export interface CalendarHeaderProps {
  title: string;
  onPressMenu?: () => void;
  onPressSearch?: () => void;
  onPressToday?: () => void;
  onPressProfile?: () => void;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // 'YYYY-MM-DD'
  color?: string;
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

export interface AddEventModalProps {
  visible: boolean;
  selectedDateString: string;
  onClose: () => void;
  onAddEvent: (title: string, dateString: string) => void;
}