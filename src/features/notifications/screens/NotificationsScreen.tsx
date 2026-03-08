import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/notifications';
import { showAlert } from '@/lib/ui/feedback';
import { useNotificationStore } from '@/store/notificationStore';
import type { Page } from '@/types/api';
import type { AppNotification } from '@/types/notification';
import { colors, radius, spacing, typography } from '@/theme';

const NOTIFICATION_PAGE_SIZE = 20;

function flattenNotificationPages(pages: Page<AppNotification>[] = []) {
  const notificationMap = new Map<number, AppNotification>();
  pages.forEach((page) => {
    page.content.forEach((notification) => {
      notificationMap.set(notification.id, notification);
    });
  });
  return Array.from(notificationMap.values());
}

function buildNotificationRoute(notification: AppNotification) {
  if (notification.diaryDate && notification.diaryUserId) {
    return {
      pathname: '/profile/[userId]/calendar' as const,
      params: notification.relatedDiaryId
        ? {
            userId: notification.diaryUserId,
            date: notification.diaryDate,
            diaryId: String(notification.relatedDiaryId),
          }
        : {
            userId: notification.diaryUserId,
            date: notification.diaryDate,
          },
    };
  }

  if (notification.diaryUserId) {
    return {
      pathname: '/profile/[userId]' as const,
      params: {
        userId: notification.diaryUserId,
      },
    };
  }

  return null;
}

export function NotificationsScreen() {
  const router = useRouter();
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [readIds, setReadIds] = useState<number[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [readingTargetId, setReadingTargetId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const notificationsQuery = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getNotifications(pageParam, NOTIFICATION_PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  });

  const notifications = useMemo(() => {
    const baseNotifications = flattenNotificationPages(notificationsQuery.data?.pages ?? []);
    return baseNotifications
      .filter((notification) => !deletedIds.includes(notification.id))
      .map((notification) => {
        if (readIds.includes(notification.id)) {
          return {
            ...notification,
            isRead: true,
          } satisfies AppNotification;
        }

        return notification;
      });
  }, [deletedIds, notificationsQuery.data?.pages, readIds]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead),
    [notifications],
  );

  useEffect(() => {
    setUnreadCount(unreadNotifications.length);
  }, [setUnreadCount, unreadNotifications.length]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const requestNextPage = () => {
    void (notificationsQuery.fetchNextPage as () => Promise<unknown>)();
  };

  const navigateFromNotification = (notification: AppNotification) => {
    const route = buildNotificationRoute(notification);
    if (!route) {
      return;
    }

    router.push(route);
  };

  const handlePressNotification = async (notification: AppNotification) => {
    if (notification.isRead) {
      navigateFromNotification(notification);
      return;
    }

    setReadingTargetId(notification.id);
    setReadIds((current) => (current.includes(notification.id) ? current : [...current, notification.id]));

    try {
      await markNotificationAsRead(notification.id);
      navigateFromNotification(notification);
    } catch (error) {
      setReadIds((current) => current.filter((id) => id !== notification.id));
      showAlert(
        '알림 읽음 처리 실패',
        error instanceof Error ? error.message : '알림 상태를 업데이트하지 못했습니다.',
      );
    } finally {
      setReadingTargetId(null);
    }
  };

  const handleDeleteNotification = async (notification: AppNotification) => {
    setDeleteTargetId(notification.id);
    setDeletedIds((current) => (current.includes(notification.id) ? current : [...current, notification.id]));

    try {
      await deleteNotification(notification.id);
    } catch (error) {
      setDeletedIds((current) => current.filter((id) => id !== notification.id));
      showAlert(
        '알림 삭제 실패',
        error instanceof Error ? error.message : '알림을 삭제하지 못했습니다.',
      );
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadNotifications.length === 0) {
      return;
    }

    const unreadIds = unreadNotifications.map((notification) => notification.id);
    setIsMarkingAll(true);
    setReadIds((current) => Array.from(new Set([...current, ...unreadIds])));

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      setReadIds((current) => current.filter((id) => !unreadIds.includes(id)));
      showAlert(
        '모두 읽기 실패',
        error instanceof Error ? error.message : '알림을 모두 읽음 처리하지 못했습니다.',
      );
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (notificationsQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          actionLabel="다시 시도"
          description={
            notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : undefined
          }
          onPressAction={() => {
            void notificationsQuery.refetch();
          }}
          title="알림을 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        testID="notifications-list"
        ListEmptyComponent={
          notificationsQuery.isPending ? (
            <LoadingState label="알림을 불러오는 중입니다." />
          ) : (
            <EmptyState
              description="새로운 활동이 생기면 이곳에서 바로 확인할 수 있습니다."
              title="모든 알림을 확인 완료했어요."
            />
          )
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <View style={styles.footerState}>
              {notificationsQuery.isFetchingNextPage ? (
                <LoadingState label="알림을 더 불러오는 중입니다." />
              ) : null}
              {notificationsQuery.isFetchNextPageError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={requestNextPage}
                  style={styles.retryButton}
                  testID="notifications-next-page-retry-button">
                  <Text style={styles.retryButtonLabel}>알림 다시 시도</Text>
                </Pressable>
              ) : null}
              {!notificationsQuery.hasNextPage &&
              !notificationsQuery.isFetching &&
              !notificationsQuery.isFetchingNextPage ? (
                <Text style={styles.endLabel} testID="notifications-end-label">
                  모든 알림을 확인했습니다.
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <AppHeader
              leftSlot={
                <Pressable
                  accessibilityLabel="뒤로가기"
                  onPress={handleBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                  testID="notifications-back-button">
                  <Ionicons color={colors.text} name="chevron-back" size={20} />
                </Pressable>
              }
              title="알림"
            />
            <View style={styles.headerActions}>
              <Text style={styles.headerDescription}>
                친구 활동과 기록 반응을 한곳에서 확인합니다.
              </Text>
              {unreadNotifications.length > 0 ? (
                <AppButton
                  fullWidth={false}
                  label="모두 읽기"
                  loading={isMarkingAll}
                  onPress={() => {
                    void handleMarkAllAsRead();
                  }}
                  testID="notifications-read-all-button"
                  variant="ghost"
                />
              ) : null}
            </View>
          </View>
        }
        onEndReached={() => {
          if (!notificationsQuery.hasNextPage || notificationsQuery.isFetchingNextPage) {
            return;
          }

          requestNextPage();
        }}
        onEndReachedThreshold={0.45}
        renderItem={({ item }) => {
          const isBusy = readingTargetId === item.id || deleteTargetId === item.id;

          return (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => {
                void handlePressNotification(item);
              }}
              style={({ pressed }) => [
                styles.rowCard,
                !item.isRead && styles.rowCardUnread,
                pressed && styles.pressed,
              ]}
              testID={`notification-row-${item.id}`}>
              <View style={styles.rowLeading}>
                <Avatar name={item.nickname} size={44} source={item.avatarUrl || null} />
                <View style={styles.rowTextBlock}>
                  <Text style={styles.messageText}>
                    <Text style={styles.nicknameText}>{item.nickname}</Text>
                    {` ${item.message}`}
                  </Text>
                  {!item.isRead ? <View style={styles.unreadDot} testID={`notification-unread-dot-${item.id}`} /> : null}
                </View>
              </View>
              <View style={styles.rowTrailing}>
                {item.thumbnailUrl ? (
                  <View style={styles.thumbnailPlaceholder} testID={`notification-thumbnail-${item.id}`} />
                ) : null}
                <Pressable
                  accessibilityLabel="알림 삭제"
                  onPress={(event) => {
                    event?.stopPropagation?.();
                    void handleDeleteNotification(item);
                  }}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                  testID={`notification-delete-${item.id}`}>
                  {deleteTargetId === item.id ? (
                    <Ionicons color={colors.mutedText} name="hourglass-outline" size={18} />
                  ) : (
                    <Ionicons color={colors.mutedText} name="trash-outline" size={18} />
                  )}
                </Pressable>
              </View>
              {isBusy ? <View pointerEvents="none" style={styles.busyOverlay} /> : null}
            </Pressable>
          );
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  headerContent: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerDescription: {
    ...typography.caption,
    color: colors.mutedText,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  rowCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  rowCardUnread: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  rowLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowTextBlock: {
    flex: 1,
    gap: spacing.sm,
  },
  nicknameText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  messageText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  footerState: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  retryButton: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  retryButtonLabel: {
    ...typography.caption,
    color: colors.text,
  },
  endLabel: {
    ...typography.caption,
    textAlign: 'center',
    color: colors.mutedText,
  },
  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
  },
  pressed: {
    opacity: 0.85,
  },
});
