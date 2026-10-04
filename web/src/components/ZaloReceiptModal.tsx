"use client";

import { useState } from "react";
import { X, CheckCircle2, Download, Copy, Check, QrCode, Send, Sparkles, ShieldCheck } from "lucide-react";
import { Student } from "@/types/database";

interface ZaloReceiptModalProps {
  isOpen: boolean;
  student: Student | null;
  completedCount: number;
  totalCount: number;
  totalFee: number;
  monthStr: string;
  isPaid: boolean;
  onClose: () => void;
  onTogglePaidStatus: (studentId: string, paid: boolean) => void;
}

export function ZaloReceiptModal({
  isOpen,
  student,
  completedCount,
  totalCount,
  totalFee,
  monthStr,
  isPaid,
  onClose,
  onTogglePaidStatus,
}: ZaloReceiptModalProps) {
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  if (!isOpen || !student) return null;

  const tutorName = "HOANG MANH TRUONG";
  const bankName = "MBBank / SeABank (VietQR)";
  const magicLink = typeof window !== "undefined" ? `${window.location.origin}/p/${student.magicToken || student.id}` : "";

  const generateReceiptText = () => {
    return (
      `🧾 BIÊN LAI XÁC NHẬN ĐÃ THU HỌC PHÍ - TUTORTRACK\n` +
      `-------------------------------------------\n` +
      `- Học sinh: ${student.name} (${student.grade})\n` +
      `- Môn học: ${student.subject}\n` +
      `- Kỳ học: ${monthStr}\n` +
      `- Số buổi hoàn thành: ${completedCount}/${totalCount} buổi\n` +
      `- Đơn giá: ${(student.hourlyRate || 200000).toLocaleString()} VNĐ / buổi\n` +
      `- TỔNG HỌC PHÍ: ${totalFee.toLocaleString()} VNĐ\n` +
      `- Trạng thái: ✅ ĐÃ THỜI HẠN / ĐÃ GẠCH NỢ THÀNH CÔNG\n` +
      `- Người nhận: ${tutorName}\n` +
      `-------------------------------------------\n` +
      `Cảm ơn Phụ huynh đã thanh toán đúng hạn!\n` +
      `Tra cứu Sổ học tập chi tiết của cháu tại: ${magicLink}`
    );
  };

  const handleCopyAndMarkPaid = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text);
    onTogglePaidStatus(student.id, true);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass w-full max-w-lg rounded-2xl p-6 relative shadow-2xl border border-white/10 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Quản Lý Thu Chi VietQR
            </span>
            <h3 className="text-lg font-bold text-white">Biên Lai Thanh Toán & Mã QR Bank</h3>
          </div>
        </div>

        {/* QR Code & Receiver details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/5">
          <div className="text-center space-y-2">
            <div className="bg-white p-2.5 rounded-xl inline-block shadow-lg border border-white/20">
              <img
                src="/qr-hoangmanhtruong.png"
                alt={`Mã VietQR ${tutorName}`}
                className="w-36 h-36 object-contain mx-auto rounded-md"
              />
            </div>
            
            <a
              href="/qr-hoangmanhtruong.png"
              download={`VietQR_${tutorName}.png`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Tải QR Về Máy
            </a>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block">Tên tài khoản nhận:</span>
              <span className="font-bold text-white text-sm">{tutorName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Ngân hàng:</span>
              <span className="font-medium text-indigo-300">{bankName}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Học sinh:</span>
              <span className="font-bold text-amber-300">{student.name} ({student.subject})</span>
            </div>
            <div>
              <span className="text-slate-400 block">Số tiền học phí:</span>
              <span className="font-extrabold text-emerald-400 text-base">{totalFee.toLocaleString()} VNĐ</span>
            </div>
            <div className="pt-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                isPaid 
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
              }`}>
                {isPaid ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                {isPaid ? "✅ Đã đóng học phí" : "⏳ Chưa thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleCopyAndMarkPaid}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
          >
            {copiedReceipt ? (
              <>
                <Check className="w-4 h-4 text-white animate-bounce" />
                Đã Copy Biên Lai & Đánh Dấu Đã Thu!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Xác Nhận Đã Thu & Copy Biên Lai Gửi Zalo Phụ Huynh
              </>
            )}
          </button>

          <button
            onClick={() => onTogglePaidStatus(student.id, !isPaid)}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition"
          >
            Đổi trạng thái: {isPaid ? "Chuyển sang ⏳ Chưa Đóng" : "Chuyển sang ✅ Đã Đóng"}
          </button>
        </div>
      </div>
    </div>
  );
}
