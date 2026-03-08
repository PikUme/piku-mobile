const DEFAULT_API_BASE_URL = 'http://localhost:8080/api';

export const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'local',
};
