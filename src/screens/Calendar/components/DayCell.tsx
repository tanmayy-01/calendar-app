import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CalendarDay } from '../utils/calendarUtils';
import { CALENDAR_COLORS } from '@/constants';
import { scale } from '@/lib/scale';

interface DayCellProps {
  day: CalendarDay;
  isLastColumn?: boolean;
  isLastRow?: boolean;
  isSelected?: boolean;
  onPress?: (day: CalendarDay) => void;
}

export const DayCell: React.FC<DayCellProps> = React.memo(
  ({ day, isLastColumn, isLastRow, isSelected, onPress }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress && onPress(day)}
        style={[
          styles.container,
          !isLastColumn && styles.borderRight,
          !isLastRow && styles.borderBottom,
          isSelected && styles.selectedBackground,
        ]}
      >
        {/* Day Number Header */}
        <View style={styles.headerRow}>
          {day.isToday ? (
            <View style={styles.todayCircle}>
              <Text style={styles.todayText}>{day.dayNumber}</Text>
            </View>
          ) : (
            <View style={styles.normalDayWrapper}>
              <Text
                style={[
                  styles.dayText,
                  day.isCurrentMonth
                    ? styles.currentMonthText
                    : styles.dimmedMonthText,
                ]}
              >
                {day.dayNumber}
              </Text>
            </View>
          )}
        </View>

        {/* Events Container */}
        <View style={styles.eventsContainer}>
          {day.events.slice(0, 2).map((event) => (
            <View
              key={event.id}
              style={[
                styles.eventPill,
                event.color ? { backgroundColor: event.color } : null,
              ]}
            >
              <Text style={styles.eventText} numberOfLines={1}>
                {event.title}
              </Text>
            </View>
          ))}
          {day.events.length > 2 && (
            <Text style={styles.moreEventsText} numberOfLines={1}>
              +{day.events.length - 2} more
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

DayCell.displayName = 'DayCell';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: scale.h(4),
    paddingHorizontal: scale.w(2),
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  borderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: CALENDAR_COLORS.gridBorder,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CALENDAR_COLORS.gridBorder,
  },
  selectedBackground: {
    backgroundColor: 'rgba(246, 165, 146, 0.08)',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scale.h(28),
  },
  todayCircle: {
    width: scale.w(24),
    height: scale.w(24),
    borderRadius: scale.w(12),
    backgroundColor: CALENDAR_COLORS.todayBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    fontSize: scale.ms(12),
    fontWeight: '700',
    color: CALENDAR_COLORS.todayText,
  },
  normalDayWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale.w(20),
    minHeight: scale.h(20),
  },
  dayText: {
    fontSize: scale.ms(12),
    fontWeight: '400',
  },
  currentMonthText: {
    color: CALENDAR_COLORS.textPrimary,
  },
  dimmedMonthText: {
    color: CALENDAR_COLORS.textDimmed,
  },
  eventsContainer: {
    flex: 1,
    marginTop: scale.h(2),
    gap: scale.h(2),
  },
  eventPill: {
    backgroundColor: CALENDAR_COLORS.eventPill,
    borderRadius: scale.ms(4),
    paddingHorizontal: scale.w(3),
    paddingVertical: scale.h(1.5),
    alignSelf: 'stretch',
  },
  eventText: {
    fontSize: scale.ms(9),
    fontWeight: '600',
    color: CALENDAR_COLORS.eventText,
  },
  moreEventsText: {
    fontSize: scale.ms(8),
    color: CALENDAR_COLORS.textSecondary,
    paddingLeft: scale.w(2),
  },
});
