import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CALENDAR_COLORS, DAYS_OF_WEEK, FONT_WEIGHTS } from '@/constants';
import { scale } from '@/lib/scale';

export const WeekdayHeader: React.FC = React.memo(() => {
  return (
    <View style={styles.container}>
      {DAYS_OF_WEEK.map((day, index) => (
        <View key={`${day}-${index}`} style={styles.dayCol}>
          <Text style={styles.dayText}>{day}</Text>
        </View>
      ))}
    </View>
  );
});

WeekdayHeader.displayName = 'WeekdayHeader';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: scale.h(32),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CALENDAR_COLORS.gridBorder,
    backgroundColor: CALENDAR_COLORS.headerBackground,
    alignItems: 'center',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: scale.ms(11),
    fontWeight: FONT_WEIGHTS.semibold,
    color: CALENDAR_COLORS.textSecondary,
    letterSpacing: 0.5,
  },
});
