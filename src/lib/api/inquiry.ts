import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';

export interface InquiryImagePayload {
  uri: string;
  name: string;
  type: string;
}

export interface InquiryPayload {
  content: string;
  image?: InquiryImagePayload | null;
}

const shouldUseLocalInquiryMock =
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

export async function submitInquiry(payload: InquiryPayload) {
  if (shouldUseLocalInquiryMock) {
    return;
  }

  try {
    const formData = new FormData();
    formData.append('content', payload.content);

    if (payload.image) {
      formData.append('image', {
        uri: payload.image.uri,
        name: payload.image.name,
        type: payload.image.type,
      } as never);
    }

    await apiClient.post('/inquiry', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}
