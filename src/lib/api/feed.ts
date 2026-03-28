import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type { CursorPage, FeedDiary } from '@/types/diary';
import { FriendshipStatus } from '@/types/friend';

interface FeedLikeResponseRaw {
  diaryId: number;
  likeCount: number;
  liked: boolean;
}

export interface FeedLikeResponse {
  diaryId: number;
  likeCount: number;
  isLiked: boolean;
}

const LOCAL_FEED_ITEMS: FeedDiary[] = [
  {
    diaryId: 1001,
    status: 'PUBLIC',
    content:
      '도심 산책길에서 찍은 장면과 함께 오늘의 기록을 남깁니다. 날씨가 맑아서 사진이 선명하게 잘 나왔어요.',
    imgUrls: [
      'https://picsum.photos/seed/pikume-feed-1001-1/900/900',
      'https://picsum.photos/seed/pikume-feed-1001-2/900/900',
    ],
    date: '2026-03-07',
    nickname: '소담',
    avatar: '',
    userId: 'user-201',
    createdAt: '2026-03-07T22:15:00.000Z',
    commentCount: 3,
    likeCount: 5,
    isLiked: false,
    friendStatus: FriendshipStatus.NONE,
  },
  {
    diaryId: 1002,
    status: 'PUBLIC',
    content: '오늘은 짧게 한 줄만 남겼습니다.',
    imgUrls: ['https://picsum.photos/seed/pikume-feed-1002-1/900/900'],
    date: '2026-03-06',
    nickname: '도리',
    avatar: '',
    userId: 'user-2',
    createdAt: '2026-03-06T09:10:00.000Z',
    commentCount: 1,
    likeCount: 2,
    isLiked: false,
    friendStatus: FriendshipStatus.SENT,
  },
  {
    diaryId: 1003,
    status: 'PUBLIC',
    content:
      '친구 요청이 도착한 상태를 확인하기 위한 예시 카드입니다. 이미지가 여러 장일 때도 좌우로 넘길 수 있어야 합니다.',
    imgUrls: [
      'https://picsum.photos/seed/pikume-feed-1003-1/900/900',
      'https://picsum.photos/seed/pikume-feed-1003-2/900/900',
      'https://picsum.photos/seed/pikume-feed-1003-3/900/900',
    ],
    date: '2026-03-05',
    nickname: '모아',
    avatar: '',
    userId: 'user-3',
    createdAt: '2026-03-05T14:40:00.000Z',
    commentCount: 7,
    likeCount: 12,
    isLiked: false,
    friendStatus: FriendshipStatus.RECEIVED,
  },
  {
    diaryId: 1004,
    status: 'PUBLIC',
    content: '내가 작성한 글은 친구 CTA가 노출되지 않습니다.',
    imgUrls: ['https://picsum.photos/seed/pikume-feed-1004-1/900/900'],
    date: '2026-03-04',
    nickname: 'test',
    avatar: '',
    userId: 'user-1',
    createdAt: '2026-03-04T08:00:00.000Z',
    commentCount: 0,
    likeCount: 0,
    isLiked: false,
    friendStatus: FriendshipStatus.NONE,
  },
];

const shouldUseLocalFeedMock =
  process.env.NODE_ENV !== 'test' &&
  env.appEnv === 'local' &&
  (env.apiBaseUrl.includes('localhost') || env.apiBaseUrl.includes('api.example.com'));

const isRecoverableLocalNetworkError = (error: unknown) => {
  if (env.appEnv !== 'local') {
    return false;
  }

  const apiError = error as ApiError;
  if (typeof apiError?.status === 'number') {
    return false;
  }

  return (
    apiError?.code === 'ERR_NETWORK' ||
    apiError?.code === 'ECONNABORTED' ||
    apiError?.message === 'Network Error' ||
    apiError?.message?.toLowerCase().includes('timeout') === true
  );
};

function getLocalFeedCursor(
  cursor?: string | null,
  limit = 20,
): CursorPage<FeedDiary> {
  const start =
    cursor === 'cursor-2' ? 2 : cursor === 'cursor-3' ? 4 : 0;
  const items = LOCAL_FEED_ITEMS.slice(start, start + limit);
  const nextIndex = start + items.length;

  return {
    items,
    nextCursor:
      nextIndex < LOCAL_FEED_ITEMS.length
        ? nextIndex === 2
          ? 'cursor-2'
          : 'cursor-3'
        : null,
    hasNext: nextIndex < LOCAL_FEED_ITEMS.length,
  };
}

const toFeedLikeResponse = (raw: FeedLikeResponseRaw): FeedLikeResponse => ({
  diaryId: raw.diaryId,
  likeCount: raw.likeCount,
  isLiked: raw.liked,
});

const updateLocalFeedLike = (diaryId: number, nextLiked: boolean): FeedLikeResponse => {
  const target = LOCAL_FEED_ITEMS.find((item) => item.diaryId === diaryId);
  if (!target) {
    throw new Error('좋아요 대상을 찾을 수 없습니다.');
  }

  target.isLiked = nextLiked;
  target.likeCount = Math.max(0, target.likeCount + (nextLiked ? 1 : -1));

  return {
    diaryId: target.diaryId,
    likeCount: target.likeCount,
    isLiked: target.isLiked,
  };
};

export async function getFeedCursor(
  cursor?: string | null,
  limit = 20,
): Promise<CursorPage<FeedDiary>> {
  if (shouldUseLocalFeedMock) {
    return getLocalFeedCursor(cursor, limit);
  }

  try {
    const params: Record<string, string | number> = { limit };
    if (cursor != null) {
      params.cursor = cursor;
    }

    const response = await apiClient.get<CursorPage<FeedDiary>>('/diary', {
      params,
    });

    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return getLocalFeedCursor(cursor, limit);
    }

    throw error;
  }
}

export async function addFeedLike(diaryId: number): Promise<FeedLikeResponse> {
  if (shouldUseLocalFeedMock) {
    return updateLocalFeedLike(diaryId, true);
  }

  const response = await apiClient.post<FeedLikeResponseRaw>(`/likes/diary/${diaryId}`);
  return toFeedLikeResponse(response.data);
}

export async function removeFeedLike(diaryId: number): Promise<FeedLikeResponse> {
  if (shouldUseLocalFeedMock) {
    return updateLocalFeedLike(diaryId, false);
  }

  const response = await apiClient.delete<FeedLikeResponseRaw>(`/likes/diary/${diaryId}`);
  return toFeedLikeResponse(response.data);
}
