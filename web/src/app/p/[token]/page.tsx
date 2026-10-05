"use client";

import { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Share2, 
  PhoneCall, 
  Award,
  Sparkles,
  Check,
  Paperclip,
  Download,
  QrCode,
  Send,
  MessageSquare,
  X,
  Printer,
  Trophy
} from "lucide-react";
import { cn, getCurrentMonthStr } from "@/lib/utils";
import { fetchStudentsFromDB, fetchSessionsFromDB, submitRescheduleRequest, submitParentFeedback } from "@/lib/db";
import { Student } from "@/types/database";
import { ClassSessionItem } from "@/components/CheckInModal";
import { StudentProgressChart } from "@/components/StudentProgressChart";
import { PrintableReportModal } from "@/components/PrintableReportModal";
import { RescheduleModal } from "@/components/RescheduleModal";
import { useParams } from "next/navigation";

import { handleDownloadFile } from "@/lib/storage";

export default function ParentPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [copied, setCopied] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // VietQR Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  
  // PDF Report Modal State
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [parentNote, setParentNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Reschedule Modal State
  const [rescheduleSessionTarget, setRescheduleSessionTarget] = useState<ClassSessionItem | null>(null);

  // Session Detail Modal State for Parent
  const [selectedDetailSession, setSelectedDetailSession] = useState<ClassSessionItem | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allStudents = await fetchStudentsFromDB();
      const allSessions = await fetchSessionsFromDB();

      // Find student matching token — NEVER fall back to another student
      const matchedStudent = allStudents.find((s) => s.id === token || s.magicToken === token) || null;
      setStudent(matchedStudent);

      if (matchedStudent) {
        const studentSessions = allSessions.filter((cs) => cs.student === matchedStudent.name);
        setSessions(studentSessions);
      }
      setLoading(false);
    }
    loadData();
  }, [token]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentNote.trim() || !student) return;
    
    const success = await submitParentFeedback(student.id, parentNote);
    if (!success) {
      alert("Lỗi khi gửi lời nhắn. Vui lòng thử lại.");
      return;
    }

    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedbackModal(false);
      setParentNote("");
    }, 2000);
  };

  const handleRescheduleSubmit = async (sessionId: string, reason: string, proposedDate?: string, proposedTime?: string) => {
    const requestPayload = {
      id: `req-${Date.now()}`,
      reason,
      proposedDate,
      proposedTime,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    const success = await submitRescheduleRequest(sessionId, requestPayload);
    
    if (success) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              rescheduleRequest: requestPayload as any,
            };
          }
          return s;
        })
      );
    } else {
      alert("Đã xảy ra lỗi khi gửi yêu cầu đổi lịch. Vui lòng thử lại sau.");
    }
  };

  const completedSessionsCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const currentMonthStr = getCurrentMonthStr();
  const hourlyRate = student?.hourlyRate || 200000;
  const actualFee = completedSessionsCount * hourlyRate;
  const projectedFee = (sessions.length || 8) * hourlyRate;

  // VietQR Code Details - HOANG MANH TRUONG
  const tutorName = "HOANG MANH TRUONG";
  const bankName = "MBBank / SeABank (VietQR)";

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 pb-12">
      
      {/* Printable PDF Modal */}
      <PrintableReportModal
        isOpen={showPDFModal}
        student={student}
        sessions={sessions}
        onClose={() => setShowPDFModal(false)}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!rescheduleSessionTarget}
        session={rescheduleSessionTarget}
        onClose={() => setRescheduleSessionTarget(null)}
        onSubmitRequest={handleRescheduleSubmit}
      />

      {/* Session Details Modal for Parent */}
      {selectedDetailSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-lg rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-5">
            <button
              onClick={() => setSelectedDetailSession(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title & Status Header */}
            <div className="space-y-1 pr-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "text-xs font-bold px-2.5 py-0.5 rounded-full border",
                  selectedDetailSession.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                )}>
                  {selectedDetailSession.status === "COMPLETED" ? "✅ Đã Hoàn Thành" : "📅 Sắp Diễn Ra"}
                </span>
                {selectedDetailSession.testScore !== undefined && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Điểm: {selectedDetailSession.testScore}/10
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white pt-1.5">{selectedDetailSession.topic}</h3>
              <p className="text-xs text-slate-400">Học sinh: <span className="text-white font-medium">{student?.name}</span> • Môn {student?.subject}</p>
            </div>

            {/* Date & Time Info Card */}
            <div className="grid grid-cols-2 gap-3 bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Ngày học:</span>
                  <span className="text-white font-bold">{selectedDetailSession.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Giờ học:</span>
                  <span className="text-white font-bold">{selectedDetailSession.time}</span>
                </div>
              </div>
            </div>

            {/* Tutor Feedback */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                Đánh giá & Nhận xét từ Gia sư:
              </span>
              {selectedDetailSession.tutorFeedback ? (
                <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed">
                  {selectedDetailSession.tutorFeedback}
                </div>
              ) : (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-slate-400 italic">
                  Chưa có nhận xét cho buổi học này.
                </div>
              )}
            </div>

            {/* Homework & Attachments */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                Bài tập về nhà & Tài liệu học tập:
              </span>

              {selectedDetailSession.homework && (
                <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedDetailSession.homework}
                </p>
              )}

              {(() => {
                const files = selectedDetailSession.homeworkFiles && selectedDetailSession.homeworkFiles.length > 0
                  ? selectedDetailSession.homeworkFiles
                  : (selectedDetailSession.homeworkFile ? [selectedDetailSession.homeworkFile] : []);

                if (files.length === 0) {
                  return !selectedDetailSession.homework ? (
                    <p className="text-xs text-slate-400 italic bg-white/5 p-3 rounded-xl border border-white/5">
                      Chưa có tài liệu đính kèm cho buổi này.
                    </p>
                  ) : null;
                }

                return (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      Tệp tài liệu đính kèm ({files.length} file):
                    </span>
                    {files.map((file, fileIdx) => (
                      <div key={fileIdx} className="flex items-center justify-between bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 text-xs">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                          <div>
                            <span className="text-white font-semibold block truncate max-w-[220px]">{file.name}</span>
                            <span className="text-[10px] text-purple-300/70 block">Dung lượng: {file.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(file.url, file.name)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Tải File
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end gap-2 border-t border-white/5">
              {selectedDetailSession.status !== "COMPLETED" && !selectedDetailSession.rescheduleRequest && (
                <button
                  onClick={() => {
                    setRescheduleSessionTarget(selectedDetailSession);
                    setSelectedDetailSession(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                >
                  Xin Nghỉ / Đổi Lịch
                </button>
              )}
              <button
                onClick={() => setSelectedDetailSession(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-sm rounded-2xl p-6 relative shadow-2xl border border-white/10 text-center space-y-4">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Mã VietQR Chính Chủ
              </span>
              <h3 className="text-lg font-bold text-white">Chuyển Khoản Học Phí</h3>
              <p className="text-xs text-slate-400">Tên TK nhận: <strong className="text-white">{tutorName}</strong></p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-white/10 inline-block mx-auto shadow-inner">
              <img 
                src="/qr-hoangmanhtruong.png" 
                alt={`Mã QR Nhận Tiền ${tutorName}`} 
                className="w-56 h-56 object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="pt-1">
              <a
                href="/qr-hoangmanhtruong.png"
                download={`VietQR_${tutorName}.png`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Tải Mã QR Về Máy
              </a>
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-bold text-amber-300">{tutorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền cần đóng:</span>
                <span className="font-bold text-emerald-400">{actualFee.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cú pháp CK:</span>
                <span className="font-mono text-xs text-indigo-300">Dong hoc phi {student?.name || "HocSinh"} T10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-4">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Lời Nhắn Cho Gia Sư</h3>
                <p className="text-xs text-slate-400">Gửi dặn dò hoặc phản hồi cho Gia sư {tutorName}</p>
              </div>
            </div>

            {feedbackSent ? (
              <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Đã gửi lời nhắn thành công!</p>
                <p className="text-xs text-slate-300">Gia sư sẽ phản hồi cho Phụ huynh qua Zalo.</p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Gia sư ơi, buổi tới cho cháu ôn lại phần bài tập nâng cao nhé..."
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs resize-none font-medium"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-4 h-4" />
                  Gửi Lời Nhắn Ngay
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-slate-900 border-b border-white/10 py-6 px-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                TutorTrack Portal
              </span>
              <h1 className="text-lg font-bold text-white">Sổ Theo Dõi Học Tập Chi Tiết</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPDFModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              In / Xuất PDF
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
              {copied ? "Đã sao chép" : "Chia sẻ link"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        
        {loading && (
          <div className="glass p-12 text-center rounded-2xl border border-white/5">
            <span className="text-xs text-indigo-400 font-semibold animate-pulse">Đang tải sổ học tập của con...</span>
          </div>
        )}

        {!loading && !student && (
          <div className="glass p-12 text-center rounded-2xl border border-red-500/20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Không tìm thấy Sổ Học Tập</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Đường link không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ Gia sư để nhận link mới, 
              hoặc sử dụng trang <a href="/lookup" className="text-indigo-400 hover:underline font-semibold">Tra Cứu bằng SĐT</a>.
            </p>
          </div>
        )}

        {!loading && student && (
          <>
            {/* Student Info Card */}
            <div className="glass p-6 rounded-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Môn {student.subject} • {student.grade}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                  <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                    Gia sư phụ trách: <span className="text-white font-medium">{tutorName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFeedbackModal(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Gửi Lời Nhắn
                  </button>

                  <a
                    href={`tel:0912345678`}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Gọi Gia Sư
                  </a>
                </div>
              </div>

              {/* Quick Stats & VietQR Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-slate-400 block mb-1">Số buổi đã học ({currentMonthStr})</span>
                  <span className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    {completedSessionsCount} / {sessions.length || 8} buổi
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">Học phí thực tế ({currentMonthStr})</span>
                    <span className="text-xl font-bold text-amber-400">{actualFee.toLocaleString()} VNĐ</span>
                    <span className="text-[10px] text-slate-400 block">(Dự kiến cả tháng: {projectedFee.toLocaleString()} VNĐ)</span>
                  </div>

                  <button
                    onClick={() => setShowQRModal(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Mã QR Bank
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Student Progress Line Chart */}
            <StudentProgressChart sessions={sessions} />

            {/* Learning Roadmap & Session History */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Lộ Trình Buổi Học & Đánh Giá
              </h3>

              <div className="space-y-4">
                {sessions.map((session, index) => {
                  const files = session.homeworkFiles && session.homeworkFiles.length > 0
                    ? session.homeworkFiles
                    : (session.homeworkFile ? [session.homeworkFile] : []);
                  const hasDetails = session.tutorFeedback || session.homework || files.length > 0;

                  return (
                    <div 
                      key={session.id}
                      onClick={() => setSelectedDetailSession(session)}
                      className={cn(
                        "glass p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.005]",
                        session.status === "COMPLETED" 
                          ? "border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40" 
                          : "border-white/5 bg-indigo-500/5 hover:border-indigo-500/30"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
                            #{index + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                              {session.topic}
                            </h4>
                            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              {session.date} • {session.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto" onClick={(e) => e.stopPropagation()}>
                          {session.testScore !== undefined && (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                              {session.testScore}/10
                            </span>
                          )}

                          <span className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full border",
                            session.status === "COMPLETED" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          )}>
                            {session.status === "COMPLETED" ? "Đã Hoàn Thành" : "Sắp Diễn Ra"}
                          </span>

                          {session.status !== "COMPLETED" && !session.rescheduleRequest && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRescheduleSessionTarget(session);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold transition"
                            >
                              Xin Nghỉ / Đổi Lịch
                            </button>
                          )}
                        </div>
                      </div>

                      {session.rescheduleRequest && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                          <span>⏳ Đã gửi yêu cầu đổi lịch: <strong>{session.rescheduleRequest.reason}</strong></span>
                          <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-bold">Chờ Gia sư duyệt</span>
                        </div>
                      )}

                      {/* Session Feedback, Homework & File Attachment */}
                      {hasDetails && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 text-sm">
                          {session.tutorFeedback && (
                            <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/20">
                              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                                <Award className="w-4 h-4 text-indigo-400" />
                                Nhận xét từ Gia sư:
                              </span>
                              <p className="text-slate-300 text-xs leading-relaxed">{session.tutorFeedback}</p>
                            </div>
                          )}

                          {(session.homework || files.length > 0) && (
                            <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2" onClick={(e) => e.stopPropagation()}>
                              {session.homework && (
                                <div>
                                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                                    <FileText className="w-4 h-4 text-purple-400" />
                                    Bài tập về nhà:
                                  </span>
                                  <p className="text-slate-300 text-xs">{session.homework}</p>
                                </div>
                              )}

                              {/* File Download List for Parent */}
                              {files.length > 0 && (
                                <div className="pt-2 border-t border-white/5 space-y-1.5">
                                  <span className="text-[11px] font-semibold text-purple-300 block mb-1">
                                    File đính kèm ({files.length}):
                                  </span>
                                  {files.map((file, fileIdx) => (
                                    <div key={fileIdx} className="flex items-center justify-between bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                                        <span className="text-xs text-white font-medium truncate">{file.name}</span>
                                        <span className="text-[10px] text-purple-300/80 shrink-0">({file.size})</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownloadFile(file.url, file.name);
                                        }}
                                        className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                                      >
                                        <Download className="w-3 h-3" />
                                        Tải Đề Bài
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="text-center py-6 text-xs text-slate-500">
          <p>TutorTrack System • Báo cáo học tập minh bạch cho Phụ huynh</p>
        </div>
      </div>
    </div>
  );
}
