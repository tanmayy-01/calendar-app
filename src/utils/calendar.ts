import { MONTH_NAMES } from "@/constants";
import { CalendarDay, CalendarEvent } from "@/types";

/**
 * Configure swipe direction behavior
 */
export const INVERT_SWIPE_DIRECTION = false;

/**
 * Total range of months: 120 past and 120 future months.
 * Index 120 is the current month.
 */
export const MONTHS_OFFSET_RANGE = 120;
export const TOTAL_MONTHS_COUNT = MONTHS_OFFSET_RANGE * 2 + 1;
export const INITIAL_MONTH_INDEX = MONTHS_OFFSET_RANGE;

/**
 * Format a Date to 'YYYY-MM-DD' string in local time.
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Check if two dates represent the same calendar day.
 */
export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Check if a date is today.
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Format the month header title
 */
export const formatMonthHeaderTitle = (date: Date): string => {
  const monthName = MONTH_NAMES[date.getMonth()];
  return `${monthName} ${date.getFullYear()}`;
};

/**
 * Get date corresponding to a virtualized month page index.
 */
export const getDateForPageIndex = (
  pageIndex: number,
  baseDate: Date = new Date()
): Date => {
  const delta = pageIndex - INITIAL_MONTH_INDEX;
  const monthOffset = INVERT_SWIPE_DIRECTION ? -delta : delta;
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, 1);
};

/**
 * Get page index for a given date.
 */
export const getPageIndexForDate = (
  targetDate: Date,
  baseDate: Date = new Date()
): number => {
  const monthDiff =
    (targetDate.getFullYear() - baseDate.getFullYear()) * 12 +
    (targetDate.getMonth() - baseDate.getMonth());
  const delta = INVERT_SWIPE_DIRECTION ? -monthDiff : monthDiff;
  return INITIAL_MONTH_INDEX + delta;
};

/**
 * Generate fixed 42-cell calendar grid for a given year and month.
 */
export const getDaysInMonthGrid = (
  year: number,
  month: number,
  eventsMap: Record<string, CalendarEvent[]> = {}
): CalendarDay[] => {
  const grid: CalendarDay[] = [];
  const today = new Date();

  // First day of the targeted month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, ..., 6 = Saturday

  // Last day of previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const getSortedEventsForDate = (dateStr: string): CalendarEvent[] => {
    const list = eventsMap[dateStr] || [];
    if (list.length <= 1) return list;
    return [...list].sort((a, b) => {
      if (a.isTask && !b.isTask) return -1;
      if (!a.isTask && b.isTask) return 1;
      return 0;
    });
  };

  // 1. Previous month leading days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const date = new Date(year, month - 1, dayNum);
    const dateStr = formatDateString(date);
    grid.push({
      date,
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getSortedEventsForDate(dateStr),
    });
  }

  // 2. Current month days
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const date = new Date(year, month, dayNum);
    const dateStr = formatDateString(date);
    grid.push({
      date,
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      events: getSortedEventsForDate(dateStr),
    });
  }

  // 3. Next month trailing overflow days to complete fixed 42 cells (6 rows x 7 days)
  const remainingCells = 42 - grid.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const date = new Date(year, month + 1, dayNum);
    const dateStr = formatDateString(date);
    grid.push({
      date,
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      events: getSortedEventsForDate(dateStr),
    });
  }

  return grid;
};
