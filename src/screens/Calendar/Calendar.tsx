import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  CalendarHeader,
  WeekdayHeader,
  MonthView,
  FloatingActionButton,
  CreateActionModal,
  DayScheduleModal,
} from './components';

import { CALENDAR_COLORS, SCREEN_NAMES } from '@/constants';
import {
  getInitialHolidays,
  getHolidaysForYears,
  loadTasks,
  convertTasksToEventsMap,
  subscribeToTaskChanges,
  loadEvents,
  convertEventsToEventsMap,
  subscribeToEventChanges,
} from '@/services';
import { styles } from './Calendar.styles';
import { CalendarDay, CalendarEvent } from '@/types';
import {
  formatDateString,
  formatMonthHeaderTitle,
  getDateForPageIndex,
  INITIAL_MONTH_INDEX,
  TOTAL_MONTHS_COUNT,
  navigate,
} from '@/utils';

const Calendar: React.FC = () => {

  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<number>>(null);

  const baseDate = useMemo(() => new Date(), []);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(baseDate);

  // Selected date (YYYY-MM-DD)
  const [selectedDateString, setSelectedDateString] = useState<string>(
    formatDateString(baseDate),
  );

  // Event dictionary keyed by 'YYYY-MM-DD', initialized with instant offline festivals
  const [eventsMap, setEventsMap] = useState<Record<string, CalendarEvent[]>>(
    () => getInitialHolidays(),
  );


  const loadedYearsRef = useRef<Set<number>>(new Set([baseDate.getFullYear()]));

  useEffect(() => {
    const currentYear = currentMonthDate.getFullYear();
    const adjacentYears = [currentYear - 1, currentYear, currentYear + 1];
    const missingYears = adjacentYears.filter((y) => !loadedYearsRef.current.has(y));

    if (missingYears.length === 0) return;

    missingYears.forEach((y) => loadedYearsRef.current.add(y));

    getHolidaysForYears(missingYears).then((newHolidays) => {
      setEventsMap((prev) => {
        const merged = { ...prev };
        for (const [dateStr, holidayList] of Object.entries(newHolidays)) {
          const existing = merged[dateStr] || [];
          const existingTitles = new Set(existing.map((e) => e.title));
          const toAdd = holidayList.filter((h) => !existingTitles.has(h.title));
          if (toAdd.length > 0) {
            merged[dateStr] = [...existing, ...toAdd];
          }
        }
        return merged;
      });
    });
  }, [currentMonthDate]);

  const [isActionModalVisible, setIsActionModalVisible] = useState(false);
  const [isDayScheduleModalVisible, setIsDayScheduleModalVisible] = useState(false);

  const pages = useMemo(
    () => Array.from({ length: TOTAL_MONTHS_COUNT }, (_, i) => i),
    [],
  );

  const handleSelectDay = useCallback((day: CalendarDay) => {
    setSelectedDateString(day.dateString);
    setIsDayScheduleModalVisible(true);
  }, []);

  const handleJumpToToday = useCallback(() => {
    flatListRef.current?.scrollToIndex({
      index: INITIAL_MONTH_INDEX,
      animated: true,
    });
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDateString(formatDateString(today));
  }, []);

  // Refresh and sync tasks and user events from storage, automatically deleting expired non-repeating items
  const refreshItems = useCallback(async () => {
    const [tasks, userEvents] = await Promise.all([loadTasks(), loadEvents()]);
    const tasksMap = convertTasksToEventsMap(tasks);
    const userEventsMap = convertEventsToEventsMap(userEvents);

    setEventsMap((prev) => {
      const merged: Record<string, CalendarEvent[]> = {};

      // 1. Base holidays/festivals (excluding user tasks and user events)
      for (const [dateStr, list] of Object.entries(prev)) {
        const baseHolidays = list.filter(
          (e) => !e.isTask && !e.id.startsWith('user-event-'),
        );
        if (baseHolidays.length > 0) {
          merged[dateStr] = baseHolidays;
        }
      }

      // 2. Add user events
      for (const [dateStr, evtList] of Object.entries(userEventsMap)) {
        const existing = merged[dateStr] || [];
        merged[dateStr] = [...existing, ...evtList];
      }

      // 3. Prepend active tasks so they appear first in day cells
      for (const [dateStr, taskEvents] of Object.entries(tasksMap)) {
        const existing = merged[dateStr] || [];
        merged[dateStr] = [...taskEvents, ...existing];
      }

      return merged;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshItems();
    }, [refreshItems])
  );

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // Subscribe to live task and event changes
  useEffect(() => {
    const unsubTasks = subscribeToTaskChanges(() => {
      refreshItems();
    });
    const unsubEvents = subscribeToEventChanges(() => {
      refreshItems();
    });
    return () => {
      unsubTasks();
      unsubEvents();
    };
  }, [refreshItems]);

  const handleOpenTaskModal = useCallback(
    (hour?: number) => {
      setIsActionModalVisible(false);
      setIsDayScheduleModalVisible(false);
      let prefilledTime: string | undefined;
      if (typeof hour === 'number') {
        const period = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        prefilledTime = `${h12}:00 ${period}`;
      }
      navigate(SCREEN_NAMES.TASK, {
        mode: 'task',
        selectedDateString,
        prefilledTime,
      });
    },
    [selectedDateString],
  );

  const handleOpenEventModal = useCallback(
    (hour?: number) => {
      setIsActionModalVisible(false);
      setIsDayScheduleModalVisible(false);
      let prefilledTime: string | undefined;
      if (typeof hour === 'number') {
        const period = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        prefilledTime = `${h12}:00 ${period}`;
      }
      navigate(SCREEN_NAMES.TASK, {
        mode: 'event',
        selectedDateString,
        prefilledTime,
      });
    },
    [selectedDateString],
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / width);
      if (pageIndex >= 0 && pageIndex < TOTAL_MONTHS_COUNT) {
        const monthDate = getDateForPageIndex(pageIndex, baseDate);
        setCurrentMonthDate(monthDate);
      }
    },
    [width, baseDate],
  );

  const handleScrollToIndexFailed = useCallback((info: { index: number }) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: false,
      });
    }, 100);
  }, []);

  const renderItem = useCallback(
    ({ item: pageIndex }: { item: number }) => {
      const monthDate = getDateForPageIndex(pageIndex, baseDate);
      return (
        <MonthView
          date={monthDate}
          eventsMap={eventsMap}
          selectedDateString={selectedDateString}
          onSelectDay={handleSelectDay}
          width={width}
        />
      );
    },
    [baseDate, eventsMap, selectedDateString, handleSelectDay, width],
  );

  const keyExtractor = useCallback(
    (pageIndex: number) => `month-page-${pageIndex}`,
    [],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <CalendarHeader
        title={formatMonthHeaderTitle(currentMonthDate)}
        onPressMenu={() => Alert.alert('Menu', 'Calendar navigation options')}
        onPressSearch={() =>
          Alert.alert('Search', 'Search for events and tasks')
        }
        onPressToday={handleJumpToToday}
        onPressProfile={() => Alert.alert('Profile', 'Account settings')}
      />

      {/* Weekday Header Row */}
      <WeekdayHeader />

      {/* Horizontal Swiping Months Pager */}
      <View style={styles.pagerContainer}>
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderItem}
          extraData={eventsMap}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={INITIAL_MONTH_INDEX}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={1}
          bounces={false}
        />
      </View>

      {/* Floating Action Button */}
      <FloatingActionButton onPress={() => setIsActionModalVisible(true)} />

      {/* Speed Dial Action Modal */}
      <CreateActionModal
        visible={isActionModalVisible}
        onClose={() => setIsActionModalVisible(false)}
        onPressTask={handleOpenTaskModal}
        onPressEvent={handleOpenEventModal}
      />

      {/* Day Schedule Timeline Modal */}
      <DayScheduleModal
        visible={isDayScheduleModalVisible}
        dateString={selectedDateString}
        events={eventsMap[selectedDateString] || []}
        onClose={() => setIsDayScheduleModalVisible(false)}
        onPressTask={(hour) => handleOpenTaskModal(hour)}
        onPressEvent={handleOpenEventModal}
      />
    </View>
  );
};

export default Calendar;
