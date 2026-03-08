import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type {
  Friend,
  FriendRequestDto,
  FriendRequestResponseDto,
  PaginatedFriendsResponse,
} from '@/types/friend';

const LOCAL_HOME_FRIENDS: Friend[] = [
  {
    userId: 'user-2',
    nickname: '도리',
    avatar: '',
  },
  {
    userId: 'user-3',
    nickname: '모아',
    avatar: '',
  },
  {
    userId: 'user-4',
    nickname: '하루',
    avatar: '',
  },
];

const shouldUseLocalFriendMock =
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

function getLocalFriendPage(page: number, size: number): PaginatedFriendsResponse {
  const start = page * size;
  const end = start + size;
  const friends = LOCAL_HOME_FRIENDS.slice(start, end);

  return {
    friends,
    hasNext: end < LOCAL_HOME_FRIENDS.length,
    totalElements: LOCAL_HOME_FRIENDS.length,
  };
}

export async function getFriends(
  page: number,
  size: number,
): Promise<PaginatedFriendsResponse> {
  if (shouldUseLocalFriendMock) {
    return getLocalFriendPage(page, size);
  }

  try {
    const response = await apiClient.get('/relation', {
      params: { page, size },
    });

    return {
      friends: response.data.content,
      hasNext: !response.data.last,
      totalElements: response.data.totalElements,
    };
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return getLocalFriendPage(page, size);
    }

    throw error;
  }
}

export async function getAllFriends(pageSize = 20): Promise<Friend[]> {
  const friends: Friend[] = [];
  let page = 0;
  let hasNext = true;

  while (hasNext) {
    const response = await getFriends(page, pageSize);
    friends.push(...response.friends);
    hasNext = response.hasNext;
    page += 1;
  }

  return friends;
}

export async function sendFriendRequest(
  userId: string,
): Promise<FriendRequestResponseDto> {
  if (shouldUseLocalFriendMock) {
    return {
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    };
  }

  try {
    const requestData: FriendRequestDto = { toUserId: userId };
    const response = await apiClient.post<FriendRequestResponseDto>(
      '/relation',
      requestData,
    );
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return {
        isAccepted: false,
        message: '친구 요청을 보냈습니다.',
      };
    }

    throw error;
  }
}

export async function cancelFriendRequest(
  userId: string,
): Promise<FriendRequestResponseDto> {
  if (shouldUseLocalFriendMock) {
    return {
      isAccepted: false,
      message: '친구 요청을 취소했습니다.',
    };
  }

  try {
    const response = await apiClient.delete<FriendRequestResponseDto>(
      `/relation/cancel/${userId}`,
    );
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return {
        isAccepted: false,
        message: '친구 요청을 취소했습니다.',
      };
    }

    throw error;
  }
}
