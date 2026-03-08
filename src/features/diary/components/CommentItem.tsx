import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { formatDiaryTimeAgo } from '@/features/diary/lib/detail';
import type { Comment, CommentRepliesState } from '@/types/comment';
import { colors, spacing, typography } from '@/theme';

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  replyState?: CommentRepliesState;
  viewerUserId?: string;
  nested?: boolean;
  onOpenProfile: (userId: string) => void;
  onReply?: (comment: Comment) => void;
  onToggleReplies?: (comment: Comment) => void;
  onFetchMoreReplies?: (commentId: number) => void;
  onOpenActions?: (comment: Comment) => void;
}

export function CommentItem({
  comment,
  replies,
  replyState,
  viewerUserId,
  nested = false,
  onOpenProfile,
  onReply,
  onToggleReplies,
  onFetchMoreReplies,
  onOpenActions,
}: CommentItemProps) {
  const isOwner = Boolean(viewerUserId) && viewerUserId === comment.userId;
  const showReplies = replyState?.isShown ?? false;
  const hasMoreReplies = replyState?.hasMore ?? false;
  const isLoadingReplies = replyState?.isLoading ?? false;

  return (
    <View
      style={[styles.container, nested && styles.nestedContainer]}
      testID={`comment-item-${comment.id}`}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenProfile(comment.userId)}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          testID={`comment-profile-button-${comment.id}`}>
          <Avatar name={comment.nickname} size={nested ? 28 : 32} source={comment.avatar ?? null} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onLongPress={() => {
            if (isOwner) {
              onOpenActions?.(comment);
            }
          }}
          style={({ pressed }) => [styles.body, pressed && styles.pressed]}
          testID={`comment-body-${comment.id}`}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenProfile(comment.userId)}
              style={({ pressed }) => pressed && styles.pressed}
              testID={`comment-name-button-${comment.id}`}>
              <Text style={styles.nickname}>{comment.nickname}</Text>
            </Pressable>
            <Text style={styles.timeAgo}>{formatDiaryTimeAgo(comment.createdAt)}</Text>
            {isOwner ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onOpenActions?.(comment)}
                style={({ pressed }) => pressed && styles.pressed}
                testID={`comment-more-button-${comment.id}`}>
                <Ionicons color={colors.mutedText} name="ellipsis-horizontal" size={16} />
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.content}>{comment.content}</Text>
          <View style={styles.actionsRow}>
            {comment.parentId === null ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onReply?.(comment)}
                style={({ pressed }) => pressed && styles.pressed}
                testID={`comment-reply-button-${comment.id}`}>
                <Text style={styles.actionLabel}>답글 달기</Text>
              </Pressable>
            ) : null}
            {comment.replyCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => onToggleReplies?.(comment)}
                style={({ pressed }) => pressed && styles.pressed}
                testID={`comment-toggle-replies-${comment.id}`}>
                <Text style={styles.actionLabel}>
                  {showReplies ? '답글 숨기기' : `답글 보기 (${comment.replyCount})`}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </View>

      {showReplies ? (
        <View style={styles.repliesBlock}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              nested
              onOpenActions={onOpenActions}
              onOpenProfile={onOpenProfile}
              replies={[]}
              viewerUserId={viewerUserId}
            />
          ))}
          {isLoadingReplies ? (
            <Text style={styles.helperLabel}>답글을 불러오는 중입니다.</Text>
          ) : null}
          {!isLoadingReplies && hasMoreReplies ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onFetchMoreReplies?.(comment.id)}
              style={({ pressed }) => pressed && styles.pressed}
              testID={`comment-load-more-replies-${comment.id}`}>
              <Text style={styles.actionLabel}>답글 더 보기</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  nestedContainer: {
    marginLeft: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatarButton: {
    paddingTop: 2,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nickname: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.mutedText,
    flex: 1,
  },
  content: {
    ...typography.body,
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  repliesBlock: {
    gap: spacing.sm,
    marginLeft: spacing['2xl'],
  },
  helperLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  pressed: {
    opacity: 0.82,
  },
});
