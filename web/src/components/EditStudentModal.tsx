"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, BookOpen, Phone, DollarSign, GraduationCap, Save, User } from "lucide-react";
import { Student, Subject } from "@/types/database";

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSaveStudent: (updatedStudent: Student) => void;
}

const subjects: Subject[] = ["Hóa học", "Toán học", "Vật lý", "Tiếng Anh", "Ngữ văn", "Sinh học", "Khác"];

export function EditStudentModal({ isOpen, student, onClose, onSaveStudent }: EditStudentModalProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("Lớp 12");
  const [subject, setSubject] = useState<Subject>("Hóa học");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [hourlyRate, setHourlyRate] = useState("200000");

  useEffect(() => {
    if (student) {
      setName(student.name || "");
      setGrade(student.grade || "Lớp 12");
      setSubject(student.subject || "Hóa học");
      setParentName(student.parentName || "");
      setParentPhone(student.parentPhone || "");
      setHourlyRate(String(student.hourlyRate || 200000));
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên học sinh!");
      return;
    }

    const updated: Student = {
      ...student,
      name: name.trim(),
      grade: grade.trim(),
      subject,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      hourlyRate: Number(hourlyRate) || 200000,
    };

    onSaveStudent(updated);
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

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sửa Thông Tin Học Sinh & Lớp Học</h3>
            <p className="text-xs text-slate-400">Cập nhật thông tin học sinh, phụ huynh và mức học phí</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  <option value="Lớp Khác">Lớp Khác</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Phụ Huynh (Bố/Mẹ)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VD: Chị Mai"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SĐT Phụ Huynh (Zalo)</label>
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

          {/* Action Buttons */}
          <div className="pt-3 flex justify-end gap-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
