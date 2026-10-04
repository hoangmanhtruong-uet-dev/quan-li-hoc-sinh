import { useState, useEffect } from "react";
import { X, Save, Trash2, Plus, Calendar, Clock, BookOpen, Upload, Paperclip } from "lucide-react";
import { ClassSessionItem } from "./CheckInModal";
import { Student } from "@/types/database";
import { uploadHomeworkFileToStorage } from "@/lib/storage";

interface EditRoadmapModalProps {
  isOpen: boolean;
  student: Student | null;
  sessions: ClassSessionItem[];
  onClose: () => void;
  onSave: (updatedSessions: ClassSessionItem[], deletedSessionIds: string[]) => Promise<void>;
}

export function EditRoadmapModal({ isOpen, student, sessions, onClose, onSave }: EditRoadmapModalProps) {
  const [editingSessions, setEditingSessions] = useState<ClassSessionItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      // Sort sessions by date or just keep them as is (assuming they are ordered)
      // Only edit SCHEDULED sessions
      setEditingSessions(sessions.filter(s => s.status === 'SCHEDULED'));
      setDeletedIds([]);
    }
  }, [isOpen, student, sessions]);

  if (!isOpen || !student) return null;

  const handleUpdateSession = (id: string, field: keyof ClassSessionItem, value: any) => {
    setEditingSessions(prev => 
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingId(id);
      const result = await uploadHomeworkFileToStorage(file);
      if (result) {
        setEditingSessions(prev =>
          prev.map(s => s.id === id ? { ...s, homeworkFile: result } : s)
        );
      }
      setUploadingId(null);
    }
  };

  const handleRemoveFile = (id: string) => {
    setEditingSessions(prev =>
      prev.map(s => s.id === id ? { ...s, homeworkFile: null } : s)
    );
  };

  const handleDeleteSession = (id: string) => {
    if (id.startsWith('new-')) {
      setEditingSessions(prev => prev.filter(s => s.id !== id));
    } else {
      setDeletedIds(prev => [...prev, id]);
      setEditingSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleAddSession = () => {
    const newSession: ClassSessionItem = {
      id: `new-${Date.now()}`,
      student: student.name,
      subject: student.subject,
      topic: "Bài mới",
      roadmapTopic: "Bài mới",
      date: "",
      time: "19h30 - 21h30",
      month: "", // will be calculated on backend
      status: "SCHEDULED",
    };
    setEditingSessions([...editingSessions, newSession]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editingSessions, deletedIds);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Sửa Lộ Trình: {student.name}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Sửa đổi các buổi học sắp tới (Chỉ áp dụng cho các buổi chưa điểm danh)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {editingSessions.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
              Học sinh này không có buổi học nào sắp tới.
            </div>
          ) : (
            editingSessions.map((session, index) => (
              <div key={session.id} className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-xl border border-white/10 items-start">
                <div className="flex-1 space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Tên bài học</label>
                  <input
                    type="text"
                    value={session.topic}
                    onChange={(e) => handleUpdateSession(session.id, 'topic', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="VD: Cấu tạo nguyên tử"
                  />
                  {!session.homeworkFile ? (
                    <label className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 cursor-pointer w-fit bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1 rounded-md transition mt-1">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      {uploadingId === session.id ? "Đang tải file lên..." : "Đính kèm file bài tập / tài liệu"}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        disabled={uploadingId === session.id}
                        onChange={(e) => handleFileUpload(session.id, e)}
                      />
                    </label>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-md text-xs text-purple-200 w-fit mt-1">
                      <Paperclip className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <a 
                        href={session.homeworkFile.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="truncate max-w-[200px] font-medium hover:underline text-purple-300"
                      >
                        {session.homeworkFile.name}
                      </a>
                      <span className="text-[10px] text-purple-300/70">({session.homeworkFile.size})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(session.id)}
                        className="text-red-400 hover:text-red-300 ml-1"
                        title="Xóa file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-40 space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Ngày học</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={session.date}
                      onChange={(e) => handleUpdateSession(session.id, 'date', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                </div>

                <div className="w-full md:w-40 space-y-2">
                  <label className="text-xs text-slate-400 font-semibold">Giờ học</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={session.time}
                      onChange={(e) => handleUpdateSession(session.id, 'time', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                      placeholder="19h30 - 21h30"
                    />
                  </div>
                </div>

                <div className="flex items-end pt-6">
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
                    title="Xóa buổi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={handleAddSession}
            className="w-full py-3 border-2 border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Buổi Học Mới
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-slate-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : (
              <>
                <Save className="w-4 h-4" />
                Lưu Thay Đổi Lộ Trình
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
