import { supabase } from "./supabase";
import { Student } from "@/types/database";
import { ClassSessionItem } from "@/components/CheckInModal";
import { NewStudentPayload } from "@/components/AddStudentModal";
import { getCurrentMonthStr } from "./utils";

// ===============================================
// STUDENTS DATABASE API
// ===============================================

export async function fetchStudentsFromDB(): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn("Supabase fetchStudents warning/empty.", error?.message);
      return [];
    }

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      subject: s.subject as any,
      parentPhone: s.parent_phone,
      hourlyRate: Number(s.hourly_rate) || 200000,
      createdAt: s.created_at,
      magicToken: s.magic_token || s.id,
    }));
  } catch (err) {
    console.error("Failed to fetch students from DB:", err);
    return [];
  }
}

export async function fetchStudentsByPhoneFromDB(phone: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .ilike("parent_phone", `%${phone}%`);

    if (error || !data) return [];

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.grade,
      subject: s.subject as any,
      parentPhone: s.parent_phone,
      hourlyRate: Number(s.hourly_rate) || 200000,
      createdAt: s.created_at,
      magicToken: s.magic_token || s.id,
    }));
  } catch (err) {
    console.error("Failed to search students by phone:", err);
    return [];
  }
}

export async function insertStudentWithRoadmapToDB(payload: NewStudentPayload): Promise<{ student: Student; sessions: ClassSessionItem[] } | null> {
  try {
    // Try to get tutor_id if logged in, but don't require it (single-tutor mode)
    let tutorId: string | null = null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      tutorId = authData.user?.id || null;
    } catch {
      // Not logged in - that's OK for single-tutor mode
    }

    // 1. Insert Student
    const insertData: any = {
      name: payload.name,
      grade: payload.grade,
      subject: payload.subject,
      parent_phone: payload.parentPhone,
      hourly_rate: payload.hourlyRate,
      schedule_days: payload.scheduleDays.join(", "),
      schedule_time: payload.scheduleTime,
    };
    if (tutorId) {
      insertData.tutor_id = tutorId;
    }

    const { data: studentData, error: studentErr } = await supabase
      .from("students")
      .insert([insertData])
      .select()
      .single();

    if (studentErr || !studentData) {
      console.error("Error inserting student to Supabase:", studentErr);
      return null;
    }

    const createdStudent: Student = {
      id: studentData.id,
      name: studentData.name,
      grade: studentData.grade,
      subject: studentData.subject,
      parentPhone: studentData.parent_phone,
      hourlyRate: Number(studentData.hourly_rate),
      createdAt: studentData.created_at,
      magicToken: studentData.magic_token || studentData.id,
    };

    // 2. Insert Generated Roadmap Sessions
    const sessionsToInsert = payload.roadmapSessions.map((s) => ({
      student_id: createdStudent.id,
      student_name: createdStudent.name,
      subject: createdStudent.subject,
      topic: s.topic,
      roadmap_topic: s.topic,
      date: s.date,
      month: getCurrentMonthStr(),
      time: s.time,
      status: "SCHEDULED",
      homework_file_name: s.homeworkFile?.name || null,
      homework_file_url: s.homeworkFile?.url || null,
      homework_file_size: s.homeworkFile?.size || null,
    }));

    const { data: sessionsData, error: sessionsErr } = await supabase
      .from("class_sessions")
      .insert(sessionsToInsert)
      .select();

    if (sessionsErr) {
      console.error("Error inserting sessions to Supabase:", sessionsErr);
    }

    const createdSessions: ClassSessionItem[] = (sessionsData || []).map((cs) => ({
      id: cs.id,
      student: cs.student_name,
      subject: cs.subject,
      topic: cs.topic,
      roadmapTopic: cs.roadmap_topic || cs.topic,
      time: cs.time,
      date: cs.date,
      month: cs.month,
      status: cs.status,
    }));

    return { student: createdStudent, sessions: createdSessions };
  } catch (err) {
    console.error("Failed to insert student with roadmap:", err);
    return null;
  }
}

export async function deleteStudentFromDB(studentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (error) {
      console.error("Error deleting student:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to delete student:", err);
    return false;
  }
}

// ===============================================
// CLASS SESSIONS DATABASE API
// ===============================================

export async function fetchSessionsFromDB(): Promise<ClassSessionItem[]> {
  try {
    const { data, error } = await supabase
      .from("class_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((cs) => ({
      id: cs.id,
      student: cs.student_name,
      subject: cs.subject,
      topic: cs.topic,
      roadmapTopic: cs.roadmap_topic || cs.topic,
      time: cs.time,
      date: cs.date,
      month: cs.month,
      status: cs.status,
      homework: cs.homework,
      homeworkFile: cs.homework_file_name
        ? {
            name: cs.homework_file_name,
            url: cs.homework_file_url || "#",
            size: cs.homework_file_size || "1 MB",
          }
        : null,
      tutorFeedback: cs.tutor_feedback,
    }));
  } catch (err) {
    console.error("Failed to fetch sessions:", err);
    return [];
  }
}

export async function updateSessionCheckInInDB(session: ClassSessionItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("class_sessions")
      .update({
        topic: session.topic,
        status: session.status,
        homework: session.homework,
        homework_file_name: session.homeworkFile?.name || null,
        homework_file_url: session.homeworkFile?.url || null,
        homework_file_size: session.homeworkFile?.size || null,
        tutor_feedback: session.tutorFeedback,
        test_score: session.testScore,
      })
      .eq("id", session.id);

    if (error) {
      console.error("Error updating session in Supabase:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to update session:", err);
    return false;
  }
}

export async function updateRoadmapSessionsInDB(updatedSessions: ClassSessionItem[], deletedSessionIds: string[]): Promise<boolean> {
  try {
    // 1. Delete removed sessions
    if (deletedSessionIds.length > 0) {
      const { error: deleteErr } = await supabase
        .from("class_sessions")
        .delete()
        .in("id", deletedSessionIds);
        
      if (deleteErr) {
        console.error("Error deleting sessions:", deleteErr);
        return false;
      }
    }

    // 2. Update existing and Insert new
    // Supabase .upsert() can be used if we format the data properly.
    // However, new sessions have 'new-xxx' IDs. We should remove the ID so DB generates a UUID.
    
    const upsertData = updatedSessions.map(s => {
      const data: any = {
        student_name: s.student,
        subject: s.subject,
        topic: s.topic,
        roadmap_topic: s.roadmapTopic || s.topic,
        date: s.date,
        time: s.time,
        status: s.status,
        homework_file_name: s.homeworkFile?.name || null,
        homework_file_url: s.homeworkFile?.url || null,
        homework_file_size: s.homeworkFile?.size || null,
      };
      
      // If it's an existing session, we pass the UUID
      if (!s.id.startsWith("new-")) {
        data.id = s.id;
      } else {
        // For new sessions we must pass student_id and month. 
        // We can get student_id from a known field if we fetch it, or just do an insert if we had the student_id.
        // Wait, updatedSessions doesn't have student_id. We need to fetch the student_id by name, 
        // or we should have passed it from the modal!
        // It's safer to fetch the student_id here if it's a new session.
      }
      return data;
    });

    // We can't just upsert without student_id for new sessions.
    // Let's separate updates and inserts.
    const toUpdate = upsertData.filter(d => d.id);
    const toInsert = upsertData.filter(d => !d.id);

    if (toUpdate.length > 0) {
      const { error: updateErr } = await supabase
        .from("class_sessions")
        .upsert(toUpdate, { onConflict: 'id' });
        
      if (updateErr) {
        console.error("Error updating sessions:", updateErr);
        return false;
      }
    }

    if (toInsert.length > 0) {
      // Find student_id
      const studentName = toInsert[0].student_name;
      const { data: stData } = await supabase.from("students").select("id").eq("name", studentName).single();
      
      if (stData) {
        const inserts = toInsert.map(d => ({
          ...d,
          student_id: stData.id,
          month: getCurrentMonthStr() // or calculate based on the date
        }));
        
        const { error: insertErr } = await supabase
          .from("class_sessions")
          .insert(inserts);
          
        if (insertErr) {
          console.error("Error inserting new sessions:", insertErr);
          return false;
        }
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to update roadmap sessions:", err);
    return false;
  }
}

// ===============================================
// RESCHEDULE API
// ===============================================

export async function submitRescheduleRequest(sessionId: string, request: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("class_sessions")
      .update({
        reschedule_request: request,
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error submitting reschedule request:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to submit reschedule request:", err);
    return false;
  }
}

export async function processRescheduleRequest(sessionId: string, isApproved: boolean, newStatus?: string): Promise<boolean> {
  try {
    // We update the JSONB field to change the request status
    // and if approved, change the session status to RESCHEDULED
    
    // First get the current request
    const { data: session } = await supabase
      .from("class_sessions")
      .select("reschedule_request")
      .eq("id", sessionId)
      .single();
      
    if (!session || !session.reschedule_request) return false;
    
    const updatedRequest = {
      ...session.reschedule_request,
      status: isApproved ? "ACCEPTED" : "REJECTED"
    };

    const updateData: any = { reschedule_request: updatedRequest };
    if (isApproved && newStatus) {
      updateData.status = newStatus;
    }

    const { error } = await supabase
      .from("class_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      console.error("Error processing reschedule request:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to process reschedule request:", err);
    return false;
  }
}

// ===============================================
// FEEDBACK API
// ===============================================

export async function submitParentFeedback(studentId: string, message: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("parent_messages")
      .insert([
        {
          student_id: studentId,
          message: message,
        }
      ]);

    if (error) {
      console.error("Error submitting parent feedback:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to submit parent feedback:", err);
    return false;
  }
}
