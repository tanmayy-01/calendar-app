import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarDay, CalendarEvent, getDaysInMonthGrid } from '../utils/calendarUtils';
import { DayCell } from './DayCell';
import { CALENDAR_COLORS } from '@/constants';

interface MonthViewProps {
  date: Date;
  eventsMap: Record<string, CalendarEvent[]>;
  selectedDateString?: string;
  onSelectDay?: (day: CalendarDay) => void;
  width: number;
}

export const MonthView: React.FC<MonthViewProps> = React.memo(
  ({ date, eventsMap, selectedDateString, onSelectDay, width }) => {
    const grid = useMemo(() => {
      return getDaysInMonthGrid(date.getFullYear(), date.getMonth(), eventsMap);
    }, [date, eventsMap]);

    // Split 42 days into 6 weeks of 7 days
    const weeks = useMemo(() => {
      const chunks: CalendarDay[][] = [];
      for (let i = 0; i < 42; i += 7) {
        chunks.push(grid.slice(i, i + 7));
      }
      return chunks;
    }, [grid]);

    return (
      <View style={[styles.container, { width }]}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <DayCell
                key={day.dateString}
                day={day}
                isLastColumn={dayIndex === 6}
                isLastRow={weekIndex === 5}
                isSelected={selectedDateString === day.dateString}
                onPress={onSelectDay}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }
);

MonthView.displayName = 'MonthView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.background,
  },
  weekRow: {
    flex: 1,
    flexDirection: 'row',
  },
});
