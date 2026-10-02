import { scale } from '@/lib/scale';
import { RepeatOption } from '@/types';

export const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const DEFAULT_COUNTRY_CODE = 'IN';

export const NAGER_DATE_URL = 'https://date.nager.at/api/v3/PublicHolidays';

export const BHARAT_CALENDAR_URL =
  'https://jayantur13.github.io/calendar-bharat/calendar';

export const REPEAT_CHOICES: {
  key: RepeatOption;
  label: string;
  subtitle?: string;
}[] = [
  {
    key: 'none',
    label: 'Does not repeat',
  },
  { key: 'daily', label: 'Every day' },
  { key: 'weekly', label: 'Every week' },
  { key: 'monthly', label: 'Every month' },
  { key: 'yearly', label: 'Every year' },
];

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const monthShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_SLOT_HEIGHT = scale.h(64);

export const QUICK_MINUTES = [0, 15, 30, 45];
export const HOURS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const QUICK_TIME_PRESETS = [
  '09:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM',
  '08:00 PM',
];

export const USER_EMAIL = 'tanmayshende007@gmail.com'