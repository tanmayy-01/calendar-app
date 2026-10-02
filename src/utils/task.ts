import { dayNames, monthShort } from "@/constants";

export function formatDisplayDate(date: Date): string {
  
  const dName = dayNames[date.getDay()];
  const mName = monthShort[date.getMonth()];
  return `${dName}, ${mName} ${date.getDate()}, ${date.getFullYear()}`;
}

export function parseTimeString(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: Math.max(1, Math.min(12, parseInt(match[1], 10))),
      minute: Math.max(0, Math.min(59, parseInt(match[2], 10))),
      period: match[3].toUpperCase() as 'AM' | 'PM',
    };
  }
  return { hour: 10, minute: 0, period: 'AM' };
}

export function formatTimeString(
  hour: number | string,
  minute: number | string,
  period: 'AM' | 'PM',
): string {
  const h = Math.max(1, Math.min(12, Number(hour) || 12));
  const m = Math.max(0, Math.min(59, Number(minute) || 0));
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

export function getInitialTime(): string {
  const now = new Date();
  const nextHour = now.getHours() + 1;
  const period: 'AM' | 'PM' = nextHour >= 12 && nextHour < 24 ? 'PM' : 'AM';
  const hour12 = nextHour % 12 === 0 ? 12 : nextHour % 12;
  return `${hour12}:00 ${period}`;
}

export function addHoursToTime(timeStr: string, hoursToAdd: number = 1): string {
  const parsed = parseTimeString(timeStr);
  let totalHours24 = parsed.hour % 12;
  if (parsed.period === 'PM') totalHours24 += 12;
  totalHours24 = (totalHours24 + hoursToAdd) % 24;
  const newPeriod: 'AM' | 'PM' = totalHours24 >= 12 ? 'PM' : 'AM';
  const newHour12 = totalHours24 % 12 === 0 ? 12 : totalHours24 % 12;
  return `${newHour12}:${String(parsed.minute).padStart(2, '0')} ${newPeriod}`;
}
