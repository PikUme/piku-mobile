import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { AppTextField } from '@/components/ui/AppTextField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { searchUsers } from '@/lib/api/search';
import type { Friend } from '@/types/friend';
import { colors, radius, spacing, typography } from '@/theme';

const SEARCH_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

function flattenUniqueUsers(pages: { content: Friend[] }[]) {
  const userMap = new Map<string, Friend>();

  pages.forEach((page) => {
    page.content.forEach((user) => {
      userMap.set(user.userId, user);
    });
  });

  return Array.from(userMap.values());
}

export function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const normalizedQuery = debouncedQuery.trim();
  const isSearchEnabled = normalizedQuery.length > 0;

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
    queryKey: ['search-users', normalizedQuery],
    enabled: isSearchEnabled,
    initialPageParam: 0,
    queryFn: ({ pageParam }) => searchUsers(normalizedQuery, pageParam, SEARCH_PAGE_SIZE),
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.number + 1),
  });

  const users = useMemo(
    () => flattenUniqueUsers(data?.pages ?? []),
    [data?.pages],
  );
  const totalResults = data?.pages[0]?.totalElements ?? 0;
  const requestNextPage = () => {
    void (fetchNextPage as () => Promise<unknown>)();
  };

  const handleOpenProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const headerComponent = (
    <View style={styles.headerContent}>
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>사용자 검색</Text>
        <AppTextField
          autoCapitalize="none"
          autoCorrect={false}
          helperText={
            isSearchEnabled
              ? undefined
              : '닉네임을 입력하면 결과가 자동으로 갱신됩니다.'
          }
          leading={<Ionicons color={colors.mutedText} name="search" size={18} />}
          onChangeText={setQuery}
          placeholder="닉네임을 입력하세요"
          returnKeyType="search"
          testID="search-input"
          value={query}
        />
        {isSearchEnabled && !isPending && !isError ? (
          <Text style={styles.searchSummary} testID="search-result-summary">
            검색 결과 {totalResults}명
          </Text>
        ) : null}
      </View>
    </View>
  );

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
          title="검색 결과를 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={users}
        keyExtractor={(item) => item.userId}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isSearchEnabled ? (
            <EmptyState
              description="검색어를 입력하면 사용자를 바로 찾을 수 있습니다."
              title="검색어를 입력해주세요."
            />
          ) : isPending ? (
            <LoadingState label="검색 결과를 불러오는 중입니다." />
          ) : (
            <EmptyState
              description="다른 닉네임으로 다시 검색해보세요."
              title="검색 결과가 없습니다."
            />
          )
        }
        ListFooterComponent={
          users.length > 0 ? (
            <View style={styles.footerState}>
              {isFetchingNextPage ? (
                <LoadingState label="검색 결과를 더 불러오는 중입니다." />
              ) : null}
              {isFetchNextPageError ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    requestNextPage();
                  }}
                  style={styles.retryButton}
                  testID="search-next-page-retry-button">
                  <Text style={styles.retryButtonLabel}>검색 결과 다시 시도</Text>
                </Pressable>
              ) : null}
              {!hasNextPage && !isFetching && !isFetchingNextPage ? (
                <Text style={styles.endLabel} testID="search-end-label">
                  모든 검색 결과를 확인했습니다.
                </Text>
              ) : null}
            </View>
          ) : null
        }
        ListHeaderComponent={headerComponent}
        onEndReached={() => {
          if (!hasNextPage || isFetchingNextPage || !isSearchEnabled) {
            return;
          }

          requestNextPage();
        }}
        onEndReachedThreshold={0.45}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => handleOpenProfile(item.userId)}
            style={({ pressed }) => [styles.resultCard, pressed && styles.resultCardPressed]}
            testID={`search-result-item-${item.userId}`}>
            <Avatar name={item.nickname} size={44} source={item.avatar || null} />
            <View style={styles.resultBody}>
              <Text style={styles.resultName}>{item.nickname}</Text>
              <Text style={styles.resultDescription}>프로필로 이동</Text>
            </View>
            <Ionicons color={colors.mutedText} name="chevron-forward" size={18} />
          </Pressable>
        )}
        testID="search-results-list"
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
  searchCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  searchTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  searchSummary: {
    ...typography.caption,
    color: colors.mutedText,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resultCardPressed: {
    opacity: 0.84,
  },
  resultBody: {
    flex: 1,
    gap: spacing.xs,
  },
  resultName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  resultDescription: {
    ...typography.caption,
    color: colors.mutedText,
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
