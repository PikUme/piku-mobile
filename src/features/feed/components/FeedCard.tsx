import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
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
import { formatFeedDate, formatTimeAgo } from '@/features/feed/lib/format';

interface FeedCardProps {
  post: FeedDiary;
  isLoggedIn: boolean;
  viewerUserId?: string;
  onOpenDetail: (post: FeedDiary) => void;
  onOpenComments: (post: FeedDiary) => void;
  onSendFriendRequest: (post: FeedDiary) => void;
  onCancelFriendRequest: (post: FeedDiary) => void;
  onOpenFriendRequests: () => void;
}

export function FeedCard({
  post,
  isLoggedIn,
  viewerUserId,
  onOpenDetail,
  onOpenComments,
  onSendFriendRequest,
  onCancelFriendRequest,
  onOpenFriendRequests,
}: FeedCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const { width } = useWindowDimensions();
  const imageSize = Math.max(width - spacing['2xl'] * 2, 280);

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

      <Pressable
        accessibilityRole="button"
        onPress={() => onOpenDetail(post)}
        style={({ pressed }) => [styles.mediaPressable, pressed && styles.pressed]}
        testID={`feed-card-open-${post.diaryId}`}>
        {post.imgUrls.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={handleImageMomentumEnd}
            showsHorizontalScrollIndicator={false}
            style={[styles.imageScroller, { height: imageSize }]}
            testID={`feed-image-carousel-${post.diaryId}`}>
            {post.imgUrls.map((imageUrl, index) => (
              <Image
                key={`${post.diaryId}-${index}`}
                source={{ uri: imageUrl }}
                style={[styles.image, { width: imageSize, height: imageSize }]}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons color={colors.mutedText} name="image-outline" size={26} />
          </View>
        )}
        {post.imgUrls.length > 1 ? (
          <View style={styles.pagination}>
            {post.imgUrls.map((_, index) => (
              <View
                key={`${post.diaryId}-dot-${index}`}
                style={[
                  styles.paginationDot,
                  index === currentImageIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        ) : null}
      </Pressable>

      <View style={styles.footer}>
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
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpenDetail(post)}
          style={({ pressed }) => pressed && styles.pressed}
          testID={`feed-content-open-${post.diaryId}`}>
          <Text
            numberOfLines={isExpanded ? undefined : 1}
            onTextLayout={(event) => {
              if (isExpanded) {
                return;
              }

              setCanExpand(event.nativeEvent.lines.length > 1);
            }}
            style={styles.contentText}
            testID={`feed-content-text-${post.diaryId}`}>
            <Text style={styles.contentNickname}>{post.nickname} </Text>
            {post.content}
          </Text>
        </Pressable>
        {!isExpanded && canExpand ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsExpanded(true)}
            style={({ pressed }) => pressed && styles.pressed}
            testID={`feed-content-more-${post.diaryId}`}>
            <Text style={styles.moreLabel}>더 보기</Text>
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.timeAgo}>{formatTimeAgo(post.createdAt)}</Text>
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
  pagination: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  paginationDotActive: {
    backgroundColor: colors.white,
    width: 18,
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
  commentLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  contentBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  contentText: {
    ...typography.body,
    color: colors.text,
  },
  contentNickname: {
    fontWeight: '700',
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
