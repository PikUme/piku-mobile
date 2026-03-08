import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ErrorState } from '@/components/ui/ErrorState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { CalendarMonthPicker } from '@/features/home/components/CalendarMonthPicker';
import { HomeCalendarGrid } from '@/features/home/components/HomeCalendarGrid';
import { HomeCalendarHeader } from '@/features/home/components/HomeCalendarHeader';
import { FeedScreen } from '@/features/feed/screens/FeedScreen';
import {
  addCalendarMonths,
  isFutureCalendarMonth,
  startOfCalendarMonth,
  type CalendarDayCell,
} from '@/features/home/lib/calendar';
import { getMonthlyDiaries } from '@/lib/api/diaries';
import { getAllFriends } from '@/lib/api/friends';
import { useAuthStore } from '@/store/authStore';
import type { MonthlyDiary } from '@/types/diary';
import { colors, radius, shadows, spacing, typography } from '@/theme';

const TODAY = new Date();
const FRIEND_SWIPE_THRESHOLD = 44;

export function HomeScreen() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const [currentDate, setCurrentDate] = useState(() => startOfCalendarMonth(TODAY));
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [viewedFriendIndex, setViewedFriendIndex] = useState<number | null>(null);

  const monthYear = currentDate.getFullYear();
  const monthNumber = currentDate.getMonth() + 1;
  const friendsQuery = useQuery({
    queryKey: ['home-calendar-friends', user?.id],
    queryFn: () => getAllFriends(),
    enabled: isLoggedIn && Boolean(user?.id),
  });
  const friends = friendsQuery.data ?? [];
  const viewedFriend = viewedFriendIndex !== null ? friends[viewedFriendIndex] : null;
  const viewedUser = viewedFriend
    ? {
        id: viewedFriend.userId,
        email: '',
        nickname: viewedFriend.nickname,
        avatar: viewedFriend.avatar,
      }
    : user;
  const isOwnCalendar = viewedFriend === null;
  const canSwipeFriends = friends.length > 0;

  const monthlyDiariesQuery = useQuery({
    queryKey: ['monthly-diaries', viewedUser?.id, monthYear, monthNumber],
    queryFn: () => getMonthlyDiaries(viewedUser?.id ?? '', monthYear, monthNumber),
    enabled: isLoggedIn && Boolean(viewedUser?.id),
    placeholderData: (previousData) => previousData,
  });

  const diariesByDate = useMemo(() => {
    return (monthlyDiariesQuery.data ?? []).reduce<Record<string, MonthlyDiary>>(
      (accumulator, diary) => {
        accumulator[diary.date] = diary;
        return accumulator;
      },
      {},
    );
  }, [monthlyDiariesQuery.data]);

  useEffect(() => {
    if (viewedFriendIndex === null) {
      return;
    }

    if (viewedFriendIndex >= friends.length) {
      setViewedFriendIndex(null);
    }
  }, [friends.length, viewedFriendIndex]);

  const handleNextFriend = useCallback(() => {
    if (!canSwipeFriends) {
      return;
    }

    setViewedFriendIndex((previousIndex) => {
      if (previousIndex === null) {
        return 0;
      }

      if (previousIndex === friends.length - 1) {
        return null;
      }

      return previousIndex + 1;
    });
  }, [canSwipeFriends, friends.length]);

  const handlePreviousFriend = useCallback(() => {
    if (!canSwipeFriends) {
      return;
    }

    setViewedFriendIndex((previousIndex) => {
      if (previousIndex === null) {
        return friends.length - 1;
      }

      if (previousIndex === 0) {
        return null;
      }

      return previousIndex - 1;
    });
  }, [canSwipeFriends, friends.length]);

  const friendSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            canSwipeFriends &&
            Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
            Math.abs(gestureState.dy) > 14
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy <= -FRIEND_SWIPE_THRESHOLD) {
            handleNextFriend();
            return;
          }

          if (gestureState.dy >= FRIEND_SWIPE_THRESHOLD) {
            handlePreviousFriend();
          }
        },
      }),
    [canSwipeFriends, handleNextFriend, handlePreviousFriend],
  );

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
    if (diary) {
      router.push({
        pathname: '/diary/story',
        params: { id: String(diary.diaryId) },
      });
      return;
    }

    if (!isOwnCalendar) {
      return;
    }

    router.push({
      pathname: '/compose',
      params: { date: day.dateKey },
    });
  };

  if (!isLoggedIn || !user) {
    return <FeedScreen entryPoint="home" />;
  }

  const activeUser = viewedUser ?? user;
  const emptyStateText = !monthlyDiariesQuery.isPending && (monthlyDiariesQuery.data?.length ?? 0) === 0
    ? isOwnCalendar
      ? '지난 날짜를 눌러 첫 기록을 남길 수 있습니다.'
      : '친구의 이 달 기록이 없습니다.'
    : null;

  return (
    <ScreenContainer contentStyle={styles.screenContent}>
      <View {...friendSwipeResponder.panHandlers} style={styles.swipeArea} testID="home-swipe-area">
        <HomeCalendarHeader
          canCycleFriends={canSwipeFriends}
          currentDate={currentDate}
          onNextFriend={handleNextFriend}
          onOpenMonthPicker={() => setIsMonthPickerVisible(true)}
          onPrevFriend={handlePreviousFriend}
          user={activeUser}
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
              isOwnCalendar={isOwnCalendar}
              viewedUserName={activeUser.nickname}
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
            />
          </View>
        )}
      </View>

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
  calendarSection: {
    flex: 1,
    gap: spacing.md,
  },
  stateBlock: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 254, 248, 0.74)',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  loadingLabel: {
    ...typography.caption,
    color: colors.text,
  },
  swipeArea: {
    flex: 1,
  },
  screenContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
