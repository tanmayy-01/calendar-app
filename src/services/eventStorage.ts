import { CALENDAR_COLORS } from '@/constants';
import { UserEvent, CalendarEvent, SQLiteDB } from '@/types';
import { formatDateString } from '@/utils';
import { scheduleEventNotification } from './notificationService';

let dbInstance: SQLiteDB | null = null;
let isInitialized = false;

// In-Memory cache of active events
let memoryEvents: UserEvent[] = [];

// Event listeners for event updates
type EventListener = () => void;
const listeners = new Set<EventListener>();

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.warn('[EventStorage] Listener error:', e);
    }
  });
}

/**
 * Lazily initialize SQLite database table for user events.
 */
function getDatabase(): SQLiteDB | null {
  if (isInitialized) {
    return dbInstance;
  }
  isInitialized = true;

  try {
    const { open } = require('@op-engineering/op-sqlite');
    if (typeof open === 'function') {
      const db = open({ name: 'calendar_holidays.db' });
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS user_events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          start_date TEXT NOT NULL,
          start_time TEXT,
          end_date TEXT NOT NULL,
          end_time TEXT,
          is_all_day INTEGER DEFAULT 1,
          does_not_repeat INTEGER DEFAULT 1,
          repeat_option TEXT DEFAULT 'none',
          created_at INTEGER
        );
      `;
      const createIndexSql = `
        CREATE INDEX IF NOT EXISTS idx_user_events_dates
        ON user_events(start_date, end_date);
      `;

      if (typeof db.executeSync === 'function') {
        db.executeSync(createTableSql);
        db.executeSync(createIndexSql);
      } else if (typeof db.execute === 'function') {
        Promise.resolve(db.execute(createTableSql)).catch((e: any) =>
          console.warn('[EventStorage] Table init error:', e),
        );
        Promise.resolve(db.execute(createIndexSql)).catch((e: any) =>
          console.warn('[EventStorage] Index init error:', e),
        );
      }
      dbInstance = db;
    }
  } catch (error) {
    console.info(
      '[EventStorage] SQLite not available, using in-memory store:',
      (error as Error)?.message,
    );
    dbInstance = null;
  }

  return dbInstance;
}

/**
 * Saves a new user event or updates an existing one.
 */
export async function saveEvent(event: UserEvent): Promise<void> {
  // 1. Store in memory immediately
  const index = memoryEvents.findIndex(e => e.id === event.id);
  if (index >= 0) {
    memoryEvents[index] = event;
  } else {
    memoryEvents.push(event);
  }

  // 2. Persist to SQLite
  const db = getDatabase();
  if (db) {
    try {
      const sql = `INSERT OR REPLACE INTO user_events 
         (id, title, description, start_date, start_time, end_date, end_time, is_all_day, does_not_repeat, repeat_option, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      const params = [
        event.id,
        event.title,
        event.description || '',
        event.startDate,
        event.startTime || null,
        event.endDate,
        event.endTime || null,
        event.isAllDay ? 1 : 0,
        event.doesNotRepeat ? 1 : 0,
        event.repeatOption || 'none',
        event.createdAt || Date.now(),
      ];

      if (typeof db.executeSync === 'function') {
        db.executeSync(sql, params);
      } else if (typeof db.execute === 'function') {
        await db.execute(sql, params);
      }
    } catch (error) {
      console.warn('[EventStorage] Error saving event to SQLite:', error);
    }
  }

  // 3. Schedule device notification trigger
  try {
    await scheduleEventNotification(event);
  } catch (error) {
    console.warn('[EventStorage] Error scheduling event notification:', error);
  }

  // 4. Notify listeners
  notifyListeners();
}

/**
 * Loads all user events, keeping historical/past events permanently.
 */
export async function loadEvents(): Promise<UserEvent[]> {
  const db = getDatabase();

  if (!db) {
    return [...memoryEvents];
  }

  try {
    const selectSql = `SELECT id, title, description, start_date, start_time, end_date, end_time, is_all_day, does_not_repeat, repeat_option, created_at 
       FROM user_events 
       ORDER BY start_date ASC;`;

    let rows: any[] = [];
    if (typeof db.executeSync === 'function') {
      const result = db.executeSync(selectSql);
      rows = Array.isArray(result?.rows)
        ? result.rows
        : (result?.rows as any)?._array || [];
    } else if (typeof db.execute === 'function') {
      const result = await db.execute(selectSql);
      rows = Array.isArray(result?.rows)
        ? result.rows
        : (result?.rows as any)?._array || [];
    }

    const loaded: UserEvent[] = rows.map((r: any) => ({
      id: String(r.id),
      title: String(r.title),
      description: r.description ? String(r.description) : '',
      startDate: String(r.start_date),
      startTime: r.start_time ? String(r.start_time) : undefined,
      endDate: String(r.end_date),
      endTime: r.end_time ? String(r.end_time) : undefined,
      isAllDay: r.is_all_day === 1 || r.is_all_day === true,
      doesNotRepeat: r.does_not_repeat === 1 || r.does_not_repeat === true,
      repeatOption: r.repeat_option || 'none',
      createdAt: Number(r.created_at) || Date.now(),
    }));

    const loadedMap = new Map(loaded.map(e => [e.id, e]));
    for (const memEvent of memoryEvents) {
      if (!loadedMap.has(memEvent.id)) {
        loaded.push(memEvent);
        loadedMap.set(memEvent.id, memEvent);
      }
    }

    memoryEvents = loaded;
    return loaded;
  } catch (error) {
    console.warn('[EventStorage] Error reading events from SQLite:', error);
    return [...memoryEvents];
  }
}

/**
 * Returns an array of date strings ('YYYY-MM-DD') for every day in the range [startDateStr, endDateStr].
 */
export function getDatesBetween(
  startDateStr: string,
  endDateStr: string,
): string[] {
  if (startDateStr === endDateStr) return [startDateStr];
  if (startDateStr > endDateStr) return [startDateStr];

  const dates: string[] = [];
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);
  const current = new Date(sYear, sMonth - 1, sDay);
  const end = new Date(eYear, eMonth - 1, eDay);

  let count = 0;
  while (current <= end && count < 366) {
    dates.push(formatDateString(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates.length > 0 ? dates : [startDateStr];
}

/**
 * Converts user events into CalendarEvent map format keyed by 'YYYY-MM-DD'.
 */
export function convertEventsToEventsMap(
  events: UserEvent[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};

  for (const event of events) {
    const dates = getDatesBetween(event.startDate, event.endDate);

    for (const d of dates) {
      if (!map[d]) {
        map[d] = [];
      }

      const displayTitle =
        event.startTime && !event.isAllDay
          ? `${event.startTime} ${event.title}`
          : event.title;

      map[d].push({
        id: `user-event-${event.id}-${d}`,
        title: displayTitle,
        date: d,
        time: event.startTime,
        color: CALENDAR_COLORS.eventPill,
        isHoliday: false,
        isTask: false,
        doesNotRepeat: event.doesNotRepeat,
        description: event.description,
      });
    }
  }

  return map;
}

/**
 * Subscribes to user event changes (save/delete/cleanup).
 */
export function subscribeToEventChanges(callback: EventListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
