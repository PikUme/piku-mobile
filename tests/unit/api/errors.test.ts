import { normalizeApiError } from '@/lib/api/errors';

describe('normalizeApiError', () => {
  it('normalizes axios-shaped errors with status and message', () => {
    const error = normalizeApiError({
      isAxiosError: true,
      message: 'Request failed',
      code: 'ERR_BAD_REQUEST',
      response: {
        status: 400,
        data: {
          message: '잘못된 요청입니다.',
        },
      },
    });

    expect(error).toMatchObject({
      message: '잘못된 요청입니다.',
      status: 400,
      code: 'ERR_BAD_REQUEST',
    });
  });

  it('returns a generic error for unknown values', () => {
    const error = normalizeApiError('boom');

    expect(error.message).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
