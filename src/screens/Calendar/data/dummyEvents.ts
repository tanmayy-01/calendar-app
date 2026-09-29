import { CalendarEvent, formatDateString } from '../utils/calendarUtils';

/**
 * Generates sample festival & calendar events resembling the reference design.
 * Automatically aligns events with the current month and adjacent dates.
 */
export const getInitialEvents = (): Record<string, CalendarEvent[]> => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const events: Record<string, CalendarEvent[]> = {};

  const addEvent = (d: Date, title: string, color?: string) => {
    const key = formatDateString(d);
    if (!events[key]) {
      events[key] = [];
    }
    events[key].push({
      id: `${key}-${title}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      date: key,
      color,
    });
  };

  // Sample events relative to the active month to match design screenshot
  // 1. Month start/previous overflow events
  addEvent(new Date(year, month, 3), 'Onam');
  addEvent(new Date(year, month, 5), 'Raksha b');

  // 2. Mid-month festival events
  addEvent(new Date(year, month, 10), 'Janmashtami');
  addEvent(new Date(year, month, 11), 'Janmashtami');

  // 3. Highlighted day event (e.g. today or near today)
  addEvent(new Date(year, month, now.getDate()), 'Today Review');
  addEvent(new Date(year, month, 19), 'Ganesh C');

  // 4. Late-month events
  addEvent(new Date(year, month, 27), 'Milad un');
  addEvent(new Date(year, month + 1, 2), 'Muhurram');

  return events;
};
