import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import { FriendshipStatus } from '@/types/friend';
import type {
  DiaryMonthCountDTO,
  NicknameAvailabilityResponseDTO,
  UpdateProfilePayload,
  UpdateProfileResponseDTO,
  UserProfileResponseDTO,
} from '@/types/profile';

const shouldUseLocalProfileMock =
  process.env.NODE_ENV !== 'test' &&
  env.appEnv === 'local' &&
  (env.apiBaseUrl.includes('localhost') || env.apiBaseUrl.includes('api.example.com'));
const LOCAL_TAKEN_NICKNAMES = new Set(['test', '도리', '모아', '하루', '다온']);

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

export async function checkNicknameAvailability(
  nickname: string,
): Promise<NicknameAvailabilityResponseDTO> {
  const normalizedNickname = nickname.trim();

  if (shouldUseLocalProfileMock) {
    const isAvailable = normalizedNickname.length > 0 && !LOCAL_TAKEN_NICKNAMES.has(normalizedNickname);
    return {
      success: isAvailable,
      message: isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
    };
  }

  try {
    const response = await apiClient.get<NicknameAvailabilityResponseDTO>(
      '/users/nickname/availability',
      {
        params: { nickname: normalizedNickname },
      },
    );
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      const isAvailable = normalizedNickname.length > 0 && !LOCAL_TAKEN_NICKNAMES.has(normalizedNickname);
      return {
        success: isAvailable,
        message: isAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.',
      };
    }

    throw error;
  }
}

export async function updateUserProfile(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResponseDTO> {
  if (shouldUseLocalProfileMock) {
    return {
      success: true,
      message: '프로필이 성공적으로 변경되었습니다.',
      newNickname: payload.newNickname,
    };
  }

  try {
    const response = await apiClient.patch<UpdateProfileResponseDTO>('/users/profile', payload);
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return {
        success: true,
        message: '프로필이 성공적으로 변경되었습니다.',
        newNickname: payload.newNickname,
      };
    }

    throw error;
  }
}
