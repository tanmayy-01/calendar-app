import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CALENDAR_COLORS, ICON_NAMES } from '@/constants';
import { IconProvider } from '@/lib/icons';
import { scale } from '@/lib/scale';

interface CalendarHeaderProps {
  title: string;
  onPressMenu?: () => void;
  onPressSearch?: () => void;
  onPressToday?: () => void;
  onPressProfile?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = React.memo(
  ({ title, onPressMenu, onPressSearch, onPressToday, onPressProfile }) => {
    return (
      <View style={styles.container}>
        {/* Left Side: Hamburger Menu & Month Title */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressMenu}
            activeOpacity={0.7}
            accessibilityLabel="Open navigation menu"
          >
            <IconProvider
              name={ICON_NAMES.MENU}
              size={scale.ms(24)}
              color={CALENDAR_COLORS.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* Right Side: Search, Today Jump, Profile Avatar */}
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressSearch}
            activeOpacity={0.7}
            accessibilityLabel="Search events"
          >
            <IconProvider
              name={ICON_NAMES.SEARCH}
              size={scale.ms(22)}
              color={CALENDAR_COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onPressToday}
            activeOpacity={0.7}
            accessibilityLabel="Jump to today"
          >
            <IconProvider
              name={ICON_NAMES.CALENDAR}
              size={scale.ms(22)}
              color={CALENDAR_COLORS.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onPressProfile}
            activeOpacity={0.8}
            accessibilityLabel="User profile"
          >
            <View style={styles.avatarPlaceholder}>
              <IconProvider
                name={ICON_NAMES.PERSON}
                size={scale.ms(26)}
                color={CALENDAR_COLORS.todayBadge}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

CalendarHeader.displayName = 'CalendarHeader';

const styles = StyleSheet.create({
  container: {
    height: scale.h(56),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.w(12),
    backgroundColor: CALENDAR_COLORS.headerBackground,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    fontSize: scale.ms(18),
    fontWeight: '600',
    color: CALENDAR_COLORS.textPrimary,
    marginLeft: scale.w(10),
    letterSpacing: 0.2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale.w(6),
  },
  iconButton: {
    width: scale.w(38),
    height: scale.w(38),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale.w(19),
  },
  avatarButton: {
    marginLeft: scale.w(4),
  },
  avatarPlaceholder: {
    width: scale.w(32),
    height: scale.w(32),
    borderRadius: scale.w(16),
    backgroundColor: CALENDAR_COLORS.surface,
    borderWidth: 1.5,
    borderColor: CALENDAR_COLORS.avatarBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
