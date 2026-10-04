"use client";

import { X, Printer, GraduationCap, CheckCircle2, Calendar, Award } from "lucide-react";
import { Student } from "@/types/database";
import { ClassSessionItem } from "./CheckInModal";

interface PrintableReportModalProps {
  isOpen: boolean;
  student: Student | null;
  sessions: ClassSessionItem[];
  onClose: () => void;
}

export function PrintableReportModal({ isOpen, student, sessions, onClose }: PrintableReportModalProps) {
  if (!isOpen || !student) return null;

  const completedSessions = sessions.filter((s) => s.status === "COMPLETED");
  const hourlyRate = student.hourlyRate || 200000;
  const totalFee = completedSessions.length * hourlyRate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-2xl p-6 sm:p-8 relative shadow-2xl border border-white/10 my-8">
        
        {/* Modal Controls (Hidden when printing) */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 print:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Xem Trước Báo Cáo Học Tập PDF</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
            >
              <Printer className="w-4 h-4" />
              In / Xuất File PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="space-y-6 text-slate-900 bg-white p-6 sm:p-8 rounded-xl print:p-0 print:bg-transparent print:text-black shadow-lg print:shadow-none">
          
          {/* Paper Header */}
          <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-indigo-950">TUTORTRACK EDUCATION</h2>
              <p className="text-xs text-slate-600">Báo Cáo Tình Hình Học Tập & Học Phí Tháng 10/2026</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-indigo-900 block">Gia Sư: HOANG MANH TRUONG</span>
              <span className="text-[11px] text-slate-500">Môn: {student.subject}</span>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-2 gap-4 bg-slate-100 p-4 rounded-lg text-xs">
            <div>
              <p className="text-slate-500">Học sinh:</p>
              <p className="font-bold text-slate-900 text-sm">{student.name}</p>
              <p className="text-slate-600">{student.grade}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Số buổi hoàn thành:</p>
              <p className="font-bold text-emerald-700 text-sm">{completedSessions.length} / {sessions.length || 8} buổi</p>
              <p className="text-slate-600">Học phí: {totalFee.toLocaleString()} VNĐ</p>
            </div>
          </div>

          {/* Detailed Session Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Chi Tiết Các Buổi Học Trong Tháng</h4>
            <table className="w-full text-xs text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-200 text-slate-800">
                  <th className="p-2 border border-slate-300">#</th>
                  <th className="p-2 border border-slate-300">Ngày học</th>
                  <th className="p-2 border border-slate-300">Chủ đề bài học</th>
                  <th className="p-2 border border-slate-300">Điểm KT</th>
                  <th className="p-2 border border-slate-300">Nhận xét của gia sư</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => (
                  <tr key={s.id} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-200 font-bold">{idx + 1}</td>
                    <td className="p-2 border border-slate-200 font-medium whitespace-nowrap">{s.date}</td>
                    <td className="p-2 border border-slate-200 font-semibold">{s.topic}</td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-indigo-900">
                      {s.testScore !== undefined ? `${s.testScore}/10` : "-"}
                    </td>
                    <td className="p-2 border border-slate-200 text-slate-600 italic">
                      {s.tutorFeedback || "Học tập tốt, hoàn thành bài tập đầy đủ."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paper Footer */}
          <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
            <div>
              <p className="font-bold text-indigo-950">Ngân hàng nhận học phí VietQR:</p>
              <p className="text-slate-600">Tên TK: HOANG MANH TRUONG</p>
              <p className="text-slate-600">Mã QR VietQR đã nhúng trên Portal Phụ Huynh</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 mb-8">Chữ ký Gia Sư</p>
              <p className="font-bold text-slate-900">Hoàng Mạnh Trường</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
