import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import {
  CALENDAR_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ICON_NAMES,
} from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';
import { CreateActionModalProps } from '@/types';

export const CreateActionModal: React.FC<CreateActionModalProps> = React.memo(
  ({ visible, onClose, onPressTask, onPressEvent, useModal = true }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const taskSlideAnim = useRef(new Animated.Value(20)).current;
    const taskScaleAnim = useRef(new Animated.Value(0.85)).current;
    const eventSlideAnim = useRef(new Animated.Value(15)).current;
    const eventScaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(taskSlideAnim, {
            toValue: 0,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(taskScaleAnim, {
            toValue: 1,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(eventSlideAnim, {
            toValue: 0,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(eventScaleAnim, {
            toValue: 1,
            tension: 70,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        fadeAnim.setValue(0);
        taskSlideAnim.setValue(20);
        taskScaleAnim.setValue(0.85);
        eventSlideAnim.setValue(15);
        eventScaleAnim.setValue(0.9);
      }
    }, [
      visible,
      fadeAnim,
      taskSlideAnim,
      taskScaleAnim,
      eventSlideAnim,
      eventScaleAnim,
    ]);

    const handleDismiss = useCallback(
      (callback?: () => void) => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }).start(() => {
          if (callback) {
            callback();
          } else {
            onClose();
          }
        });
      },
      [fadeAnim, onClose],
    );

    const handleTaskPress = useCallback(() => {
      handleDismiss(onPressTask);
    }, [handleDismiss, onPressTask]);

    const handleEventPress = useCallback(() => {
      handleDismiss(onPressEvent);
    }, [handleDismiss, onPressEvent]);

    if (!visible) return null;

    const modalContent = (
      <TouchableWithoutFeedback onPress={() => handleDismiss()}>
        <Animated.View
          style={[
            styles.backdrop,
            !useModal && styles.inlineBackdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Speed dial action buttons on the bottom-right */}
          <View style={styles.actionsContainer} pointerEvents="box-none">
            {/* Task Row */}
            <Animated.View
              style={[
                styles.actionRow,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: taskSlideAnim },
                    { scale: taskScaleAnim },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTaskPress}
                style={styles.labelTouchable}
              >
                <Text style={styles.labelText}>Task</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleTaskPress}
                style={[styles.actionButton, styles.taskButton]}
                accessibilityLabel="Create a new task"
                accessibilityRole="button"
              >
                <IconProvider
                  name={ICON_NAMES.CHECKMARK_CIRCLE}
                  size={scale.ms(26)}
                  color={CALENDAR_COLORS.fabIcon}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Event Row */}
            <Animated.View
              style={[
                styles.actionRow,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: eventSlideAnim },
                    { scale: eventScaleAnim },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEventPress}
                style={styles.labelTouchable}
              >
                <Text style={styles.labelText}>Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEventPress}
                style={[styles.actionButton, styles.eventButton]}
                accessibilityLabel="Create a new event"
                accessibilityRole="button"
              >
                <IconProvider
                  name={ICON_NAMES.CALENDAR_SOLID}
                  size={scale.ms(24)}
                  color={CALENDAR_COLORS.todayText}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );

    if (!useModal) {
      return modalContent;
    }

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => handleDismiss()}
      >
        {modalContent}
      </Modal>
    );
  },
);

CreateActionModal.displayName = 'CreateActionModal';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.overlay_2,
    justifyContent: 'flex-end',
  },
  inlineBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  actionsContainer: {
    position: 'absolute',
    right: scale.w(18),
    bottom: scale.h(24),
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: scale.h(16),
  },
  labelTouchable: {
    paddingVertical: scale.h(6),
    paddingHorizontal: scale.w(8),
  },
  labelText: {
    color: CALENDAR_COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    marginRight: scale.w(8),
    ...Platform.select({
      ios: {
        shadowColor: CALENDAR_COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 3,
      },
      android: {
        textShadowColor: CALENDAR_COLORS.shadow,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
    }),
  },
  actionButton: {
    width: scale.w(56),
    height: scale.w(56),
    borderRadius: scale.ms(16),
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: CALENDAR_COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  taskButton: {
    backgroundColor: CALENDAR_COLORS.task_btn_background,
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.task_btn_border,
  },
  eventButton: {
    backgroundColor: CALENDAR_COLORS.todayBadge,
  },
});
