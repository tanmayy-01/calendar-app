import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Calendar, DateData } from 'react-native-calendars';
import {
  CALENDAR_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  HOURS_LIST,
  ICON_NAMES,
  QUICK_MINUTES,
  QUICK_TIME_PRESETS,
  REPEAT_CHOICES,
  USER_EMAIL,
} from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';
import {
  RepeatOption,
  UserTask,
  UserEvent,
  TaskScreenRouteProp,
} from '@/types';
import {
  formatDateString,
  formatDisplayDate,
  getInitialTime,
  parseTimeString,
  formatTimeString,
  addHoursToTime,
} from '@/utils';
import { saveTask } from '@/services/taskStorage';
import { saveEvent } from '@/services/eventStorage';
import { styles } from './Task.styles';
import * as navigation from '@/utils';

const Task: React.FC = () => {
  const route = useRoute<TaskScreenRouteProp>();
  const mode = route.params?.mode || 'task';
  const isEventMode = mode === 'event';

  // Today's date (YYYY-MM-DD)
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDateString(today), [today]);

  const initialDate = useMemo(() => {
    const param = route.params?.selectedDateString;
    if (param) {
      const parts = param.split('-').map(Number);
      if (parts.length === 3) {
        const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
        const parsedStr = formatDateString(parsed);
        if (parsedStr >= todayStr) {
          return parsed;
        }
      }
    }
    return new Date();
  }, [route.params?.selectedDateString, todayStr]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);

  // Start & End dates
  const [startDate, setStartDate] = useState<Date>(initialDate);
  const [endDate, setEndDate] = useState<Date>(initialDate);

  // Repeat selection
  const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');

  // Time states
  const [startTime, setStartTime] = useState<string>(
    () => route.params?.prefilledTime || getInitialTime(),
  );
  const [endTime, setEndTime] = useState<string>(() =>
    addHoursToTime(route.params?.prefilledTime || getInitialTime(), 1),
  );

  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>(
    'start',
  );
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end'>(
    'start',
  );

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [isRepeatPickerVisible, setIsRepeatPickerVisible] = useState(false);

  // Time picker modal temporary states
  const [tempHour, setTempHour] = useState<number>(
    () => parseTimeString(startTime).hour,
  );
  const [tempMinute, setTempMinute] = useState<number>(
    () => parseTimeString(startTime).minute,
  );
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(
    () => parseTimeString(startTime).period,
  );

  const openDatePicker = useCallback((target: 'start' | 'end' = 'start') => {
    setDatePickerTarget(target);
    setIsDatePickerVisible(true);
  }, []);

  const openTimePicker = useCallback(
    (target: 'start' | 'end' = 'start') => {
      setTimePickerTarget(target);
      const targetTime = target === 'start' ? startTime : endTime;
      const parsed = parseTimeString(targetTime);
      setTempHour(parsed.hour);
      setTempMinute(parsed.minute);
      setTempPeriod(parsed.period);
      setIsTimePickerVisible(true);
    },
    [startTime, endTime],
  );

  const confirmTime = useCallback(() => {
    const formatted = formatTimeString(tempHour, tempMinute, tempPeriod);
    if (timePickerTarget === 'start') {
      setStartTime(formatted);
      if (formatDateString(startDate) === formatDateString(endDate)) {
        setEndTime(addHoursToTime(formatted, 1));
      }
    } else {
      setEndTime(formatted);
    }
    setIsTimePickerVisible(false);
  }, [tempHour, tempMinute, tempPeriod, timePickerTarget, startDate, endDate]);

  const canSave = title.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert(
        'Required',
        isEventMode
          ? 'Please enter an event title.'
          : 'Please enter a task title.',
      );
      return;
    }

    const sDateStr = formatDateString(startDate);
    const eDateStr = formatDateString(endDate);

    if (sDateStr < todayStr) {
      Alert.alert(
        'Invalid Date',
        `${
          isEventMode ? 'Events' : 'Tasks'
        } can only be scheduled for today or future dates.`,
      );
      return;
    }

    if (isEventMode && eDateStr < sDateStr) {
      Alert.alert(
        'Invalid Date',
        'End date cannot be earlier than start date.',
      );
      return;
    }

    const doesNotRepeat = repeatOption === 'none';

    if (isEventMode) {
      const newEvent: UserEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        description: description.trim(),
        startDate: sDateStr,
        startTime: isAllDay ? undefined : startTime,
        endDate: eDateStr,
        endTime: isAllDay ? undefined : endTime,
        isAllDay,
        doesNotRepeat,
        repeatOption,
        createdAt: Date.now(),
      };
      await saveEvent(newEvent);
    } else {
      const newTask: UserTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        description: description.trim(),
        date: sDateStr,
        time: isAllDay ? undefined : startTime,
        isAllDay,
        doesNotRepeat,
        repeatOption,
        createdAt: Date.now(),
      };
      await saveTask(newTask);
    }

    navigation.goBack();
  }, [
    title,
    description,
    startDate,
    endDate,
    todayStr,
    isAllDay,
    startTime,
    endTime,
    repeatOption,
    isEventMode,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Close screen"
          >
            <IconProvider
              name={ICON_NAMES.CLOSE}
              size={scale.ms(24)}
              color={CALENDAR_COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.8}
            accessibilityLabel={isEventMode ? 'Save event' : 'Save task'}
          >
            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <View style={styles.titleSection}>
            <TextInput
              style={styles.titleInput}
              placeholder={isEventMode ? 'Add event title' : 'Add title'}
              placeholderTextColor={CALENDAR_COLORS.textDimmed}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* Account / Category Row */}
          <View style={styles.row}>
            <View style={styles.iconColumn}>
              <View>
                <IconProvider
                  name={ICON_NAMES.CALENDAR_SOLID}
                  size={scale.ms(22)}
                  color={
                    isEventMode
                      ? CALENDAR_COLORS.eventPill
                      : CALENDAR_COLORS.textSecondary
                  }
                />
                <View
                  style={
                    isEventMode ? styles.eventDotBadge : styles.blueDotBadge
                  }
                />
              </View>
            </View>

            <View style={styles.contentColumn}>
              <Text style={styles.accountCategoryText}>
                {isEventMode ? 'Events' : 'Tasks'}
              </Text>
              <Text style={styles.accountEmailText}>{USER_EMAIL}</Text>
            </View>
          </View>

          {/* Description Row */}
          <View style={styles.rowTopAlign}>
            <View style={styles.iconColumn}>
              <IconProvider
                name={ICON_NAMES.DESCRIPTION}
                size={scale.ms(22)}
                color={CALENDAR_COLORS.textSecondary}
              />
            </View>

            <View style={styles.contentColumn}>
              <TextInput
                style={styles.descriptionInput}
                placeholder={isEventMode ? 'Add description' : 'Add details'}
                placeholderTextColor={CALENDAR_COLORS.textDimmed}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>

          {/* All-Day Toggle Row */}
          <View style={styles.rowBetween}>
            <View style={styles.leftGroup}>
              <View style={styles.iconColumn}>
                <IconProvider
                  name={ICON_NAMES.TIME}
                  size={scale.ms(22)}
                  color={CALENDAR_COLORS.textSecondary}
                />
              </View>
              <Text style={styles.rowLabel}>All-day</Text>
            </View>

            <Switch
              value={isAllDay}
              onValueChange={val => {
                setIsAllDay(val);
                if (!val) {
                  openTimePicker('start');
                }
              }}
              trackColor={{
                false: CALENDAR_COLORS.swithTrack,
                true: isEventMode
                  ? CALENDAR_COLORS.eventPill
                  : CALENDAR_COLORS.todayBadge,
              }}
              thumbColor={
                isAllDay
                  ? isEventMode
                    ? CALENDAR_COLORS.switchThumb
                    : CALENDAR_COLORS.swithThumb_1
                  : CALENDAR_COLORS.defaultSwithThumb
              }
            />
          </View>

          <View style={styles.dateTimeContainer}>
            {isEventMode ? (
              isAllDay ? (
                <>
                  <View style={styles.dateTimeRowBetween}>
                    <TouchableOpacity
                      onPress={() => openDatePicker('start')}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dateTimeText}>
                        {formatDisplayDate(startDate)}
                      </Text>
                    </TouchableOpacity>

                    {formatDateString(startDate) ===
                      formatDateString(endDate) && (
                      <TouchableOpacity
                        onPress={() => openDatePicker('end')}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.addEndDateButtonText}>
                          + End date
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {formatDateString(startDate) !==
                    formatDateString(endDate) && (
                    <View
                      style={[
                        styles.dateTimeRowBetween,
                        { marginTop: scale.h(12) },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => openDatePicker('end')}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.dateTimeText}>
                          {formatDisplayDate(endDate)}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setEndDate(startDate)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <IconProvider
                          name={ICON_NAMES.CLOSE}
                          size={scale.ms(16)}
                          color={CALENDAR_COLORS.textDimmed}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <>
                  {/* Start Row */}
                  <View style={styles.dateTimeRowBetween}>
                    <TouchableOpacity
                      onPress={() => openDatePicker('start')}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dateTimeText}>
                        {formatDisplayDate(startDate)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => openTimePicker('start')}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dateTimeText}>{startTime}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* End Row */}
                  <View
                    style={[
                      styles.dateTimeRowBetween,
                      { marginTop: scale.h(12) },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => openDatePicker('end')}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dateTimeText}>
                        {formatDisplayDate(endDate)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => openTimePicker('end')}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.dateTimeText}>{endTime}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )
            ) : isAllDay ? (
              <View style={styles.dateTimeRowBetween}>
                <TouchableOpacity
                  onPress={() => openDatePicker('start')}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.dateTimeRowBetween}>
                <TouchableOpacity
                  onPress={() => openDatePicker('start')}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.dateTimeText}>
                    {formatDisplayDate(startDate)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openTimePicker('start')}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.dateTimeText}>{startTime}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Repeat Option Row */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setIsRepeatPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.iconColumn}>
              <IconProvider
                name={ICON_NAMES.REPEAT}
                size={scale.ms(22)}
                color={CALENDAR_COLORS.textSecondary}
              />
            </View>

            <View style={styles.repeatRowContent}>
              <Text style={styles.repeatText}>
                {REPEAT_CHOICES.find(c => c.key === repeatOption)?.label ||
                  'Does not repeat'}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Repeat Selection Modal */}
      <Modal
        visible={isRepeatPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRepeatPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsRepeatPickerVisible(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalHeaderTitle}>Repeat options</Text>

            {REPEAT_CHOICES.map(choice => {
              const isSelected = choice.key === repeatOption;
              return (
                <TouchableOpacity
                  key={choice.key}
                  style={styles.optionItem}
                  onPress={() => {
                    setRepeatOption(choice.key);
                    setIsRepeatPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionTextWrapper}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {choice.label}
                    </Text>
                    {choice.subtitle && (
                      <Text style={styles.optionSubtitle}>
                        {choice.subtitle}
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <IconProvider
                      name={ICON_NAMES.CHECKMARK}
                      size={scale.ms(20)}
                      color={
                        isEventMode
                          ? CALENDAR_COLORS.eventPill
                          : CALENDAR_COLORS.todayBadge
                      }
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerVisible(false)}
        >
          <View
            style={styles.calendarModalCard}
            onStartShouldSetResponder={() => true}
          >
            <Calendar
              current={
                datePickerTarget === 'start'
                  ? formatDateString(startDate)
                  : formatDateString(endDate)
              }
              minDate={
                datePickerTarget === 'start'
                  ? todayStr
                  : formatDateString(startDate)
              }
              disableAllTouchEventsForDisabledDays={true}
              onDayPress={(day: DateData) => {
                const minCheck =
                  datePickerTarget === 'start'
                    ? todayStr
                    : formatDateString(startDate);
                if (day.dateString < minCheck) return;

                const parts = day.dateString.split('-').map(Number);
                const picked = new Date(parts[0], parts[1] - 1, parts[2]);

                if (datePickerTarget === 'start') {
                  setStartDate(picked);
                  if (formatDateString(picked) > formatDateString(endDate)) {
                    setEndDate(picked);
                  }
                } else {
                  setEndDate(picked);
                }
                setIsDatePickerVisible(false);
              }}
              markedDates={{
                [datePickerTarget === 'start'
                  ? formatDateString(startDate)
                  : formatDateString(endDate)]: {
                  selected: true,
                  selectedColor: isEventMode
                    ? CALENDAR_COLORS.eventPill
                    : CALENDAR_COLORS.todayBadge,
                  selectedTextColor: CALENDAR_COLORS.white,
                },
              }}
              enableSwipeMonths={true}
              theme={{
                backgroundColor: CALENDAR_COLORS.surface,
                calendarBackground: CALENDAR_COLORS.surface,
                textSectionTitleColor: CALENDAR_COLORS.textDimmed,
                selectedDayBackgroundColor: isEventMode
                  ? CALENDAR_COLORS.eventPill
                  : CALENDAR_COLORS.todayBadge,
                selectedDayTextColor: CALENDAR_COLORS.white,
                todayTextColor: isEventMode
                  ? CALENDAR_COLORS.eventPill
                  : CALENDAR_COLORS.todayBadge,
                dayTextColor: CALENDAR_COLORS.textPrimary,
                textDisabledColor: CALENDAR_COLORS.textDimmed,
                monthTextColor: CALENDAR_COLORS.textPrimary,
                arrowColor: isEventMode
                  ? CALENDAR_COLORS.eventPill
                  : CALENDAR_COLORS.todayBadge,
                textDayFontWeight: FONT_WEIGHTS.medium,
                textMonthFontWeight: FONT_WEIGHTS.bold,
                textDayHeaderFontWeight: FONT_WEIGHTS.semibold,
                textDayFontSize: scale.ms(13),
                textMonthFontSize: scale.ms(15),
                textDayHeaderFontSize: FONT_SIZES.xs,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={isTimePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTimePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsTimePickerVisible(false)}
        >
          <View
            style={styles.timeModalCard}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalHeaderTitle}>
              {isEventMode ? `Select ${timePickerTarget} time` : 'Select time'}
            </Text>

            {/* Interactive Digital Clock Display */}
            <View style={styles.timeDisplayRow}>
              {/* Hour Input Box */}
              <View style={[styles.timeInputBox, styles.timeInputBoxActive]}>
                <TextInput
                  style={styles.timeInputText}
                  value={String(tempHour)}
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={val => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setTempHour(Math.max(1, Math.min(12, num)));
                    } else if (val === '') {
                      setTempHour(1);
                    }
                  }}
                  selectTextOnFocus
                />
              </View>

              <Text style={styles.timeColon}>:</Text>

              {/* Minute Input Box */}
              <View style={styles.timeInputBox}>
                <TextInput
                  style={styles.timeInputText}
                  value={String(tempMinute).padStart(2, '0')}
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={val => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setTempMinute(Math.max(0, Math.min(59, num)));
                    } else if (val === '') {
                      setTempMinute(0);
                    }
                  }}
                  selectTextOnFocus
                />
              </View>

              {/* AM / PM Segment Toggle */}
              <View style={styles.amPmCol}>
                <TouchableOpacity
                  style={[
                    styles.amPmBtn,
                    tempPeriod === 'AM' && styles.amPmBtnActive,
                  ]}
                  onPress={() => setTempPeriod('AM')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.amPmBtnText,
                      tempPeriod === 'AM' && styles.amPmBtnTextActive,
                    ]}
                  >
                    AM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.amPmBtn,
                    tempPeriod === 'PM' && styles.amPmBtnActive,
                  ]}
                  onPress={() => setTempPeriod('PM')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.amPmBtnText,
                      tempPeriod === 'PM' && styles.amPmBtnTextActive,
                    ]}
                  >
                    PM
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Popular Presets */}
            <Text style={styles.timeSectionSubtitle}>Popular times</Text>
            <View style={styles.quickChipsRow}>
              {QUICK_TIME_PRESETS.map(preset => {
                const parsed = parseTimeString(preset);
                const isActive =
                  tempHour === parsed.hour &&
                  tempMinute === parsed.minute &&
                  tempPeriod === parsed.period;

                return (
                  <TouchableOpacity
                    key={preset}
                    style={[
                      styles.quickChip,
                      isActive && styles.quickChipActive,
                    ]}
                    onPress={() => {
                      setTempHour(parsed.hour);
                      setTempMinute(parsed.minute);
                      setTempPeriod(parsed.period);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        isActive && styles.quickChipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Hour Grid */}
            <Text style={styles.timeSectionSubtitle}>Hour</Text>
            <View style={styles.hoursGrid}>
              {HOURS_LIST.map(h => {
                const isActive = tempHour === h;
                return (
                  <TouchableOpacity
                    key={`h-${h}`}
                    style={[styles.hourBtn, isActive && styles.hourBtnActive]}
                    onPress={() => setTempHour(h)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.hourBtnText,
                        isActive && styles.hourBtnTextActive,
                      ]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Minute Chips */}
            <Text style={styles.timeSectionSubtitle}>Minute</Text>
            <View style={styles.minutesRow}>
              {QUICK_MINUTES.map(m => {
                const isActive = tempMinute === m;
                return (
                  <TouchableOpacity
                    key={`m-${m}`}
                    style={[
                      styles.minuteChip,
                      isActive && styles.minuteChipActive,
                    ]}
                    onPress={() => setTempMinute(m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.minuteChipText,
                        isActive && styles.minuteChipTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Modal Bottom Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalActionCancelBtn}
                onPress={() => setIsTimePickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalActionCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActionConfirmBtn,
                  isEventMode && { backgroundColor: CALENDAR_COLORS.eventPill },
                ]}
                onPress={confirmTime}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionConfirmText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Task;
