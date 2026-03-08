import * as SecureStore from 'expo-secure-store';

import {
  clearAuthSession,
  getAccessToken,
  getAuthSession,
  getOrCreateDeviceId,
  persistAuthSession,
  updateStoredUser,
} from '@/lib/auth/sessionStorage';

describe('sessionStorage', () => {
  beforeEach(async () => {
    (SecureStore as typeof SecureStore & { __reset: () => void }).__reset();
    await clearAuthSession();
  });

  it('persists and reads an auth session', async () => {
    await persistAuthSession({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    await expect(getAccessToken()).resolves.toBe('token-1');
    await expect(getAuthSession()).resolves.toEqual({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });
  });

  it('updates only the stored user payload', async () => {
    await persistAuthSession({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    await updateStoredUser({
      id: 'user-1',
      email: 'tester@example.com',
      nickname: 'tester-renamed',
      avatar: 'avatar.png',
    });

    await expect(getAuthSession()).resolves.toEqual({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester-renamed',
        avatar: 'avatar.png',
      },
    });
  });

  it('reuses a stored device id', async () => {
    const first = await getOrCreateDeviceId();
    const second = await getOrCreateDeviceId();

    expect(first).toBe(second);
  });
});
