import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMonthStr() {
  const d = new Date();
  return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function getNextMonthStr(currentMonthStr?: string) {
  let month = new Date().getMonth() + 1;
  let year = new Date().getFullYear();

  if (currentMonthStr && currentMonthStr.includes("/")) {
    const cleanStr = currentMonthStr.replace("Tháng ", "").trim();
    const parts = cleanStr.split("/");
    if (parts.length === 2) {
      month = parseInt(parts[0], 10);
      year = parseInt(parts[1], 10);
    }
  }

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `Tháng ${month}/${year}`;
}

export function getUpcomingMonthOptions(count = 6): string[] {
  const options: string[] = [];
  const now = new Date();
  let m = now.getMonth() + 1;
  let y = now.getFullYear();

  for (let i = 0; i < count; i++) {
    options.push(`Tháng ${m}/${y}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return options;
}

const dayNameMap: Record<number, { full: string; short: string }> = {
  0: { full: "Chủ Nhật", short: "CN" },
  1: { full: "Thứ 2", short: "Thứ 2" },
  2: { full: "Thứ 3", short: "Thứ 3" },
  3: { full: "Thứ 4", short: "Thứ 4" },
  4: { full: "Thứ 5", short: "Thứ 5" },
  5: { full: "Thứ 6", short: "Thứ 6" },
  6: { full: "Thứ 7", short: "Thứ 7" },
};

const dayIndexMap: Record<string, number> = {
  "Chủ Nhật": 0,
  "CN": 0,
  "Thứ 2": 1,
  "Thứ 2 ": 1,
  "Thứ 3": 2,
  "Thứ 4": 3,
  "Thứ 5": 4,
  "Thứ 6": 5,
  "Thứ 7": 6,
};

export function generateDatesForMonth(monthStr: string, scheduleDays: string[]): { dateStr: string; dayOfWeek: string }[] {
  if (!monthStr || scheduleDays.length === 0) return [];

  const cleanStr = monthStr.replace("Tháng ", "").trim();
  const parts = cleanStr.split("/");
  if (parts.length !== 2) return [];

  const month = parseInt(parts[0], 10) - 1; // 0-indexed in JS Date
  const year = parseInt(parts[1], 10);

  const targetDayIndices = new Set(
    scheduleDays.map((d) => dayIndexMap[d.trim()]).filter((idx) => idx !== undefined)
  );

  const dates: { dateStr: string; dayOfWeek: string }[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const now = new Date();
  let startDay = 1;
  if (year === now.getFullYear() && month === now.getMonth()) {
    startDay = now.getDate();
  }

  for (let day = startDay; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dayOfWeekIdx = dateObj.getDay();

    if (targetDayIndices.has(dayOfWeekIdx)) {
      const dayInfo = dayNameMap[dayOfWeekIdx];
      const formattedDay = day < 10 ? `0${day}` : `${day}`;
      const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
      const dateStr = `${dayInfo.full}, ${formattedDay}/${formattedMonth}`;

      dates.push({
        dateStr,
        dayOfWeek: dayInfo.full,
      });
    }
  }

  return dates;
}
