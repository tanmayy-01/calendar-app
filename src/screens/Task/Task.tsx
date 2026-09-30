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

const Task: React.FC = () => {
  const route = useRoute<TaskScreenRouteProp>();

  // Initialize date from route params or fallback to current local time
  const initialDate = useMemo(() => {
    const param = route.params?.selectedDateString;
    if (param) {
      const parts = param.split('-').map(Number);
      if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  }, [route.params?.selectedDateString]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [repeatOption, setRepeatOption] = useState<RepeatOption>('none');

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isRepeatPickerVisible, setIsRepeatPickerVisible] = useState(false);

  const canSave = title.trim().length > 0;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }

    const dateStr = formatDateString(selectedDate);
    const doesNotRepeat = repeatOption === 'none';

    const newTask: UserTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim(),
      date: dateStr,
      isAllDay,
      doesNotRepeat,
      repeatOption,
      createdAt: Date.now(),
    };

    await saveTask(newTask);
    navigation.goBack();
  }, [title, description, selectedDate, isAllDay, repeatOption, navigation]);

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

          <View style={styles.headerCenter}>
            <View style={styles.chevronHandle} />
          </View>

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
              onValueChange={setIsAllDay}
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

          {/* Date Picker */}
          <TouchableOpacity
            style={styles.dateIndentedRow}
            onPress={() => setIsDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dateDisplayText}>
              {formatDisplayDate(selectedDate)}
            </Text>
          </TouchableOpacity>

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
              onDayPress={(day: DateData) => {
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
    </View>
  );
};

export default Task;
