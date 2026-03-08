import { apiClient } from '@/lib/api/client';
import { getOrCreateDeviceId } from '@/lib/auth/sessionStorage';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type {
  AuthSession,
  EmailVerificationPayload,
  LoginPayload,
  SignupPayload,
} from '@/types/auth';

const getBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    throw new Error('Authorization header is missing.');
  }

  return authorizationHeader.slice(7);
};

const LOCAL_MOCK_LOGIN = {
  email: 'tester@example.com',
  password: 'password123!',
  session: {
    accessToken: 'local-mock-access-token',
    user: {
      id: 'user-1',
      email: 'tester@example.com',
      nickname: 'tester',
      avatar: '',
    },
  },
} satisfies {
  email: string;
  password: string;
  session: AuthSession;
};

const LOCAL_ALLOWED_EMAIL_DOMAINS = [
  'example.com',
  'gmail.com',
  'naver.com',
  'kakao.com',
];

const LOCAL_SIGNUP_VERIFICATION_CODE = '123456';
const localVerifiedEmails = new Set<string>();

const isRecoverableLocalNetworkError = (error: unknown) => {
  if (env.appEnv !== 'local') {
    return false;
  }

  const apiError = error as ApiError;
  if (typeof apiError?.status === 'number') {
    return false;
  }

  return (
    apiError?.code === 'ERR_NETWORK' ||
    apiError?.code === 'ECONNABORTED' ||
    apiError?.message === 'Network Error' ||
    apiError?.message?.toLowerCase().includes('timeout') === true
  );
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getEmailDomain = (email: string) => normalizeEmail(email).split('@')[1] ?? '';

const loginWithLocalMock = async ({
  email,
  password,
}: LoginPayload): Promise<AuthSession> => {
  await Promise.resolve();

  if (
    email.trim().toLowerCase() !== LOCAL_MOCK_LOGIN.email ||
    password !== LOCAL_MOCK_LOGIN.password
  ) {
    throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
  }

  return LOCAL_MOCK_LOGIN.session;
};

export async function login(payload: LoginPayload): Promise<AuthSession> {
  try {
    const deviceId = await getOrCreateDeviceId();
    const response = await apiClient.post('/auth/login', payload, {
      headers: {
        'Device-Id': deviceId,
      },
    });

    const accessToken = getBearerToken(response.headers.authorization);
    const user = response.data?.user;

    if (!user) {
      throw new Error('User payload is missing.');
    }

    return {
      accessToken,
      user,
    };
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return loginWithLocalMock(payload);
    }

    throw error;
  }
}

async function localSendSignUpVerificationEmail(email: string) {
  await Promise.resolve();

  const normalizedEmail = normalizeEmail(email);
  const domain = getEmailDomain(normalizedEmail);

  if (!LOCAL_ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    throw new Error('허용되지 않은 이메일 도메인입니다.');
  }

  return { message: '회원가입 인증 이메일이 발송되었습니다.' };
}

async function localVerifyCode({
  email,
  code,
}: EmailVerificationPayload) {
  await Promise.resolve();

  if (code.trim() !== LOCAL_SIGNUP_VERIFICATION_CODE) {
    throw new Error('인증코드가 올바르지 않습니다.');
  }

  localVerifiedEmails.add(normalizeEmail(email));
  return { message: '이메일 인증이 완료되었습니다.' };
}

async function localSignup(payload: SignupPayload) {
  await Promise.resolve();

  const normalizedEmail = normalizeEmail(payload.email);
  if (!localVerifiedEmails.has(normalizedEmail)) {
    throw new Error('이메일 인증을 완료해주세요.');
  }

  return { message: '회원가입 성공' };
}

export async function getAllowedEmailDomains(): Promise<string[]> {
  try {
    const response = await apiClient.get<string[]>('/auth/email-domains');
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return LOCAL_ALLOWED_EMAIL_DOMAINS;
    }

    throw error;
  }
}

export async function sendSignUpVerificationEmail(email: string) {
  try {
    const response = await apiClient.post('/auth/send-verification/sign-up', {
      email: normalizeEmail(email),
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return localSendSignUpVerificationEmail(email);
    }

    throw error;
  }
}

export async function verifyEmailCode(payload: EmailVerificationPayload) {
  try {
    const response = await apiClient.post('/auth/verify-code', {
      ...payload,
      email: normalizeEmail(payload.email),
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return localVerifyCode(payload);
    }

    throw error;
  }
}

export async function signup(payload: SignupPayload) {
  try {
    const response = await apiClient.post('/auth/signup', {
      email: normalizeEmail(payload.email),
      password: payload.password,
      nickname: payload.nickname.trim(),
      fixedCharacterId: Number(payload.character),
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return localSignup(payload);
    }

    throw error;
  }
}

export async function logout() {
  await apiClient.post('/auth/logout');
}
