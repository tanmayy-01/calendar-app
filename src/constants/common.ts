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
    subtitle: 'Auto-deleted after the event date passes',
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
