"use client";

import { useState } from "react";
import { GraduationCap, Phone, Search, ArrowRight, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { fetchStudentsFromDB } from "@/lib/db";
import { Student } from "@/types/database";
import Link from "next/link";

export default function ParentLookupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundStudents, setFoundStudents] = useState<Student[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setHasSearched(true);

    const allStudents = await fetchStudentsFromDB();
    const matches = allStudents.filter(
      (s) => s.parentPhone && s.parentPhone.replace(/\D/g, "").includes(phone.replace(/\D/g, ""))
    );

    setFoundStudents(matches);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full pt-12 space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 mx-auto shadow-xl shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <GraduationCap className="text-indigo-400 w-8 h-8" />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Portal Phụ Huynh
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">Tra Cứu Sổ Học Tập</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Nhập Số điện thoại Phụ huynh để xem tiến độ & nhận xét của con
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="glass p-6 rounded-2xl border border-white/10 space-y-4 shadow-2xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Số Điện Thoại Phụ Huynh (Zalo)
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                placeholder="VD: 0981234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm font-medium"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]"
          >
            {loading ? (
              <span className="animate-pulse">Đang tìm kiếm...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Tra Cứu Tiến Độ Học Tập
              </>
            )}
          </button>
        </form>

        {/* Results Section */}
        {hasSearched && (
          <div className="space-y-3">
            {foundStudents && foundStudents.length > 0 ? (
              foundStudents.map((st) => (
                <Link
                  key={st.id}
                  href={`/p/${st.magicToken || st.id}`}
                  className="glass p-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 hover:bg-indigo-950/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">{st.name}</h4>
                      <p className="text-xs text-slate-400">{st.grade} • Môn {st.subject}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-indigo-400">
                    Xem Sổ
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="glass p-6 text-center rounded-2xl border border-white/5 space-y-2">
                <p className="text-sm font-semibold text-white">Chưa tìm thấy học sinh với SĐT trên</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vui lòng kiểm tra lại số điện thoại hoặc nhắn cho Gia sư để nhận đường link trực tiếp.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      <footer className="text-center py-4 text-xs text-slate-500">
        <p>TutorTrack System • Nền tảng kết nối Phụ huynh & Gia sư</p>
      </footer>
    </div>
  );
}
