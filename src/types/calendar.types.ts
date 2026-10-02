export interface CalendarHeaderProps {
  title: string;
  onPressMenu?: () => void;
  onPressSearch?: () => void;
  onPressToday?: () => void;
  onPressProfile?: () => void;
}

export type RepeatOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface UserTask {
  id: string;
  title: string;
  description?: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // e.g. '10:00 AM'
  isAllDay: boolean;
  doesNotRepeat: boolean;
  repeatOption: RepeatOption;
  createdAt: number;
}

export interface UserEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string; // 'YYYY-MM-DD'
  startTime?: string; // e.g. '10:00 AM'
  endDate: string; // 'YYYY-MM-DD'
  endTime?: string; // e.g. '11:00 AM'
  isAllDay: boolean;
  doesNotRepeat: boolean;
  repeatOption: RepeatOption;
  createdAt: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // e.g. '10:00 AM'
  color?: string;
  isHoliday?: boolean;
  holidayType?: 'Public' | 'Festival' | 'Observance' | 'User';
  isTask?: boolean;
  doesNotRepeat?: boolean;
  description?: string;
}

export interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

export interface MonthViewProps {
  date: Date;
  eventsMap: Record<string, CalendarEvent[]>;
  selectedDateString?: string;
  onSelectDay?: (day: CalendarDay) => void;
  width: number;
}

export interface DayCellProps {
  day: CalendarDay;
  isLastColumn?: boolean;
  isLastRow?: boolean;
  isSelected?: boolean;
  onPress?: (day: CalendarDay) => void;
}

export interface FloatingActionButtonProps {
  onPress?: () => void;
}

export interface CreateActionModalProps {
  visible: boolean;
  onClose: () => void;
  onPressTask: () => void;
  onPressEvent: () => void;
  useModal?: boolean;
}

export interface AddEventModalProps {
  visible: boolean;
  selectedDateString: string;
  onClose: () => void;
  onAddEvent: (title: string, dateString: string, mode?: 'event' | 'task') => void;
  mode?: 'event' | 'task';
}

export interface NagerHoliday {
  date: string; // 'YYYY-MM-DD'
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

export interface DayScheduleModalProps {
  visible: boolean;
  dateString: string; // 'YYYY-MM-DD'
  events: CalendarEvent[];
  onClose: () => void;
  onPressTask?: (hour?: number) => void;
  onPressEvent?: () => void;
  onPressFab?: () => void;
}
