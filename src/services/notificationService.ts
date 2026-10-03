import notifee, {
  AndroidImportance,
  EventType,
  Event,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { UserTask, UserEvent } from '@/types';
import { REMINDERS_CHANNEL_ID, REMINDERS_CHANNEL_NAME } from '@/constants';

let isInitialized = false;

/**
 * Parses time string (e.g., '11:00 AM', '9:30 PM', '11 AM') into 24-hour hour & minute.
 */
export function parseTimeTo24Hour(timeStr?: string): {
  hour: number;
  minute: number;
} {
  if (!timeStr) return { hour: 9, minute: 0 };
  const cleaned = timeStr.trim().replace(/\./g, '');
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return { hour: 9, minute: 0 };

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hour < 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  return {
    hour: Math.max(0, Math.min(23, hour)),
    minute: Math.max(0, Math.min(59, minute)),
  };
}

/**
 * Calculates unix timestamp (ms) for a given date and time string.
 * Defaults to 9:00 AM for all-day items.
 */
export function calculateNotificationTimestamp(
  dateStr: string,
  timeStr?: string,
  isAllDay?: boolean,
): number {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return Date.now();

  const year = parts[0];
  const monthIndex = parts[1] - 1;
  const day = parts[2];

  const { hour, minute } =
    !isAllDay && timeStr ? parseTimeTo24Hour(timeStr) : { hour: 9, minute: 0 };

  const targetDate = new Date(year, monthIndex, day, hour, minute, 0, 0);
  return targetDate.getTime();
}

/**
 * Initializes notification channels, permissions, and foreground event listeners.
 */
export async function initNotificationService(): Promise<void> {
  if (isInitialized) return;

  try {
    // 1. Create Android Notification Channel
    await notifee.createChannel({
      id: REMINDERS_CHANNEL_ID,
      name: REMINDERS_CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    });

    // 2. Request user notification permission
    await notifee.requestPermission();

    // 3. Set up foreground event handler
    notifee.onForegroundEvent(({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log(
          '[NotificationService] Notification tapped in foreground:',
          detail.notification?.id,
        );
      }
    });

    isInitialized = true;
    console.log(
      '[NotificationService] Notification service initialized successfully',
    );
  } catch (error) {
    console.warn(
      '[NotificationService] Error initializing notifications:',
      error,
    );
  }
}

/**
 * Schedules a local device notification for a task.
 */
export async function scheduleTaskNotification(
  task: UserTask,
): Promise<string | null> {
  try {
    await initNotificationService();

    const timestamp = calculateNotificationTimestamp(
      task.date,
      task.time,
      task.isAllDay,
    );
    const now = Date.now();

    // If scheduled time is in the past, skip scheduling future alarm
    if (timestamp <= now) {
      // If it was scheduled for within the last 30 seconds (just now), display immediately
      if (now - timestamp < 30 * 1000) {
        return await notifee.displayNotification({
          id: task.id,
          title: task.title,
          body:
            task.description?.trim() ||
            (task.time
              ? `Task reminder for ${task.time}`
              : 'All-day task scheduled for today'),
          android: {
            channelId: REMINDERS_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            pressAction: { id: 'default' },
          },
          ios: { sound: 'default' },
        });
      }
      console.log(
        `[NotificationService] Task '${
          task.title
        }' time is in the past (${new Date(
          timestamp,
        ).toLocaleString()}), skipping future trigger`,
      );
      return null;
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: {
        allowWhileIdle: true,
      },
      repeatFrequency:
        task.repeatOption === 'daily'
          ? RepeatFrequency.DAILY
          : task.repeatOption === 'weekly'
          ? RepeatFrequency.WEEKLY
          : undefined,
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: task.id,
        title: task.title,
        body:
          task.description?.trim() ||
          (task.time
            ? `Task reminder for ${task.time}`
            : 'All-day task scheduled for today'),
        android: {
          channelId: REMINDERS_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500],
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );

    console.log(
      `[NotificationService] Scheduled task reminder '${
        task.title
      }' for ${new Date(timestamp).toLocaleString()}`,
    );
    return notificationId;
  } catch (error) {
    console.warn(
      '[NotificationService] Error scheduling task notification:',
      error,
    );
    return null;
  }
}

/**
 * Schedules a local device notification for an event.
 */
export async function scheduleEventNotification(
  event: UserEvent,
): Promise<string | null> {
  try {
    await initNotificationService();

    const timestamp = calculateNotificationTimestamp(
      event.startDate,
      event.startTime,
      event.isAllDay,
    );
    const now = Date.now();

    // If scheduled time is in the past, skip scheduling future alarm
    if (timestamp <= now) {
      // If it was scheduled for within the last 30 seconds (just now), display immediately
      if (now - timestamp < 30 * 1000) {
        return await notifee.displayNotification({
          id: event.id,
          title: event.title,
          body:
            event.description?.trim() ||
            (event.startTime
              ? `Event scheduled for ${event.startTime}`
              : 'All-day event scheduled for today'),
          android: {
            channelId: REMINDERS_CHANNEL_ID,
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            pressAction: { id: 'default' },
          },
          ios: { sound: 'default' },
        });
      }
      console.log(
        `[NotificationService] Event '${
          event.title
        }' time is in the past (${new Date(
          timestamp,
        ).toLocaleString()}), skipping future trigger`,
      );
      return null;
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp,
      alarmManager: {
        allowWhileIdle: true,
      },
      repeatFrequency:
        event.repeatOption === 'daily'
          ? RepeatFrequency.DAILY
          : event.repeatOption === 'weekly'
          ? RepeatFrequency.WEEKLY
          : undefined,
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: event.id,
        title: event.title,
        body:
          event.description?.trim() ||
          (event.startTime
            ? `Event starts at ${event.startTime}`
            : 'All-day event scheduled for today'),
        android: {
          channelId: REMINDERS_CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [300, 500],
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger,
    );

    console.log(
      `[NotificationService] Scheduled event reminder '${
        event.title
      }' for ${new Date(timestamp).toLocaleString()}`,
    );
    return notificationId;
  } catch (error) {
    console.warn(
      '[NotificationService] Error scheduling event notification:',
      error,
    );
    return null;
  }
}

/**
 * Reschedules all upcoming notifications for stored tasks and events.
 */
export async function rescheduleUpcomingNotifications(
  tasks: UserTask[],
  events: UserEvent[],
): Promise<void> {
  for (const task of tasks) {
    await scheduleTaskNotification(task);
  }
  for (const event of events) {
    await scheduleEventNotification(event);
  }
}
