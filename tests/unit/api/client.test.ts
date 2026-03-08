import { AxiosHeaders } from 'axios';

import { apiClient } from '@/lib/api/client';
import * as sessionStorage from '@/lib/auth/sessionStorage';
import { useAuthStore } from '@/store/authStore';

const requestHandler = (apiClient.interceptors.request as unknown as {
  handlers: Array<{ fulfilled: (value: unknown) => Promise<unknown> }>;
}).handlers[0].fulfilled;
const responseErrorHandler = (apiClient.interceptors.response as unknown as {
  handlers: Array<{ rejected: (error: unknown) => Promise<unknown> }>;
}).handlers[0].rejected;

describe('apiClient interceptors', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'test@gmail.com',
        nickname: 'test',
        avatar: '',
      },
    });
  });

  it('adds the Authorization header to private requests', async () => {
    jest.spyOn(sessionStorage, 'getAccessToken').mockResolvedValue('token-123');

    const config = (await requestHandler({
      url: '/diary',
      headers: new AxiosHeaders(),
    })) as { headers: AxiosHeaders };

    expect(config.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('skips the Authorization header for public auth requests', async () => {
    jest.spyOn(sessionStorage, 'getAccessToken').mockResolvedValue('token-123');

    const config = (await requestHandler({
      url: '/auth/login',
      headers: new AxiosHeaders(),
    })) as { headers: AxiosHeaders };

    expect(config.headers.get('Authorization')).toBeUndefined();
  });

  it('clears the local session on private 401 responses', async () => {
    const clearSpy = jest.spyOn(sessionStorage, 'clearAuthSession').mockResolvedValue();

    await expect(
      responseErrorHandler({
        isAxiosError: true,
        message: 'Request failed with status code 401',
        code: 'ERR_BAD_REQUEST',
        config: { url: '/diary' },
        response: {
          status: 401,
          data: {
            message: '세션이 만료되었습니다.',
          },
        },
      }),
    ).rejects.toMatchObject({
      message: '세션이 만료되었습니다.',
      status: 401,
    });

    expect(clearSpy).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      isLoggedIn: false,
      user: null,
    });
  });

  it('does not clear the session for public auth failures', async () => {
    const clearSpy = jest.spyOn(sessionStorage, 'clearAuthSession').mockResolvedValue();

    await expect(
      responseErrorHandler({
        isAxiosError: true,
        message: 'Unauthorized',
        code: 'ERR_BAD_REQUEST',
        config: { url: '/auth/login' },
        response: {
          status: 401,
          data: {
            message: '로그인에 실패했습니다.',
          },
        },
      }),
    ).rejects.toMatchObject({
      message: '로그인에 실패했습니다.',
      status: 401,
    });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
  });
});
