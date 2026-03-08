import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';

const shouldUseLocalPushMock =
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

export async function registerPushToken(userId: string, token: string, deviceId: string) {
  if (shouldUseLocalPushMock) {
    return;
  }

  try {
    await apiClient.post('/fcm', {
      userId,
      token,
      deviceId,
    });
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}
