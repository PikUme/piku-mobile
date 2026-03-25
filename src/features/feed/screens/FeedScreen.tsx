import { useCallback, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Animated,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppTopBar } from '@/components/shell/AppTopBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { FeedCard } from '@/features/feed/components/FeedCard';
import { FeedCommentSheet } from '@/features/feed/components/FeedCommentSheet';
import { getFeedCursor } from '@/lib/api/feed';
import { cancelFriendRequest, sendFriendRequest } from '@/lib/api/friends';
import { showAlert } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import type { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import { colors, radius, spacing, typography } from '@/theme';

interface FeedScreenProps {
  entryPoint?: 'home' | 'feed';
}

const FEED_HEADER_HIDE_OFFSET = 56;
const FEED_HEADER_SCROLL_DOWN_THRESHOLD = 12;
const FEED_HEADER_SCROLL_UP_THRESHOLD = 6;
const FEED_HEADER_SPACER = 56;

function flattenUniqueItems(pages: { items: FeedDiary[] }[]) {
  const map = new Map<number, FeedDiary>();

  pages.forEach((page) => {
    page.items.forEach((item) => {
      map.set(item.diaryId, item);
    });
  });

  return Array.from(map.values());
}

export function FeedScreen({ entryPoint: _entryPoint = 'feed' }: FeedScreenProps) {
  void _entryPoint;
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const [selectedPost, setSelectedPost] = useState<FeedDiary | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(FEED_HEADER_SPACER);
  const [statusOverrides, setStatusOverrides] = useState<Record<number, FriendshipStatus>>(
    {},
  );
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<number, number>>(
    {},
  );
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollOffsetRef = useRef(0);
  const headerVisibleRef = useRef(true);

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

  const rawItems = useMemo(() => flattenUniqueItems(data?.pages ?? []), [data?.pages]);

  const items = useMemo(
    () =>
      rawItems.map((item) => ({
        ...item,
        friendStatus: statusOverrides[item.diaryId] ?? item.friendStatus,
        commentCount: commentCountOverrides[item.diaryId] ?? item.commentCount,
      })),
    [commentCountOverrides, rawItems, statusOverrides],
  );

  const requestNextPage = () => {
    void (fetchNextPage as () => Promise<unknown>)();
  };

  const animateHeader = useCallback(
    (nextVisible: boolean) => {
      if (headerVisibleRef.current === nextVisible) {
        return;
      }

      headerVisibleRef.current = nextVisible;
      setIsHeaderVisible(nextVisible);
      Animated.parallel([
        Animated.timing(headerTranslateY, {
          toValue: nextVisible ? 0 : -(headerHeight + spacing.xs),
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(headerOpacity, {
          toValue: nextVisible ? 1 : 0,
          duration: nextVisible ? 180 : 120,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [headerHeight, headerOpacity, headerTranslateY],
  );

  const handleFeedScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextOffset = event.nativeEvent.contentOffset.y;
      const delta = nextOffset - lastScrollOffsetRef.current;

      if (nextOffset <= 0) {
        animateHeader(true);
        lastScrollOffsetRef.current = nextOffset;
        return;
      }

      if (
        delta > FEED_HEADER_SCROLL_DOWN_THRESHOLD &&
        nextOffset > FEED_HEADER_HIDE_OFFSET
      ) {
        animateHeader(false);
      } else if (delta < -FEED_HEADER_SCROLL_UP_THRESHOLD) {
        animateHeader(true);
      }

      lastScrollOffsetRef.current = nextOffset;
    },
    [animateHeader],
  );

  const handleOpenDetail = (post: FeedDiary) => {
    setSelectedPost(null);
    router.push({
      pathname: '/diary/story',
      params: { id: String(post.diaryId), source: 'feed' },
    });
  };

  const handleOpenComments = (post: FeedDiary) => {
    setSelectedPost(post);
  };

  const handleCommentCountChange = useCallback((diaryId: number, count: number) => {
    setCommentCountOverrides((current) => {
      if (current[diaryId] === count) {
        return current;
      }

      return {
        ...current,
        [diaryId]: count,
      };
    });
  }, []);

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

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);

    if (nextHeight > 0 && nextHeight !== headerHeight) {
      setHeaderHeight(nextHeight);

      if (!headerVisibleRef.current) {
        headerTranslateY.setValue(-(nextHeight + spacing.xs));
        headerOpacity.setValue(0);
      }
    }
  };

  const floatingHeader = (
    <Animated.View
      accessibilityState={{ expanded: isHeaderVisible }}
      style={[
        styles.floatingHeader,
        {
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        },
      ]}
      pointerEvents={isHeaderVisible ? 'auto' : 'none'}
      testID="feed-floating-header">
      <View onLayout={handleHeaderLayout} style={styles.floatingHeaderInner}>
        <AppTopBar compact title="PikUme" variant="brand" />
      </View>
    </Animated.View>
  );

  if (isPending) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        {floatingHeader}
        <View style={[styles.stateContent, { paddingTop: headerHeight }]}>
          <LoadingState label="피드를 불러오는 중입니다." />
        </View>
      </ScreenContainer>
    );
  }

  if (isError) {
    return (
      <ScreenContainer contentStyle={styles.screen}>
        {floatingHeader}
        <View style={[styles.stateContent, { paddingTop: headerHeight }]}>
          <ErrorState
            actionLabel="다시 시도"
            description={error instanceof Error ? error.message : undefined}
            onPressAction={() => {
              void refetch();
            }}
            title="피드를 불러오지 못했습니다."
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      {floatingHeader}
      <FlatList
        contentContainerStyle={[styles.listContent, { paddingTop: headerHeight }]}
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
        onEndReached={() => {
          if (!hasNextPage || isFetchingNextPage) {
            return;
          }

          requestNextPage();
        }}
        onEndReachedThreshold={0.45}
        onScroll={handleFeedScroll}
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
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        testID="feed-list"
      />

      <FeedCommentSheet
        onClose={() => setSelectedPost(null)}
        onCommentCountChange={handleCommentCountChange}
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
  stateContent: {
    flex: 1,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  floatingHeaderInner: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.lg,
    paddingBottom: spacing['4xl'],
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
