"use client";

import { useState } from "react";
import { X, UserPlus, BookOpen, Phone, DollarSign, GraduationCap, Calendar, Clock, ArrowRight, Sparkles, Check, ArrowLeft, Trash2, Plus, Upload, Paperclip } from "lucide-react";
import { Student, Subject } from "@/types/database";
import { uploadHomeworkFilesToStorage } from "@/lib/storage";

export interface RoadmapSessionConfig {
  date: string;
  dayOfWeek: string;
  time: string;
  topic: string;
  homeworkFile?: { name: string; size: string; url: string } | null;
  homeworkFiles?: { name: string; size: string; url: string }[] | null;
}

export interface NewStudentPayload extends Omit<Student, "id" | "createdAt"> {
  scheduleDays: string[];
  scheduleTime: string;
  roadmapSessions: RoadmapSessionConfig[];
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (payload: NewStudentPayload) => void;
}

const subjects: Subject[] = ["Hóa học", "Toán học", "Vật lý", "Tiếng Anh", "Ngữ văn", "Sinh học", "Khác"];
const daysOfWeekList = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

// Suggested Roadmap Templates for Subjects
const defaultRoadmapSuggestions: Record<string, string[]> = {
  "Hóa học": [
    "Chuyên đề 1: Este - Khái niệm & Tính chất hóa học",
    "Chuyên đề 1: Bài tập Este cơ bản & Nâng cao",
    "Chuyên đề 1: Lipit & Chất béo - Bài tập Xà phòng hóa",
    "Chuyên đề 1: Tổng ôn Este - Lipit & Kiểm tra nhỏ 15p",
    "Chuyên đề 2: Cacbohidrat - Glucozơ & Fructozơ",
    "Chuyên đề 2: Saccarozơ & Tinh bột - Xenlulozơ",
    "Chuyên đề 2: Bài tập tổng hợp Cacbohidrat",
    "Chuyên đề 3: Amin - Khái niệm & Tính chất lưỡng tính",
  ],
  "Toán học": [
    "Chuyên đề: Tính đơn điệu của hàm số",
    "Chuyên đề: Cực trị của hàm số",
    "Chuyên đề: Giá trị lớn nhất & Nhỏ nhất của hàm số",
    "Chuyên đề: Tiệm cận của đồ thị hàm số",
    "Chuyên đề: Khảo sát sự biến thiên hàm số",
    "Chuyên đề: Khối đa diện & Thể tích khối đa diện",
    "Chuyên đề: Thể tích khối chóp & Khối lăng trụ",
    "Ôn tập & Đề thi khảo sát chất lượng tháng",
  ],
  "Tiếng Anh": [
    "Unit 1: Grammar - Present Perfect vs Past Simple",
    "Unit 1: Vocabulary - Life Stories & Reading Skills",
    "Unit 2: Grammar - Passive Voice & Advanced Exercises",
    "Unit 2: Listening & Speaking Confidence",
    "Unit 3: Grammar - Relative Clauses (Mệnh đề quan hệ)",
    "Unit 3: Practice Test - Reading Comprehension",
    "General Review: Pronunciation & Word Stress",
    "Monthly Progress Assessment & Mock Test",
  ],
};

export function AddStudentModal({ isOpen, onClose, onAddStudent }: AddStudentModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 Form States
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Lớp 12");
  const [subject, setSubject] = useState<Subject>("Hóa học");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("200000");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Thứ 2", "Thứ 7"]);
  const [scheduleTime, setScheduleTime] = useState("19:30 - 21:30");

  // Step 2 Roadmap States
  const [roadmapSessions, setRoadmapSessions] = useState<RoadmapSessionConfig[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleFileUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadingIndex(index);
      const results = await uploadHomeworkFilesToStorage(files);
      if (results.length > 0) {
        setRoadmapSessions((prev) =>
          prev.map((item, idx) => {
            if (idx !== index) return item;
            const existingFiles = item.homeworkFiles && item.homeworkFiles.length > 0
              ? item.homeworkFiles
              : (item.homeworkFile ? [item.homeworkFile] : []);
            const updatedFiles = [...existingFiles, ...results];
            return {
              ...item,
              homeworkFiles: updatedFiles,
              homeworkFile: updatedFiles[0] || null,
            };
          })
        );
      }
      setUploadingIndex(null);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number, fileIdx: number) => {
    setRoadmapSessions((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const existingFiles = item.homeworkFiles && item.homeworkFiles.length > 0
          ? item.homeworkFiles
          : (item.homeworkFile ? [item.homeworkFile] : []);
        const updatedFiles = existingFiles.filter((_, i) => i !== fileIdx);
        return {
          ...item,
          homeworkFiles: updatedFiles.length > 0 ? updatedFiles : null,
          homeworkFile: updatedFiles[0] || null,
        };
      })
    );
  };

  // Generate 1 Month Schedule based on selected days
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedDays.length === 0) return;

    // Auto-generate dates for October 2026 (or next 30 days)
    const suggestions = defaultRoadmapSuggestions[subject] || defaultRoadmapSuggestions["Hóa học"];
    const generatedSessions: RoadmapSessionConfig[] = [];

    // Mock generated dates for 8 sessions in month
    let topicIdx = 0;
    const dayDateMapping: Record<string, string[]> = {
      "Thứ 2": ["Thứ 2, 05/10", "Thứ 2, 12/10", "Thứ 2, 19/10", "Thứ 2, 26/10"],
      "Thứ 3": ["Thứ 3, 06/10", "Thứ 3, 13/10", "Thứ 3, 20/10", "Thứ 3, 27/10"],
      "Thứ 4": ["Thứ 4, 07/10", "Thứ 4, 14/10", "Thứ 4, 21/10", "Thứ 4, 28/10"],
      "Thứ 5": ["Thứ 5, 01/10", "Thứ 5, 08/10", "Thứ 5, 15/10", "Thứ 5, 22/10"],
      "Thứ 6": ["Thứ 6, 02/10", "Thứ 6, 09/10", "Thứ 6, 16/10", "Thứ 6, 23/10"],
      "Thứ 7": ["Thứ 7, 10/10", "Thứ 7, 17/10", "Thứ 7, 24/10", "Thứ 7, 31/10"],
      "Chủ Nhật": ["CN, 04/10", "CN, 11/10", "CN, 18/10", "CN, 25/10"],
    };

    // Gather dates in order
    const allDates: { dateStr: string; day: string }[] = [];
    selectedDays.forEach((day) => {
      const dates = dayDateMapping[day] || [];
      dates.forEach((d) => allDates.push({ dateStr: d, day }));
    });

    // Sort roughly by date index
    allDates.slice(0, 8).forEach((item) => {
      generatedSessions.push({
        date: item.dateStr,
        dayOfWeek: item.day,
        time: scheduleTime,
        topic: suggestions[topicIdx % suggestions.length] || `Bài ${topicIdx + 1}: Chuyên đề ${subject}`,
      });
      topicIdx++;
    });

    setRoadmapSessions(generatedSessions);
    setStep(2);
  };

  const handleUpdateTopic = (index: number, newTopic: string) => {
    setRoadmapSessions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, topic: newTopic } : item))
    );
  };

  const handleAddCustomSession = () => {
    setRoadmapSessions((prev) => [
      ...prev,
      {
        date: `Buổi ${prev.length + 1}`,
        dayOfWeek: "Cố định",
        time: scheduleTime,
        topic: `Nội dung bài học ${prev.length + 1}`,
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setRoadmapSessions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalSubmit = () => {
    onAddStudent({
      name,
      grade,
      subject,
      parentName,
      parentPhone,
      hourlyRate: Number(hourlyRate) || 0,
      scheduleDays: selectedDays,
      scheduleTime,
      roadmapSessions,
    });

    // Reset Form
    setName("");
    setParentName("");
    setParentPhone("");
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="glass w-full max-w-2xl rounded-2xl p-6 relative shadow-2xl border border-white/10 my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header Progress */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
            {step}/2
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {step === 1 ? "1. Thông Tin Học Sinh & Lịch Học" : "2. Lập Lộ Trình 1 Tháng Dự Kiến"}
            </h3>
            <p className="text-xs text-slate-400">
              {step === 1 ? "Nhập tên, lớp, khung giờ dạy cố định và học phí" : "Tự động tạo kế hoạch bài học 1 tháng tới cho phụ huynh & gia sư"}
            </p>
          </div>
        </div>

        {/* Step 1: Student Details & Class Days */}
        {step === 1 && (
          <form onSubmit={handleProceedToStep2} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và Tên Học Sinh *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Khối Lớp</label>
                <div className="relative">
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm font-medium appearance-none"
                  >
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                    <option value="Luyện thi ĐH">Luyện thi ĐH</option>
                  </select>
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Môn Học</label>
                <div className="relative">
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value as Subject)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm font-medium appearance-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <BookOpen className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Select Days of Week */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Lịch Học Cố Định Trong Tuần (Chọn các ngày dạy) *
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
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border border-indigo-400/40"
                          : "bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Khung Giờ Dạy Mỗi Buổi</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="19:30 - 21:30"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Học Phí / Buổi (VNĐ)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="10000"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Phụ Huynh (Bố/Mẹ)</label>
                <input
                  type="text"
                  placeholder="VD: Chị Mai / Anh Hùng"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SĐT Phụ Huynh (Nhận báo cáo Zalo)</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="0987xxxxxx"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]"
              >
                Tiếp Theo: Lập Lộ Trình 1 Tháng
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Roadmap Builder for 1 Month */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Đã tự động tạo kế hoạch {roadmapSessions.length} buổi học
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Học sinh: <span className="text-white font-medium">{name}</span> • Môn {subject} ({grade})
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomSession}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Buổi Học
              </button>
            </div>

            {/* Editable Roadmap List */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {roadmapSessions.map((session, index) => (
                <div key={index} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{index + 1}
                  </span>

                  <div className="w-28 shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-white block">{session.date}</span>
                    <span className="text-[10px] text-slate-400 block">{session.time}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={session.topic}
                      onChange={(e) => handleUpdateTopic(index, e.target.value)}
                      placeholder="Nhập nội dung/chủ đề buổi học..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />

                    {(() => {
                      const files = session.homeworkFiles && session.homeworkFiles.length > 0
                        ? session.homeworkFiles
                        : (session.homeworkFile ? [session.homeworkFile] : []);

                      return (
                        <div className="space-y-1">
                          {files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                              {files.map((file, fileIdx) => (
                                <div key={fileIdx} className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-md text-[11px] text-purple-200">
                                  <Paperclip className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                                  <span className="text-[9px] text-purple-300/70">({file.size})</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index, fileIdx)}
                                    className="text-red-400 hover:text-red-300 ml-0.5"
                                    title="Xóa file này"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <label className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 hover:text-purple-200 cursor-pointer w-fit bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2.5 py-1 rounded-md transition">
                            <Upload className="w-3 h-3 text-purple-400" />
                            {uploadingIndex === index ? "Đang tải file..." : "Đính kèm file (nhiều file, <=10MB)"}
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.zip"
                              className="hidden"
                              disabled={uploadingIndex === index}
                              onChange={(e) => handleFileUpload(index, e)}
                            />
                          </label>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition mt-0.5"
                    title="Xóa buổi học này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại bước 1
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                Lưu Học Sinh & Xuất Lộ Trình
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
