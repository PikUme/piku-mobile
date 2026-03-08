import { isAxiosError } from 'axios';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const message =
      (typeof error.response?.data === 'object' &&
      error.response?.data &&
      'message' in error.response.data
        ? String(error.response.data.message)
        : undefined) ??
      error.message ??
      '요청 처리 중 오류가 발생했습니다.';

    const apiError = new Error(message) as ApiError;
    apiError.status = error.response?.status;
    apiError.code = error.code;
    apiError.details = error.response?.data;
    return apiError;
  }

  if (error instanceof Error) {
    return error as ApiError;
  }

  return new Error('알 수 없는 오류가 발생했습니다.') as ApiError;
}
