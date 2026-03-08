import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import { DiaryDetailBody } from '@/features/diary/components/DiaryDetailBody';
import { DiaryImageCarousel } from '@/features/diary/components/DiaryImageCarousel';
import { formatDiaryDate, formatDiaryTimeAgo } from '@/features/diary/lib/detail';
import { getDiaryDetail } from '@/lib/api/diaries';
import { colors, radius, spacing, typography } from '@/theme';

const getDiaryId = (value?: string | string[]) => {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function DiaryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const diaryId = getDiaryId(params.id);
  const [isCommentSheetVisible, setIsCommentSheetVisible] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  const detailQuery = useQuery({
    queryKey: ['diary-detail', diaryId],
    queryFn: () => getDiaryDetail(diaryId as number),
    enabled: diaryId !== null,
  });
  const detailData = detailQuery.data;

  useEffect(() => {
    if (!detailData) {
      return;
    }

    setCommentCount(detailData.commentCount);
  }, [detailData]);

  if (diaryId === null) {
    return (
      <ScreenContainer>
        <ErrorState description="유효하지 않은 일기 경로입니다." title="일기를 찾을 수 없습니다." />
      </ScreenContainer>
    );
  }

  if (detailQuery.isPending) {
    return (
      <ScreenContainer>
        <LoadingState label="일기 상세를 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  if (detailQuery.isError || !detailData) {
    return (
      <ScreenContainer>
        <ErrorState
          description={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : '일기 정보를 불러오지 못했습니다.'
          }
          onPressAction={() => {
            void detailQuery.refetch();
          }}
          title="일기를 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  const diary = detailData;

  return (
    <>
      <ScreenContainer contentStyle={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }

              router.replace('/');
            }}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            testID="diary-detail-back-button">
            <Ionicons color={colors.text} name="chevron-back" size={22} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/profile/${diary.userId}`)}
            style={({ pressed }) => [styles.authorBlock, pressed && styles.pressed]}
            testID="diary-detail-author-button">
            <Avatar name={diary.nickname} size={40} source={diary.avatar ?? null} />
            <View style={styles.authorText}>
              <Text style={styles.authorName}>{diary.nickname}</Text>
              <Text style={styles.authorDate}>{formatDiaryDate(diary.date)}</Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <DiaryImageCarousel imageUrls={diary.imgUrls} testIDPrefix="diary-detail" />

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Ionicons color={colors.text} name="chatbubble-outline" size={18} />
              <Text style={styles.metricValue}>{commentCount}</Text>
            </View>
            <Text style={styles.timeAgo}>{formatDiaryTimeAgo(diary.createdAt)}</Text>
          </View>

          <DiaryDetailBody diary={diary} testIDPrefix="diary-detail" />
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsCommentSheetVisible(true)}
          style={({ pressed }) => [styles.commentEntry, pressed && styles.pressed]}
          testID="diary-detail-comment-entry">
          <Text style={styles.commentEntryPlaceholder}>댓글 달기...</Text>
          <Ionicons color={colors.mutedText} name="send-outline" size={18} />
        </Pressable>
      </ScreenContainer>

      <DiaryCommentSheet
        diary={{ ...diary, commentCount }}
        onCommentCountChange={setCommentCount}
        onClose={() => setIsCommentSheetVisible(false)}
        visible={isCommentSheetVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  authorText: {
    flex: 1,
    gap: spacing.xs,
  },
  authorName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  authorDate: {
    ...typography.caption,
    color: colors.mutedText,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.mutedText,
  },
  commentEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing['2xl'],
  },
  commentEntryPlaceholder: {
    ...typography.body,
    color: colors.mutedText,
  },
  pressed: {
    opacity: 0.82,
  },
});
