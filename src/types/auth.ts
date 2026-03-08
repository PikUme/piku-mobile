export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Agreements {
  terms: boolean;
  privacy: boolean;
}

export interface SignupValues {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  character: string;
  verificationCode: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  nickname: string;
  character: string;
}

export interface PasswordResetValues {
  email: string;
  verificationCode: string;
  password: string;
  passwordConfirm: string;
}

export interface PasswordResetPayload {
  email: string;
  password: string;
}

export interface EmailVerificationPayload {
  email: string;
  code: string;
  type: 'SIGN_UP' | 'PASSWORD_RESET';
}
