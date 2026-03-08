import axios from 'axios';

import { clearAuthSession, getAccessToken } from '@/lib/auth/sessionStorage';
import { env } from '@/lib/env';
import { normalizeApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/store/authStore';

const PUBLIC_AUTH_PATHS = new Set([
  '/auth/login',
  '/auth/signup',
  '/auth/email-domains',
  '/auth/send-verification/sign-up',
  '/auth/verify-code',
  '/auth/send-verification/password-reset',
  '/auth/password-reset',
]);

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  if (!config.url || PUBLIC_AUTH_PATHS.has(config.url)) {
    return config;
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return config;
  }

  config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const normalizedError = normalizeApiError(error);
    const isAuthFailure =
      normalizedError.status === 401 || normalizedError.status === 403;
    const isPublicAuthRequest =
      typeof error?.config?.url === 'string' &&
      PUBLIC_AUTH_PATHS.has(error.config.url);

    if (isAuthFailure && !isPublicAuthRequest) {
      await clearAuthSession();
      useAuthStore.setState({
        isHydrated: true,
        isLoggedIn: false,
        user: null,
      });
    }

    return Promise.reject(normalizedError);
  },
);
