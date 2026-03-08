import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '@/components/shell/AppTopBar';
import { AppButton } from '@/components/ui/AppButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { FeedCard } from '@/features/feed/components/FeedCard';
import { FeedCommentSheet } from '@/features/feed/components/FeedCommentSheet';
import { getFeedCursor } from '@/lib/api/feed';
import {
  cancelFriendRequest,
  sendFriendRequest,
} from '@/lib/api/friends';
import { showAlert } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import type { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import { colors, radius, spacing, typography } from '@/theme';

interface FeedScreenProps {
  entryPoint?: 'home' | 'feed';
}

function flattenUniqueItems(pages: { items: FeedDiary[] }[]) {
  const map = new Map<number, FeedDiary>();

  pages.forEach((page) => {
    page.items.forEach((item) => {
      map.set(item.diaryId, item);
    });
  });

  return Array.from(map.values());
}

export function FeedScreen({ entryPoint = 'feed' }: FeedScreenProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const [selectedPost, setSelectedPost] = useState<FeedDiary | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<number, FriendshipStatus>
  >({});
  const [commentCountOverrides, setCommentCountOverrides] = useState<
    Record<number, number>
  >({});

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    isPending,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['feed', isLoggedIn ? user?.id ?? 'member' : 'guest'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getFeedCursor(pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.nextCursor ?? undefined : undefined,
  });

  const rawItems = useMemo(
    () => flattenUniqueItems(data?.pages ?? []),
    [data?.pages],
  );

  const items = useMemo(
    () =>
      rawItems.map((item) => ({
        ...item,
        friendStatus: statusOverrides[item.diaryId] ?? item.friendStatus,
        commentCount: commentCountOverrides[item.diaryId] ?? item.commentCount,
      })),
    [commentCountOverrides, rawItems, statusOverrides],
  );

  const shellTitle = entryPoint === 'home' ? '홈' : '피드';
  const subtitle = isLoggedIn
    ? '친구와 공개 일기를 카드형 리스트로 탐색합니다.'
    : '비로그인 사용자는 공개 일기만 둘러볼 수 있습니다.';
  const requestNextPage = () => {
    void (fetchNextPage as () => Promise<unknown>)();
  };

  const handleOpenDetail = (post: FeedDiary) => {
    setSelectedPost(null);
    router.push({
      pathname: '/diary/story',
      params: { id: String(post.diaryId) },
    });
  };

  const handleOpenComments = (post: FeedDiary) => {
    setSelectedPost(post);
  };

  const handleSendFriendRequest = async (post: FeedDiary) => {
    try {
      await sendFriendRequest(post.userId);
      setStatusOverrides((current) => ({
        ...current,
        [post.diaryId]: FriendshipStatus.SENT,
      }));
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : '친구 요청 처리 중 오류가 발생했습니다.';
      showAlert('친구 요청 실패', message);
    }
  };

  const handleCancelFriendRequest = async (post: FeedDiary) => {
    try {
      await cancelFriendRequest(post.userId);
      setStatusOverrides((current) => ({
        ...current,
        [post.diaryId]: FriendshipStatus.NONE,
      }));
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : '친구 요청 취소 중 오류가 발생했습니다.';
      showAlert('요청 취소 실패', message);
    }
  };

  const handleGuestLogin = () => {
    setSelectedPost(null);
    router.push('/login');
  };

  const handleGuestSignup = () => {
    setSelectedPost(null);
    router.push('/signup');
  };

  const headerComponent = (
    <View style={styles.headerContent}>
      <AppTopBar subtitle={subtitle} title={shellTitle} />
      {!isLoggedIn ? (
        <View style={styles.guestBanner}>
          <Text style={styles.guestEyebrow}>PUBLIC FEED</Text>
          <Text style={styles.guestTitle} testID="public-feed-title">
            공개 피드
          </Text>
          <Text style={styles.guestDescription}>
            공개된 일기는 바로 볼 수 있고, 댓글 작성과 친구 관련 액션은 로그인 이후에만
            가능합니다.
          </Text>
          <View style={styles.guestPolicies}>
            <Text style={styles.guestPolicyText}>공개 일기만 노출</Text>
            <Text style={styles.guestPolicyText}>댓글 액션 제한</Text>
            <Text style={styles.guestPolicyText}>친구 액션 제한</Text>
          </View>
          <View style={styles.guestCtas}>
            <AppButton
              fullWidth={false}
              label="로그인"
              onPress={handleGuestLogin}
              testID="public-feed-login-button"
              variant="neutral"
            />
            <AppButton
              fullWidth={false}
              label="가입하기"
              onPress={handleGuestSignup}
              testID="public-feed-signup-button"
              variant="ghost"
            />
          </View>
        </View>
      ) : null}
    </View>
  );

  if (isPending) {
    return (
      <ScreenContainer>
        {headerComponent}
        <LoadingState label="피드를 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer>
        {headerComponent}
        <ErrorState
          actionLabel="다시 시도"
          description={error instanceof Error ? error.message : undefined}
          onPressAction={() => {
            void refetch();
          }}
          title="피드를 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => String(item.diaryId)}
        ListEmptyComponent={
          <EmptyState
            description="아직 노출할 공개 일기가 없습니다."
            title="피드가 비어 있습니다."
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.footerState}>
              {isFetchingNextPage ? (
                <LoadingState label="피드를 더 불러오는 중입니다." />
              ) : null}
              {isFetchNextPageError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    requestNextPage();
                  }}
                  style={styles.retryButton}
                  testID="feed-next-page-retry-button">
                  <Text style={styles.retryButtonLabel}>다음 피드 다시 시도</Text>
                </Pressable>
              ) : null}
              {!hasNextPage && !isFetching && !isFetchingNextPage ? (
                <Text style={styles.endLabel} testID="feed-end-label">
                  모든 일기를 확인했습니다.
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

          requestNextPage();
        }}
        onEndReachedThreshold={0.45}
        renderItem={({ item }) => (
          <FeedCard
            isLoggedIn={isLoggedIn}
            onCancelFriendRequest={(post) => {
              void handleCancelFriendRequest(post);
            }}
            onOpenComments={handleOpenComments}
            onOpenDetail={handleOpenDetail}
            onOpenFriendRequests={() => router.push('/friends')}
            onSendFriendRequest={(post) => {
              void handleSendFriendRequest(post);
            }}
            post={item}
            viewerUserId={user?.id}
          />
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        testID="feed-list"
      />

      <FeedCommentSheet
        onClose={() => setSelectedPost(null)}
        onCommentCountChange={(diaryId, count) => {
          setCommentCountOverrides((current) => ({
            ...current,
            [diaryId]: count,
          }));
          setSelectedPost((current) =>
            current && current.diaryId === diaryId
              ? {
                  ...current,
                  commentCount: count,
                }
              : current,
          );
        }}
        onOpenDetail={handleOpenDetail}
        post={selectedPost}
        visible={Boolean(selectedPost)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  headerContent: {
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.sm,
  },
  guestBanner: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  guestEyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  guestTitle: {
    ...typography.heading,
    color: colors.text,
  },
  guestDescription: {
    ...typography.body,
    color: colors.mutedText,
  },
  guestPolicies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  guestPolicyText: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  guestCtas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  retryButton: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  retryButtonLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  endLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
