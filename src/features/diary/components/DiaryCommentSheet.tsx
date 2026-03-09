import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { CommentComposer } from '@/features/diary/components/CommentComposer';
import { CommentItem } from '@/features/diary/components/CommentItem';
import { formatDiaryDate, formatDiaryTimeAgo } from '@/features/diary/lib/detail';
import {
  createComment,
  deleteComment,
  getReplies,
  getRootComments,
  updateComment,
} from '@/lib/api/comments';
import { showActionSheet, showAlert, showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import type {
  Comment,
  CommentRepliesState,
  CommentSheetDiaryPreview,
} from '@/types/comment';
import { colors, radius, spacing, typography } from '@/theme';

interface DiaryCommentSheetProps {
  visible: boolean;
  diary: CommentSheetDiaryPreview | null;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
  onOpenDetail?: (diary: CommentSheetDiaryPreview) => void;
  testIDPrefix?: string;
}

const ROOT_PAGE_SIZE = 10;
const REPLY_PAGE_SIZE = 5;

const createEmptyReplyState = (): CommentRepliesState => ({
  list: [],
  page: 0,
  hasMore: false,
  isLoading: false,
  isShown: false,
});

const cloneRepliesState = (state: Record<number, CommentRepliesState>) => {
  return Object.fromEntries(
    Object.entries(state).map(([key, value]) => [
      Number(key),
      {
        ...value,
        list: [...value.list],
      },
    ]),
  ) as Record<number, CommentRepliesState>;
};

const replaceCommentInList = (
  comments: Comment[],
  commentId: number,
  updater: (comment: Comment) => Comment,
) => comments.map((comment) => (comment.id === commentId ? updater(comment) : comment));

export function DiaryCommentSheet({
  visible,
  diary,
  onClose,
  onCommentCountChange,
  onOpenDetail,
  testIDPrefix = 'diary-comment-sheet',
}: DiaryCommentSheetProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentReplies, setCommentReplies] = useState<
    Record<number, CommentRepliesState>
  >({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const currentDiaryId = diary?.diaryId ?? null;

  useEffect(() => {
    setTotalComments(diary?.commentCount ?? 0);
  }, [diary?.commentCount, diary?.diaryId]);

  const applyCommentCount = useCallback(
    (count: number) => {
      setTotalComments(count);
      onCommentCountChange?.(count);
    },
    [onCommentCountChange],
  );

  const loadRootComments = async (isNewFetch = false) => {
    if (!diary) {
      return;
    }

    if (isLoadingComments || (!hasMore && !isNewFetch)) {
      return;
    }

    setCommentsError(null);
    setIsLoadingComments(true);
    const pageToFetch = isNewFetch ? 0 : page;

    try {
      const data = await getRootComments(diary.diaryId, pageToFetch, ROOT_PAGE_SIZE);
      setComments((current) => (isNewFetch ? data.content : [...current, ...data.content]));
      setPage(pageToFetch + 1);
      setHasMore(!data.last);
      applyCommentCount(data.totalElements);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '댓글을 불러오지 못했습니다.';
      setCommentsError(message);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!visible || currentDiaryId === null) {
      return;
    }

    let isMounted = true;
    setComments([]);
    setCommentReplies({});
    setPage(0);
    setHasMore(true);
    setCommentsError(null);
    setValue('');
    setReplyTo(null);
    setEditingComment(null);
    setIsLoadingComments(true);

    void (async () => {
      try {
        const data = await getRootComments(currentDiaryId, 0, ROOT_PAGE_SIZE);
        if (!isMounted) {
          return;
        }

        setComments(data.content);
        setPage(1);
        setHasMore(!data.last);
        applyCommentCount(data.totalElements);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : '댓글을 불러오지 못했습니다.';
        setCommentsError(message);
      } finally {
        if (isMounted) {
          setIsLoadingComments(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [applyCommentCount, currentDiaryId, visible]);

  const handleOpenProfile = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  const handleOpenLogin = () => {
    onClose();
    router.push('/login');
  };

  const handleOpenSignup = () => {
    onClose();
    router.push('/signup');
  };

  const handleToggleReplies = async (comment: Comment) => {
    const currentState = commentReplies[comment.id] ?? createEmptyReplyState();

    if (currentState.isShown) {
      setCommentReplies((current) => ({
        ...current,
        [comment.id]: {
          ...currentState,
          isShown: false,
        },
      }));
      return;
    }

    setCommentReplies((current) => ({
      ...current,
      [comment.id]: {
        ...currentState,
        isShown: true,
        hasMore: currentState.hasMore || comment.replyCount > currentState.list.length,
      },
    }));

    if (currentState.list.length === 0 && comment.replyCount > 0) {
      await handleFetchMoreReplies(comment.id);
    }
  };

  const handleFetchMoreReplies = async (commentId: number) => {
    const currentState = commentReplies[commentId] ?? createEmptyReplyState();
    if (currentState.isLoading || (!currentState.hasMore && currentState.page > 0)) {
      return;
    }

    setCommentReplies((current) => ({
      ...current,
      [commentId]: {
        ...currentState,
        isLoading: true,
      },
    }));

    try {
      const data = await getReplies(commentId, currentState.page, REPLY_PAGE_SIZE);
      setCommentReplies((current) => ({
        ...current,
        [commentId]: {
          ...currentState,
          list: [...currentState.list, ...data.content],
          page: currentState.page + 1,
          hasMore: !data.last,
          isLoading: false,
          isShown: true,
        },
      }));
    } catch (error) {
      showAlert(
        '답글 로드 실패',
        error instanceof Error ? error.message : '답글을 불러오지 못했습니다.',
      );
      setCommentReplies((current) => ({
        ...current,
        [commentId]: {
          ...currentState,
          isLoading: false,
        },
      }));
    }
  };

  const handleCancelContext = () => {
    setEditingComment(null);
    setReplyTo(null);
    setValue('');
  };

  const handleReply = (comment: Comment) => {
    setEditingComment(null);
    setReplyTo(comment);
    setValue('');
  };

  const handleStartEdit = (comment: Comment) => {
    setReplyTo(null);
    setEditingComment(comment);
    setValue(comment.content);
  };

  const openCommentActions = (comment: Comment) => {
    if (!user || user.id !== comment.userId) {
      return;
    }

    showActionSheet({
      title: '댓글 옵션',
      options: [
        {
          label: '수정',
          onPress: () => handleStartEdit(comment),
        },
        {
          label: '삭제',
          style: 'destructive',
          onPress: () => {
            showConfirm('댓글 삭제', '정말 이 댓글을 삭제하시겠습니까?', () => {
              void handleDeleteComment(comment);
            });
          },
        },
        {
          label: '취소',
          style: 'cancel',
        },
      ],
    });
  };

  const handleDeleteComment = async (comment: Comment) => {
    const previousComments = comments;
    const previousReplies = cloneRepliesState(commentReplies);
    const previousTotal = totalComments;

    const deletedCount = comment.parentId === null ? comment.replyCount + 1 : 1;

    if (comment.parentId === null) {
      setComments((current) => current.filter((item) => item.id !== comment.id));
      setCommentReplies((current) => {
        const next = { ...current };
        delete next[comment.id];
        return next;
      });
    } else {
      setCommentReplies((current) => {
        const parentState = current[comment.parentId ?? -1] ?? createEmptyReplyState();
        return {
          ...current,
          [comment.parentId ?? -1]: {
            ...parentState,
            list: parentState.list.filter((item) => item.id !== comment.id),
          },
        };
      });
      setComments((current) =>
        replaceCommentInList(current, comment.parentId ?? -1, (item) => ({
          ...item,
          replyCount: Math.max(0, item.replyCount - 1),
        })),
      );
    }

    applyCommentCount(Math.max(0, previousTotal - deletedCount));

    try {
      await deleteComment(comment.id);
    } catch (error) {
      setComments(previousComments);
      setCommentReplies(previousReplies);
      applyCommentCount(previousTotal);
      showAlert(
        '댓글 삭제 실패',
        error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다.',
      );
    }
  };

  const handleSubmit = async () => {
    if (!diary || !user || !value.trim() || isSubmitting) {
      return;
    }

    if (editingComment) {
      const previousComments = comments;
      const previousReplies = cloneRepliesState(commentReplies);
      const trimmedValue = value.trim();

      setComments((current) =>
        replaceCommentInList(current, editingComment.id, (comment) => ({
          ...comment,
          content: trimmedValue,
          updatedAt: new Date().toISOString(),
        })),
      );
      setCommentReplies((current) => {
        const next = cloneRepliesState(current);
        Object.keys(next).forEach((key) => {
          const commentId = Number(key);
          next[commentId] = {
            ...next[commentId],
            list: replaceCommentInList(next[commentId].list, editingComment.id, (comment) => ({
              ...comment,
              content: trimmedValue,
              updatedAt: new Date().toISOString(),
            })),
          };
        });
        return next;
      });

      setIsSubmitting(true);
      setEditingComment(null);
      setValue('');

      try {
        await updateComment(editingComment.id, trimmedValue);
      } catch (error) {
        setComments(previousComments);
        setCommentReplies(previousReplies);
        setEditingComment(editingComment);
        setValue(trimmedValue);
        showAlert(
          '댓글 수정 실패',
          error instanceof Error ? error.message : '댓글을 수정하지 못했습니다.',
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const trimmedValue = value.trim();
    const tempId = Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      diaryId: diary.diaryId,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar ?? null,
      content: trimmedValue,
      parentId: replyTo?.id ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyCount: 0,
    };

    const previousTotal = totalComments;
    const nextTotal = previousTotal + 1;
    const originalReplyTo = replyTo;
    applyCommentCount(nextTotal);
    setIsSubmitting(true);
    setValue('');

    if (originalReplyTo) {
      const parentId = originalReplyTo.id;
      setComments((current) =>
        replaceCommentInList(current, parentId, (comment) => ({
          ...comment,
          replyCount: comment.replyCount + 1,
        })),
      );
      setCommentReplies((current) => {
        const parentState = current[parentId] ?? createEmptyReplyState();
        const hasHiddenReplies =
          parentState.hasMore || originalReplyTo.replyCount > parentState.list.length;
        return {
          ...current,
          [parentId]: {
            ...parentState,
            isShown: true,
            hasMore: hasHiddenReplies,
            list: [...parentState.list, optimisticComment],
          },
        };
      });
    } else {
      setComments((current) => [...current, optimisticComment]);
    }

    setReplyTo(null);

    try {
      const createdComment = await createComment({
        diaryId: diary.diaryId,
        content: trimmedValue,
        parentId: originalReplyTo?.id,
      });

      if (originalReplyTo) {
        setCommentReplies((current) => {
          const parentState = current[originalReplyTo.id] ?? createEmptyReplyState();
          return {
            ...current,
            [originalReplyTo.id]: {
              ...parentState,
              list: parentState.list.map((comment) =>
                comment.id === tempId ? { ...optimisticComment, ...createdComment } : comment,
              ),
            },
          };
        });
      } else {
        setComments((current) =>
          current.map((comment) =>
            comment.id === tempId ? { ...optimisticComment, ...createdComment } : comment,
          ),
        );
      }
    } catch (error) {
      applyCommentCount(previousTotal);
      if (originalReplyTo) {
        setComments((current) =>
          replaceCommentInList(current, originalReplyTo.id, (comment) => ({
            ...comment,
            replyCount: Math.max(0, comment.replyCount - 1),
          })),
        );
        setCommentReplies((current) => {
          const parentState = current[originalReplyTo.id] ?? createEmptyReplyState();
          return {
            ...current,
            [originalReplyTo.id]: {
              ...parentState,
              list: parentState.list.filter((comment) => comment.id !== tempId),
            },
          };
        });
        setReplyTo(originalReplyTo);
      } else {
        setComments((current) => current.filter((comment) => comment.id !== tempId));
      }
      setValue(trimmedValue);
      showAlert(
        '댓글 작성 실패',
        error instanceof Error ? error.message : '댓글을 작성하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = diary ? (
    <CommentComposer
      editingComment={editingComment}
      isLoggedIn={isLoggedIn}
      isSubmitting={isSubmitting}
      onCancelContext={handleCancelContext}
      onChange={setValue}
      onOpenLogin={handleOpenLogin}
      onOpenSignup={handleOpenSignup}
      onSubmit={() => {
        void handleSubmit();
      }}
      replyTo={replyTo}
      testIDPrefix={testIDPrefix}
      value={value}
    />
  ) : null;

  let commentsBody = null;

  if (diary) {
    if (commentsError) {
      commentsBody = (
        <ErrorState
          actionLabel="다시 시도"
          description={commentsError}
          onPressAction={() => {
            void loadRootComments(true);
          }}
          title="댓글을 불러오지 못했습니다."
        />
      );
    } else if (isLoadingComments && comments.length === 0) {
      commentsBody = <LoadingState label="댓글을 불러오는 중입니다." />;
    } else {
      commentsBody = (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={false}
          style={styles.commentsScroll}
          testID={`${testIDPrefix}-body`}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onFetchMoreReplies={(commentId) => {
                void handleFetchMoreReplies(commentId);
              }}
              onOpenActions={openCommentActions}
              onOpenProfile={handleOpenProfile}
              onReply={handleReply}
              onToggleReplies={(targetComment) => {
                void handleToggleReplies(targetComment);
              }}
              replies={commentReplies[comment.id]?.list ?? []}
              replyState={commentReplies[comment.id]}
              viewerUserId={user?.id}
            />
          ))}
          {comments.length === 0 && !isLoadingComments ? (
            <EmptyState
              description="첫 번째 댓글을 남겨보세요."
              title="아직 댓글이 없습니다."
            />
          ) : null}
          {hasMore && comments.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void loadRootComments();
              }}
              style={({ pressed }) => pressed && styles.pressed}
              testID={`${testIDPrefix}-load-more-button`}>
              <Text style={styles.loadMoreLabel}>다음 댓글 더 보기</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      );
    }
  }

  return (
    <BottomSheet
      footer={footer}
      heightRatio={0.84}
      onClose={onClose}
      title={diary ? `댓글 ${totalComments}개` : '댓글'}
      visible={visible}>
      {diary ? (
        <View style={styles.content}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleOpenProfile(diary.userId)}
                style={({ pressed }) => pressed && styles.pressed}
                testID={`${testIDPrefix}-profile-button`}>
                <Avatar name={diary.nickname} size={36} source={diary.avatar ?? null} />
              </Pressable>
              <View style={styles.previewText}>
                <Text style={styles.previewNickname}>{diary.nickname}</Text>
                <Text style={styles.previewMeta}>
                  {formatDiaryDate(diary.createdAt)} · {formatDiaryTimeAgo(diary.createdAt)}
                </Text>
                <Text numberOfLines={2} style={styles.previewBody}>
                  {diary.content}
                </Text>
              </View>
            </View>
            {onOpenDetail ? (
              <AppButton
                fullWidth={false}
                label="스토리 상세 보기"
                onPress={() => {
                  onClose();
                  onOpenDetail(diary);
                }}
                testID={`${testIDPrefix}-detail-button`}
                variant="ghost"
              />
            ) : null}
          </View>
          <View testID={`${testIDPrefix}-body`}>{commentsBody}</View>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  previewCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  previewText: {
    flex: 1,
    gap: spacing.xs,
  },
  previewNickname: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  previewMeta: {
    ...typography.caption,
    color: colors.mutedText,
  },
  previewBody: {
    ...typography.body,
    color: colors.text,
  },
  commentsScroll: {
    maxHeight: 340,
  },
  commentsContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  loadMoreLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
