import { CalendarEvent, NagerHoliday } from '@/types';
import {
  BHARAT_CALENDAR_URL,
  BUNDLED_HOLIDAYS_IN,
  CALENDAR_COLORS,
  DEFAULT_COUNTRY_CODE,
  MONTH_NAMES,
  NAGER_DATE_URL,
} from '@/constants';
import { getHolidaysFromSQLite, saveHolidaysToSQLite } from './sqliteCache';

// In-Memory Fast Cache: `${countryCode}-${year}` -> { 'YYYY-MM-DD': CalendarEvent[] }
const memoryCache = new Map<string, Record<string, CalendarEvent[]>>();

/**
 * Returns initial holiday & festival events synchronously.
 */
export function getInitialHolidays(
  countryCode: string = DEFAULT_COUNTRY_CODE,
): Record<string, CalendarEvent[]> {
  const normalizedCountry = countryCode.toUpperCase();
  if (normalizedCountry === 'IN') {
    return { ...BUNDLED_HOLIDAYS_IN };
  }
  return {};
}

/**
 * Helper to determine festival pill color based on holiday type.
 */
function getHolidayColor(types?: string[] | string): string {
  if (Array.isArray(types)) {
    if (types.includes('Public') || types.includes('Bank')) {
      return CALENDAR_COLORS.holidayPill;
    }
    if (types.includes('Observance')) {
      return CALENDAR_COLORS.observancePill;
    }
    return CALENDAR_COLORS.festivalPill;
  }

  if (typeof types === 'string' && types.toLowerCase().includes('government')) {
    return CALENDAR_COLORS.holidayPill;
  }
  return CALENDAR_COLORS.festivalPill;
}

/**
 * Fetches holidays from Nager.Date API for supported countries.
 */
async function fetchFromNagerDate(
  year: number,
  countryCode: string,
): Promise<CalendarEvent[]> {
  const url = `${NAGER_DATE_URL}/${year}/${countryCode}`;
  const response = await fetch(url);

  if (response.status === 204 || !response.ok) {
    return [];
  }

  const holidays: NagerHoliday[] = await response.json();
  return holidays.map(h => ({
    id: `nager-${h.countryCode}-${h.date}-${h.name.replace(
      /[^a-zA-Z0-9]/g,
      '',
    )}`,
    title: h.localName || h.name,
    date: h.date,
    color: getHolidayColor(h.types),
    isHoliday: true,
    holidayType: (h.types && (h.types[0] as any)) || 'Public',
  }));
}

/**
 * Fetches Indian cultural festivals and gazetted holidays from the calendar-bharat registry.
 */
async function fetchIndianFestivals(year: number): Promise<CalendarEvent[]> {
  const url = `${BHARAT_CALENDAR_URL}/${year}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const yearData = data[String(year)];
  if (!yearData) return [];

  const events: CalendarEvent[] = [];

  for (const [, days] of Object.entries(
    yearData as Record<string, Record<string, any>>,
  )) {
    for (const [dayKey, info] of Object.entries(days)) {
      const match = dayKey.match(/([A-Za-z]+)\s+(\d+),\s+(\d{4})/);
      if (match) {
        const monthIndex = (MONTH_NAMES as readonly string[]).indexOf(match[1]);
        if (monthIndex >= 0) {
          const dayNum = parseInt(match[2], 10);
          const yearNum = parseInt(match[3], 10);
          const mm = String(monthIndex + 1).padStart(2, '0');
          const dd = String(dayNum).padStart(2, '0');
          const dateStr = `${yearNum}-${mm}-${dd}`;
          const isGov = info.type === 'Government Holiday';

          events.push({
            id: `fest-in-${dateStr}-${(info.event || '').replace(
              /[^a-zA-Z0-9]/g,
              '',
            )}`,
            title: info.event,
            date: dateStr,
            color: isGov
              ? CALENDAR_COLORS.holidayPill
              : CALENDAR_COLORS.festivalPill,
            isHoliday: true,
            holidayType: isGov ? 'Public' : 'Festival',
          });
        }
      }
    }
  }

  return events;
}

/**
 * Converts an array of CalendarEvent items into a dictionary keyed by 'YYYY-MM-DD'.
 */
function groupEventsByDate(
  events: CalendarEvent[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    if (!map[event.date]) {
      map[event.date] = [];
    }
    // Prevent duplicate entries for the same festival on the same date
    const exists = map[event.date].some(e => e.title === event.title);
    if (!exists) {
      map[event.date].push(event);
    }
  }
  return map;
}

/**
 * Fetches real-time festivals and holidays for a given year.
 */
export async function getHolidaysForYear(
  year: number,
  countryCode: string = DEFAULT_COUNTRY_CODE,
): Promise<Record<string, CalendarEvent[]>> {
  const normCountry = countryCode.toUpperCase();
  const cacheKey = `${normCountry}-${year}`;

  // 1. Check in-memory cache
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // 2. Check local SQLite cache
  const cachedFromDB = getHolidaysFromSQLite(year, normCountry);
  if (cachedFromDB && cachedFromDB.length > 0) {
    const grouped = groupEventsByDate(cachedFromDB);
    memoryCache.set(cacheKey, grouped);
    return grouped;
  }

  let events: CalendarEvent[] = [];

  // 3. Fetch from remote API
  try {
    if (normCountry === 'IN') {
      events = await fetchIndianFestivals(year);
    } else {
      events = await fetchFromNagerDate(year, normCountry);
    }
  } catch (error) {
    console.warn(
      `[FestivalService] Network fetch failed for ${cacheKey}:`,
      error,
    );
  }

  // 4. If remote fetch returned no events, try offline bundled dataset (for India)
  if (events.length === 0 && normCountry === 'IN') {
    const bundledEntries = Object.entries(BUNDLED_HOLIDAYS_IN).filter(
      ([dateKey]) => dateKey.startsWith(`${year}-`),
    );
    events = bundledEntries.flatMap(([, evts]) => evts);
  }

  // 5. Store in SQLite & Memory Cache
  if (events.length > 0) {
    saveHolidaysToSQLite(year, normCountry, events);
  }

  const grouped = groupEventsByDate(events);
  memoryCache.set(cacheKey, grouped);
  return grouped;
}

/**
 * Pre-fetches and aggregates holidays for multiple years
 */
export async function getHolidaysForYears(
  years: number[],
  countryCode: string = DEFAULT_COUNTRY_CODE,
): Promise<Record<string, CalendarEvent[]>> {
  const results = await Promise.all(
    years.map(year => getHolidaysForYear(year, countryCode)),
  );

  const merged: Record<string, CalendarEvent[]> = {};
  for (const yearMap of results) {
    for (const [dateKey, events] of Object.entries(yearMap)) {
      if (!merged[dateKey]) {
        merged[dateKey] = [];
      }
      merged[dateKey].push(...events);
    }
  }
  return merged;
}
