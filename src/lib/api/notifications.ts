import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type { Page } from '@/types/api';
import type { AppNotification } from '@/types/notification';

const LOCAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 501,
    message: '님의 새 일기를 확인해보세요.',
    nickname: '도리',
    avatarUrl: '',
    type: 'FRIEND_DIARY',
    relatedDiaryId: 202603080,
    thumbnailUrl: 'https://picsum.photos/seed/notification-501/120/120',
    isRead: false,
    diaryDate: '2026-03-08',
    diaryUserId: 'user-2',
  },
  {
    id: 502,
    message: '님이 댓글을 남겼습니다.',
    nickname: '모아',
    avatarUrl: '',
    type: 'COMMENT',
    relatedDiaryId: 202603070,
    thumbnailUrl: 'https://picsum.photos/seed/notification-502/120/120',
    isRead: false,
    diaryDate: '2026-03-07',
    diaryUserId: 'user-3',
  },
  {
    id: 503,
    message: '님이 회원님의 댓글에 답글을 남겼습니다.',
    nickname: '하루',
    avatarUrl: '',
    type: 'REPLY',
    relatedDiaryId: 202603060,
    thumbnailUrl: null,
    isRead: true,
    diaryDate: '2026-03-06',
    diaryUserId: 'user-4',
  },
  {
    id: 504,
    message: '님이 친구 요청을 보냈습니다.',
    nickname: '다온',
    avatarUrl: '',
    type: 'FRIEND_REQUEST',
    relatedDiaryId: null,
    thumbnailUrl: null,
    isRead: false,
    diaryDate: null,
    diaryUserId: 'user-8',
  },
  {
    id: 505,
    message: '님과 친구가 되었습니다.',
    nickname: '시우',
    avatarUrl: '',
    type: 'FRIEND_ACCEPT',
    relatedDiaryId: null,
    thumbnailUrl: null,
    isRead: true,
    diaryDate: null,
    diaryUserId: 'user-9',
  },
];

const shouldUseLocalNotificationMock =
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

function buildLocalNotificationPage(page: number, size: number): Page<AppNotification> {
  const start = page * size;
  const end = start + size;
  const content = LOCAL_NOTIFICATIONS.slice(start, end);

  return {
    content,
    last: end >= LOCAL_NOTIFICATIONS.length,
    totalElements: LOCAL_NOTIFICATIONS.length,
    number: page,
    size,
  };
}

export async function getNotifications(page = 0, size = 20): Promise<Page<AppNotification>> {
  if (shouldUseLocalNotificationMock) {
    return buildLocalNotificationPage(page, size);
  }

  try {
    const response = await apiClient.get<Page<AppNotification>>('/sse/notifications', {
      params: { page, size },
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalNotificationPage(page, size);
    }

    throw error;
  }
}

export async function markNotificationAsRead(notificationId: number) {
  if (shouldUseLocalNotificationMock) {
    return;
  }

  try {
    await apiClient.patch(`/sse/${notificationId}`);
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}

export async function markAllNotificationsAsRead() {
  if (shouldUseLocalNotificationMock) {
    return;
  }

  try {
    await apiClient.patch('/sse/notifications');
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}

export async function deleteNotification(notificationId: number) {
  if (shouldUseLocalNotificationMock) {
    return;
  }

  try {
    await apiClient.delete(`/sse/${notificationId}`);
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}
