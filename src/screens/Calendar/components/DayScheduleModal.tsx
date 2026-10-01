import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  CALENDAR_COLORS,
  dayNames,
  FONT_SIZES,
  FONT_WEIGHTS,
  HOUR_SLOT_HEIGHT,
  HOURS,
  ICON_NAMES,
  MONTH_NAMES,
} from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';
import { CalendarEvent, DayScheduleModalProps } from '@/types';
import { formatHourLabel, isToday, parseTimeDetails } from '@/utils';
import { FloatingActionButton } from './FloatingActionButton';
import { CreateActionModal } from './CreateActionModal';
import { SafeAreaView } from 'react-native-safe-area-context';

export const DayScheduleModal: React.FC<DayScheduleModalProps> = ({
  visible,
  dateString,
  events,
  onClose,
  onPressTask,
  onPressEvent,
  onPressFab,
}) => {
  const scrollRef = useRef<any>(null);

  const parsedDate = useMemo(() => {
    if (!dateString) return new Date();
    const parts = dateString.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  }, [dateString]);

  const weekdayName = dayNames[parsedDate.getDay()];
  const dayNumber = parsedDate.getDate();
  const monthYearTitle = `${
    MONTH_NAMES[parsedDate.getMonth()]
  } ${parsedDate.getFullYear()}`;
  const dayIsToday = isToday(parsedDate);

  const { allDayEvents, timedEventsByHour } = useMemo(() => {
    const allDay: CalendarEvent[] = [];
    const timedMap: Record<number, CalendarEvent[]> = {};

    for (const event of events) {
      const timeParsed = parseTimeDetails(event.time);
      if (timeParsed !== null) {
        if (!timedMap[timeParsed.hour]) {
          timedMap[timeParsed.hour] = [];
        }
        timedMap[timeParsed.hour].push(event);
      } else {
        allDay.push(event);
      }
    }

    return { allDayEvents: allDay, timedEventsByHour: timedMap };
  }, [events]);

  const currentTimeDetails = useMemo(() => {
    if (!dayIsToday) return null;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const topPosition = (currentHour + currentMinute / 60) * HOUR_SLOT_HEIGHT;
    return { currentHour, currentMinute, topPosition };
  }, [dayIsToday]);

  useEffect(() => {
    if (visible) {
      const targetHour = dayIsToday
        ? Math.max(0, new Date().getHours() - 1)
        : 7;
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: targetHour * HOUR_SLOT_HEIGHT,
          animated: true,
        });
      }, 150);
    }
  }, [visible, dayIsToday]);

  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityLabel="Close day schedule"
          >
            <IconProvider
              name={ICON_NAMES.CLOSE}
              size={scale.ms(24)}
              color={CALENDAR_COLORS.textPrimary}
            />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>{monthYearTitle}</Text>

          <View style={styles.topBarRightPlaceholder} />
        </View>

        {/* All-Day Events Header */}
        <View style={styles.allDayHeaderRow}>
          {/* Day of Week + Day Number Column */}
          <View style={styles.dayCol}>
            <Text style={styles.weekdayText}>{weekdayName}</Text>
            <View
              style={[
                styles.dayNumberWrapper,
                dayIsToday && styles.todayDayNumberWrapper,
              ]}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  dayIsToday && styles.todayDayNumberText,
                ]}
              >
                {dayNumber}
              </Text>
            </View>
          </View>

          {/* Vertical Divider */}
          <View style={styles.headerVerticalDivider} />

          {/* All-day Events / Holidays Pill Container */}
          <View style={styles.allDayPillsContainer}>
            {allDayEvents.length > 0 ? (
              allDayEvents.map(event => {
                const isTask = event.isTask;
                return (
                  <View
                    key={event.id}
                    style={[
                      styles.allDayPill,
                      isTask
                        ? styles.allDayTaskPill
                        : {
                            backgroundColor:
                              event.color || CALENDAR_COLORS.eventPill,
                          },
                    ]}
                  >
                    <Text style={styles.allDayPillText} numberOfLines={2}>
                      {isTask && !event.title.startsWith('✓')
                        ? `✓ ${event.title}`
                        : event.title}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.noAllDayPlaceholder}>
                <Text style={styles.noAllDayText}>No all-day events</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerBottomDivider} />

        {/* Hourly Timeline */}
        <ScrollView
          ref={scrollRef}
          style={styles.timelineScroll}
          contentContainerStyle={styles.timelineContent}
          showsVerticalScrollIndicator={false}
        >
          {HOURS.map(hour => {
            const timedEvents = timedEventsByHour[hour] || [];

            return (
              <View key={`hour-${hour}`} style={styles.hourRow}>
                {/* Hour Label */}
                <View style={styles.hourLabelCol}>
                  <Text style={styles.hourLabelText}>
                    {formatHourLabel(hour)}
                  </Text>
                </View>

                {/* Vertical Divider Line */}
                <View style={styles.timelineVerticalLine} />

                {/* Timeline Hour Slot */}
                <TouchableOpacity
                  style={styles.timelineSlot}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsActionModalVisible(false);
                    onPressTask && onPressTask(hour);
                  }}
                >
                  <View style={styles.slotGridLine} />

                  {timedEvents.map(evt => {
                    const parsedTime = parseTimeDetails(evt.time);
                    const minuteOffset = parsedTime
                      ? (parsedTime.minute / 60) * HOUR_SLOT_HEIGHT
                      : 0;

                    return (
                      <View
                        key={evt.id}
                        style={[
                          styles.timedEventCard,
                          evt.isTask
                            ? styles.timedTaskCard
                            : styles.timedCalendarCard,
                          { top: minuteOffset },
                        ]}
                      >
                        <Text style={styles.timedEventTitle} numberOfLines={1}>
                          {evt.isTask && !evt.title.startsWith('✓')
                            ? `✓ ${evt.title}`
                            : evt.title}
                        </Text>
                        {evt.description ? (
                          <Text
                            style={styles.timedEventSubtitle}
                            numberOfLines={1}
                          >
                            {evt.description}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Current Time Red Line Indicator */}
          {currentTimeDetails && (
            <View
              style={[
                styles.currentTimeIndicator,
                { top: currentTimeDetails.topPosition },
              ]}
              pointerEvents="none"
            >
              <View style={styles.currentTimeDot} />
              <View style={styles.currentTimeLine} />
            </View>
          )}
        </ScrollView>

        <FloatingActionButton
          onPress={() => {
            if (onPressFab) {
              onPressFab();
            } else {
              setIsActionModalVisible(true);
            }
          }}
        />
        <CreateActionModal
          visible={isActionModalVisible}
          onClose={() => setIsActionModalVisible(false)}
          onPressTask={() => {
            setIsActionModalVisible(false);
            onPressTask && onPressTask();
          }}
          onPressEvent={() => {
            setIsActionModalVisible(false);
            onPressEvent && onPressEvent();
          }}
          useModal={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.w(16),
    paddingVertical: scale.h(10),
    backgroundColor: CALENDAR_COLORS.headerBackground,
  },
  closeBtn: {
    width: scale.w(36),
    height: scale.w(36),
    borderRadius: scale.w(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: CALENDAR_COLORS.textPrimary,
  },
  topBarRightPlaceholder: {
    width: scale.w(36),
  },
  allDayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale.h(10),
    backgroundColor: CALENDAR_COLORS.background,
  },
  dayCol: {
    width: scale.w(56),
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: scale.ms(11),
    fontWeight: FONT_WEIGHTS.medium,
    color: CALENDAR_COLORS.textSecondary,
    marginBottom: scale.h(2),
  },
  dayNumberWrapper: {
    minWidth: scale.w(28),
    height: scale.w(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDayNumberWrapper: {
    backgroundColor: CALENDAR_COLORS.todayBadge,
    borderRadius: scale.w(14),
  },
  dayNumberText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: CALENDAR_COLORS.textPrimary,
  },
  todayDayNumberText: {
    color: CALENDAR_COLORS.todayText,
  },
  headerVerticalDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: CALENDAR_COLORS.gridBorder,
    alignSelf: 'stretch',
  },
  allDayPillsContainer: {
    flex: 1,
    paddingHorizontal: scale.w(12),
    gap: scale.h(6),
  },
  allDayPill: {
    borderRadius: scale.ms(8),
    paddingHorizontal: scale.w(12),
    paddingVertical: scale.h(8),
    alignSelf: 'stretch',
    backgroundColor: CALENDAR_COLORS.eventPill,
  },
  allDayTaskPill: {
    backgroundColor: CALENDAR_COLORS.task_event,
    borderLeftWidth: scale.w(3),
    borderLeftColor: CALENDAR_COLORS.blue_dot_background,
  },
  allDayPillText: {
    fontSize: scale.ms(13),
    fontWeight: FONT_WEIGHTS.semibold,
    color: CALENDAR_COLORS.white,
  },
  noAllDayPlaceholder: {
    paddingVertical: scale.h(6),
  },
  noAllDayText: {
    fontSize: scale.ms(11),
    color: CALENDAR_COLORS.textDimmed,
    fontStyle: 'italic',
  },
  headerBottomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CALENDAR_COLORS.gridBorder,
  },
  timelineScroll: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.background,
  },
  timelineContent: {
    paddingBottom: scale.h(100),
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_SLOT_HEIGHT,
  },
  hourLabelCol: {
    width: scale.w(56),
    alignItems: 'flex-end',
    paddingRight: scale.w(8),
    paddingTop: scale.h(0),
  },
  hourLabelText: {
    fontSize: scale.ms(11),
    fontWeight: FONT_WEIGHTS.medium,
    color: CALENDAR_COLORS.textDimmed,
    marginTop: -scale.h(7),
  },
  timelineVerticalLine: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: CALENDAR_COLORS.gridBorder,
  },
  timelineSlot: {
    flex: 1,
    position: 'relative',
  },
  slotGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: CALENDAR_COLORS.gridBorder,
  },
  timedEventCard: {
    position: 'absolute',
    left: scale.w(8),
    right: scale.w(16),
    borderRadius: scale.ms(8),
    paddingHorizontal: scale.w(10),
    paddingVertical: scale.h(6),
    zIndex: 2,
    borderLeftWidth: scale.w(3),
  },
  timedTaskCard: {
    backgroundColor: CALENDAR_COLORS.task_event,
    borderLeftColor: CALENDAR_COLORS.blue_dot_background,
  },
  timedCalendarCard: {
    backgroundColor: CALENDAR_COLORS.eventPill,
    borderLeftColor: CALENDAR_COLORS.timedborder,
  },
  timedEventTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: CALENDAR_COLORS.white,
  },
  timedEventSubtitle: {
    fontSize: scale.ms(10),
    color: CALENDAR_COLORS.textSecondary,
    marginTop: scale.h(2),
  },
  currentTimeIndicator: {
    position: 'absolute',
    left: scale.w(48),
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  currentTimeDot: {
    width: scale.w(10),
    height: scale.w(10),
    borderRadius: scale.w(5),
    backgroundColor: CALENDAR_COLORS.todayBadge,
  },
  currentTimeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: CALENDAR_COLORS.todayBadge,
  },
});
