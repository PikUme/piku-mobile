import * as SecureStore from 'expo-secure-store';

import { useAuthStore } from '@/store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    (SecureStore as typeof SecureStore & { __reset: () => void }).__reset();
    useAuthStore.setState({
      isHydrated: false,
      isLoggedIn: false,
      user: null,
    });
  });

  it('hydrates an empty session as guest', async () => {
    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState()).toMatchObject({
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  });

  it('logs in and restores the stored session', async () => {
    await useAuthStore.getState().login({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    useAuthStore.setState({
      isHydrated: false,
      isLoggedIn: false,
      user: null,
    });

    await useAuthStore.getState().hydrateSession();

    expect(useAuthStore.getState()).toMatchObject({
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });
  });

  it('clears the session on logout', async () => {
    await useAuthStore.getState().login({
      accessToken: 'token-1',
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  });
});
