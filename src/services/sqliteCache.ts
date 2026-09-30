import { CalendarEvent } from '@/types';

interface SQLiteDB {
  execute: (sql: string, params?: any[]) => { rows?: { _array?: any[] } };
}

let dbInstance: SQLiteDB | null = null;
let isInitialized = false;

/**
 * Lazily initialize the SQLite database 
 */
function getDatabase(): SQLiteDB | null {
  if (isInitialized) {
    return dbInstance;
  }
  isInitialized = true;

  try {
    // Dynamic require so non-native environments do not crash on load
    const { open } = require('@op-engineering/op-sqlite');
    if (typeof open === 'function') {
      const db = open({ name: 'calendar_holidays.db' });
      db.execute(`
        CREATE TABLE IF NOT EXISTS holidays_cache (
          id TEXT PRIMARY KEY,
          year INTEGER,
          country TEXT,
          date TEXT,
          title TEXT,
          color TEXT,
          holiday_type TEXT
        );
      `);
      db.execute(`
        CREATE INDEX IF NOT EXISTS idx_holidays_year_country
        ON holidays_cache(year, country);
      `);
      dbInstance = db;
    }
  } catch (error) {
    console.info('[SQLiteCache] Native SQLite not initialized, using memory fallback:', (error as Error)?.message);
    dbInstance = null;
  }

  return dbInstance;
}

/**
 * Retrieve cached holidays for a given year and country from SQLite.
 */
export function getHolidaysFromSQLite(
  year: number,
  country: string
): CalendarEvent[] | null {
  const db = getDatabase();
  if (!db) return null;

  try {
    const result = db.execute(
      'SELECT id, title, date, color, holiday_type FROM holidays_cache WHERE year = ? AND country = ?;',
      [year, country.toUpperCase()]
    );

    const rows = result.rows?._array || [];
    if (!rows || rows.length === 0) {
      return null;
    }

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      date: r.date,
      color: r.color,
      isHoliday: true,
      holidayType: r.holiday_type,
    }));
  } catch (error) {
    console.warn('[SQLiteCache] Error querying holidays:', error);
    return null;
  }
}

/**
 * Save holidays into the SQLite database.
 */
export function saveHolidaysToSQLite(
  year: number,
  country: string,
  events: CalendarEvent[]
): void {
  const db = getDatabase();
  if (!db || !events.length) return;

  try {
    for (const evt of events) {
      db.execute(
        `INSERT OR REPLACE INTO holidays_cache (id, year, country, date, title, color, holiday_type)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          evt.id,
          year,
          country.toUpperCase(),
          evt.date,
          evt.title,
          evt.color || '#E06A55',
          evt.holidayType || 'Festival',
        ]
      );
    }
  } catch (error) {
    console.warn('[SQLiteCache] Error saving holidays:', error);
  }
}
