import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { PasswordVisibilityToggle } from '@/features/auth/components/PasswordVisibilityToggle';
import {
  getEmailError,
  getPasswordError,
} from '@/features/auth/lib/validation';
import {
  getAllowedEmailDomains,
  resetPassword,
  sendPasswordResetVerificationEmail,
  verifyEmailCode,
} from '@/lib/api/auth';
import type { PasswordResetValues } from '@/types/auth';
import { colors, radius, spacing, typography } from '@/theme';

const INITIAL_VALUES: PasswordResetValues = {
  email: '',
  verificationCode: '',
  password: '',
  passwordConfirm: '',
};

const INITIAL_ERRORS = {
  email: '',
  password: '',
  passwordConfirm: '',
};

function StepIndicator({
  step,
}: {
  step: 1 | 2 | 3;
}) {
  return (
    <View style={styles.stepIndicator} testID="password-reset-step-indicator">
      {[
        { value: 1, label: '이메일' },
        { value: 2, label: '인증' },
        { value: 3, label: '재설정' },
      ].map((item, index) => {
        const isActive = step === item.value;
        const isCompleted = step > item.value;

        return (
          <View key={item.value} style={styles.stepItem}>
            <View style={styles.stepNodeRow}>
              <View
                style={[
                  styles.stepDot,
                  (isActive || isCompleted) && styles.stepDotActive,
                ]}
                testID={`password-reset-step-dot-${item.value}`}
              />
              {index < 2 ? (
                <View
                  style={[
                    styles.stepConnector,
                    step > item.value && styles.stepConnectorActive,
                  ]}
                  testID={`password-reset-step-connector-${item.value}`}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isActive || isCompleted) && styles.stepLabelActive,
              ]}
              testID={`password-reset-step-label-${item.value}`}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function PasswordResetScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState<PasswordResetValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [message, setMessage] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [emailDomains, setEmailDomains] = useState<string[]>([]);
  const [isEmailDomainsLoading, setIsEmailDomainsLoading] = useState(true);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const domains = await getAllowedEmailDomains();
        if (isMounted) {
          setEmailDomains(domains);
        }
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

  const updateField = (field: keyof PasswordResetValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setMessage('');

    if (field === 'verificationCode') {
      setVerificationMessage('');
      return;
    }

    if (field === 'email') {
      setVerificationMessage('');
      setErrors((prev) => ({
        ...prev,
        email: getEmailError(value, emailDomains, !isEmailDomainsLoading),
      }));
      return;
    }

    if (field === 'password') {
      const passwordError = getPasswordError(value);
      setErrors((prev) => ({ ...prev, password: passwordError }));

      setErrors((prev) => ({
        ...prev,
        password: passwordError,
        passwordConfirm:
          prev.passwordConfirm || values.passwordConfirm
            ? value !== values.passwordConfirm
              ? '비밀번호가 일치하지 않습니다.'
              : ''
            : prev.passwordConfirm,
      }));
      return;
    }

    if (field === 'passwordConfirm') {
      setErrors((prev) => ({
        ...prev,
        passwordConfirm:
          value !== values.password ? '비밀번호가 일치하지 않습니다.' : '',
      }));
    }
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
      await sendPasswordResetVerificationEmail(normalizedEmail);
      setStep(2);
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
        type: 'PASSWORD_RESET',
      });
      setStep(3);
      setMessage('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.');
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

  const handleSubmit = async () => {
    if (errors.password || errors.passwordConfirm) {
      setMessage('새 비밀번호를 다시 확인해주세요.');
      return;
    }
    if (!values.password || !values.passwordConfirm) {
      setMessage('새 비밀번호와 확인 값을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await resetPassword({
        email: values.email,
        password: values.password,
      });
      router.replace('/login');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '비밀번호 재설정에 실패했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      description="이메일 인증을 완료한 뒤 새 비밀번호를 설정해 주세요."
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
              disabled={
                !values.email ||
                isEmailDomainsLoading ||
                Boolean(errors.email) ||
                isSendingVerification
              }
              label={isSendingVerification ? '전송 중...' : '인증코드 발송'}
              onPress={handleSendVerification}
              testID="password-reset-send-verification-button"
              variant="neutral"
            />
          ) : step === 2 ? (
            <AppButton
              disabled={!values.verificationCode || isVerifyingCode}
              label={isVerifyingCode ? '인증 중...' : '인증 확인'}
              onPress={handleVerifyCode}
              testID="password-reset-verify-code-button"
              variant="neutral"
            />
          ) : (
            <AppButton
              disabled={
                !values.password ||
                !values.passwordConfirm ||
                Boolean(errors.password) ||
                Boolean(errors.passwordConfirm) ||
                isSubmitting
              }
              label={isSubmitting ? '재설정 중...' : '비밀번호 재설정'}
              onPress={handleSubmit}
              testID="password-reset-submit-button"
              variant="neutral"
            />
          )}
        </View>
      }
      onBack={() => {
        if (step === 3) {
          setStep(2);
          return;
        }
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
      title="비밀번호 재설정">
      <StepIndicator step={step} />

      {step === 1 ? (
        <View style={styles.section}>
          <AppTextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="이메일"
            onChangeText={(text) => updateField('email', text)}
            placeholder="가입한 이메일을 입력해주세요"
            testID="password-reset-email-input"
            value={values.email}
            errorText={errors.email || undefined}
            helperText={
              !values.email || !isEmailDomainsLoading
                ? undefined
                : '허용된 이메일 도메인을 확인하는 중입니다.'
            }
            leading={<Ionicons color={colors.mutedText} name="mail-outline" size={18} />}
          />
          <Text style={styles.helpText}>
            가입한 이메일 주소로 인증코드를 발송합니다.
          </Text>
        </View>
      ) : step === 2 ? (
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>인증 이메일</Text>
            <Text style={styles.infoValue}>{values.email}</Text>
          </View>
          <AppTextField
            keyboardType="number-pad"
            label="인증코드"
            onChangeText={(text) => updateField('verificationCode', text)}
            placeholder="인증코드를 입력해주세요"
            testID="password-reset-verification-code-input"
            value={values.verificationCode}
            errorText={verificationMessage || undefined}
            leading={<Ionicons color={colors.mutedText} name="key-outline" size={18} />}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>계정 이메일</Text>
            <Text style={styles.infoValue}>{values.email}</Text>
          </View>
          <AppTextField
            autoCapitalize="none"
            autoCorrect={false}
            label="새 비밀번호"
            onChangeText={(text) => updateField('password', text)}
            placeholder="새 비밀번호를 입력해주세요"
            secureTextEntry={!isPasswordVisible}
            spellCheck={false}
            testID="password-reset-password-input"
            value={values.password}
            errorText={errors.password || undefined}
            leading={<Ionicons color={colors.mutedText} name="lock-closed-outline" size={18} />}
            trailing={
              <PasswordVisibilityToggle
                onPress={() => setIsPasswordVisible((prev) => !prev)}
                testID="password-reset-password-visibility-toggle"
                visible={isPasswordVisible}
              />
            }
          />
          <AppTextField
            autoCapitalize="none"
            autoCorrect={false}
            label="새 비밀번호 확인"
            onChangeText={(text) => updateField('passwordConfirm', text)}
            placeholder="새 비밀번호를 다시 입력해주세요"
            secureTextEntry={!isPasswordConfirmVisible}
            spellCheck={false}
            testID="password-reset-password-confirm-input"
            value={values.passwordConfirm}
            errorText={errors.passwordConfirm || undefined}
            leading={<Ionicons color={colors.mutedText} name="checkmark-circle-outline" size={18} />}
            trailing={
              <PasswordVisibilityToggle
                onPress={() => setIsPasswordConfirmVisible((prev) => !prev)}
                testID="password-reset-password-confirm-visibility-toggle"
                visible={isPasswordConfirmVisible}
              />
            }
          />
        </View>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepNodeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.border,
  },
  stepConnectorActive: {
    backgroundColor: colors.text,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.text,
  },
  section: {
    gap: spacing.lg,
  },
  helpText: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  infoValue: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  footerActions: {
    gap: spacing.md,
  },
  message: {
    ...typography.caption,
    textAlign: 'center',
  },
  messageSuccess: {
    color: colors.primary,
  },
  messageError: {
    color: colors.danger,
  },
});
