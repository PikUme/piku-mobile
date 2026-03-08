import * as SecureStore from 'expo-secure-store';

import type { AuthSession, AuthUser } from '@/types/auth';

const AUTH_SESSION_KEY = 'pikume.auth.session';
const DEVICE_ID_KEY = 'pikume.device.id';

const createDeviceId = () =>
  `pikume-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function persistAuthSession(session: AuthSession) {
  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const rawSession = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return null;
  }
}

export async function getAccessToken() {
  const session = await getAuthSession();
  return session?.accessToken ?? null;
}

export async function updateStoredUser(user: AuthUser) {
  const session = await getAuthSession();
  if (!session) {
    return;
  }

  await persistAuthSession({
    ...session,
    user,
  });
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

export async function getOrCreateDeviceId() {
  const currentDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (currentDeviceId) {
    return currentDeviceId;
  }

  const nextDeviceId = createDeviceId();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
}
