import { env } from '@/lib/env';
import type { AuthUser } from '@/types/auth';

type AuthUserLike = Partial<AuthUser> & {
  avatarUrl?: string | null;
};

function getServerOrigin() {
  return env.apiBaseUrl.replace(/\/api\/?$/, '');
}

function normalizeAssetUrl(value?: string | null) {
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${getServerOrigin()}${normalizedPath}`;
}

export function normalizeAuthUser(user: AuthUserLike): AuthUser {
  const rawAvatar =
    (typeof user.avatar === 'string' ? user.avatar : '') ||
    (typeof user.avatarUrl === 'string' ? user.avatarUrl : '');

  return {
    id: typeof user.id === 'string' ? user.id : '',
    email: typeof user.email === 'string' ? user.email : '',
    nickname: typeof user.nickname === 'string' ? user.nickname : '',
    avatar: normalizeAssetUrl(rawAvatar),
    avatarUrl:
      typeof user.avatarUrl === 'string' ? normalizeAssetUrl(user.avatarUrl) : undefined,
  };
}
