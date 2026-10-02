import { CALENDAR_COLORS } from '@/constants';
import { UserTask, CalendarEvent, SQLiteDB } from '@/types';
import { scheduleTaskNotification } from './notificationService';

let dbInstance: SQLiteDB | null = null;
let isInitialized = false;

// In-Memory cache of active tasks
let memoryTasks: UserTask[] = [];

// Event listeners for task updates
type TaskListener = () => void;
const listeners = new Set<TaskListener>();

function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (e) {
      console.warn('[TaskStorage] Listener error:', e);
    }
  });
}

/**
 * Lazily initialize SQLite database table for user tasks.
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
        CREATE TABLE IF NOT EXISTS user_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          time TEXT,
          is_all_day INTEGER DEFAULT 1,
          does_not_repeat INTEGER DEFAULT 1,
          repeat_option TEXT DEFAULT 'none',
          created_at INTEGER
        );
      `;
      const createIndexSql = `
        CREATE INDEX IF NOT EXISTS idx_user_tasks_date
        ON user_tasks(date);
      `;

      if (typeof db.executeSync === 'function') {
        db.executeSync(createTableSql);
        db.executeSync(createIndexSql);
        try {
          db.executeSync('ALTER TABLE user_tasks ADD COLUMN time TEXT;');
        } catch {
          // Column already exists
        }
      } else if (typeof db.execute === 'function') {
        Promise.resolve(db.execute(createTableSql)).catch((e: any) =>
          console.warn('[TaskStorage] Table init error:', e),
        );
        Promise.resolve(db.execute(createIndexSql)).catch((e: any) =>
          console.warn('[TaskStorage] Index init error:', e),
        );
        Promise.resolve(db.execute('ALTER TABLE user_tasks ADD COLUMN time TEXT;')).catch(
          () => {},
        );
      }
      dbInstance = db;
    }
  } catch (error) {
    console.info(
      '[TaskStorage] SQLite not available, using in-memory store:',
      (error as Error)?.message,
    );
    dbInstance = null;
  }

  return dbInstance;
}

/**
 * Saves a new task or updates an existing one.
 */
export async function saveTask(task: UserTask): Promise<void> {
  // 1. Immediately store in memory so calendar updates synchronously without delay
  const index = memoryTasks.findIndex(t => t.id === task.id);
  if (index >= 0) {
    memoryTasks[index] = task;
  } else {
    memoryTasks.push(task);
  }

  // 2. Persist to SQLite
  const db = getDatabase();
  if (db) {
    try {
      const sql = `INSERT OR REPLACE INTO user_tasks 
         (id, title, description, date, time, is_all_day, does_not_repeat, repeat_option, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;
      const params = [
        task.id,
        task.title,
        task.description || '',
        task.date,
        task.time || null,
        task.isAllDay ? 1 : 0,
        task.doesNotRepeat ? 1 : 0,
        task.repeatOption || 'none',
        task.createdAt || Date.now(),
      ];

      if (typeof db.executeSync === 'function') {
        db.executeSync(sql, params);
      } else if (typeof db.execute === 'function') {
        await db.execute(sql, params);
      }
    } catch (error) {
      console.warn('[TaskStorage] Error saving task to SQLite:', error);
    }
  }

  // 3. Schedule device notification trigger
  try {
    await scheduleTaskNotification(task);
  } catch (error) {
    console.warn('[TaskStorage] Error scheduling task notification:', error);
  }

  // 4. Notify active calendar listeners
  notifyListeners();
}

/**
 * Loads all tasks, keeping historical/past tasks permanently.
 */
export async function loadTasks(): Promise<UserTask[]> {
  const db = getDatabase();

  if (!db) {
    return [...memoryTasks];
  }

  try {
    const selectSql = `SELECT id, title, description, date, time, is_all_day, does_not_repeat, repeat_option, created_at 
       FROM user_tasks 
       ORDER BY date ASC;`;

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

    const loaded: UserTask[] = rows.map((r: any) => ({
      id: String(r.id),
      title: String(r.title),
      description: r.description ? String(r.description) : '',
      date: String(r.date),
      time: r.time ? String(r.time) : undefined,
      isAllDay: r.is_all_day === 1 || r.is_all_day === true,
      doesNotRepeat: r.does_not_repeat === 1 || r.does_not_repeat === true,
      repeatOption: r.repeat_option || 'none',
      createdAt: Number(r.created_at) || Date.now(),
    }));

    const loadedMap = new Map(loaded.map(t => [t.id, t]));
    for (const memTask of memoryTasks) {
      if (!loadedMap.has(memTask.id)) {
        loaded.push(memTask);
        loadedMap.set(memTask.id, memTask);
      }
    }

    memoryTasks = loaded;
    return loaded;
  } catch (error) {
    console.warn('[TaskStorage] Error reading tasks from SQLite:', error);
    return [...memoryTasks];
  }
}


/**
 * Converts user tasks into CalendarEvent map format keyed by 'YYYY-MM-DD'.
 */
export function convertTasksToEventsMap(
  tasks: UserTask[],
): Record<string, CalendarEvent[]> {
  const map: Record<string, CalendarEvent[]> = {};

  for (const task of tasks) {
    if (!map[task.date]) {
      map[task.date] = [];
    }

    const displayTitle =
      task.time ? `${task.time} ${task.title}` : task.title;

    map[task.date].push({
      id: task.id,
      title: displayTitle,
      date: task.date,
      time: task.time,
      color: CALENDAR_COLORS.task_event,
      isHoliday: false,
      isTask: true,
      doesNotRepeat: task.doesNotRepeat,
      description: task.description,
    });
  }

  return map;
}

/**
 * Subscribes to task changes (save/delete/cleanup).
 */
export function subscribeToTaskChanges(callback: TaskListener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
