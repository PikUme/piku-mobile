export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getEmailDomain = (email: string) =>
  email.trim().toLowerCase().split('@')[1] ?? '';

export const getEmailError = (
  email: string,
  emailDomains: string[],
  isEmailDomainsReady: boolean,
) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return '';
  }
  if (!validateEmail(normalizedEmail)) {
    return '유효한 이메일 형식이 아닙니다.';
  }
  if (
    isEmailDomainsReady &&
    emailDomains.length > 0 &&
    !emailDomains.includes(getEmailDomain(normalizedEmail))
  ) {
    return '허용된 이메일 도메인이 아닙니다.';
  }

  return '';
};

export const getPasswordError = (password: string) => {
  if (password.length < 8) {
    return '비밀번호는 8자 이상이어야 합니다.';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return '비밀번호는 소문자를 포함해야 합니다.';
  }
  if (!/(?=.*\d)/.test(password)) {
    return '비밀번호는 숫자를 포함해야 합니다.';
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return '비밀번호는 특수문자(@$!%*?&)를 포함해야 합니다.';
  }

  return '';
};
