import type { FriendshipStatus } from '@/types/friend';

export interface MonthlyDiary {
  diaryId: number;
  date: string;
  coverPhotoUrl: string | null;
}

export type DiaryVisibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE';

export interface FeedDiary {
  diaryId: number;
  status: DiaryVisibility;
  content: string;
  imgUrls: string[];
  date: string;
  nickname: string;
  avatar: string | null;
  userId: string;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  friendStatus?: FriendshipStatus | null;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

export interface DiaryAuthor {
  memberId?: number;
  nickname: string;
  avatar: string | null;
}

export interface DiaryComment {
  commentId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  member: DiaryAuthor;
}

export interface DiaryDetail {
  diaryId: number;
  content: string;
  date: string;
  status: DiaryVisibility;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  imgUrls: string[];
  nickname: string;
  avatar: string | null;
  userId: string;
  comments?: DiaryComment[];
}

export interface DiaryImageInfo {
  type: 'AI_IMAGE' | 'USER_IMAGE';
  order: number;
  aiPhotoId?: number;
  photoIndex?: number;
}

export interface UploadablePhotoFile {
  uri: string;
  name: string;
  type: string;
}

export interface ComposePhoto {
  id: string;
  type: 'ai' | 'user';
  previewUri: string;
  sourceKey?: string;
  aiPhotoId?: number;
  uploadFile?: UploadablePhotoFile;
}

export interface DiaryCreatePayload {
  diary: {
    status: DiaryVisibility;
    content: string;
    date: string;
    imageInfos: DiaryImageInfo[];
  };
  photos: UploadablePhotoFile[];
}

export interface AiPhotoResult {
  id: number;
  url: string;
}
