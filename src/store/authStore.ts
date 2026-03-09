import { create } from 'zustand';

import { normalizeAuthUser } from '@/lib/auth/normalizeAuthUser';
import {
  clearAuthSession,
  getAuthSession,
  persistAuthSession,
  updateStoredUser,
} from '@/lib/auth/sessionStorage';
import type { AuthSession, AuthUser } from '@/types/auth';

interface AuthState {
  isHydrated: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  hydrateSession: () => Promise<void>;
  login: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  isLoggedIn: false,
  user: null,
  hydrateSession: async () => {
    const session = await getAuthSession();

    if (session) {
      const normalizedUser = normalizeAuthUser(session.user);
      set({
        isHydrated: true,
        isLoggedIn: true,
        user: normalizedUser,
      });
      return;
    }

    set({
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  },
  login: async (session) => {
    const normalizedUser = normalizeAuthUser(session.user);
    await persistAuthSession({
      ...session,
      user: normalizedUser,
    });
    set({
      isHydrated: true,
      isLoggedIn: true,
      user: normalizedUser,
    });
  },
  logout: async () => {
    await clearAuthSession();
    set({
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  },
  setUser: async (user) => {
    const normalizedUser = normalizeAuthUser(user);
    await updateStoredUser(normalizedUser);
    set({ user: normalizedUser });
  },
}));
