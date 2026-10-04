"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, Award, FileText, Calendar, Upload, FileCheck, Paperclip, Trash2, Trophy } from "lucide-react";
import { uploadHomeworkFileToStorage } from "@/lib/storage";

export interface RescheduleRequest {
  id: string;
  reason: string;
  proposedDate?: string;
  proposedTime?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface ClassSessionItem {
  id: string;
  student: string;
  subject: string;
  topic: string;
  roadmapTopic: string;
  time: string;
  date: string;
  month: string;
  status: "COMPLETED" | "SCHEDULED" | "CANCELLED" | "RESCHEDULED";
  homework?: string;
  homeworkFile?: { name: string; size: string; url: string } | null;
  tutorFeedback?: string;
  testScore?: number; // Thang điểm 10
  icon?: any;
  rescheduleRequest?: RescheduleRequest | null;
}

interface CheckInModalProps {
  isOpen: boolean;
  session: ClassSessionItem | null;
  onClose: () => void;
  onSaveSession: (updatedSession: ClassSessionItem) => void;
}

export function CheckInModal({ isOpen, session, onClose, onSaveSession }: CheckInModalProps) {
  const [topic, setTopic] = useState("");
  const [homework, setHomework] = useState("");
  const [tutorFeedback, setTutorFeedback] = useState("");
  const [testScore, setTestScore] = useState<string>("");
  const [status, setStatus] = useState<"COMPLETED" | "SCHEDULED" | "CANCELLED" | "RESCHEDULED">("COMPLETED");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session) {
      setTopic(session.topic || session.roadmapTopic || "");
      setHomework(session.homework || "");
      setTutorFeedback(session.tutorFeedback || "");
      setTestScore(session.testScore !== undefined ? String(session.testScore) : "");
      setStatus(session.status === "SCHEDULED" ? "COMPLETED" : session.status);
      setUploadedFile(session.homeworkFile || null);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const result = await uploadHomeworkFileToStorage(file);
      if (result) {
        setUploadedFile(result);
      }
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSession({
      ...session,
      topic,
      homework,
      homeworkFile: uploadedFile,
      tutorFeedback,
      testScore: testScore !== "" ? Number(testScore) : undefined,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="glass w-full max-w-lg rounded-2xl p-6 relative shadow-2xl border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Điểm Danh & Ghi Nhận Buổi Học</h3>
            <p className="text-xs text-slate-400">Học sinh: <span className="text-white font-medium">{session.student}</span> • Môn: <span className="text-indigo-400 font-medium">{session.subject}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/20">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Nội dung học theo Lộ trình (Tự động tải):
              </label>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold">
                Roadmap
              </span>
            </div>

            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-900/80 border border-indigo-500/30 text-white font-semibold text-xs focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng thái buổi học</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs font-medium"
              >
                <option value="COMPLETED">✅ Đã Hoàn Thành (Điểm danh)</option>
                <option value="SCHEDULED">📅 Đã Lên Lịch</option>
                <option value="CANCELLED">❌ Hủy / Nghỉ Học</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Điểm kiểm tra (Thang 10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                placeholder="VD: 8.5"
                value={testScore}
                onChange={(e) => setTestScore(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-amber-300 font-bold placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              Nhận xét thái độ & kết quả học (Hiển thị cho Phụ huynh)
            </label>
            <textarea
              rows={2}
              placeholder="VD: Học sinh nắm tốt công thức, làm bài tập tự luận nhanh..."
              value={tutorFeedback}
              onChange={(e) => setTutorFeedback(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-400" />
              Bài tập về nhà & Đề bài đính kèm
            </label>
            
            <input
              type="text"
              placeholder="VD: Làm bài 1 - 10 trang 15 SBT..."
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
            />

            {!uploadedFile ? (
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 cursor-pointer transition text-xs font-semibold text-purple-300">
                <Upload className="w-4 h-4 text-purple-400" />
                {uploading ? "Đang tải file lên Cloud Storage..." : "Tải file bài tập lên (PDF, Word, Ảnh)"}
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Paperclip className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white font-medium truncate">{uploadedFile.name}</span>
                  <span className="text-[10px] text-purple-300/80 shrink-0">({uploadedFile.size})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 rounded-md text-red-400 hover:bg-red-500/20 transition"
                  title="Xóa file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
            >
              Xác Nhận & Lưu Điểm Danh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
