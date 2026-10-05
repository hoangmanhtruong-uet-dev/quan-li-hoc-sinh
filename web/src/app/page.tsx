"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  Calendar, 
  TrendingUp, 
  GraduationCap,
  Clock,
  Beaker,
  FunctionSquare,
  Globe2,
  Plus,
  ExternalLink,
  Edit3,
  Phone,
  Search,
  SlidersHorizontal,
  DollarSign,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Database,
  Share2,
  Trash2,
  Copy,
  Check,
  FileText,
  Send,
  Filter,
  X,
  QrCode,
  LogOut,
  MessageSquare
} from "lucide-react";
import { cn, getCurrentMonthStr } from "@/lib/utils";
import { AddStudentModal, NewStudentPayload } from "@/components/AddStudentModal";
import { CheckInModal, ClassSessionItem } from "@/components/CheckInModal";
import { ZaloReceiptModal } from "@/components/ZaloReceiptModal";
import { EditRoadmapModal } from "@/components/EditRoadmapModal";
import { AddFutureMonthRoadmapModal } from "@/components/AddFutureMonthRoadmapModal";
import { EditStudentModal } from "@/components/EditStudentModal";
import { Student } from "@/types/database";
import { 
  fetchStudentsFromDB, 
  fetchSessionsFromDB, 
  insertStudentWithRoadmapToDB, 
  updateSessionCheckInInDB,
  deleteStudentFromDB,
  processRescheduleRequest,
  updateRoadmapSessionsInDB,
  updateStudentInDB,
  fetchParentMessagesFromDB,
  insertMultipleSessionsToDB,
  ParentMessageItem
} from "@/lib/db";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const currentMonthStr = getCurrentMonthStr();

const subjectColorMap: Record<string, { bg: string; text: string; border: string }> = {
  "Hóa học": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Toán học": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  "Tiếng Anh": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  "Vật lý": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

const getSubjectIcon = (subject: string) => {
  if (subject === "Hóa học") return Beaker;
  if (subject === "Toán học") return FunctionSquare;
  if (subject === "Tiếng Anh") return Globe2;
  return BookOpen;
};

type ActiveTab = "overview" | "schedule" | "students" | "tuition";

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ClassSessionItem | null>(null);
  
  // Real Database State
  const [students, setStudents] = useState<Student[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSessionItem[]>([]);
  
  // Filters
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("Tất cả");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Paid Status Tracking per Student (Local UI state / Syncable)
  const [paidStatusMap, setPaidStatusMap] = useState<Record<string, boolean>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Zalo & VietQR Modal State
  const [selectedZaloStudent, setSelectedZaloStudent] = useState<Student | null>(null);

  // Edit Roadmap State
  const [isEditRoadmapOpen, setIsEditRoadmapOpen] = useState(false);
  const [selectedRoadmapStudent, setSelectedRoadmapStudent] = useState<Student | null>(null);

  // Add Future Month Roadmap State
  const [isAddFutureMonthOpen, setIsAddFutureMonthOpen] = useState(false);
  const [selectedFutureMonthStudent, setSelectedFutureMonthStudent] = useState<Student | null>(null);

  // Edit Student Details State
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Parent Messages State & Modal
  const [parentMessages, setParentMessages] = useState<ParentMessageItem[]>([]);
  const [showParentMessagesModal, setShowParentMessagesModal] = useState(false);

  // Reschedule Requests Drawer State
  const [showRescheduleDrawer, setShowRescheduleDrawer] = useState(false);

  const handleSaveFutureMonthRoadmap = async (newSessions: ClassSessionItem[]) => {
    if (!selectedFutureMonthStudent) return;
    const created = await insertMultipleSessionsToDB(
      selectedFutureMonthStudent.id,
      newSessions
    );
    if (created && created.length > 0) {
      setUpcomingClasses((prev) => [...prev, ...created]);
    }
    setIsAddFutureMonthOpen(false);
    setSelectedFutureMonthStudent(null);
  };

  // Load Real Data from Supabase DB on startup + get current user
  useEffect(() => {
    async function loadDBData() {
      setLoading(true);

      // Get logged-in user email
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const dbStudents = await fetchStudentsFromDB();
      const dbSessions = await fetchSessionsFromDB();
      const dbMessages = await fetchParentMessagesFromDB();

      setStudents(dbStudents);
      setParentMessages(dbMessages);
      
      const mappedSessions = dbSessions.map((s) => ({
        ...s,
        icon: getSubjectIcon(s.subject),
      }));

      setUpcomingClasses(mappedSessions);
      setLoading(false);
    }
    loadDBData();
  }, []);

  const pendingRescheduleCount = upcomingClasses.filter(
    (c) => c.rescheduleRequest && c.rescheduleRequest.status === "PENDING"
  ).length;

  const handleApproveReschedule = async (session: ClassSessionItem) => {
    if (!session.rescheduleRequest) return;
    const newDate = session.rescheduleRequest.proposedDate || session.date;
    const newTime = session.rescheduleRequest.proposedTime || session.time;

    const success = await processRescheduleRequest(session.id, true, "SCHEDULED");
    if (!success) {
      alert("Lỗi cập nhật lịch. Vui lòng thử lại.");
      return;
    }

    setUpcomingClasses((prev) =>
      prev.map((item) => {
        if (item.id === session.id) {
          return {
            ...item,
            date: newDate,
            time: newTime,
            status: "SCHEDULED",
            rescheduleRequest: {
              ...item.rescheduleRequest!,
              status: "ACCEPTED",
            },
          };
        }
        return item;
      })
    );
  };

  const handleRejectReschedule = async (session: ClassSessionItem) => {
    if (!session.rescheduleRequest) return;
    
    const success = await processRescheduleRequest(session.id, false);
    if (!success) {
      alert("Lỗi cập nhật. Vui lòng thử lại.");
      return;
    }

    setUpcomingClasses((prev) =>
      prev.map((item) => {
        if (item.id === session.id) {
          return {
            ...item,
            rescheduleRequest: {
              ...item.rescheduleRequest!,
              status: "REJECTED",
            },
          };
        }
        return item;
      })
    );
  };

  // Add Student & Roadmap Sessions
  const handleAddStudent = async (payload: NewStudentPayload) => {
    const result = await insertStudentWithRoadmapToDB(payload);

    if (result) {
      setStudents((prev) => [result.student, ...prev]);
      setUpcomingClasses((prev) => [...result.sessions, ...prev]);
    } else {
      alert("Lỗi khi thêm học sinh! Vui lòng kiểm tra quyền RLS (INSERT Policy) trên Supabase cho cả 2 bảng `students` và `class_sessions`.");
    }
  };

  // Save Session Check-in
  const handleSaveSession = async (updatedSession: ClassSessionItem) => {
    setUpcomingClasses((prev) =>
      prev.map((item) => (item.id === updatedSession.id ? updatedSession : item))
    );

    await updateSessionCheckInInDB(updatedSession);
  };

  // Save Roadmap
  const handleSaveRoadmap = async (updatedSessions: ClassSessionItem[], deletedSessionIds: string[]) => {
    const success = await updateRoadmapSessionsInDB(updatedSessions, deletedSessionIds);
    if (success) {
      // Update local state
      setUpcomingClasses((prev) => {
        // Remove deleted
        let newClasses = prev.filter(c => !deletedSessionIds.includes(c.id));
        // Update or insert edited ones
        // First filter out all edited ones from newClasses to avoid duplicates
        const updatedIds = updatedSessions.map(s => s.id);
        newClasses = newClasses.filter(c => !updatedIds.includes(c.id));
        // Push the updated ones
        newClasses = [...newClasses, ...updatedSessions];
        // Note: New sessions have 'new-' IDs temporarily until reload, which is fine for UI
        return newClasses;
      });
    } else {
      alert("Đã xảy ra lỗi khi cập nhật lộ trình. Vui lòng thử lại!");
    }
  };

  // Save Edited Student Info
  const handleSaveStudentInfo = async (updatedStudent: Student) => {
    const success = await updateStudentInDB(updatedStudent);
    if (!success) {
      alert("Lỗi khi cập nhật thông tin học sinh. Vui lòng thử lại.");
      return;
    }

    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    );

    // Also update session items if student name or subject changed
    setUpcomingClasses((prev) =>
      prev.map((cs) => {
        if (editingStudent && cs.student === editingStudent.name) {
          return {
            ...cs,
            student: updatedStudent.name,
            subject: updatedStudent.subject,
            icon: getSubjectIcon(updatedStudent.subject),
          };
        }
        return cs;
      })
    );

    setIsEditStudentOpen(false);
    setEditingStudent(null);
  };

  // Delete Student
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${studentName}" và toàn bộ lộ trình?`)) {
      const success = await deleteStudentFromDB(studentId);
      if (success) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        setUpcomingClasses((prev) => prev.filter((c) => c.student !== studentName));
      } else {
        alert("Không thể xóa học sinh trong Database. Vui lòng kiểm tra lại quyền RLS (Delete Policy) trên Supabase.");
      }
    }
  };

  // Copy Magic Link for Parent
  const handleCopyMagicLink = (tokenOrId: string, studentName: string) => {
    const link = `${window.location.origin}/p/${tokenOrId}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(tokenOrId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Copy Zalo Payment Notice for Parent
  const handleCopyZaloNotice = (student: Student, completedCount: number, totalCount: number, fee: number) => {
    const noticeText = `Kính gửi Phụ huynh em ${student.name},\n` +
      `Gia sư xin gửi báo cáo học phí môn ${student.subject} (${currentMonthStr}):\n` +
      `- Số buổi đã hoàn thành: ${completedCount}/${totalCount} buổi\n` +
      `- Tổng học phí thực tế: ${fee.toLocaleString()} VNĐ\n` +
      `- Link theo dõi chi tiết bài học & bài tập: ${window.location.origin}/p/${student.magicToken || student.id}\n` +
      `Cảm ơn Phụ huynh đã đồng hành cùng cháu!`;

    navigator.clipboard.writeText(noticeText);
    setCopiedNotice(student.id);
    setTimeout(() => setCopiedNotice(null), 2000);
  };

  // Filtered Sessions
  const filteredSessions = upcomingClasses.filter((item) => {
    const matchesSubject = selectedSubjectFilter === "Tất cả" || item.subject === selectedSubjectFilter;
    const matchesStatus = selectedStatusFilter === "Tất cả" || 
                          (selectedStatusFilter === "COMPLETED" && item.status === "COMPLETED") ||
                          (selectedStatusFilter === "SCHEDULED" && item.status === "SCHEDULED");
    const matchesSearch = item.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesStatus && matchesSearch;
  });

  // Calculate Monthly Stats
  const thisMonthSessions = upcomingClasses.filter(c => c.month === currentMonthStr);
  const completedMonthSessions = thisMonthSessions.filter(c => c.status === "COMPLETED");
  
  const monthlyRevenue = completedMonthSessions.reduce((acc, curr) => {
    const st = students.find(s => s.name === curr.student);
    return acc + (st?.hourlyRate || 200000);
  }, 0);

  const projectedMonthlyRevenue = thisMonthSessions.reduce((acc, curr) => {
    const st = students.find(s => s.name === curr.student);
    return acc + (st?.hourlyRate || 200000);
  }, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0c14] text-slate-100">
      {/* Modals */}
      <AddStudentModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onAddStudent={handleAddStudent}
      />

      <EditRoadmapModal
        isOpen={isEditRoadmapOpen}
        student={selectedRoadmapStudent}
        sessions={selectedRoadmapStudent ? upcomingClasses.filter(c => c.student === selectedRoadmapStudent.name) : []}
        onClose={() => {
          setIsEditRoadmapOpen(false);
          setSelectedRoadmapStudent(null);
        }}
        onSave={handleSaveRoadmap}
        onOpenAddFutureMonth={() => {
          setSelectedFutureMonthStudent(selectedRoadmapStudent);
          setIsAddFutureMonthOpen(true);
        }}
      />

      <AddFutureMonthRoadmapModal
        isOpen={isAddFutureMonthOpen}
        student={selectedFutureMonthStudent}
        onClose={() => {
          setIsAddFutureMonthOpen(false);
          setSelectedFutureMonthStudent(null);
        }}
        onSave={handleSaveFutureMonthRoadmap}
      />

      <EditStudentModal
        isOpen={isEditStudentOpen}
        student={editingStudent}
        onClose={() => {
          setIsEditStudentOpen(false);
          setEditingStudent(null);
        }}
        onSaveStudent={handleSaveStudentInfo}
      />

      <CheckInModal
        isOpen={!!selectedSession}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSaveSession={handleSaveSession}
      />

      {/* Zalo & VietQR Modal */}
      {selectedZaloStudent && (
        <ZaloReceiptModal
          isOpen={!!selectedZaloStudent}
          student={selectedZaloStudent}
          completedCount={upcomingClasses.filter(c => c.student === selectedZaloStudent.name && c.month === currentMonthStr && c.status === "COMPLETED").length}
          totalCount={upcomingClasses.filter(c => c.student === selectedZaloStudent.name && c.month === currentMonthStr).length || 8}
          totalFee={upcomingClasses.filter(c => c.student === selectedZaloStudent.name && c.month === currentMonthStr && c.status === "COMPLETED").length * (selectedZaloStudent.hourlyRate || 200000)}
          monthStr={currentMonthStr}
          isPaid={paidStatusMap[selectedZaloStudent.id] || false}
          onClose={() => setSelectedZaloStudent(null)}
          onTogglePaidStatus={(studentId, paid) => setPaidStatusMap(prev => ({ ...prev, [studentId]: paid }))}
        />
      )}

      {/* Parent Messages Modal for Tutor */}
      {showParentMessagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowParentMessagesModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Lời Nhắn Từ Phụ Huynh ({parentMessages.length})</h3>
                <p className="text-xs text-slate-400">Danh sách các dặn dò / phản hồi trực tiếp từ phụ huynh</p>
              </div>
            </div>

            <div className="space-y-3">
              {parentMessages.map((pm) => (
                <div key={pm.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-300">Học sinh: {pm.studentName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(pm.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-white/5 text-xs text-slate-200 leading-relaxed">
                    💬 "{pm.message}"
                  </div>
                </div>
              ))}

              {parentMessages.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có lời nhắn nào từ Phụ huynh.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Requests Drawer */}
      {showRescheduleDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-4">
            <button
              onClick={() => setShowRescheduleDrawer(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Yêu Cầu Xin Nghỉ / Đổi Lịch Từ Phụ Huynh</h3>
                <p className="text-xs text-slate-400">Danh sách các đề xuất học bù cần Gia sư xét duyệt</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {upcomingClasses.filter(c => c.rescheduleRequest && c.rescheduleRequest.status === "PENDING").map((session) => (
                <div key={session.id} className="p-4 rounded-xl bg-white/5 border border-amber-500/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{session.student}</h4>
                      <p className="text-xs text-slate-400">Bài: {session.topic} ({session.date})</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Chờ duyệt
                    </span>
                  </div>

                  <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-500/20 text-xs text-amber-200">
                    <p className="font-semibold mb-0.5">Lý do: {session.rescheduleRequest?.reason}</p>
                    {session.rescheduleRequest?.proposedDate && (
                      <p className="text-slate-300">Đề xuất giờ mới: <strong>{session.rescheduleRequest.proposedDate} ({session.rescheduleRequest.proposedTime || session.time})</strong></p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleApproveReschedule(session)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      ✅ Duyệt & Đổi Lịch
                    </button>
                    <button
                      onClick={() => handleRejectReschedule(session)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition"
                    >
                      Từ Chối
                    </button>
                  </div>
                </div>
              ))}

              {upcomingClasses.filter(c => c.rescheduleRequest && c.rescheduleRequest.status === "PENDING").length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Chưa có yêu cầu đổi lịch mới nào cần xử lý.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 glass hidden md:flex flex-col border-r border-white/5 m-3 rounded-2xl">
        <div className="p-5 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <GraduationCap className="text-indigo-400 w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white block leading-none">TutorTrack</span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400/80">Pro Dashboard</span>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1.5">
          {[
            { id: "overview", label: "Tổng Quan", icon: TrendingUp },
            { id: "schedule", label: "Lịch Dạy & Check-in", icon: Calendar },
            { id: "students", label: "Học Sinh & Lớp", icon: Users },
            { id: "tuition", label: "Học Phí & Thu Nhập", icon: DollarSign },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={cn(
                "w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between text-sm font-medium",
                activeTab === item.id 
                  ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn("w-4 h-4", activeTab === item.id ? "text-indigo-400" : "text-slate-400")} />
                {item.label}
              </div>
              {item.id === "students" && students.length > 0 && (
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold text-slate-300">{students.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 m-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              GS
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">Gia Sư</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail || "Đang tải..."}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              const supabase = createSupabaseBrowserClient();
              await supabase.auth.signOut();
              router.push("/login");
              router.refresh();
            }}
            className="w-full px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Top Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Thống kê {currentMonthStr}
              </span>

              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <Database className="w-3 h-3 text-emerald-400" />
                Supabase DB Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {activeTab === "overview" && "Quản Lý Lớp Học Gia Sư"}
              {activeTab === "schedule" && "Lịch Dạy & Điểm Danh Chi Tiết"}
              {activeTab === "students" && "Danh Sách Học Sinh & Lộ Trình"}
              {activeTab === "tuition" && "Báo Cáo Học Phí & Thu Nhập"}
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              {activeTab === "overview" && "Tổng quan tiến độ dạy học, học sinh và báo cáo thu nhập tháng."}
              {activeTab === "schedule" && "Xem toàn bộ lịch dạy, kiểm tra nội dung bài học và tải bài tập về nhà."}
              {activeTab === "students" && "Quản lý thông tin học sinh, sao chép Magic Link gửi cho Phụ huynh."}
              {activeTab === "tuition" && "Thống kê học phí từng học sinh, đánh dấu đã đóng và tạo tin nhắn Zalo."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowParentMessagesModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              {parentMessages.length > 0 ? `${parentMessages.length} Lời nhắn từ PH` : "Lời nhắn PH"}
            </button>

            {pendingRescheduleCount > 0 && (
              <button
                onClick={() => setShowRescheduleDrawer(true)}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition animate-pulse"
              >
                <Calendar className="w-4 h-4 text-amber-400" />
                {pendingRescheduleCount} Yêu cầu đổi lịch
              </button>
            )}

            <Link
              href="/p/demo-student-123"
              target="_blank"
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition glass-hover"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              Portal Phụ Huynh (Demo)
            </Link>

            <button 
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Thêm Học Sinh & Lộ Trình
            </button>
          </div>
        </header>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tổng Học Sinh", value: students.length, icon: Users, color: "text-blue-400", change: "Học sinh CSDL" },
            { label: "Buổi Tháng 10", value: `${completedMonthSessions.length}/${thisMonthSessions.length} buổi`, icon: CheckCircle2, color: "text-emerald-400", change: "Hoàn thành" },
            { label: "Học Phí Đã Thu (T10)", value: `${(monthlyRevenue / 1000).toLocaleString()}k VNĐ`, icon: DollarSign, color: "text-amber-400", change: "Số buổi đã hoàn thành" },
            { label: "Doanh Thu Dự Kiến (T10)", value: `${(projectedMonthlyRevenue / 1000).toLocaleString()}k VNĐ`, icon: TrendingUp, color: "text-purple-400", change: "Cả tháng 10" },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              key={stat.label} 
              className="glass p-4 md:p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative overflow-hidden group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={cn("p-2.5 rounded-xl bg-white/5 border border-white/5", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                  {stat.change}
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-0.5">{stat.value}</h3>
              <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* TAB 1: TỔNG QUAN (OVERVIEW) */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Search & Subject Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm theo tên học sinh, bài học trong DB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                {["Tất cả", "Hóa học", "Toán học", "Tiếng Anh"].map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedSubjectFilter(subject)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      selectedSubjectFilter === subject
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Feed */}
              <div className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Lịch Dạy Sắp Tới & Điểm Danh
                  </h2>
                </div>

                <div className="space-y-3">
                  {loading && (
                    <div className="glass p-8 text-center rounded-2xl border border-white/5">
                      <span className="text-xs text-indigo-400 font-semibold animate-pulse">Đang tải dữ liệu từ Supabase...</span>
                    </div>
                  )}

                  {!loading && filteredSessions.length === 0 && (
                    <div className="glass p-8 text-center rounded-2xl border border-white/5 space-y-3">
                      <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
                      <p className="text-sm font-bold text-white">Chưa có dữ liệu học sinh trong Database</p>
                      <button
                        onClick={() => setIsAddStudentOpen(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20"
                      >
                        + Thêm Học Sinh Ngay
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {filteredSessions.slice(0, 5).map((session, i) => {
                      const colors = subjectColorMap[session.subject] || subjectColorMap["Hóa học"];
                      const IconComp = session.icon || BookOpen;

                      return (
                        <motion.div 
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedSession(session)}
                          className={cn(
                            "glass p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all cursor-pointer group hover:scale-[1.005]",
                            session.status === "COMPLETED"
                              ? "border-emerald-500/30 bg-emerald-950/10"
                              : "border-white/5 hover:border-indigo-500/30"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0", colors.bg, colors.border)}>
                              <IconComp className={cn("w-5 h-5", colors.text)} />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {session.student}
                                </h4>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", colors.bg, colors.text, colors.border)}>
                                  {session.subject}
                                </span>
                              </div>
                              
                              <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                {session.topic}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {session.homework && (
                                  <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    <Sparkles className="w-3 h-3 text-amber-400" />
                                    {session.homework}
                                  </span>
                                )}

                                {(() => {
                                  const files = session.homeworkFiles && session.homeworkFiles.length > 0
                                    ? session.homeworkFiles
                                    : (session.homeworkFile ? [session.homeworkFile] : []);
                                  if (files.length === 0) return null;
                                  return files.map((f, fIdx) => (
                                    <span key={fIdx} className="text-[11px] text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-medium">
                                      <Paperclip className="w-3 h-3 text-purple-400" />
                                      {f.name}
                                    </span>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                            <div className="text-left sm:text-right">
                              <p className="text-xs font-semibold text-white">{session.date}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{session.time}</p>
                            </div>

                            <button 
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 border shadow-sm",
                                session.status === "COMPLETED"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40"
                              )}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {session.status === "COMPLETED" ? "Đã Điểm Danh" : "Điểm Danh Ngay"}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Roster Preview */}
              <div className="space-y-6">
                 <div className="glass rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Học Sinh ({students.length})
                      </h3>
                      <button 
                        onClick={() => setActiveTab("students")}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Xem tất cả ➔
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {students.map((st) => (
                        <div key={st.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white text-xs">{st.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{st.grade} • Môn {st.subject}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {st.parentPhone && (
                              <a 
                                href={`https://zalo.me/${st.parentPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                title="Zalo Phụ huynh"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleCopyMagicLink(st.magicToken || st.id, st.name)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition text-[11px] flex items-center gap-1 font-semibold"
                              title="Copy Link gửi Phụ huynh"
                            >
                              {copiedToken === (st.magicToken || st.id) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LỊCH DẠY & CHECK-IN (SCHEDULE & ROADMAP MANAGEMENT) */}
        {activeTab === "schedule" && (
          <div className="space-y-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm chủ đề bài học, tên học sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Lọc trạng thái:
                </span>
                {[
                  { id: "Tất cả", label: "Tất cả" },
                  { id: "SCHEDULED", label: "📅 Sắp tới" },
                  { id: "COMPLETED", label: "✅ Đã hoàn thành" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSelectedStatusFilter(st.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                      selectedStatusFilter === st.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sessions Timeline View */}
            <div className="space-y-3">
              {filteredSessions.map((session, i) => {
                const colors = subjectColorMap[session.subject] || subjectColorMap["Hóa học"];
                const IconComp = session.icon || BookOpen;

                return (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedSession(session)}
                    className={cn(
                      "glass p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all cursor-pointer group hover:scale-[1.003]",
                      session.status === "COMPLETED" 
                        ? "border-emerald-500/30 bg-emerald-950/10" 
                        : "border-white/5 hover:border-indigo-500/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex flex-col items-center justify-center border shrink-0 mt-0.5", colors.bg, colors.border)}>
                        <IconComp className={cn("w-5 h-5", colors.text)} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {session.student}
                          </h4>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", colors.bg, colors.text, colors.border)}>
                            {session.subject}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">({session.month})</span>
                        </div>

                        <p className="text-sm text-slate-200 font-semibold">{session.topic}</p>

                        {session.tutorFeedback && (
                          <p className="text-xs text-indigo-300/90 bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/20 mt-2">
                            💬 Nhận xét: {session.tutorFeedback}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {session.homework && (
                            <span className="text-xs text-slate-300 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Baitap: {session.homework}
                            </span>
                          )}

                          {(() => {
                            const files = session.homeworkFiles && session.homeworkFiles.length > 0
                              ? session.homeworkFiles
                              : (session.homeworkFile ? [session.homeworkFile] : []);
                            if (files.length === 0) return null;
                            return files.map((f, fIdx) => (
                              <span key={fIdx} className="text-xs text-purple-300 flex items-center gap-1.5 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/30 font-medium">
                                <Paperclip className="w-3.5 h-3.5 text-purple-400" />
                                {f.name} ({f.size})
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5 md:justify-end">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {session.date}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{session.time}</p>
                      </div>

                      <button 
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 border shadow-md",
                          session.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/40"
                        )}
                      >
                        <Edit3 className="w-4 h-4" />
                        {session.status === "COMPLETED" ? "Sửa / Đã Điểm Danh" : "Điểm Danh Buổi Này"}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: HỌC SINH & LỚP (STUDENT ROSTER & MAGIC LINKS) */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="font-bold text-white text-base">Danh Sách {students.length} Học Sinh</h3>
                <p className="text-xs text-slate-400">Sao chép Magic Link gửi cho Phụ huynh theo dõi lộ trình</p>
              </div>

              <button 
                onClick={() => setIsAddStudentOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Thêm Học Sinh & Lộ Trình
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {students.map((st) => (
                <div key={st.id} className="glass p-5 rounded-2xl border border-white/5 space-y-4 hover:border-indigo-500/30 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{st.name}</h4>
                        <span className="text-xs text-indigo-400 font-semibold">{st.grade} • Môn {st.subject}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setIsEditStudentOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                        title="Sửa thông tin học sinh & lớp"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id, st.name)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Xóa học sinh này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-slate-300">
                    {st.parentName && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phụ huynh (Bố/Mẹ):</span>
                        <span className="font-semibold text-white">{st.parentName}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-slate-400">Học phí / Buổi:</span>
                      <span className="font-bold text-amber-400">{(st.hourlyRate / 1000).toLocaleString()}k VNĐ</span>
                    </div>

                    {st.parentPhone && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">SĐT Phụ huynh:</span>
                        <a 
                          href={`https://zalo.me/${st.parentPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {st.parentPhone} (Zalo)
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setEditingStudent(st);
                          setIsEditStudentOpen(true);
                        }}
                        className="py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Sửa Thông Tin
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRoadmapStudent(st);
                          setIsEditRoadmapOpen(true);
                        }}
                        className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Sửa Lộ Trình
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopyMagicLink(st.magicToken || st.id, st.name)}
                      className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      {copiedToken === (st.magicToken || st.id) ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          Đã Sao Chép Link Phụ Huynh!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Sao Chép Link Sổ Học Tập
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: HỌC PHÍ & THU NHẬP (TUITION BILLING & ZALO RECEIPT) */}
        {activeTab === "tuition" && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Báo Cáo Học Phí {currentMonthStr}</h3>
                <p className="text-xs text-slate-400">Tổng hợp học phí thực tế theo số buổi đã điểm danh hoàn thành</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Đã Thu Thực Tế</span>
                  <span className="text-xl font-bold text-amber-400">{(monthlyRevenue / 1000).toLocaleString()}k VNĐ</span>
                </div>
                <div className="text-right border-l border-white/10 pl-4">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Dự Kiến Cả Tháng</span>
                  <span className="text-xl font-bold text-purple-400">{(projectedMonthlyRevenue / 1000).toLocaleString()}k VNĐ</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {students.map((st) => {
                const stSessions = upcomingClasses.filter(c => c.student === st.name && c.month === currentMonthStr);
                const stCompleted = stSessions.filter(c => c.status === "COMPLETED");
                const stFee = stCompleted.length * stHourlyRate(st);
                const isPaid = paidStatusMap[st.id] || false;

                function stHourlyRate(s: Student) {
                  return s.hourlyRate || 200000;
                }

                return (
                  <div key={st.id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
                        $
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-white">{st.name}</h4>
                        <p className="text-xs text-slate-400">{st.grade} • Môn {st.subject} • {(stHourlyRate(st)/1000).toLocaleString()}k/buổi</p>
                        
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="text-emerald-400 font-semibold">
                            ✅ Đã học: {stCompleted.length}/{stSessions.length || 8} buổi
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-400">Thành tiền tháng 10:</p>
                        <p className="text-xl font-bold text-amber-400">{stFee.toLocaleString()} VNĐ</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle Payment Status */}
                        <button
                          onClick={() => setPaidStatusMap(prev => ({ ...prev, [st.id]: !isPaid }))}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold transition border",
                            isPaid
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {isPaid ? "✅ Đã Đóng" : "⏳ Chưa Đóng"}
                        </button>

                        {/* QR Bank & Zalo Receipt Modal Trigger */}
                        <button
                          onClick={() => setSelectedZaloStudent(st)}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                          title="Xem mã VietQR và tạo Biên lai Zalo"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-300" />
                          QR & Biên Lai Zalo
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
