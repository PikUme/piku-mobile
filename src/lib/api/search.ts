import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type { Page } from '@/types/api';
import type { Friend } from '@/types/friend';

const LOCAL_SEARCH_USERS: Friend[] = [
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
  {
    userId: 'user-5',
    nickname: '소담',
    avatar: '',
  },
  {
    userId: 'user-6',
    nickname: '도윤',
    avatar: '',
  },
  {
    userId: 'user-7',
    nickname: '하민',
    avatar: '',
  },
];

const shouldUseLocalSearchMock =
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

function buildLocalSearchPage(keyword: string, page: number, size: number): Page<Friend> {
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredUsers = normalizedKeyword
    ? LOCAL_SEARCH_USERS.filter((user) =>
        user.nickname.toLowerCase().includes(normalizedKeyword),
      )
    : [];
  const start = page * size;
  const end = start + size;
  const content = filteredUsers.slice(start, end);

  return {
    content,
    last: end >= filteredUsers.length,
    totalElements: filteredUsers.length,
    number: page,
    size,
  };
}

export async function searchUsers(
  keyword: string,
  page: number,
  size = 10,
): Promise<Page<Friend>> {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    return {
      content: [],
      last: true,
      totalElements: 0,
      number: page,
      size,
    };
  }

  if (shouldUseLocalSearchMock) {
    return buildLocalSearchPage(normalizedKeyword, page, size);
  }

  try {
    const response = await apiClient.get<Page<Friend>>('/search', {
      params: {
        keyword: normalizedKeyword,
        page,
        size,
      },
    });

    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalSearchPage(normalizedKeyword, page, size);
    }

    throw error;
  }
}
