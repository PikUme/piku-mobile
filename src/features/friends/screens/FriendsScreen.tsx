import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '@/components/shell/AppTopBar';
import { AppButton } from '@/components/ui/AppButton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import {
  acceptFriendRequest,
  deleteFriend,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
} from '@/lib/api/friends';
import { showAlert, showConfirm } from '@/lib/ui/feedback';
import type {
  Friend,
  FriendRequest,
  PaginatedFriendRequestsResponse,
  PaginatedFriendsResponse,
} from '@/types/friend';
import { colors, radius, spacing, typography } from '@/theme';

const FRIEND_PAGE_SIZE = 10;

type FriendsTab = 'friends' | 'requests';

function flattenUniqueUsers<T extends Friend>(users: T[]) {
  const userMap = new Map<string, T>();
  users.forEach((user) => {
    userMap.set(user.userId, user);
  });
  return Array.from(userMap.values());
}

function flattenFriendPages(pages: PaginatedFriendsResponse[] = []) {
  return flattenUniqueUsers(pages.flatMap((page) => page.friends));
}

function flattenRequestPages(pages: PaginatedFriendRequestsResponse[] = []) {
  return flattenUniqueUsers(pages.flatMap((page) => page.requests));
}

export function FriendsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [acceptedRequests, setAcceptedRequests] = useState<FriendRequest[]>([]);
  const [handledRequestIds, setHandledRequestIds] = useState<string[]>([]);
  const [removedFriendIds, setRemovedFriendIds] = useState<string[]>([]);
  const [actionTargetUserId, setActionTargetUserId] = useState<string | null>(null);

  const friendsQuery = useInfiniteQuery({
    queryKey: ['friends-list'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getFriends(pageParam, FRIEND_PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNext ? allPages.length : undefined,
  });

  const requestsQuery = useInfiniteQuery({
    queryKey: ['friend-requests'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => getFriendRequests(pageParam, FRIEND_PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNext ? allPages.length : undefined,
  });

  const friends = useMemo(() => {
    const baseFriends = flattenFriendPages(friendsQuery.data?.pages ?? []);
    return flattenUniqueUsers([...acceptedRequests, ...baseFriends]).filter(
      (friend) => !removedFriendIds.includes(friend.userId),
    );
  }, [acceptedRequests, friendsQuery.data?.pages, removedFriendIds]);

  const requests = useMemo(() => {
    const baseRequests = flattenRequestPages(requestsQuery.data?.pages ?? []);
    return baseRequests.filter((request) => !handledRequestIds.includes(request.userId));
  }, [handledRequestIds, requestsQuery.data?.pages]);

  const totalRequestCount = Math.max(
    0,
    (requestsQuery.data?.pages[0]?.totalElements ?? requests.length) - handledRequestIds.length,
  );

  const requestNextFriends = () => {
    void (friendsQuery.fetchNextPage as () => Promise<unknown>)();
  };

  const requestNextRequests = () => {
    void (requestsQuery.fetchNextPage as () => Promise<unknown>)();
  };

  const handleOpenProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    setActionTargetUserId(request.userId);

    try {
      await acceptFriendRequest(request.userId);
      setAcceptedRequests((current) => flattenUniqueUsers([request, ...current]));
      setHandledRequestIds((current) => [...current, request.userId]);
    } catch (error) {
      showAlert(
        '친구 요청 수락 실패',
        error instanceof Error ? error.message : '친구 요청을 수락하지 못했습니다.',
      );
    } finally {
      setActionTargetUserId(null);
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    setActionTargetUserId(request.userId);

    try {
      await rejectFriendRequest(request.userId);
      setHandledRequestIds((current) => [...current, request.userId]);
    } catch (error) {
      showAlert(
        '친구 요청 거절 실패',
        error instanceof Error ? error.message : '친구 요청을 거절하지 못했습니다.',
      );
    } finally {
      setActionTargetUserId(null);
    }
  };

  const handleDeleteFriend = (friend: Friend) => {
    showConfirm('친구 끊기', `${friend.nickname}님과 친구를 끊으시겠습니까?`, () => {
      void (async () => {
        setActionTargetUserId(friend.userId);

        try {
          await deleteFriend(friend.userId);
          setRemovedFriendIds((current) => [...current, friend.userId]);
        } catch (error) {
          showAlert(
            '친구 끊기 실패',
            error instanceof Error ? error.message : '친구를 끊지 못했습니다.',
          );
        } finally {
          setActionTargetUserId(null);
        }
      })();
    });
  };

  const headerComponent = (
    <View style={styles.headerContent}>
      <AppTopBar
        subtitle="친구 목록과 받은 친구 요청을 관리합니다."
        title="친구"
      />
      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('friends')}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'friends' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          testID="friends-tab-friends">
          <Text
            style={[styles.tabLabel, activeTab === 'friends' && styles.tabLabelActive]}>
            친구 목록
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab('requests')}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === 'requests' && styles.tabButtonActive,
            pressed && styles.tabButtonPressed,
          ]}
          testID="friends-tab-requests">
          <Text
            style={[styles.tabLabel, activeTab === 'requests' && styles.tabLabelActive]}>
            친구 요청
          </Text>
          {totalRequestCount > 0 ? (
            <View testID="friends-requests-badge">
              <Badge count={totalRequestCount} tone="danger" />
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );

  const currentUsers = activeTab === 'friends' ? friends : requests;
  const isPending = activeTab === 'friends' ? friendsQuery.isPending : requestsQuery.isPending;
  const isError = activeTab === 'friends' ? friendsQuery.isError : requestsQuery.isError;
  const error = activeTab === 'friends' ? friendsQuery.error : requestsQuery.error;
  const hasNextPage =
    activeTab === 'friends' ? friendsQuery.hasNextPage : requestsQuery.hasNextPage;
  const isFetching =
    activeTab === 'friends' ? friendsQuery.isFetching : requestsQuery.isFetching;
  const isFetchingNextPage =
    activeTab === 'friends' ? friendsQuery.isFetchingNextPage : requestsQuery.isFetchingNextPage;
  const isFetchNextPageError =
    activeTab === 'friends'
      ? friendsQuery.isFetchNextPageError
      : requestsQuery.isFetchNextPageError;

  if (isError) {
    return (
      <ScreenContainer>
        {headerComponent}
        <ErrorState
          actionLabel="다시 시도"
          description={error instanceof Error ? error.message : undefined}
          onPressAction={() => {
            if (activeTab === 'friends') {
              void friendsQuery.refetch();
              return;
            }

            void requestsQuery.refetch();
          }}
          title={activeTab === 'friends' ? '친구 목록을 불러오지 못했습니다.' : '친구 요청을 불러오지 못했습니다.'}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={currentUsers}
        keyExtractor={(item) => `${activeTab}-${item.userId}`}
        ListEmptyComponent={
          isPending ? (
            <LoadingState label={activeTab === 'friends' ? '친구 목록을 불러오는 중입니다.' : '친구 요청을 불러오는 중입니다.'} />
          ) : activeTab === 'friends' ? (
            <EmptyState
              description="친구를 추가하면 이곳에서 바로 확인할 수 있습니다."
              title="친구 목록이 비어 있습니다."
            />
          ) : (
            <EmptyState
              description="받은 친구 요청이 생기면 이곳에 표시됩니다."
              title="대기 중인 친구 요청이 없습니다."
            />
          )
        }
        ListFooterComponent={
          currentUsers.length > 0 ? (
            <View style={styles.footerState}>
              {isFetchingNextPage ? (
                <LoadingState label={activeTab === 'friends' ? '친구를 더 불러오는 중입니다.' : '친구 요청을 더 불러오는 중입니다.'} />
              ) : null}
              {isFetchNextPageError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (activeTab === 'friends') {
                      requestNextFriends();
                      return;
                    }

                    requestNextRequests();
                  }}
                  style={styles.retryButton}
                  testID="friends-next-page-retry-button">
                  <Text style={styles.retryButtonLabel}>목록 다시 시도</Text>
                </Pressable>
              ) : null}
              {!hasNextPage && !isFetching && !isFetchingNextPage ? (
                <Text style={styles.endLabel} testID="friends-end-label">
                  모든 {activeTab === 'friends' ? '친구' : '요청'}를 확인했습니다.
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListHeaderComponent={headerComponent}
        onEndReached={() => {
          if (!hasNextPage || isFetchingNextPage) {
            return;
          }

          if (activeTab === 'friends') {
            requestNextFriends();
            return;
          }

          requestNextRequests();
        }}
        onEndReachedThreshold={0.45}
        renderItem={({ item }) => {
          const isActionLoading = actionTargetUserId === item.userId;
          const isFriendTab = activeTab === 'friends';

          return (
            <View
              style={[styles.rowCard, isFriendTab && styles.friendRowCard]}
              testID={`friends-row-${item.userId}`}>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleOpenProfile(item.userId)}
                style={({ pressed }) => [
                  styles.profileBlock,
                  isFriendTab && styles.friendProfileBlock,
                  pressed && styles.profilePressed,
                ]}
                testID={`friends-open-profile-${item.userId}`}>
                <Avatar name={item.nickname} size={44} source={item.avatar || null} />
                <View
                  style={styles.profileTextBlock}
                  testID={`friends-profile-block-${item.userId}`}>
                  <Text style={styles.nickname}>{item.nickname}</Text>
                  <Text style={styles.helperText}>
                    {isFriendTab ? '프로필 보기' : '받은 친구 요청'}
                  </Text>
                </View>
              </Pressable>
              <View
                style={[styles.actionBlock, isFriendTab && styles.friendActionBlock]}>
                {isFriendTab ? (
                  <AppButton
                    fullWidth={false}
                    label="친구 끊기"
                    loading={isActionLoading}
                    onPress={() => handleDeleteFriend(item)}
                    size="md"
                    testID={`friends-remove-${item.userId}`}
                    variant="ghost"
                  />
                ) : (
                  <>
                    <AppButton
                      fullWidth={false}
                      label="수락"
                      loading={isActionLoading}
                      onPress={() => handleAcceptRequest(item)}
                      size="md"
                      testID={`friends-accept-${item.userId}`}
                      variant="neutral"
                    />
                    <AppButton
                      fullWidth={false}
                      label="거절"
                      loading={isActionLoading}
                      onPress={() => handleRejectRequest(item)}
                      size="md"
                      testID={`friends-reject-${item.userId}`}
                      variant="ghost"
                    />
                  </>
                )}
              </View>
            </View>
          );
        }}
        testID="friends-list"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  tabButtonActive: {
    borderColor: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  tabButtonPressed: {
    opacity: 0.84,
  },
  tabLabel: {
    ...typography.bodyStrong,
    color: colors.mutedText,
  },
  tabLabelActive: {
    color: colors.text,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  rowCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  friendRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  friendProfileBlock: {
    flex: 1,
  },
  profilePressed: {
    opacity: 0.84,
  },
  profileTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  nickname: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  helperText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  actionBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  friendActionBlock: {
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  footerState: {
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  retryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  endLabel: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
  },
});
