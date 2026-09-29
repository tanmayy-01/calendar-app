import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CALENDAR_COLORS } from '@/constants';
import { scale } from '@/lib/scale';

interface AddEventModalProps {
  visible: boolean;
  selectedDateString: string;
  onClose: () => void;
  onAddEvent: (title: string, dateString: string) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  visible,
  selectedDateString,
  onClose,
  onAddEvent,
}) => {
  const [title, setTitle] = useState('');

  const handleSave = () => {
    if (title.trim()) {
      onAddEvent(title.trim(), selectedDateString);
      setTitle('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.modalTitle}>Add Event</Text>
          <Text style={styles.dateSubtitle}>{selectedDateString}</Text>

          <TextInput
            style={styles.input}
            placeholder="Event title (e.g. Meeting, Birthday)"
            placeholderTextColor={CALENDAR_COLORS.textDimmed}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.saveBtn]}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale.w(24),
  },
  card: {
    width: '100%',
    backgroundColor: CALENDAR_COLORS.surface,
    borderRadius: scale.ms(16),
    padding: scale.w(20),
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.gridBorder,
  },
  modalTitle: {
    fontSize: scale.ms(18),
    fontWeight: '700',
    color: CALENDAR_COLORS.textPrimary,
  },
  dateSubtitle: {
    fontSize: scale.ms(13),
    color: CALENDAR_COLORS.todayBadge,
    marginTop: scale.h(4),
    marginBottom: scale.h(16),
  },
  input: {
    backgroundColor: CALENDAR_COLORS.background,
    borderRadius: scale.ms(8),
    paddingHorizontal: scale.w(12),
    paddingVertical: scale.h(10),
    color: CALENDAR_COLORS.textPrimary,
    fontSize: scale.ms(14),
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.gridBorder,
    marginBottom: scale.h(20),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: scale.w(12),
  },
  btn: {
    paddingVertical: scale.h(8),
    paddingHorizontal: scale.w(16),
    borderRadius: scale.ms(8),
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
  cancelBtnText: {
    color: CALENDAR_COLORS.textSecondary,
    fontSize: scale.ms(14),
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: CALENDAR_COLORS.todayBadge,
  },
  saveBtnText: {
    color: CALENDAR_COLORS.todayText,
    fontSize: scale.ms(14),
    fontWeight: '700',
  },
});
