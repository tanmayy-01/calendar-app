import { dayNames, monthShort } from "@/constants";

export function formatDisplayDate(date: Date): string {
  
  const dName = dayNames[date.getDay()];
  const mName = monthShort[date.getMonth()];
  return `${dName}, ${mName} ${date.getDate()}, ${date.getFullYear()}`;
}