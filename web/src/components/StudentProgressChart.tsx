"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ClassSessionItem } from "./CheckInModal";
import { TrendingUp, Trophy } from "lucide-react";

interface StudentProgressChartProps {
  sessions: ClassSessionItem[];
}

export function StudentProgressChart({ sessions }: StudentProgressChartProps) {
  // Extract scored sessions
  const chartData = sessions
    .filter((s) => s.testScore !== undefined && s.testScore !== null)
    .map((s, idx) => ({
      name: `Buổi ${idx + 1}`,
      date: s.date.split(",")[1]?.trim() || s.date,
      score: Number(s.testScore),
      topic: s.topic,
    }));

  if (chartData.length === 0) {
    return null;
  }

  const latestScore = chartData[chartData.length - 1]?.score;

  return (
    <div className="glass p-4 sm:p-5 rounded-2xl border border-indigo-500/20 bg-indigo-950/20 space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>Biểu Đồ Tiến Bộ Điểm Số</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Tăng trưởng tốt
              </span>
            </h4>
            <p className="text-xs text-slate-400">Thang điểm 10 qua các bài kiểm tra định kỳ</p>
          </div>
        </div>

        <div className="text-left xs:text-right self-end xs:self-auto">
          <span className="text-[10px] text-slate-400 block font-semibold">Điểm gần nhất</span>
          <span className="text-lg font-extrabold text-amber-400">{latestScore}/10</span>
        </div>
      </div>

      <div className="h-44 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-indigo-500/40 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-bold text-white">{data.name} ({data.date})</p>
                      <p className="text-amber-400 font-semibold">Điểm: {data.score}/10</p>
                      <p className="text-[10px] text-slate-400">{data.topic}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#818cf8"
              strokeWidth={3}
              dot={{ fill: "#fbbf24", r: 4, strokeWidth: 2, stroke: "#1e1b4b" }}
              activeDot={{ r: 6, fill: "#fbbf24", stroke: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
