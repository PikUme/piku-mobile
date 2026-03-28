import { isAxiosError } from 'axios';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

const getResponseData = (data: unknown) => {
  if (typeof data === 'object' && data) {
    return data as Record<string, unknown>;
  }

  return null;
};

export function normalizeApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const responseData = getResponseData(error.response?.data);
    const message =
      (typeof responseData?.message === 'string' ? responseData.message : undefined) ??
      error.message ??
      '요청 처리 중 오류가 발생했습니다.';
    const responseStatus =
      error.response?.status ??
      (typeof responseData?.status === 'number' ? responseData.status : undefined);

    const apiError = new Error(message) as ApiError;
    apiError.status = responseStatus;
    apiError.code = error.code;
    apiError.details = error.response?.data;
    return apiError;
  }

  if (error instanceof Error) {
    return error as ApiError;
  }

  return new Error('알 수 없는 오류가 발생했습니다.') as ApiError;
}
