import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import { DiaryDetailBody } from '@/features/diary/components/DiaryDetailBody';
import { DiaryImageCarousel } from '@/features/diary/components/DiaryImageCarousel';
import { formatDiaryDate } from '@/features/diary/lib/detail';
import { deleteDiary, getDiaryDetail } from '@/lib/api/diaries';
import { showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography } from '@/theme';

const getDiaryId = (value?: string | string[]) => {
  const normalized = Array.isArray(value) ? value[0] : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function DiaryStoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[]; source?: string | string[] }>();
  const diaryId = getDiaryId(params.id);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const user = useAuthStore((state) => state.user);
  const [commentCount, setCommentCount] = useState(0);
  const [isCommentSheetVisible, setIsCommentSheetVisible] = useState(false);
  const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);

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

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        gestureState.dy < -8,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -40) {
          setIsCommentSheetVisible(true);
        }
      },
    }),
  ).current;

  if (diaryId === null) {
    return <ErrorState description="유효하지 않은 일기 경로입니다." title="일기를 찾을 수 없습니다." />;
  }

  if (detailQuery.isPending) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <LoadingState label="스토리형 일기를 불러오는 중입니다." />
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailData) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
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
      </SafeAreaView>
    );
  }

  const diary = detailData;
  const isOwnDiary = user?.id === diary.userId;
  const shouldHideCaption = source === 'feed';

  return (
    <>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.safeArea}
        testID="diary-story-screen">
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/profile/${diary.userId}`)}
            style={({ pressed }) => [styles.authorBlock, pressed && styles.pressed]}
            testID="diary-story-author-button">
            <Avatar name={diary.nickname} size={36} source={diary.avatar ?? null} />
            <View style={styles.authorText}>
              <Text style={styles.authorName}>{diary.nickname}</Text>
              <Text style={styles.headerDate}>{formatDiaryDate(diary.date)}</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            {isOwnDiary ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsActionSheetVisible(true)}
                style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
                testID="diary-story-more-button">
                <Ionicons color={colors.white} name="ellipsis-horizontal" size={22} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={handleClose}
              style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
              testID="diary-story-close-button">
              <Ionicons color={colors.white} name="close" size={24} />
            </Pressable>
          </View>
        </View>

        <View style={styles.mediaSection}>
          <DiaryImageCarousel
            fullScreen
            imageUrls={diary.imgUrls}
            testIDPrefix="diary-story"
          />
        </View>

        {!shouldHideCaption ? (
          <View style={styles.captionSection}>
            <DiaryDetailBody diary={diary} testIDPrefix="diary-story" />
          </View>
        ) : null}

        <View
          style={styles.commentHandleContainer}
          testID="diary-story-comment-handle"
          {...swipeResponder.panHandlers}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsCommentSheetVisible(true)}
            style={({ pressed }) => [styles.commentHandleButton, pressed && styles.pressed]}
            testID="diary-story-comment-open-button">
            <Ionicons color={colors.white} name="chevron-up" size={18} />
            <Text style={styles.commentHandleLabel}>댓글 보기</Text>
          </Pressable>
          <Text style={styles.commentCountLabel}>{commentCount}</Text>
        </View>
      </SafeAreaView>

      <DiaryCommentSheet
        diary={{ ...diary, commentCount }}
        onCommentCountChange={setCommentCount}
        onClose={() => setIsCommentSheetVisible(false)}
        visible={isCommentSheetVisible}
      />

      <BottomSheet
        description="본인 글일 때만 삭제 메뉴가 노출됩니다."
        onClose={() => setIsActionSheetVisible(false)}
        title="일기 옵션"
        visible={isActionSheetVisible}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsActionSheetVisible(false);
            showConfirm('일기 삭제', '정말 이 일기를 삭제하시겠습니까?', () => {
              void (async () => {
                await deleteDiary(diary.diaryId);
                handleClose();
              })();
            });
          }}
          style={({ pressed }) => [styles.deleteAction, pressed && styles.pressed]}
          testID="diary-story-delete-button">
          <Text style={styles.deleteActionLabel}>일기 삭제</Text>
        </Pressable>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
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
    color: colors.white,
  },
  headerDate: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaSection: {
    flex: 1,
    justifyContent: 'center',
  },
  captionSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  commentHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  commentHandleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  commentHandleLabel: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  commentCountLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  deleteAction: {
    borderRadius: spacing.md,
    backgroundColor: colors.dangerSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  deleteActionLabel: {
    ...typography.bodyStrong,
    color: colors.danger,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
