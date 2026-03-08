import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { CalendarMonthPicker } from '@/features/home/components/CalendarMonthPicker';
import { HomeCalendarGrid } from '@/features/home/components/HomeCalendarGrid';
import { HomeCalendarHeader } from '@/features/home/components/HomeCalendarHeader';
import {
  addCalendarMonths,
  isFutureCalendarMonth,
  parseDateKey,
  startOfCalendarMonth,
  type CalendarDayCell,
} from '@/features/home/lib/calendar';
import { getMonthlyDiaries } from '@/lib/api/diaries';
import { getProfileInfo } from '@/lib/api/profile';
import type { AuthUser } from '@/types/auth';
import type { MonthlyDiary } from '@/types/diary';
import { colors, radius, shadows, spacing, typography } from '@/theme';

const TODAY = new Date();

function getInitialDate(dateParam?: string) {
  if (!dateParam) {
    return startOfCalendarMonth(TODAY);
  }

  const parsedDate = parseDateKey(dateParam);
  if (parsedDate) {
    return startOfCalendarMonth(parsedDate);
  }

  const isoDate = new Date(dateParam);
  if (!Number.isNaN(isoDate.getTime())) {
    return startOfCalendarMonth(isoDate);
  }

  return startOfCalendarMonth(TODAY);
}

export function ProfileCalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string; date?: string; diaryId?: string }>();
  const profileUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const dateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const diaryIdParam = Array.isArray(params.diaryId) ? params.diaryId[0] : params.diaryId;
  const [currentDate, setCurrentDate] = useState(() => getInitialDate(dateParam));
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const handledDiaryIdRef = useRef<string | null>(null);

  useEffect(() => {
    setCurrentDate(getInitialDate(dateParam));
  }, [dateParam]);

  useEffect(() => {
    if (!profileUserId || !diaryIdParam || handledDiaryIdRef.current === diaryIdParam) {
      return;
    }

    handledDiaryIdRef.current = diaryIdParam;
    router.replace({
      pathname: '/profile/[userId]/calendar',
      params: dateParam
        ? {
            userId: profileUserId,
            date: dateParam,
          }
        : {
            userId: profileUserId,
          },
    });
    router.push({
      pathname: '/diary/story',
      params: { id: diaryIdParam },
    });
  }, [dateParam, diaryIdParam, profileUserId, router]);

  const profileQuery = useQuery({
    queryKey: ['profile-calendar-user', profileUserId],
    enabled: Boolean(profileUserId),
    queryFn: () => getProfileInfo(profileUserId as string),
  });

  const monthYear = currentDate.getFullYear();
  const monthNumber = currentDate.getMonth() + 1;
  const monthlyDiariesQuery = useQuery({
    queryKey: ['profile-calendar-monthly-diaries', profileUserId, monthYear, monthNumber],
    enabled: Boolean(profileUserId),
    queryFn: () => getMonthlyDiaries(profileUserId as string, monthYear, monthNumber),
    placeholderData: (previousData) => previousData,
  });

  const diariesByDate = useMemo(() => {
    return (monthlyDiariesQuery.data ?? []).reduce<Record<string, MonthlyDiary>>((accumulator, diary) => {
      accumulator[diary.date] = diary;
      return accumulator;
    }, {});
  }, [monthlyDiariesQuery.data]);

  const viewedUser = useMemo<AuthUser | null>(() => {
    if (!profileQuery.data) {
      return null;
    }

    return {
      id: profileQuery.data.userId,
      email: '',
      nickname: profileQuery.data.nickname,
      avatar: profileQuery.data.avatar,
    };
  }, [profileQuery.data]);

  const handlePressDay = (day: CalendarDayCell) => {
    if (!day.isCurrentMonth) {
      const targetMonth = startOfCalendarMonth(day.date);
      if (isFutureCalendarMonth(targetMonth, TODAY)) {
        return;
      }

      setCurrentDate(targetMonth);
      return;
    }

    if (day.isFuture) {
      return;
    }

    const diary = diariesByDate[day.dateKey];
    if (!diary) {
      return;
    }

    router.push({
      pathname: '/diary/story',
      params: { id: String(diary.diaryId) },
    });
  };

  if (!profileUserId) {
    return (
      <ScreenContainer>
        <ErrorState title="프로필 캘린더를 불러올 수 없습니다." />
      </ScreenContainer>
    );
  }

  if (profileQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          description={profileQuery.error instanceof Error ? profileQuery.error.message : undefined}
          onPressAction={() => {
            void profileQuery.refetch();
          }}
          title="사용자 정보를 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  if (profileQuery.isPending || !viewedUser) {
    return (
      <ScreenContainer>
        <LoadingState label="프로필 캘린더를 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  const emptyStateText = !monthlyDiariesQuery.isPending && (monthlyDiariesQuery.data?.length ?? 0) === 0
    ? `${viewedUser.nickname}님의 이 달 기록이 없습니다.`
    : null;

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <HomeCalendarHeader
        currentDate={currentDate}
        onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
        user={viewedUser}
      />

      {monthlyDiariesQuery.isError ? (
        <View style={styles.stateBlock}>
          <ErrorState
            description={
              monthlyDiariesQuery.error instanceof Error
                ? monthlyDiariesQuery.error.message
                : '월별 기록을 불러오지 못했습니다.'
            }
            onPressAction={() => {
              void monthlyDiariesQuery.refetch();
            }}
            title="캘린더를 불러오지 못했습니다."
          />
        </View>
      ) : (
        <View style={styles.calendarSection}>
          <HomeCalendarGrid
            currentDate={currentDate}
            diariesByDate={diariesByDate}
            emptyStateText={emptyStateText}
            isOwnCalendar={false}
            onPressDay={handlePressDay}
            onSwipeMonth={(direction) => {
              const targetMonth = startOfCalendarMonth(
                addCalendarMonths(currentDate, direction === 'next' ? 1 : -1),
              );
              if (isFutureCalendarMonth(targetMonth, TODAY)) {
                return;
              }

              setCurrentDate(targetMonth);
            }}
            viewedUserName={viewedUser.nickname}
          />
        </View>
      )}

      <CalendarMonthPicker
        currentDate={currentDate}
        onClose={() => setIsMonthPickerVisible(false)}
        onConfirm={(nextDate) => setCurrentDate(startOfCalendarMonth(nextDate))}
        visible={isMonthPickerVisible}
      />

      {monthlyDiariesQuery.isPending || monthlyDiariesQuery.isFetching ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingLabel}>캘린더를 불러오는 중입니다.</Text>
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  stateBlock: {
    flex: 1,
  },
  calendarSection: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: spacing['3xl'],
    left: spacing['2xl'],
    right: spacing['2xl'],
    alignItems: 'center',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  loadingLabel: {
    ...typography.caption,
    color: colors.text,
  },
});
