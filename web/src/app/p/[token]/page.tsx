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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchStudentsFromDB, fetchSessionsFromDB } from "@/lib/db";
import { Student } from "@/types/database";
import { ClassSessionItem } from "@/components/CheckInModal";
import { useParams } from "next/navigation";

export default function ParentPortalPage() {
  const params = useParams();
  const token = params?.token as string;

  const [copied, setCopied] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<ClassSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // VietQR Modal State
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [parentNote, setParentNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const allStudents = await fetchStudentsFromDB();
      const allSessions = await fetchSessionsFromDB();

      // Find student matching token or id
      const matchedStudent = allStudents.find((s) => s.id === token || s.magicToken === token) || allStudents[0] || null;
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

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentNote.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedbackModal(false);
      setParentNote("");
    }, 2000);
  };

  const completedSessionsCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const currentMonthStr = "Tháng 10/2026";
  const hourlyRate = student?.hourlyRate || 200000;
  const actualFee = completedSessionsCount * hourlyRate;
  const projectedFee = (sessions.length || 8) * hourlyRate;

  // VietQR Code URL (MBBank / Techcombank demo QR)
  const bankAccount = "999988886666";
  const bankName = "MBBANK";
  const qrCodeUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${actualFee}&addInfo=Dong%20hoc%20phi%20Thang10%20${encodeURIComponent(student?.name || "HocSinh")}&accountName=GIA%20SU%20HOANG`;

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 pb-12">
      
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
                Chuyển Khoản Tự Động
              </span>
              <h3 className="text-lg font-bold text-white">Mã QR Thanh Toán Học Phí</h3>
              <p className="text-xs text-slate-400">Quét mã bằng ứng dụng Ngân hàng / ZaloPay</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-white/10 inline-block mx-auto shadow-inner">
              <img 
                src={qrCodeUrl} 
                alt="Mã QR Học Phí VietQR" 
                className="w-56 h-56 object-contain mx-auto rounded-lg"
              />
            </div>

            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-amber-400">{actualFee.toLocaleString()} VNĐ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-white">{bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số TK:</span>
                <span className="font-mono font-bold text-indigo-300">{bankAccount}</span>
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
                <p className="text-xs text-slate-400">Gửi dặn dò hoặc phản hồi cho Gia sư phụ trách</p>
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

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-indigo-400" />}
            {copied ? "Đã sao chép" : "Chia sẻ link"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        
        {loading && (
          <div className="glass p-12 text-center rounded-2xl border border-white/5">
            <span className="text-xs text-indigo-400 font-semibold animate-pulse">Đang tải sổ học tập của con...</span>
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
                    Gia sư phụ trách: <span className="text-white font-medium">Gia sư Hoàng</span>
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
                    <span className="text-xs text-slate-400 block mb-0.5">Học phí đã học ({currentMonthStr})</span>
                    <span className="text-xl font-bold text-amber-400">{actualFee.toLocaleString()} VNĐ</span>
                    <span className="text-[10px] text-slate-400 block">(Dự kiến cả tháng: {projectedFee.toLocaleString()} VNĐ)</span>
                  </div>

                  <button
                    onClick={() => setShowQRModal(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <QrCode className="w-4 h-4 text-amber-400" />
                    Mã QR
                  </button>
                </div>
              </div>
            </div>

            {/* Learning Roadmap & Session History */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Lộ Trình Buổi Học & Đánh Giá
              </h3>

              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div 
                    key={session.id}
                    className={cn(
                      "glass p-5 rounded-2xl border transition-all",
                      session.status === "COMPLETED" 
                        ? "border-emerald-500/20 bg-emerald-950/10" 
                        : "border-white/5 bg-indigo-500/5"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-indigo-300">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-white text-base">{session.topic}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {session.date} • {session.time}
                          </p>
                        </div>
                      </div>

                      <span className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto",
                        session.status === "COMPLETED" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      )}>
                        {session.status === "COMPLETED" ? "Đã Hoàn Thành" : "Sắp Diễn Ra"}
                      </span>
                    </div>

                    {/* Session Feedback, Homework & File Attachment */}
                    {session.status === "COMPLETED" && (
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

                        {(session.homework || session.homeworkFile) && (
                          <div className="bg-white/5 p-3.5 rounded-xl border border-white/5 space-y-2">
                            {session.homework && (
                              <div>
                                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                                  <FileText className="w-4 h-4 text-purple-400" />
                                  Bài tập về nhà:
                                </span>
                                <p className="text-slate-300 text-xs">{session.homework}</p>
                              </div>
                            )}

                            {/* File Download Button for Parent */}
                            {session.homeworkFile && (
                              <div className="pt-2 border-t border-white/5 flex items-center justify-between bg-purple-500/10 p-2.5 rounded-lg border border-purple-500/20">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="text-xs text-white font-medium truncate">{session.homeworkFile.name}</span>
                                  <span className="text-[10px] text-purple-300/80 shrink-0">({session.homeworkFile.size})</span>
                                </div>
                                <a
                                  href={session.homeworkFile.url}
                                  download
                                  className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold flex items-center gap-1 transition shrink-0"
                                >
                                  <Download className="w-3 h-3" />
                                  Tải Đề Bài
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
