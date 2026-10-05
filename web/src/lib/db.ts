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

// ===============================================
// HELPER FUNCTIONS FOR MULTIPLE FILES
// ===============================================

export function parseHomeworkFilesFromDB(cs: any): { name: string; url: string; size: string }[] {
  if (!cs.homework_file_url && !cs.homework_file_name) return [];

  if (cs.homework_file_url && cs.homework_file_url.startsWith("[")) {
    try {
      const parsed = JSON.parse(cs.homework_file_url);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback if JSON parse fails
    }
  }

  return [{
    name: cs.homework_file_name || "File đính kèm",
    url: cs.homework_file_url || "#",
    size: cs.homework_file_size || "1 MB",
  }];
}

export function formatHomeworkFilesForDB(session: {
  homeworkFiles?: { name: string; url: string; size: string }[] | null;
  homeworkFile?: { name: string; url: string; size: string } | null;
}) {
  const files = session.homeworkFiles && session.homeworkFiles.length > 0
    ? session.homeworkFiles
    : (session.homeworkFile ? [session.homeworkFile] : []);

  if (files.length === 0) {
    return {
      homework_file_name: null,
      homework_file_url: null,
      homework_file_size: null,
    };
  }

  if (files.length === 1) {
    return {
      homework_file_name: files[0].name,
      homework_file_url: files[0].url,
      homework_file_size: files[0].size,
    };
  }

  return {
    homework_file_name: `${files.length} file đính kèm`,
    homework_file_url: JSON.stringify(files),
    homework_file_size: files.map((f) => f.size).join(", "),
  };
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
      ...formatHomeworkFilesForDB(s),
    }));

    const { data: sessionsData, error: sessionsErr } = await supabase
      .from("class_sessions")
      .insert(sessionsToInsert)
      .select();

    if (sessionsErr) {
      console.error("Error inserting sessions to Supabase:", sessionsErr);
    }

    const createdSessions: ClassSessionItem[] = (sessionsData || []).map((cs) => {
      const files = parseHomeworkFilesFromDB(cs);
      return {
        id: cs.id,
        student: cs.student_name,
        subject: cs.subject,
        topic: cs.topic,
        roadmapTopic: cs.roadmap_topic || cs.topic,
        time: cs.time,
        date: cs.date,
        month: cs.month,
        status: cs.status,
        homeworkFiles: files.length > 0 ? files : null,
        homeworkFile: files.length > 0 ? files[0] : null,
      };
    });

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

    return data.map((cs) => {
      const files = parseHomeworkFilesFromDB(cs);
      return {
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
        homeworkFiles: files.length > 0 ? files : null,
        homeworkFile: files.length > 0 ? files[0] : null,
        tutorFeedback: cs.tutor_feedback,
      };
    });
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
        ...formatHomeworkFilesForDB(session),
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

    // 2. Separate existing sessions to update vs new sessions to insert
    const existingSessions = updatedSessions.filter(s => !s.id.startsWith("new-"));
    const newSessions = updatedSessions.filter(s => s.id.startsWith("new-"));

    // Update existing sessions using .update() to avoid upsert NOT NULL constraint errors
    for (const s of existingSessions) {
      const updateData: any = {
        topic: s.topic,
        roadmap_topic: s.roadmapTopic || s.topic,
        date: s.date,
        time: s.time,
        status: s.status,
        ...formatHomeworkFilesForDB(s),
      };

      const { error: updateErr } = await supabase
        .from("class_sessions")
        .update(updateData)
        .eq("id", s.id);

      if (updateErr) {
        console.error("Error updating session:", s.id, updateErr);
        return false;
      }
    }

    // Insert new sessions if any
    if (newSessions.length > 0) {
      const studentName = newSessions[0].student;
      const { data: stData } = await supabase.from("students").select("id").eq("name", studentName).single();

      if (stData) {
        const inserts = newSessions.map(s => ({
          student_id: stData.id,
          student_name: s.student,
          subject: s.subject,
          topic: s.topic,
          roadmap_topic: s.roadmapTopic || s.topic,
          date: s.date,
          time: s.time,
          month: s.month || getCurrentMonthStr(),
          status: s.status || "SCHEDULED",
          ...formatHomeworkFilesForDB(s),
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
