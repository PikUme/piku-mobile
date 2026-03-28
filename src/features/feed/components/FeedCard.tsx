import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import type { FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { formatFeedDate } from '@/features/feed/lib/format';

interface FeedCardProps {
  post: FeedDiary;
  isLoggedIn: boolean;
  isLikePending?: boolean;
  viewerUserId?: string;
  onOpenDetail: (post: FeedDiary) => void;
  onToggleLike: (post: FeedDiary) => void;
  onOpenComments: (post: FeedDiary) => void;
  onSendFriendRequest: (post: FeedDiary) => void;
  onCancelFriendRequest: (post: FeedDiary) => void;
  onOpenFriendRequests: () => void;
}

export function FeedCard({
  post,
  isLoggedIn,
  isLikePending = false,
  viewerUserId,
  onOpenDetail,
  onToggleLike,
  onOpenComments,
  onSendFriendRequest,
  onCancelFriendRequest,
  onOpenFriendRequests,
}: FeedCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [mediaWidth, setMediaWidth] = useState(0);
  const { width } = useWindowDimensions();
  const imageSize = mediaWidth || Math.max(width - spacing['2xl'] * 2, 280);
  const collapsedPreviewText = post.content.replace(/\s+/g, ' ').trim();

  const canShowFriendAction = isLoggedIn && viewerUserId !== post.userId;
  const friendshipStatus = post.friendStatus ?? FriendshipStatus.NONE;

  useEffect(() => {
    setIsExpanded(false);
    setCanExpand(false);
  }, [post.content, post.diaryId]);

  const handleImageMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (!width) {
      return;
    }

    setCurrentImageIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const handleMediaLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);

    if (nextWidth > 0 && nextWidth !== mediaWidth) {
      setMediaWidth(nextWidth);
    }
  };

  const renderFriendAction = () => {
    if (!canShowFriendAction) {
      return null;
    }

    switch (friendshipStatus) {
      case FriendshipStatus.NONE:
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => onSendFriendRequest(post)}
            style={({ pressed }) => [styles.friendActionButton, pressed && styles.pressed]}
            testID={`feed-friend-action-${post.diaryId}`}>
            <Text style={styles.friendActionLabel}>친구 추가</Text>
          </Pressable>
        );
      case FriendshipStatus.SENT:
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => onCancelFriendRequest(post)}
            style={({ pressed }) => [styles.friendActionButton, pressed && styles.pressed]}
            testID={`feed-friend-action-${post.diaryId}`}>
            <Text style={styles.friendActionLabel}>요청 취소</Text>
          </Pressable>
        );
      case FriendshipStatus.RECEIVED:
        return (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenFriendRequests}
            style={({ pressed }) => [styles.friendActionButton, pressed && styles.pressed]}
            testID={`feed-friend-action-${post.diaryId}`}>
            <Text style={styles.friendActionLabel}>요청 확인</Text>
          </Pressable>
        );
      case FriendshipStatus.FRIEND:
        return (
          <View style={styles.friendStatusChip} testID={`feed-friend-action-${post.diaryId}`}>
            <Text style={styles.friendStatusLabel}>친구</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card} testID={`feed-card-${post.diaryId}`}>
      <View style={styles.header}>
        <View style={styles.profileBlock}>
          <Avatar name={post.nickname} size={40} source={post.avatar ?? null} />
          <View style={styles.profileTextBlock}>
            <Text numberOfLines={1} style={styles.nickname}>
              {post.nickname}
            </Text>
            <Text numberOfLines={1} style={styles.dateText}>
              {formatFeedDate(post.date)}
            </Text>
          </View>
        </View>
        {renderFriendAction()}
      </View>

      <View onLayout={handleMediaLayout} style={styles.mediaSection}>
        {post.imgUrls.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={handleImageMomentumEnd}
            showsHorizontalScrollIndicator={false}
            style={[styles.imageScroller, { height: imageSize }]}
            testID={`feed-image-carousel-${post.diaryId}`}>
            {post.imgUrls.map((imageUrl, index) => (
              <Pressable
                key={`${post.diaryId}-${index}`}
                accessibilityRole="button"
                onPress={() => onOpenDetail(post)}
                style={({ pressed }) => [
                  styles.mediaPressable,
                  { width: imageSize, height: imageSize },
                  pressed && styles.pressed,
                ]}
                testID={
                  index === 0
                    ? `feed-card-open-${post.diaryId}`
                    : `feed-card-open-${post.diaryId}-${index}`
                }>
                <Image
                  source={{ uri: imageUrl }}
                  style={[styles.image, { width: imageSize, height: imageSize }]}
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenDetail(post)}
            style={({ pressed }) => [styles.mediaPressable, pressed && styles.pressed]}
            testID={`feed-card-open-${post.diaryId}`}>
            <View style={styles.imageFallback}>
              <Ionicons color={colors.mutedText} name="image-outline" size={26} />
            </View>
          </Pressable>
        )}
        {post.imgUrls.length > 1 ? (
          <View style={styles.paginationRow} testID={`feed-image-pagination-${post.diaryId}`}>
            <Text style={styles.paginationLabel} testID={`feed-image-pagination-label-${post.diaryId}`}>
              {currentImageIndex + 1} / {post.imgUrls.length}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: post.isLiked }}
          disabled={isLikePending}
          onPress={() => onToggleLike(post)}
          style={({ pressed }) => [
            styles.commentButton,
            isLikePending && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          testID={`feed-like-button-${post.diaryId}`}>
          <Ionicons
            color={post.isLiked ? colors.black : colors.text}
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={18}
          />
          <Text style={styles.commentLabel} testID={`feed-like-count-${post.diaryId}`}>
            {post.likeCount}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenComments(post)}
          style={({ pressed }) => [styles.commentButton, pressed && styles.pressed]}
          testID={`feed-comment-button-${post.diaryId}`}>
          <Ionicons color={colors.text} name="chatbubble-outline" size={18} />
          <Text style={styles.commentLabel}>댓글 {post.commentCount}</Text>
        </Pressable>
      </View>

      <View style={styles.contentBlock}>
        {!isExpanded ? (
          <Text
            onTextLayout={(event) => {
              setCanExpand(event.nativeEvent.lines.length > 1);
            }}
            style={styles.contentMeasureText}
            testID={`feed-content-measure-${post.diaryId}`}>
            <Text style={styles.contentNickname}>{post.nickname} </Text>
            {collapsedPreviewText}
          </Text>
        ) : null}
        {canExpand && !isExpanded ? (
          <View style={styles.contentInlineRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenDetail(post)}
              style={({ pressed }) => [styles.contentInlinePressable, pressed && styles.pressed]}
              testID={`feed-content-open-${post.diaryId}`}>
              <Text
                ellipsizeMode="tail"
                numberOfLines={1}
                style={styles.contentText}
                testID={`feed-content-text-${post.diaryId}`}>
                <Text style={styles.contentNickname}>{post.nickname} </Text>
                {collapsedPreviewText}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsExpanded(true)}
              style={({ pressed }) => [styles.moreInlineButton, pressed && styles.pressed]}
              testID={`feed-content-more-${post.diaryId}`}>
              <Text style={styles.moreLabel}>더보기</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpenDetail(post)}
            style={({ pressed }) => pressed && styles.pressed}
            testID={`feed-content-open-${post.diaryId}`}>
            <Text
              numberOfLines={isExpanded ? undefined : 1}
              style={styles.contentText}
              testID={`feed-content-text-${post.diaryId}`}>
              <Text style={styles.contentNickname}>{post.nickname} </Text>
              {post.content}
            </Text>
          </Pressable>
        )}
      </View>
      {/* <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text> */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  profileBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  nickname: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dateText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  friendActionButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  friendActionLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  friendStatusChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  friendStatusLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  mediaPressable: {
    position: 'relative',
  },
  mediaSection: {
    backgroundColor: colors.surface,
  },
  imageScroller: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
  },
  imageFallback: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  paginationRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
  },
  paginationLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  commentButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  disabledButton: {
    opacity: 0.45,
  },
  commentLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  contentBlock: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  contentMeasureText: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
    opacity: 0,
    ...typography.body,
    color: 'transparent',
  },
  contentInlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  contentInlinePressable: {
    flex: 1,
    minWidth: 0,
  },
  contentText: {
    ...typography.body,
    color: colors.text,
  },
  contentNickname: {
    fontWeight: '700',
  },
  moreInlineButton: {
    flexShrink: 0,
    marginLeft: 2,
  },
  moreLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  timeAgo: {
    ...typography.caption,
    color: colors.mutedText,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  pressed: {
    opacity: 0.82,
  },
});
