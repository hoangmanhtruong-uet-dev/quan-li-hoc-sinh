export type Subject = "Hóa học" | "Toán học" | "Vật lý" | "Tiếng Anh" | "Ngữ văn" | "Sinh học" | "Khác";

export interface Student {
  id: string;
  name: string;
  grade: string;
  phone?: string;
  parentPhone?: string;
  hourlyRate: number;
  subject: Subject;
  avatarUrl?: string;
  magicToken?: string;
  createdAt: string;
}

export interface ClassSession {
  id: string;
  studentId: string;
  studentName?: string;
  subject: Subject;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  homework?: string;
  tutorFeedback?: string;
}
