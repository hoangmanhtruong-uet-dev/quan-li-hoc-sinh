import { supabase } from "./supabase";
import { Student } from "@/types/database";
import { ClassSessionItem } from "@/components/CheckInModal";
import { NewStudentPayload } from "@/components/AddStudentModal";

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

export async function insertStudentWithRoadmapToDB(payload: NewStudentPayload): Promise<{ student: Student; sessions: ClassSessionItem[] } | null> {
  try {
    // 1. Insert Student
    const { data: studentData, error: studentErr } = await supabase
      .from("students")
      .insert([
        {
          name: payload.name,
          grade: payload.grade,
          subject: payload.subject,
          parent_phone: payload.parentPhone,
          hourly_rate: payload.hourlyRate,
          schedule_days: payload.scheduleDays.join(", "),
          schedule_time: payload.scheduleTime,
        },
      ])
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
      month: "Tháng 10/2026",
      time: s.time,
      status: "SCHEDULED",
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
