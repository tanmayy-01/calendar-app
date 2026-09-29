import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CALENDAR_COLORS, ICON_NAMES } from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';
import { FloatingActionButtonProps } from '@/types';

export const FloatingActionButton: React.FC<FloatingActionButtonProps> =
  React.memo(({ onPress }) => {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel="Add new event"
      >
        <IconProvider
          name={ICON_NAMES.ADD}
          size={scale.ms(28)}
          color={CALENDAR_COLORS.fabIcon}
        />
      </TouchableOpacity>
    );
  });

FloatingActionButton.displayName = 'FloatingActionButton';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: scale.w(18),
    bottom: scale.h(24),
    width: scale.w(56),
    height: scale.w(56),
    borderRadius: scale.ms(16),
    backgroundColor: CALENDAR_COLORS.fabBackground,
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
        elevation: 6,
      },
    }),
  },
});
