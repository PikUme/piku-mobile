import { useCallback } from 'react';

import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import type { FeedDiary } from '@/types/diary';
import type { CommentSheetDiaryPreview } from '@/types/comment';

interface FeedCommentSheetProps {
  visible: boolean;
  post: FeedDiary | null;
  onClose: () => void;
  onOpenDetail: (post: FeedDiary) => void;
  onCommentCountChange?: (diaryId: number, count: number) => void;
}

export function FeedCommentSheet({
  visible,
  post,
  onClose,
  onOpenDetail,
  onCommentCountChange,
}: FeedCommentSheetProps) {
  const postDiaryId = post?.diaryId ?? null;

  const handleCommentCountChange = useCallback(
    (count: number) => {
      if (postDiaryId === null) {
        return;
      }

      onCommentCountChange?.(postDiaryId, count);
    },
    [onCommentCountChange, postDiaryId],
  );

  const handleOpenDetail = useCallback(
    (diary: CommentSheetDiaryPreview) => {
      if (!post) {
        return;
      }

      onOpenDetail({
        ...post,
        commentCount: diary.commentCount,
      });
    },
    [onOpenDetail, post],
  );

  return (
    <DiaryCommentSheet
      diary={post}
      onClose={onClose}
      onCommentCountChange={handleCommentCountChange}
      onOpenDetail={handleOpenDetail}
      testIDPrefix="feed-comment-sheet"
      visible={visible}
    />
  );
}
