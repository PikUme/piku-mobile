import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { PasswordVisibilityToggle } from '@/features/auth/components/PasswordVisibilityToggle';
import { PolicyModal } from '@/features/auth/components/PolicyModal';
import {
  getEmailError,
  getPasswordError,
} from '@/features/auth/lib/validation';
import { privacyPolicy } from '@/content/policies/privacy';
import { termsOfService } from '@/content/policies/terms';
import { getFixedCharacters } from '@/lib/api/characters';
import {
  getAllowedEmailDomains,
  sendSignUpVerificationEmail,
  signup,
  verifyEmailCode,
} from '@/lib/api/auth';
import type { Agreements, SignupValues } from '@/types/auth';
import type { FixedCharacter } from '@/types/character';
import { colors, radius, spacing, typography } from '@/theme';

type ModalType = 'terms' | 'privacy' | null;

const INITIAL_VALUES: SignupValues = {
  email: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
  character: '',
  verificationCode: '',
};

const INITIAL_ERRORS = {
  email: '',
  password: '',
  passwordConfirm: '',
};

const INITIAL_AGREEMENTS: Agreements = {
  terms: false,
  privacy: false,
};

const CHARACTER_EMOJI: Record<string, string> = {
  fox: '🦊',
  cat: '🐱',
  bear: '🐻',
  rabbit: '🐰',
};

function StepIndicator({
  step,
}: {
  step: 1 | 2;
}) {
  return (
    <View style={styles.stepRow}>
      {[
        { value: 1, label: '기본 정보' },
        { value: 2, label: '캐릭터 선택' },
      ].map((item) => {
        const isActive = step === item.value;
        return (
          <View
            key={item.value}
            style={[styles.stepChip, isActive && styles.stepChipActive]}>
            <Text
              style={[
                styles.stepChipText,
                isActive && styles.stepChipTextActive,
              ]}>
              {item.value}. {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AgreementRow({
  checked,
  label,
  onToggle,
  onView,
  testID,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
  onView: () => void;
  testID: string;
}) {
  return (
    <View style={styles.agreementRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={onToggle}
        style={styles.agreementToggle}
        testID={testID}>
        <Ionicons
          color={checked ? colors.primary : colors.border}
          name={checked ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
        />
        <Text style={styles.agreementLabel}>{label}</Text>
      </Pressable>
      <Pressable onPress={onView} testID={`${testID}-view`}>
        <Text style={styles.agreementViewLabel}>보기</Text>
      </Pressable>
    </View>
  );
}

export function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<SignupValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [message, setMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [emailDomains, setEmailDomains] = useState<string[]>([]);
  const [characters, setCharacters] = useState<FixedCharacter[]>([]);
  const [isEmailDomainsLoading, setIsEmailDomainsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [agreements, setAgreements] = useState<Agreements>(INITIAL_AGREEMENTS);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const [domains, fixedCharacters] = await Promise.all([
          getAllowedEmailDomains(),
          getFixedCharacters(),
        ]);

        if (!isMounted) {
          return;
        }

        setEmailDomains(domains);
        setCharacters(fixedCharacters);
      } finally {
        if (isMounted) {
          setIsEmailDomainsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!values.email) {
      return;
    }

    const nextEmailError = getEmailError(
      values.email,
      emailDomains,
      !isEmailDomainsLoading,
    );

    setErrors((prev) =>
      prev.email === nextEmailError
        ? prev
        : { ...prev, email: nextEmailError },
    );
  }, [emailDomains, isEmailDomainsLoading, values.email]);

  const isAgreed = agreements.terms && agreements.privacy;
  const canProceedToStep2 =
    isEmailVerified &&
    isAgreed &&
    values.nickname.trim().length > 0 &&
    values.password.length > 0 &&
    values.passwordConfirm.length > 0 &&
    !isEmailDomainsLoading &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm;

  const policyTitle = modalType === 'terms' ? '이용약관' : '개인정보 처리방침';
  const policyContent = modalType === 'terms' ? termsOfService : privacyPolicy;

  const updateField = (field: keyof SignupValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'email' ? { verificationCode: '' } : {}),
    }));
    setMessage('');

    if (field === 'verificationCode') {
      setVerificationMessage('');
    }

    if (field === 'email') {
      setIsEmailVerified(false);
      setIsVerificationSent(false);
      setVerificationMessage('');
      setErrors((prev) => ({
        ...prev,
        email: getEmailError(value, emailDomains, !isEmailDomainsLoading),
      }));
    }

    if (field === 'password') {
      const passwordError = getPasswordError(value);
      setErrors((prev) => ({ ...prev, password: passwordError }));

      if (values.passwordConfirm && value !== values.passwordConfirm) {
        setErrors((prev) => ({
          ...prev,
          passwordConfirm: '비밀번호가 일치하지 않습니다.',
        }));
      } else if (values.passwordConfirm && value === values.passwordConfirm) {
        setErrors((prev) => ({ ...prev, passwordConfirm: '' }));
      }
    }

    if (field === 'passwordConfirm') {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm:
          value !== values.password ? '비밀번호가 일치하지 않습니다.' : '',
      }));
    }
  };

  const toggleAgreement = (field: keyof Agreements) => {
    setAgreements((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAllAgreements = () => {
    const next = !(agreements.terms && agreements.privacy);
    setAgreements({
      terms: next,
      privacy: next,
    });
  };

  const handleSendVerification = async () => {
    const normalizedEmail = values.email.trim().toLowerCase();
    const nextEmailError = getEmailError(
      normalizedEmail,
      emailDomains,
      !isEmailDomainsLoading,
    );

    if (!normalizedEmail) {
      setMessage('이메일을 입력해주세요.');
      return;
    }
    if (isEmailDomainsLoading) {
      setMessage('허용된 이메일 도메인을 확인하는 중입니다.');
      return;
    }
    if (nextEmailError) {
      setErrors((prev) => ({ ...prev, email: nextEmailError }));
      setMessage(nextEmailError);
      return;
    }

    setIsSendingVerification(true);
    setMessage('');

    try {
      await sendSignUpVerificationEmail(normalizedEmail);
      setIsVerificationSent(true);
      setVerificationMessage('');
      setMessage('인증코드가 발송되었습니다.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '인증코드 발송에 실패했습니다.',
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!values.verificationCode.trim()) {
      setVerificationMessage('인증코드를 입력해주세요.');
      return;
    }

    setIsVerifyingCode(true);
    setVerificationMessage('');

    try {
      await verifyEmailCode({
        email: values.email,
        code: values.verificationCode,
        type: 'SIGN_UP',
      });
      setIsEmailVerified(true);
      setIsVerificationSent(false);
      setMessage('이메일 인증이 완료되었습니다.');
    } catch (error) {
      setVerificationMessage(
        error instanceof Error
          ? error.message
          : '인증코드가 올바르지 않습니다.',
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleNextStep = () => {
    if (!isEmailVerified) {
      setMessage('이메일 인증을 완료해주세요.');
      return;
    }
    if (errors.password || errors.passwordConfirm || errors.email) {
      setMessage('입력값을 다시 확인해주세요.');
      return;
    }
    if (!values.nickname.trim()) {
      setMessage('닉네임을 입력해주세요.');
      return;
    }
    if (!isAgreed) {
      setMessage('이용약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    setStep(2);
    setMessage('');
  };

  const handleSubmit = async () => {
    if (!values.character) {
      setMessage('캐릭터를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await signup({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
        character: values.character,
      });

      router.replace('/login');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '회원가입에 실패했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthScreenLayout
        description="이메일 인증과 캐릭터 선택을 완료하면 바로 로그인할 수 있습니다."
        footer={
          <View style={styles.footerActions}>
            {message ? (
              <Text
                style={[
                  styles.message,
                  message.includes('완료') || message.includes('발송')
                    ? styles.messageSuccess
                    : styles.messageError,
                ]}>
                {message}
              </Text>
            ) : null}
            {step === 1 ? (
              <AppButton
                disabled={!canProceedToStep2}
                label="다음"
                onPress={handleNextStep}
                testID="signup-next-button"
                variant="neutral"
              />
            ) : (
              <AppButton
                disabled={isLoading || !values.character}
                label={isLoading ? '가입 중...' : '회원 가입'}
                onPress={handleSubmit}
                testID="signup-submit-button"
                variant="neutral"
              />
            )}
          </View>
        }
        onBack={() => {
          if (step === 2) {
            setStep(1);
            return;
          }

          if (router.canGoBack()) {
            router.back();
            return;
          }

          router.replace('/login');
        }}
        title="가입하기">
        <StepIndicator step={step} />

        {step === 1 ? (
          <View style={styles.section}>
            <AppTextField
              autoCapitalize="none"
              autoComplete="email"
              editable={!isEmailVerified}
              keyboardType="email-address"
              label="이메일"
              onChangeText={(text) => updateField('email', text)}
              placeholder="이메일을 입력해주세요"
              testID="signup-email-input"
              value={values.email}
              errorText={errors.email || undefined}
              helperText={
                !values.email || !isEmailDomainsLoading
                  ? undefined
                  : '허용된 이메일 도메인을 확인하는 중입니다.'
              }
              leading={<Ionicons color={colors.mutedText} name="mail-outline" size={18} />}
            />
            <AppButton
              disabled={
                isEmailVerified ||
                isEmailDomainsLoading ||
                !values.email ||
                Boolean(errors.email) ||
                isSendingVerification
              }
              label={
                isEmailVerified
                  ? '인증완료'
                  : isSendingVerification
                    ? '전송 중...'
                    : '인증코드 전송'
              }
              onPress={handleSendVerification}
              testID="signup-send-verification-button"
              variant="secondary"
            />

            {isVerificationSent ? (
              <View style={styles.verificationCard}>
                <AppTextField
                  keyboardType="number-pad"
                  label="인증코드"
                  onChangeText={(text) => updateField('verificationCode', text)}
                  placeholder="인증코드를 입력하세요"
                  testID="signup-verification-code-input"
                  value={values.verificationCode}
                  errorText={verificationMessage || undefined}
                  leading={<Ionicons color={colors.mutedText} name="key-outline" size={18} />}
                />
                <AppButton
                  disabled={isVerifyingCode}
                  label={isVerifyingCode ? '인증 중...' : '인증 확인'}
                  onPress={handleVerifyCode}
                  testID="signup-verify-code-button"
                  variant="ghost"
                />
              </View>
            ) : null}

            <AppTextField
              autoCapitalize="none"
              autoCorrect={false}
              label="비밀번호"
              onChangeText={(text) => updateField('password', text)}
              placeholder="비밀번호를 입력해주세요"
              secureTextEntry={!isPasswordVisible}
              spellCheck={false}
              testID="signup-password-input"
              value={values.password}
              errorText={errors.password || undefined}
              leading={<Ionicons color={colors.mutedText} name="lock-closed-outline" size={18} />}
              trailing={
                <PasswordVisibilityToggle
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  testID="signup-password-visibility-toggle"
                  visible={isPasswordVisible}
                />
              }
            />
            <AppTextField
              autoCapitalize="none"
              autoCorrect={false}
              label="비밀번호 확인"
              onChangeText={(text) => updateField('passwordConfirm', text)}
              placeholder="비밀번호를 다시 입력해주세요"
              secureTextEntry={!isPasswordConfirmVisible}
              spellCheck={false}
              testID="signup-password-confirm-input"
              value={values.passwordConfirm}
              errorText={errors.passwordConfirm || undefined}
              leading={<Ionicons color={colors.mutedText} name="checkmark-circle-outline" size={18} />}
              trailing={
                <PasswordVisibilityToggle
                  onPress={() => setIsPasswordConfirmVisible((prev) => !prev)}
                  testID="signup-password-confirm-visibility-toggle"
                  visible={isPasswordConfirmVisible}
                />
              }
            />
            <AppTextField
              label="닉네임"
              onChangeText={(text) => updateField('nickname', text)}
              placeholder="닉네임을 입력해주세요"
              testID="signup-nickname-input"
              value={values.nickname}
              leading={<Ionicons color={colors.mutedText} name="person-outline" size={18} />}
            />

            <View style={styles.agreementSection}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAgreed }}
                onPress={toggleAllAgreements}
                style={styles.agreementToggle}
                testID="signup-agreement-all">
                <Ionicons
                  color={isAgreed ? colors.primary : colors.border}
                  name={isAgreed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                />
                <Text style={styles.agreementLabel}>모두 동의</Text>
              </Pressable>
              <AgreementRow
                checked={agreements.terms}
                label="이용약관 동의"
                onToggle={() => toggleAgreement('terms')}
                onView={() => setModalType('terms')}
                testID="signup-agreement-terms"
              />
              <AgreementRow
                checked={agreements.privacy}
                label="개인정보 처리방침 동의"
                onToggle={() => toggleAgreement('privacy')}
                onView={() => setModalType('privacy')}
                testID="signup-agreement-privacy"
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>캐릭터 선택</Text>
            <Text style={styles.sectionDescription}>
              선택한 캐릭터를 기준으로 일기 이미지가 생성됩니다.
            </Text>
            <View style={styles.characterGrid}>
              {characters.map((character) => {
                const isSelected = values.character === String(character.id);
                const fallbackEmoji =
                  CHARACTER_EMOJI[character.type.toLowerCase()] ?? '✨';

                return (
                  <Pressable
                    key={character.id}
                    onPress={() => updateField('character', String(character.id))}
                    style={({ pressed }) => [
                      styles.characterCard,
                      isSelected && styles.characterCardSelected,
                      pressed && styles.characterCardPressed,
                    ]}
                    testID={`signup-character-option-${character.id}`}>
                    {character.displayImageUrl ? (
                      <Image
                        source={{ uri: character.displayImageUrl }}
                        style={styles.characterImage}
                      />
                    ) : (
                      <Text style={styles.characterFallback}>{fallbackEmoji}</Text>
                    )}
                    <Text style={styles.characterLabel}>{character.type}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </AuthScreenLayout>

      <PolicyModal
        content={policyContent}
        onAgree={() => {
          if (modalType) {
            setAgreements((prev) => ({ ...prev, [modalType]: true }));
          }
          setModalType(null);
        }}
        onClose={() => setModalType(null)}
        title={policyTitle}
        visible={modalType !== null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  stepChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stepChipActive: {
    backgroundColor: colors.primarySoft,
  },
  stepChipText: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  stepChipTextActive: {
    color: colors.primary,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.mutedText,
  },
  domainSection: {
    gap: spacing.sm,
  },
  domainChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  domainChip: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  domainChipText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  verificationCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceMuted,
  },
  agreementSection: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  agreementToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  agreementLabel: {
    ...typography.body,
    color: colors.text,
  },
  agreementViewLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  characterCard: {
    width: '47%',
    minHeight: 164,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  characterCardSelected: {
    borderColor: colors.black,
    borderWidth: 2,
  },
  characterCardPressed: {
    opacity: 0.85,
  },
  characterImage: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
  },
  characterFallback: {
    fontSize: 40,
  },
  characterLabel: {
    ...typography.bodyStrong,
    color: colors.text,
    textTransform: 'capitalize',
  },
  footerActions: {
    gap: spacing.md,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
  },
  messageSuccess: {
    color: colors.success,
  },
  messageError: {
    color: colors.danger,
  },
});
