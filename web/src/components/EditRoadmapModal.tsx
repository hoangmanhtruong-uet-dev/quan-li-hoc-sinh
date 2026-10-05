import { useState, useEffect } from "react";
import { X, Save, Trash2, Plus, Calendar, Clock, BookOpen, Upload, Paperclip, ArrowUp, ArrowDown, Sparkles } from "lucide-react";
import { ClassSessionItem } from "./CheckInModal";
import { Student } from "@/types/database";
import { uploadHomeworkFilesToStorage } from "@/lib/storage";
import { parseSessionDateWeight } from "@/lib/db";
import { generateDatesForMonth, getCurrentMonthStr } from "@/lib/utils";

interface EditRoadmapModalProps {
  isOpen: boolean;
  student: Student | null;
  sessions: ClassSessionItem[];
  onClose: () => void;
  onSave: (updatedSessions: ClassSessionItem[], deletedSessionIds: string[]) => Promise<void>;
  onOpenAddFutureMonth?: () => void;
}

export function EditRoadmapModal({ isOpen, student, sessions, onClose, onSave, onOpenAddFutureMonth }: EditRoadmapModalProps) {
  const [editingSessions, setEditingSessions] = useState<ClassSessionItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      // Keep sessions in their roadmap slot order
      setEditingSessions(sessions.filter(s => s.status === 'SCHEDULED'));
      setDeletedIds([]);
    }
  }, [isOpen, student, sessions]);

  if (!isOpen || !student) return null;

  const reassignDates = (list: ClassSessionItem[]) => {
    if (list.length === 0) return list;
    const monthStr = list[0].month || getCurrentMonthStr();
    const generatedDates = generateDatesForMonth(monthStr, ["Thứ 2", "Thứ 7"]);
    return list.map((s, idx) => {
      const generatedDate = generatedDates[idx];
      if (generatedDate) {
        const isT2 = generatedDate.dayOfWeek === "Thứ 2" || generatedDate.dayOfWeek.includes("2");
        return {
          ...s,
          date: generatedDate.dateStr,
          time: isT2 ? "19:30 - 21:30" : "17:00 - 19:00",
          month: monthStr,
        };
      }
      return s;
    });
  };

  const handleSortDatesChronologically = () => {
    setEditingSessions((prev) => reassignDates(prev));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setEditingSessions((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return reassignDates(next);
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= editingSessions.length - 1) return;
    setEditingSessions((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return reassignDates(next);
    });
  };

  const handleUpdateSession = (id: string, field: keyof ClassSessionItem, value: any) => {
    setEditingSessions(prev => 
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
  };

  const handleFileUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingId(id);
      const results = await uploadHomeworkFilesToStorage(files);
      if (results.length > 0) {
        setEditingSessions(prev =>
          prev.map(s => {
            if (s.id !== id) return s;
            const existingFiles = s.homeworkFiles && s.homeworkFiles.length > 0
              ? s.homeworkFiles
              : (s.homeworkFile ? [s.homeworkFile] : []);
            const updatedFiles = [...existingFiles, ...results];
            return {
              ...s,
              homeworkFiles: updatedFiles,
              homeworkFile: updatedFiles[0] || null,
            };
          })
        );
      }
      setUploadingId(null);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (id: string, fileIdx: number) => {
    setEditingSessions(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const existingFiles = s.homeworkFiles && s.homeworkFiles.length > 0
          ? s.homeworkFiles
          : (s.homeworkFile ? [s.homeworkFile] : []);
        const updatedFiles = existingFiles.filter((_, idx) => idx !== fileIdx);
        return {
          ...s,
          homeworkFiles: updatedFiles.length > 0 ? updatedFiles : null,
          homeworkFile: updatedFiles[0] || null,
        };
      })
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleSortDatesChronologically}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Tự động sắp xếp các ngày học theo đúng thứ tự thời gian tăng dần trong tháng"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Sắp Xếp Chuẩn Lịch
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {editingSessions.length === 0 ? (
            <div className="text-center p-8 text-slate-400">
              Học sinh này không có buổi học nào sắp tới.
            </div>
          ) : (
            editingSessions.map((session, index) => {
              const files = session.homeworkFiles && session.homeworkFiles.length > 0
                ? session.homeworkFiles
                : (session.homeworkFile ? [session.homeworkFile] : []);

              return (
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

                    <div className="space-y-1 pt-1">
                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {files.map((file, fileIdx) => (
                            <div key={fileIdx} className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md text-xs text-purple-200">
                              <Paperclip className="w-3 h-3 text-purple-400 shrink-0" />
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="truncate max-w-[150px] font-medium hover:underline text-purple-300"
                              >
                                {file.name}
                              </a>
                              <span className="text-[10px] text-purple-300/70">({file.size})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(session.id, fileIdx)}
                                className="text-red-400 hover:text-red-300 ml-0.5"
                                title="Xóa file này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 cursor-pointer w-fit bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1 rounded-md transition mt-1">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        {uploadingId === session.id ? "Đang tải file..." : "Đính kèm file (nhiều file, <=10MB)"}
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                          className="hidden"
                          disabled={uploadingId === session.id}
                          onChange={(e) => handleFileUpload(session.id, e)}
                        />
                      </label>
                    </div>
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

                <div className="flex items-center gap-2.5 self-start md:self-end pt-1 md:pt-6 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:opacity-30 disabled:hover:bg-indigo-500/10 transition"
                      title="Đổi vị trí LÊN TRÊN (tự động giữ nguyên khung ngày giờ)"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-300 px-1">#{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === editingSessions.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:opacity-30 disabled:hover:bg-indigo-500/10 transition"
                      title="Đổi vị trí XUỐNG DƯỚI (tự động giữ nguyên khung ngày giờ)"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
                    title="Xóa buổi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddSession}
              className="py-3 border border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/50 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Thêm 1 Buổi Học Lẻ
            </button>

            {onOpenAddFutureMonth && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddFutureMonth();
                }}
                className="py-3 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/40 text-purple-300 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition shadow-sm"
              >
                <Calendar className="w-4 h-4 text-purple-400" />
                ➕ Tạo Lộ Trình Tháng Tới (Tự Động)
              </button>
            )}
          </div>
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
