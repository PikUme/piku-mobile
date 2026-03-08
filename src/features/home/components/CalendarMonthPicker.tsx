import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  addCalendarMonths,
  formatFullMonthLabel,
  isFutureCalendarMonth,
  setCalendarYearMonth,
  startOfCalendarMonth,
} from '@/features/home/lib/calendar';
import { colors, radius, spacing, typography } from '@/theme';

interface CalendarMonthPickerProps {
  currentDate: Date;
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

export function CalendarMonthPicker({
  currentDate,
  visible,
  onClose,
  onConfirm,
}: CalendarMonthPickerProps) {
  const [draftDate, setDraftDate] = useState(currentDate);

  useEffect(() => {
    if (visible) {
      setDraftDate(currentDate);
    }
  }, [currentDate, visible]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index), []);
  const currentMonth = useMemo(() => startOfCalendarMonth(new Date()), []);
  const isNextYearDisabled = isFutureCalendarMonth(
    addCalendarMonths(draftDate, 12),
    currentMonth,
  );
  const isConfirmDisabled = isFutureCalendarMonth(draftDate, currentMonth);

  return (
    <BottomSheet
      description="이동할 년도와 월을 선택합니다."
      onClose={onClose}
      title="날짜 선택"
      visible={visible}>
      <View style={styles.content}>
        <View style={styles.yearRow}>
          <Pressable
            accessibilityLabel="이전 해"
            onPress={() => setDraftDate(addCalendarMonths(draftDate, -12))}
            style={({ pressed }) => [styles.yearButton, pressed && styles.pressed]}
            testID="home-month-picker-prev-year">
            <Ionicons color={colors.text} name="chevron-back" size={20} />
          </Pressable>
          <Text style={styles.yearLabel}>{formatFullMonthLabel(draftDate)}</Text>
          <Pressable
            accessibilityLabel="다음 해"
            disabled={isNextYearDisabled}
            onPress={() => setDraftDate(addCalendarMonths(draftDate, 12))}
            style={({ pressed }) => [
              styles.yearButton,
              isNextYearDisabled && styles.buttonDisabled,
              pressed && !isNextYearDisabled && styles.pressed,
            ]}
            testID="home-month-picker-next-year">
            <Ionicons color={colors.text} name="chevron-forward" size={20} />
          </Pressable>
        </View>

        <View style={styles.monthGrid}>
          {months.map((monthIndex) => {
            const isSelected = draftDate.getMonth() === monthIndex;
            const monthDate = setCalendarYearMonth(
              draftDate,
              draftDate.getFullYear(),
              monthIndex,
            );
            const isDisabled = isFutureCalendarMonth(monthDate, currentMonth);

            return (
              <Pressable
                key={monthIndex}
                accessibilityLabel={`${monthIndex + 1}월 선택`}
                disabled={isDisabled}
                onPress={() =>
                  setDraftDate(monthDate)
                }
                style={({ pressed }) => [
                  styles.monthButton,
                  isSelected && styles.monthButtonSelected,
                  isDisabled && styles.buttonDisabled,
                  pressed && !isDisabled && styles.pressed,
                ]}
                testID={`home-month-option-${monthIndex + 1}`}>
                <Text
                  style={[
                    styles.monthButtonLabel,
                    isSelected && styles.monthButtonLabelSelected,
                    isDisabled && styles.monthButtonLabelDisabled,
                  ]}>
                  {monthIndex + 1}월
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isConfirmDisabled}
          onPress={() => {
            onConfirm(draftDate);
            onClose();
          }}
          style={({ pressed }) => [
            styles.confirmButton,
            isConfirmDisabled && styles.buttonDisabled,
            pressed && !isConfirmDisabled && styles.pressed,
          ]}
          testID="home-month-picker-confirm">
          <Text style={styles.confirmLabel}>확인</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  yearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  yearLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.bodyStrong,
    color: colors.text,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthButton: {
    width: '22%',
    minWidth: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md,
  },
  monthButtonSelected: {
    backgroundColor: colors.black,
  },
  monthButtonLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  monthButtonLabelSelected: {
    color: colors.white,
  },
  monthButtonLabelDisabled: {
    color: '#94a3b8',
  },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.black,
    paddingVertical: spacing.lg,
  },
  confirmLabel: {
    ...typography.button,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.85,
  },
});
