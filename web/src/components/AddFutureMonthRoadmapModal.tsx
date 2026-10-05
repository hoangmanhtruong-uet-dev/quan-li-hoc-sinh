"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Clock, BookOpen, Plus, Save, Trash2, ArrowUp, ArrowDown, Upload, Paperclip, Sparkles } from "lucide-react";
import { Student, Subject } from "@/types/database";
import { ClassSessionItem } from "./CheckInModal";
import { generateDatesForMonth, getUpcomingMonthOptions, getNextMonthStr } from "@/lib/utils";
import { uploadHomeworkFilesToStorage } from "@/lib/storage";

interface AddFutureMonthRoadmapModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (sessions: ClassSessionItem[]) => Promise<void>;
}

const daysOfWeekList = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

const defaultRoadmapSuggestions: Record<string, string[]> = {
  "Hóa học": [
    "Chuyên đề Este: Phản ứng Xà phòng hóa & Bài tập nâng cao",
    "Chuyên đề Cacbohidrat: Tinh bột & Xenlulozơ",
    "Chuyên đề Amin: Tính bazơ & Phản ứng thế nhân thơm",
    "Chuyên đề Amino Axit & Peptit: Thủy phân & Bài tập đếm",
    "Chuyên đề Polime: Phân loại & Phản ứng trùng hợp",
    "Chuyên đề Đại cương Kim loại: Tính chất vật lý & Hóa học",
    "Chuyên đề Kim loại Kiềm & Kiềm thổ: Bài tập CO2 tác dụng với Kiềm",
    "Tổng ôn Hóa học Học kỳ & Bài kiểm tra đánh giá",
  ],
  "Toán học": [
    "Chuyên đề Hàm số: Tiệm cận & Đồ thị nâng cao",
    "Chuyên đề Mũ & Logarit: Phương trình & Bất phương trình",
    "Chuyên đề Hình không gian: Góc & Khoảng cách",
    "Chuyên đề Khối tròn xoay: Nón, Trụ, Cầu",
    "Chuyên đề Nguyên hàm & Tích phân cơ bản",
    "Chuyên đề Ứng dụng Tích phân tính diện tích & thể tích",
    "Chuyên đề Số phức: Đại số & Hình học",
    "Tổng ôn Đề thi thử Toán học & Kiểm tra tháng",
  ],
  "Tiếng Anh": [
    "Advanced Grammar: Inversion & Conditional Clauses",
    "Vocabulary Booster: Topic Environment & Technology",
    "Reading Comprehension: Skimming & Scanning Strategies",
    "Listening Skills: Multiple Choice & Sentence Completion",
    "Writing Skills: Essay Structure & Linking Words",
    "Grammar Review: Passive Voice & Reported Speech",
    "Mock Test Practice: Full Length Examination",
    "Monthly Assessment & Feedback Session",
  ],
};

export function AddFutureMonthRoadmapModal({ isOpen, student, onClose, onSave }: AddFutureMonthRoadmapModalProps) {
  const monthOptions = getUpcomingMonthOptions(6);
  const [selectedMonth, setSelectedMonth] = useState(getNextMonthStr());
  const [selectedDays, setSelectedDays] = useState<string[]>(["Thứ 2", "Thứ 7"]);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({
    "Thứ 2": "19:30 - 21:30",
    "Thứ 7": "17:00 - 19:00",
  });
  const [editingSessions, setEditingSessions] = useState<ClassSessionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && student) {
      setSelectedMonth(getNextMonthStr());
      // Regenerate dates for next month
      generateDefaultSessions(getNextMonthStr(), selectedDays, scheduleTimes);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const generateDefaultSessions = (monthStr: string, days: string[], times: Record<string, string>) => {
    const dates = generateDatesForMonth(monthStr, days);
    const suggestions = defaultRoadmapSuggestions[student.subject] || defaultRoadmapSuggestions["Hóa học"];

    const generated: ClassSessionItem[] = dates.slice(0, 10).map((d, idx) => ({
      id: `new-${Date.now()}-${idx}`,
      student: student.name,
      subject: student.subject,
      topic: suggestions[idx % suggestions.length] || `Bài ${idx + 1}: Chuyên đề ${student.subject}`,
      roadmapTopic: suggestions[idx % suggestions.length] || `Bài ${idx + 1}: Chuyên đề ${student.subject}`,
      date: d.dateStr,
      time: times[d.dayOfWeek] || "19:30 - 21:30",
      month: monthStr,
      status: "SCHEDULED",
    }));

    setEditingSessions(generated);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    generateDefaultSessions(newMonth, selectedDays, scheduleTimes);
  };

  const toggleDay = (day: string) => {
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(nextDays);
    
    const nextTimes = { ...scheduleTimes };
    if (!nextTimes[day] && !selectedDays.includes(day)) {
      nextTimes[day] = "19:30 - 21:30";
    }
    setScheduleTimes(nextTimes);

    generateDefaultSessions(selectedMonth, nextDays, nextTimes);
  };

  const handleTimeChange = (day: string, time: string) => {
    const nextTimes = { ...scheduleTimes, [day]: time };
    setScheduleTimes(nextTimes);
    generateDefaultSessions(selectedMonth, selectedDays, nextTimes);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setEditingSessions((prev) => {
      const next = [...prev];
      const tempDate = next[index].date;
      const tempTime = next[index].time;
      next[index].date = next[index - 1].date;
      next[index].time = next[index - 1].time;
      next[index - 1].date = tempDate;
      next[index - 1].time = tempTime;

      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= editingSessions.length - 1) return;
    setEditingSessions((prev) => {
      const next = [...prev];
      const tempDate = next[index].date;
      const tempTime = next[index].time;
      next[index].date = next[index + 1].date;
      next[index].time = next[index + 1].time;
      next[index + 1].date = tempDate;
      next[index + 1].time = tempTime;

      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const handleUpdateTopic = (index: number, topic: string) => {
    setEditingSessions((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, topic, roadmapTopic: topic } : s))
    );
  };

  const handleUpdateDate = (index: number, date: string) => {
    setEditingSessions((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, date } : s))
    );
  };

  const handleUpdateTime = (index: number, time: string) => {
    setEditingSessions((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, time } : s))
    );
  };

  const handleRemoveSession = (index: number) => {
    setEditingSessions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCustomSession = () => {
    const defaultTime = Object.values(scheduleTimes)[0] || "19:30 - 21:30";
    const newSession: ClassSessionItem = {
      id: `new-${Date.now()}`,
      student: student.name,
      subject: student.subject,
      topic: `Bài bổ sung ${editingSessions.length + 1}`,
      roadmapTopic: `Bài bổ sung ${editingSessions.length + 1}`,
      date: "",
      time: defaultTime,
      month: selectedMonth,
      status: "SCHEDULED",
    };
    setEditingSessions([...editingSessions, newSession]);
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingIdx(index);
      const results = await uploadHomeworkFilesToStorage(files);
      if (results.length > 0) {
        setEditingSessions((prev) =>
          prev.map((s, idx) => {
            if (idx !== index) return s;
            const existing = s.homeworkFiles && s.homeworkFiles.length > 0
              ? s.homeworkFiles
              : (s.homeworkFile ? [s.homeworkFile] : []);
            const updated = [...existing, ...results];
            return {
              ...s,
              homeworkFiles: updated,
              homeworkFile: updated[0] || null,
            };
          })
        );
      }
      setUploadingIdx(null);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (editingSessions.length === 0) {
      alert("Vui lòng thêm ít nhất 1 buổi học cho lộ trình tháng mới!");
      return;
    }

    setIsSaving(true);
    await onSave(editingSessions);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/30 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Tạo Lộ Trình Tháng Mới: {student.name}
              </h2>
              <p className="text-xs text-slate-400">
                Lập kế hoạch bài học trước cho các tháng tiếp theo ({student.subject})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-white/5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Chọn Tháng Cần Tạo Lộ Trình *
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/30 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>📅 {m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chọn Các Ngày Dạy Cố Định Trong Tuần:
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeekList.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md border border-indigo-400/40"
                          : "bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-400" />
                Khung Giờ Tương Ứng:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedDays.map(day => (
                  <div key={day} className="flex items-center gap-2 bg-slate-900 border border-white/5 p-2 rounded-xl">
                    <span className="text-xs font-bold text-indigo-300 w-16 text-center shrink-0">{day}</span>
                    <input
                      type="text"
                      value={scheduleTimes[day] || ""}
                      onChange={(e) => handleTimeChange(day, e.target.value)}
                      className="w-full bg-transparent border-none text-white text-xs font-medium focus:outline-none placeholder:text-slate-500"
                      placeholder="Ví dụ: 19:30 - 21:30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {editingSessions.map((session, index) => {
            const files = session.homeworkFiles && session.homeworkFiles.length > 0
              ? session.homeworkFiles
              : (session.homeworkFile ? [session.homeworkFile] : []);

            return (
              <div key={session.id} className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-xl border border-white/10 items-start">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs text-slate-400 font-semibold">Tên bài học #{index + 1}</label>
                  <input
                    type="text"
                    value={session.topic}
                    onChange={(e) => handleUpdateTopic(index, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="VD: Cấu tạo nguyên tử"
                  />

                  {/* File uploads */}
                  <div className="space-y-1 pt-1">
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {files.map((file, fileIdx) => (
                          <div key={fileIdx} className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md text-xs text-purple-200">
                            <Paperclip className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate max-w-[140px] font-medium text-purple-300">{file.name}</span>
                            <span className="text-[10px] text-purple-300/70">({file.size})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 cursor-pointer w-fit bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1 rounded-md transition mt-1">
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      {uploadingIdx === index ? "Đang tải file..." : "Đính kèm bài tập (nhiều file, <=10MB)"}
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                        className="hidden"
                        disabled={uploadingIdx === index}
                        onChange={(e) => handleFileUpload(index, e)}
                      />
                    </label>
                  </div>
                </div>

                <div className="w-full md:w-36 space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Ngày học</label>
                  <input
                    type="text"
                    value={session.date}
                    onChange={(e) => handleUpdateDate(index, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="VD: Thứ 2, 02/11"
                  />
                </div>

                <div className="w-full md:w-36 space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Giờ học</label>
                  <input
                    type="text"
                    value={session.time}
                    onChange={(e) => handleUpdateTime(index, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    placeholder="19:30 - 21:30"
                  />
                </div>

                <div className="flex items-center gap-2 self-start md:self-end pt-1 md:pt-6 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:opacity-30 transition"
                      title="Đổi vị trí LÊN TRÊN (giữ nguyên ngày giờ)"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-300 px-1">#{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === editingSessions.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:opacity-30 transition"
                      title="Đổi vị trí XUỐNG DƯỚI (giữ nguyên ngày giờ)"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition"
                    title="Xóa buổi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAddCustomSession}
            className="w-full py-3 border-2 border-dashed border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Buổi Học Khác Cho {selectedMonth}
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-slate-950/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? "Đang tạo lộ trình..." : (
              <>
                <Save className="w-4 h-4" />
                Lưu Lộ Trình {selectedMonth}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
