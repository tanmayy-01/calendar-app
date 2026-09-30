import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
} from 'react-native';
import {
  CalendarHeader,
  WeekdayHeader,
  MonthView,
  FloatingActionButton,
  AddEventModal,
} from './components';

import { getInitialHolidays, getHolidaysForYears } from '@/services';
import { styles } from './Calendar.styles';
import { CalendarDay, CalendarEvent } from '@/types';
import {
  formatDateString,
  formatMonthHeaderTitle,
  getDateForPageIndex,
  INITIAL_MONTH_INDEX,
  TOTAL_MONTHS_COUNT,
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

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

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

  const handleAddEvent = useCallback((title: string, dateString: string) => {
    setEventsMap(prev => {
      const existing = prev[dateString] || [];
      const newEvent: CalendarEvent = {
        id: `${dateString}-${Date.now()}`,
        title,
        date: dateString,
      };
      return {
        ...prev,
        [dateString]: [...existing, newEvent],
      };
    });
  }, []);

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
      <FloatingActionButton onPress={() => setIsAddModalVisible(true)} />

      {/* Add Event Modal */}
      <AddEventModal
        visible={isAddModalVisible}
        selectedDateString={selectedDateString}
        onClose={() => setIsAddModalVisible(false)}
        onAddEvent={handleAddEvent}
      />
    </View>
  );
};

export default Calendar;
