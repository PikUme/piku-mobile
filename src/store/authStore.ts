import { create } from 'zustand';

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
      set({
        isHydrated: true,
        isLoggedIn: true,
        user: session.user,
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
    await persistAuthSession(session);
    set({
      isHydrated: true,
      isLoggedIn: true,
      user: session.user,
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
    await updateStoredUser(user);
    set({ user });
  },
}));
