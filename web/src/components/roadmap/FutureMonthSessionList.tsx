import { ClassSessionItem } from "../CheckInModal";
import { ArrowUp, ArrowDown, Upload, Trash2, Paperclip } from "lucide-react";
import { ChangeEvent } from "react";

interface Props {
  sessions: ClassSessionItem[];
  uploadingIdx: number | null;
  onUpdateTopic: (index: number, topic: string) => void;
  onUpdateDate: (index: number, date: string) => void;
  onUpdateTime: (index: number, time: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onFileUpload: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
}

export function FutureMonthSessionList({
  sessions,
  uploadingIdx,
  onUpdateTopic,
  onUpdateDate,
  onUpdateTime,
  onMoveUp,
  onMoveDown,
  onRemove,
  onFileUpload,
}: Props) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <p className="text-sm">Chưa có bài học nào được tạo.</p>
        <p className="text-xs mt-1">Hãy chọn tháng và các thứ trong tuần để tự động sinh bài.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session, index) => (
        <div key={session.id} className="bg-slate-950/50 p-4 rounded-xl border border-white/5 relative group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-4 right-4 flex gap-1">
            <button
              onClick={() => onMoveUp(index)}
              disabled={index === 0}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
              title="Di chuyển lên"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={index === sessions.length - 1}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 transition"
              title="Di chuyển xuống"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 ml-2 transition"
              title="Xóa bài này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-24">
            <div className="md:col-span-6">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên bài học</label>
              <input
                type="text"
                value={session.topic}
                onChange={(e) => onUpdateTopic(index, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nhập tên bài học..."
              />
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ngày học (dd/mm)</label>
              <input
                type="text"
                value={session.date}
                onChange={(e) => onUpdateDate(index, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="VD: Thứ 2, 05/10"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giờ học</label>
              <input
                type="text"
                value={session.time}
                onChange={(e) => onUpdateTime(index, e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="19:30 - 21:30"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex flex-wrap gap-2 items-center">
              {(session.homeworkFiles || []).map((file, fIdx) => (
                <div key={fIdx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-indigo-300/70">({file.size})</span>
                </div>
              ))}
              
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition">
                {uploadingIdx === index ? (
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    Đang tải...
                  </span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Đính kèm file
                  </>
                )}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => onFileUpload(index, e)}
                  disabled={uploadingIdx === index}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                />
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
