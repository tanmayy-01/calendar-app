import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CalendarHeader,
  WeekdayHeader,
  MonthView,
  FloatingActionButton,
  AddEventModal,
  CreateActionModal,
} from './components';

import { CALENDAR_COLORS, SCREEN_NAMES } from '@/constants';
import {
  getInitialHolidays,
  getHolidaysForYears,
  saveTask,
  loadTasks,
  convertTasksToEventsMap,
  subscribeToTaskChanges,
} from '@/services';
import { styles } from './Calendar.styles';
import { CalendarDay, CalendarEvent, RootStackParamList } from '@/types';
import {
  formatDateString,
  formatMonthHeaderTitle,
  getDateForPageIndex,
  INITIAL_MONTH_INDEX,
  TOTAL_MONTHS_COUNT,
} from '@/utils';
import * as navigation from '@/utils'

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

  // Track loaded years to prevent redundant fetches
  const loadedYearsRef = useRef<Set<number>>(new Set([baseDate.getFullYear()]));

  // Dynamically load real-time festivals/holidays for current and adjacent years
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

  // Action sheet (speed-dial) modal visibility
  const [isActionModalVisible, setIsActionModalVisible] = useState(false);

  // Add event/task dialog visibility and active mode
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'event' | 'task'>('event');

  // Array of page indices for virtualized months list
  const pages = useMemo(
    () => Array.from({ length: TOTAL_MONTHS_COUNT }, (_, i) => i),
    [],
  );

  const handleSelectDay = useCallback((day: CalendarDay) => {
    setSelectedDateString(day.dateString);
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

  // Refresh and sync tasks from storage, automatically deleting expired non-repeating tasks
  const refreshTasks = useCallback(async () => {
    const tasks = await loadTasks();
    const tasksMap = convertTasksToEventsMap(tasks);

    setEventsMap((prev) => {
      const merged: Record<string, CalendarEvent[]> = {};

      // 1. Non-task events (holidays, festivals)
      for (const [dateStr, list] of Object.entries(prev)) {
        const nonTasks = list.filter((e) => !e.isTask);
        if (nonTasks.length > 0) {
          merged[dateStr] = nonTasks;
        }
      }

      // 2. Prepend active tasks so they appear first in day cells
      for (const [dateStr, taskEvents] of Object.entries(tasksMap)) {
        const existing = merged[dateStr] || [];
        merged[dateStr] = [...taskEvents, ...existing];
      }

      return merged;
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshTasks();
    }, [refreshTasks])
  );

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Subscribe to live task changes
  useEffect(() => {
    const unsubscribe = subscribeToTaskChanges(() => {
      refreshTasks();
    });
    return unsubscribe;
  }, [refreshTasks]);

  const handleOpenTaskModal = useCallback(() => {
    setIsActionModalVisible(false);
    navigation.navigate(SCREEN_NAMES.TASK, {
      selectedDateString,
    });
  }, [navigation, selectedDateString]);

  const handleOpenEventModal = useCallback(() => {
    setIsActionModalVisible(false);
    setModalMode('event');
    setIsAddModalVisible(true);
  }, []);

  const handleAddEvent = useCallback(
    (title: string, dateString: string, mode: 'event' | 'task' = 'event') => {
      const isTask = mode === 'task';
      if (isTask) {
        saveTask({
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          date: dateString,
          isAllDay: true,
          doesNotRepeat: true,
          repeatOption: 'none',
          createdAt: Date.now(),
        });
      } else {
        setEventsMap((prev) => {
          const existing = prev[dateString] || [];
          const newEvent: CalendarEvent = {
            id: `${dateString}-${Date.now()}`,
            title,
            date: dateString,
            color: CALENDAR_COLORS.eventPill,
            isHoliday: false,
            isTask: false,
          };
          return {
            ...prev,
            [dateString]: [...existing, newEvent],
          };
        });
      }
    },
    [],
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

      {/* Speed Dial Action Modal (Task & Event Options matching design) */}
      <CreateActionModal
        visible={isActionModalVisible}
        onClose={() => setIsActionModalVisible(false)}
        onPressTask={handleOpenTaskModal}
        onPressEvent={handleOpenEventModal}
      />

      {/* Add Event / Task Input Modal */}
      <AddEventModal
        visible={isAddModalVisible}
        selectedDateString={selectedDateString}
        onClose={() => setIsAddModalVisible(false)}
        onAddEvent={handleAddEvent}
        mode={modalMode}
      />
    </View>
  );
};

export default Calendar;
