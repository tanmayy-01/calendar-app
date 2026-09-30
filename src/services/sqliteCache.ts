import { CalendarEvent } from '@/types';

interface SQLiteDB {
  execute: (sql: string, params?: any[]) => Promise<{ rows?: any[] }> | { rows?: any[] };
  executeSync?: (sql: string, params?: any[]) => { rows?: any[]; rowsAffected?: number };
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
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS holidays_cache (
          id TEXT PRIMARY KEY,
          year INTEGER,
          country TEXT,
          date TEXT,
          title TEXT,
          color TEXT,
          holiday_type TEXT
        );
      `;
      const createIndexSql = `
        CREATE INDEX IF NOT EXISTS idx_holidays_year_country
        ON holidays_cache(year, country);
      `;

      if (typeof db.executeSync === 'function') {
        db.executeSync(createTableSql);
        db.executeSync(createIndexSql);
      } else if (typeof db.execute === 'function') {
        Promise.resolve(db.execute(createTableSql)).catch((e: any) =>
          console.warn('[SQLiteCache] Table init error:', e)
        );
        Promise.resolve(db.execute(createIndexSql)).catch((e: any) =>
          console.warn('[SQLiteCache] Index init error:', e)
        );
      }
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
    const selectSql = 'SELECT id, title, date, color, holiday_type FROM holidays_cache WHERE year = ? AND country = ?;';
    const params = [year, country.toUpperCase()];

    let rows: any[] = [];
    if (typeof db.executeSync === 'function') {
      const result = db.executeSync(selectSql, params);
      rows = Array.isArray(result?.rows)
        ? result.rows
        : (result?.rows as any)?._array || [];
    }

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
    const insertSql = `INSERT OR REPLACE INTO holidays_cache (id, year, country, date, title, color, holiday_type)
         VALUES (?, ?, ?, ?, ?, ?, ?);`;

    for (const evt of events) {
      const params = [
        evt.id,
        year,
        country.toUpperCase(),
        evt.date,
        evt.title,
        evt.color || '#E06A55',
        evt.holidayType || 'Festival',
      ];

      if (typeof db.executeSync === 'function') {
        db.executeSync(insertSql, params);
      } else if (typeof db.execute === 'function') {
        Promise.resolve(db.execute(insertSql, params)).catch((e: any) =>
          console.warn('[SQLiteCache] Insert error:', e)
        );
      }
    }
  } catch (error) {
    console.warn('[SQLiteCache] Error saving holidays:', error);
  }
}
