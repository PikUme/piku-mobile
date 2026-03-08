export interface Comment {
  id: number;
  diaryId: number;
  userId: string;
  nickname: string;
  avatar: string | null;
  content: string;
  parentId: number | null;
  createdAt: string;
  updatedAt?: string;
  replyCount: number;
}

export interface CommentPage {
  content: Comment[];
  last: boolean;
  totalElements: number;
}

export interface CommentCreatePayload {
  diaryId: number;
  content: string;
  parentId?: number;
}

export interface CommentSheetDiaryPreview {
  diaryId: number;
  content: string;
  commentCount: number;
  nickname: string;
  avatar: string | null;
  userId: string;
  createdAt: string;
  imgUrls?: string[];
}

export interface CommentRepliesState {
  list: Comment[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isShown: boolean;
}
