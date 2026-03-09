import { useCallback } from 'react';

import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import type { FeedDiary } from '@/types/diary';

interface FeedCommentSheetProps {
  visible: boolean;
  post: FeedDiary | null;
  onClose: () => void;
  onCommentCountChange?: (diaryId: number, count: number) => void;
}

export function FeedCommentSheet({
  visible,
  post,
  onClose,
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

  return (
    <DiaryCommentSheet
      diary={post}
      onClose={onClose}
      onCommentCountChange={handleCommentCountChange}
      testIDPrefix="feed-comment-sheet"
      visible={visible}
    />
  );
}
