import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import { FriendshipStatus } from '@/types/friend';
import type { DiaryMonthCountDTO, UserProfileResponseDTO } from '@/types/profile';

const shouldUseLocalProfileMock =
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

function getSeedFromUserId(userId: string) {
  return Array.from(userId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildMonthlyDiaryCount(seed: number): DiaryMonthCountDTO[] {
  const year = 2026;
  return [1, 2, 3, 4, 5].map((month) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const count = Math.min(daysInMonth, 4 + ((seed + month * 3) % 12));

    return {
      year,
      month,
      count,
      daysInMonth,
    };
  });
}

export function buildLocalProfilePreviewMock(userId: string): UserProfileResponseDTO {
  const seed = getSeedFromUserId(userId);
  const isOwner = userId === 'user-1';
  const nicknameMap: Record<string, string> = {
    'user-1': 'test',
    'user-2': '도리',
    'user-3': '모아',
    'user-4': '하루',
    'user-8': '다온',
  };

  return {
    id: userId,
    userId,
    nickname: nicknameMap[userId] ?? `사용자 ${seed % 100}`,
    avatar: '',
    friendCount: 12 + (seed % 8),
    diaryCount: 18 + (seed % 15),
    friendStatus: isOwner
      ? FriendshipStatus.FRIEND
      : userId === 'user-2'
        ? FriendshipStatus.FRIEND
        : userId === 'user-3'
          ? FriendshipStatus.SENT
          : userId === 'user-8'
            ? FriendshipStatus.RECEIVED
            : FriendshipStatus.NONE,
    isOwner,
    monthlyDiaryCount: buildMonthlyDiaryCount(seed),
  };
}

export async function getProfileInfo(userId: string): Promise<UserProfileResponseDTO> {
  if (shouldUseLocalProfileMock) {
    return buildLocalProfilePreviewMock(userId);
  }

  try {
    const response = await apiClient.get<UserProfileResponseDTO>(`/users/${userId}/profile-preview`);
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalProfilePreviewMock(userId);
    }

    throw error;
  }
}
