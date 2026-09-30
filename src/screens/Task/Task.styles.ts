import { StyleSheet, Platform } from 'react-native';
import { CALENDAR_COLORS, FONT_SIZES, FONT_WEIGHTS } from '@/constants';
import { scale } from '@/lib/scale';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.w(16),
    paddingTop: scale.h(8),
    paddingBottom: scale.h(12),
  },
  closeButton: {
    width: scale.w(40),
    height: scale.w(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale.w(20),
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronHandle: {
    width: scale.w(32),
    height: scale.h(4),
    borderRadius: scale.h(2),
    backgroundColor: CALENDAR_COLORS.gridBorder,
  },
  saveButton: {
    paddingHorizontal: scale.w(18),
    paddingVertical: scale.h(7),
    borderRadius: scale.ms(18),
    backgroundColor: CALENDAR_COLORS.todayBadge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: CALENDAR_COLORS.surface,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: CALENDAR_COLORS.todayText,
  },
  saveButtonTextDisabled: {
    color: CALENDAR_COLORS.textDimmed,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scale.h(40),
  },
  titleSection: {
    paddingHorizontal: scale.w(20),
    paddingTop: scale.h(8),
    paddingBottom: scale.h(16),
  },
  titleInput: {
    fontSize: scale.ms(22),
    fontWeight: FONT_WEIGHTS.medium,
    color: CALENDAR_COLORS.textPrimary,
    padding: 0,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: CALENDAR_COLORS.gridBorder,
    marginVertical: scale.h(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale.w(20),
    paddingVertical: scale.h(14),
  },
  rowTopAlign: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: scale.w(20),
    paddingVertical: scale.h(12),
  },
  iconColumn: {
    width: scale.w(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    marginLeft: scale.w(8),
  },
  accountCategoryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: CALENDAR_COLORS.textPrimary,
  },
  accountEmailText: {
    fontSize: FONT_SIZES.xs,
    color: CALENDAR_COLORS.textSecondary,
    marginTop: scale.h(2),
  },
  blueDotBadge: {
    position: 'absolute',
    bottom: -scale.h(1),
    right: -scale.w(1),
    width: scale.w(8),
    height: scale.w(8),
    borderRadius: scale.w(4),
    backgroundColor: CALENDAR_COLORS.blue_dot_background,
    borderWidth: 1.5,
    borderColor: CALENDAR_COLORS.background,
  },
  descriptionInput: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: CALENDAR_COLORS.textPrimary,
    padding: 0,
    minHeight: scale.h(32),
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale.w(20),
    paddingVertical: scale.h(12),
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: FONT_SIZES.md,
    color: CALENDAR_COLORS.textPrimary,
    marginLeft: scale.w(8),
  },
  dateIndentedRow: {
    paddingLeft: scale.w(64),
    paddingRight: scale.w(20),
    paddingVertical: scale.h(8),
  },
  dateDisplayText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: CALENDAR_COLORS.textPrimary,
  },
  repeatRowContent: {
    flex: 1,
    marginLeft: scale.w(8),
  },
  repeatText: {
    fontSize: FONT_SIZES.md,
    color: CALENDAR_COLORS.textPrimary,
  },
  autoDeleteHint: {
    fontSize: scale.ms(11),
    color: CALENDAR_COLORS.todayBadge,
    marginTop: scale.h(2),
  },
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: CALENDAR_COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale.w(24),
  },
  modalCard: {
    width: '100%',
    backgroundColor: CALENDAR_COLORS.surface,
    borderRadius: scale.ms(16),
    padding: scale.w(20),
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.gridBorder,
    ...Platform.select({
      ios: {
        shadowColor: CALENDAR_COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeaderTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: CALENDAR_COLORS.textPrimary,
    marginBottom: scale.h(16),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale.h(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CALENDAR_COLORS.gridBorder,
  },
  optionLabel: {
    fontSize: FONT_SIZES.sm,
    color: CALENDAR_COLORS.textPrimary,
  },
  optionLabelSelected: {
    color: CALENDAR_COLORS.todayBadge,
    fontWeight: FONT_WEIGHTS.bold,
  },
  optionSubtitle: {
    fontSize: scale.ms(11),
    color: CALENDAR_COLORS.textSecondary,
    marginTop: scale.h(2),
  },
  optionTextWrapper: {
    flex: 1,
  },
  calendarModalCard: {
    width: '100%',
    backgroundColor: CALENDAR_COLORS.surface,
    borderRadius: scale.ms(16),
    padding: scale.w(10),
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.gridBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: CALENDAR_COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});