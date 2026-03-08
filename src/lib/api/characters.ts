import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type { FixedCharacter } from '@/types/character';

const LOCAL_FIXED_CHARACTERS: FixedCharacter[] = [
  { id: 1, type: 'fox', displayImageUrl: '' },
  { id: 2, type: 'cat', displayImageUrl: '' },
  { id: 3, type: 'bear', displayImageUrl: '' },
  { id: 4, type: 'rabbit', displayImageUrl: '' },
];

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

export async function getFixedCharacters(): Promise<FixedCharacter[]> {
  try {
    const response = await apiClient.get<FixedCharacter[]>('/characters/fixed');
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return LOCAL_FIXED_CHARACTERS;
    }

    throw error;
  }
}
