import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import type { FeedDiary } from '@/types/diary';

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
  return (
    <DiaryCommentSheet
      diary={post}
      onClose={onClose}
      onCommentCountChange={(count) => {
        if (!post) {
          return;
        }

        onCommentCountChange?.(post.diaryId, count);
      }}
      onOpenDetail={(diary) => {
        if (!post) {
          return;
        }

        onOpenDetail({
          ...post,
          commentCount: diary.commentCount,
        });
      }}
      testIDPrefix="feed-comment-sheet"
      visible={visible}
    />
  );
}
