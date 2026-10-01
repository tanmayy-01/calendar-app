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
  ICON_NAMES,
  REPEAT_CHOICES,
} from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';
import { RepeatOption, UserTask, TaskScreenRouteProp } from '@/types';
import { formatDateString, formatDisplayDate } from '@/utils';
import { saveTask } from '@/services/taskStorage';
import { styles } from './Task.styles';
import * as navigation from '@/utils';

function parseTimeString(timeStr: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: Math.max(1, Math.min(12, parseInt(match[1], 10))),
      minute: Math.max(0, Math.min(59, parseInt(match[2], 10))),
      period: match[3].toUpperCase() as 'AM' | 'PM',
    };
  }
  return { hour: 10, minute: 0, period: 'AM' };
}

function formatTimeString(
  hour: number | string,
  minute: number | string,
  period: 'AM' | 'PM',
): string {
  const h = Math.max(1, Math.min(12, Number(hour) || 12));
  const m = Math.max(0, Math.min(59, Number(minute) || 0));
  return `${h}:${String(m).padStart(2, '0')} ${period}`;
}

function getInitialTime(): string {
  const now = new Date();
  const nextHour = now.getHours() + 1;
  const period: 'AM' | 'PM' = nextHour >= 12 && nextHour < 24 ? 'PM' : 'AM';
  const hour12 = nextHour % 12 === 0 ? 12 : nextHour % 12;
  return `${hour12}:00 ${period}`;
}

const QUICK_TIME_PRESETS = [
  '09:00 AM',
  '10:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '06:00 PM',
  '08:00 PM',
];

const QUICK_MINUTES = [0, 15, 30, 45];
const HOURS_LIST = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const Task: React.FC = () => {
  const route = useRoute<TaskScreenRouteProp>();

  // Today's date string (YYYY-MM-DD)
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
  const [isAllDay, setIsAllDay] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');

  // Time state for when isAllDay is false
  const [selectedTime, setSelectedTime] = useState<string>(getInitialTime);
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  // Time picker modal temporary states
  const [tempHour, setTempHour] = useState<number>(
    () => parseTimeString(selectedTime).hour,
  );
  const [tempMinute, setTempMinute] = useState<number>(
    () => parseTimeString(selectedTime).minute,
  );
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(
    () => parseTimeString(selectedTime).period,
  );

  const openTimePicker = useCallback(() => {
    const parsed = parseTimeString(selectedTime);
    setTempHour(parsed.hour);
    setTempMinute(parsed.minute);
    setTempPeriod(parsed.period);
    setIsTimePickerVisible(true);
  }, [selectedTime]);

  const confirmTime = useCallback(() => {
    const formatted = formatTimeString(tempHour, tempMinute, tempPeriod);
    setSelectedTime(formatted);
    setIsTimePickerVisible(false);
  }, [tempHour, tempMinute, tempPeriod]);

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isRepeatPickerVisible, setIsRepeatPickerVisible] = useState(false);

  const canSave = title.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }

    const dateStr = formatDateString(selectedDate);
    if (dateStr < todayStr) {
      Alert.alert(
        'Invalid Date',
        'Tasks can only be scheduled for today or future dates.',
      );
      return;
    }

    const doesNotRepeat = repeatOption === 'none';

    const newTask: UserTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      date: dateStr,
      time: isAllDay ? undefined : selectedTime,
      isAllDay,
      doesNotRepeat,
      repeatOption,
      createdAt: Date.now(),
    };

    await saveTask(newTask);
    navigation.goBack();
  }, [title, description, selectedDate, todayStr, isAllDay, selectedTime, repeatOption]);

  const selectedDateStr = useMemo(
    () => formatDateString(selectedDate),
    [selectedDate],
  );

  return (
    <View style={styles.container}>
      <View style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Close task screen"
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
            accessibilityLabel="Save task"
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
              placeholder="Add title"
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
                  color={CALENDAR_COLORS.textSecondary}
                />
                <View style={styles.blueDotBadge} />
              </View>
            </View>

            <View style={styles.contentColumn}>
              <Text style={styles.accountCategoryText}>Tasks</Text>
              <Text style={styles.accountEmailText}>
                tanmayshende007@gmail.com
              </Text>
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
                placeholder="Add details"
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
                  openTimePicker();
                }
              }}
              trackColor={{
                false: CALENDAR_COLORS.surface,
                true: CALENDAR_COLORS.todayBadge,
              }}
              thumbColor={
                isAllDay
                  ? CALENDAR_COLORS.todayText
                  : CALENDAR_COLORS.textDimmed
              }
            />
          </View>

          {/* Date & Time Row */}
          {isAllDay ? (
            <TouchableOpacity
              style={styles.dateIndentedRow}
              onPress={() => setIsDatePickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.dateDisplayText}>
                {formatDisplayDate(selectedDate)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => setIsDatePickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.dateDisplayText}>
                  {formatDisplayDate(selectedDate)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeChip}
                onPress={openTimePicker}
                activeOpacity={0.7}
              >
                <IconProvider
                  name={ICON_NAMES.TIME}
                  size={scale.ms(16)}
                  color={CALENDAR_COLORS.todayBadge}
                />
                <Text style={styles.timeChipText}>{selectedTime}</Text>
              </TouchableOpacity>
            </View>
          )}

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
              {repeatOption === 'none' && (
                <Text style={styles.autoDeleteHint}>
                  Auto-deletes when date arrives
                </Text>
              )}
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
                      color={CALENDAR_COLORS.todayBadge}
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
              current={selectedDateStr}
              minDate={todayStr}
              disableAllTouchEventsForDisabledDays={true}
              onDayPress={(day: DateData) => {
                if (day.dateString < todayStr) return;
                const parts = day.dateString.split('-').map(Number);
                setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
                setIsDatePickerVisible(false);
              }}
              markedDates={{
                [selectedDateStr]: {
                  selected: true,
                  selectedColor: CALENDAR_COLORS.todayBadge,
                  selectedTextColor: CALENDAR_COLORS.todayText,
                },
              }}
              enableSwipeMonths={true}
              theme={{
                backgroundColor: CALENDAR_COLORS.surface,
                calendarBackground: CALENDAR_COLORS.surface,
                textSectionTitleColor: CALENDAR_COLORS.textDimmed,
                selectedDayBackgroundColor: CALENDAR_COLORS.todayBadge,
                selectedDayTextColor: CALENDAR_COLORS.todayText,
                todayTextColor: CALENDAR_COLORS.todayBadge,
                dayTextColor: CALENDAR_COLORS.textPrimary,
                textDisabledColor: CALENDAR_COLORS.textDimmed,
                monthTextColor: CALENDAR_COLORS.textPrimary,
                arrowColor: CALENDAR_COLORS.todayBadge,
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
            <Text style={styles.modalHeaderTitle}>Select time</Text>

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
            <View style={styles.quickChipsRow}>
              {QUICK_MINUTES.map(m => {
                const isActive = tempMinute === m;
                return (
                  <TouchableOpacity
                    key={`m-${m}`}
                    style={[
                      styles.quickChip,
                      isActive && styles.quickChipActive,
                    ]}
                    onPress={() => setTempMinute(m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.quickChipText,
                        isActive && styles.quickChipTextActive,
                      ]}
                    >
                      :{String(m).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalActionCancelBtn}
                onPress={() => setIsTimePickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalActionCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalActionConfirmBtn}
                onPress={confirmTime}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionConfirmText}>Set time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Task;
