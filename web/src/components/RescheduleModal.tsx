"use client";

import { useState } from "react";
import { X, Calendar, Clock, AlertTriangle, Send, CheckCircle2 } from "lucide-react";
import { ClassSessionItem } from "./CheckInModal";

interface RescheduleModalProps {
  isOpen: boolean;
  session: ClassSessionItem | null;
  onClose: () => void;
  onSubmitRequest: (sessionId: string, reason: string, proposedDate?: string, proposedTime?: string) => void;
}

const presetReasons = [
  "Con bị ốm / Sức khỏe",
  "Bận việc gia đình",
  "Trùng lịch kiểm tra ở trường",
  "Khác (Ghi chú chi tiết)"
];

export function RescheduleModal({ isOpen, session, onClose, onSubmitRequest }: RescheduleModalProps) {
  const [selectedReason, setSelectedReason] = useState(presetReasons[0]);
  const [customNote, setCustomNote] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !session) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === "Khác (Ghi chú chi tiết)" 
      ? customNote.trim() || "Xin nghỉ / đổi lịch" 
      : `${selectedReason}${customNote ? `: ${customNote}` : ""}`;

    onSubmitRequest(session.id, finalReason, proposedDate || undefined, proposedTime || undefined);
    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Xin Nghỉ / Đề Xuất Học Bù</h3>
            <p className="text-xs text-slate-400">Buổi học: <strong className="text-white">{session.topic}</strong></p>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Đã Gửi Đề Xuất Thành Công!</h4>
            <p className="text-xs text-slate-300">Gia sư sẽ xem xét và phản hồi / sắp xếp lại lịch học cho cháu sớm nhất.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Lịch dạy hiện tại: <strong>{session.date} ({session.time})</strong></span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Lý do xin nghỉ / đổi lịch:</label>
              <div className="grid grid-cols-2 gap-2">
                {presetReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedReason(r)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition ${
                      selectedReason === r
                        ? "bg-indigo-600 text-white border-indigo-500 font-bold"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi chú chi tiết (nếu có):</label>
              <textarea
                rows={2}
                placeholder="VD: Cháu bị sốt nhẹ, nhờ Thầy cô cho cháu xin học bù vào cuối tuần..."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Ngày học bù mong muốn:
                </label>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Giờ học bù:
                </label>
                <input
                  type="text"
                  placeholder="VD: 19h30 - 21h30"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi Đề Xuất
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
