import { useMemo, useRef, useState } from 'react';
import {
  Image,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  type CalendarDayCell,
  createCalendarMonthDays,
  getCalendarDayNames,
  isFutureCalendarMonth,
} from '@/features/home/lib/calendar';
import type { MonthlyDiary } from '@/types/diary';
import { colors, radius, spacing, typography } from '@/theme';

interface HomeCalendarGridProps {
  currentDate: Date;
  today?: Date;
  diariesByDate: Record<string, MonthlyDiary>;
  onPressDay: (day: CalendarDayCell) => void;
  onSwipeMonth: (direction: 'prev' | 'next') => void;
  isOwnCalendar: boolean;
  viewedUserName: string;
  emptyStateText?: string | null;
}

const SWIPE_THRESHOLD = 40;

function ThumbnailFallback({ day }: { day: number }) {
  return (
    <View style={styles.thumbnailFallback}>
      <Text style={styles.thumbnailFallbackLabel}>{day}일</Text>
      <Text style={styles.thumbnailFallbackCaption}>기록</Text>
    </View>
  );
}

export function HomeCalendarGrid({
  currentDate,
  today = new Date(),
  diariesByDate,
  onPressDay,
  onSwipeMonth,
  isOwnCalendar,
  viewedUserName,
  emptyStateText,
}: HomeCalendarGridProps) {
  const calendarDays = useMemo(
    () => createCalendarMonthDays(currentDate, today),
    [currentDate, today],
  );
  const dayNames = useMemo(() => getCalendarDayNames(), []);
  const swipeLockRef = useRef(false);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [dayNameRowHeight, setDayNameRowHeight] = useState(0);
  const rowCount = Math.ceil(calendarDays.length / 7);
  const cellGapTotal = spacing.xs * 6;
  const availableWidth = wrapperWidth > 0 ? wrapperWidth : 7 * 44 + cellGapTotal;
  const availableHeight = Math.max(
    0,
    wrapperHeight - dayNameRowHeight - spacing.sm,
  );
  const rowGapTotal = spacing.xs * Math.max(0, rowCount - 1);
  const cellWidth = Math.max(40, Math.floor((availableWidth - cellGapTotal) / 7));
  const cellHeight = Math.max(
    48,
    Math.floor((Math.max(availableHeight - rowGapTotal, 0) || cellWidth * rowCount) / rowCount),
  );

  const handleWrapperLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setWrapperWidth(width);
    setWrapperHeight(height);
  };

  const handleDayNameRowLayout = (event: LayoutChangeEvent) => {
    setDayNameRowHeight(event.nativeEvent.layout.height);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
            Math.abs(gestureState.dx) > 12
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (swipeLockRef.current) {
            swipeLockRef.current = false;
            return;
          }

          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            onSwipeMonth('next');
            swipeLockRef.current = true;
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD) {
            onSwipeMonth('prev');
            swipeLockRef.current = true;
          }
        },
      }),
    [onSwipeMonth],
  );

  return (
    <View onLayout={handleWrapperLayout} style={styles.wrapper}>
      <View onLayout={handleDayNameRowLayout} style={styles.dayNameRow}>
        {dayNames.map((name) => (
          <Text key={name} style={styles.dayNameLabel}>
            {name}
          </Text>
        ))}
      </View>
      <View
        style={styles.grid}
        testID="home-calendar-grid"
        {...panResponder.panHandlers}>
        {calendarDays.map((day) => {
          const diary = diariesByDate[day.dateKey];
          const canCreate = isOwnCalendar && day.isCurrentMonth && !day.isFuture && !diary;
          const canView = Boolean(diary) && day.isCurrentMonth;
          const canMoveMonth = !day.isCurrentMonth && !isFutureCalendarMonth(day.date, today);
          const isInteractive = canCreate || canView || canMoveMonth;
          const shouldShowThumbnail = Boolean(diary) && day.isCurrentMonth;
          const testID = day.isCurrentMonth
            ? `home-calendar-current-day-${day.date.getDate()}`
            : `home-calendar-adjacent-day-${day.date.getMonth() + 1}-${day.date.getDate()}`;

          return (
            <Pressable
              key={day.dateKey}
              accessibilityLabel={`${viewedUserName} ${day.dateKey} ${diary ? '기록 있음' : '기록 없음'}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !isInteractive }}
              disabled={!isInteractive}
              onPress={() => onPressDay(day)}
              style={({ pressed }) => [
                styles.dayCell,
                {
                  width: cellWidth,
                  height: cellHeight,
                },
                !day.isCurrentMonth && styles.dayCellMuted,
                shouldShowThumbnail && styles.dayCellThumbnail,
                day.isToday && styles.dayCellToday,
                pressed && isInteractive ? styles.dayCellPressed : null,
              ]}
              testID={testID}>
              {shouldShowThumbnail ? (
                diary.coverPhotoUrl ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: diary.coverPhotoUrl }}
                    style={styles.thumbnailImage}
                  />
                ) : (
                  <ThumbnailFallback day={day.date.getDate()} />
                )
              ) : (
                <Text
                  style={[
                    styles.dayLabel,
                    day.date.getDay() === 0 && day.isCurrentMonth && !day.isFuture
                      ? styles.dayLabelSunday
                      : null,
                    day.date.getDay() === 6 && day.isCurrentMonth && !day.isFuture
                      ? styles.dayLabelSaturday
                      : null,
                    !day.isCurrentMonth && styles.dayLabelMuted,
                    day.isFuture && day.isCurrentMonth && styles.dayLabelFuture,
                  ]}>
                  {day.date.getDate()}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      {emptyStateText ? (
        <View pointerEvents="none" style={styles.emptyStateOverlay}>
          <Text style={styles.emptyStateLabel}>{emptyStateText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: spacing.sm,
  },
  dayNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  dayNameLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.caption,
    color: colors.mutedText,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignContent: 'flex-start',
  },
  dayCell: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dayCellThumbnail: {
    backgroundColor: colors.surfaceMuted,
  },
  dayCellMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  dayCellToday: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  dayCellPressed: {
    opacity: 0.86,
  },
  dayLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dayLabelSunday: {
    color: colors.danger,
  },
  dayLabelSaturday: {
    color: colors.primary,
  },
  dayLabelMuted: {
    color: colors.mutedText,
  },
  dayLabelFuture: {
    color: '#cbd5e1',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    gap: 2,
  },
  thumbnailFallbackLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  thumbnailFallbackCaption: {
    ...typography.caption,
    color: colors.primary,
  },
  emptyStateOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyStateLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 254, 248, 0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
});
