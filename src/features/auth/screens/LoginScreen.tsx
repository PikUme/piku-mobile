import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppTextField } from '@/components/ui/AppTextField';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { PasswordVisibilityToggle } from '@/features/auth/components/PasswordVisibilityToggle';
import { login as requestLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography } from '@/theme';

export function LoginScreen() {
  const router = useRouter();
  const persistLogin = useAuthStore((state) => state.login);
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const session = await requestLogin({
        email: email.trim().toLowerCase(),
        password,
      });
      await persistLogin(session);
      router.replace('/');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : '로그인 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      description="이메일과 비밀번호를 입력해 로그인해 주세요."
      footer={
        <View style={styles.footerActions}>
          <View style={styles.signupRow}>
            <Text style={styles.footerDescription}>계정이 없으신가요? </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/signup')}
              style={styles.inlineButton}
              testID="login-signup-link">
              <Text style={styles.inlineButtonLabel}>가입하기</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/password-reset')}
            style={styles.footerButton}
            testID="login-password-reset-link">
            <Text style={styles.footerMutedLabel}>비밀번호를 잊으셨나요?</Text>
          </Pressable>
        </View>
      }
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace('/');
      }}
      title="로그인">
      <View style={styles.formSection}>
        <AppTextField
          accessibilityLabel="이메일"
          autoCapitalize="none"
          autoComplete="email"
          blurOnSubmit={false}
          keyboardType="email-address"
          label="이메일"
          onChangeText={setEmail}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholder="이메일을 입력하세요"
          returnKeyType="next"
          testID="login-email-input"
          textContentType="username"
          value={email}
          leading={<Ionicons color={colors.mutedText} name="mail-outline" size={18} />}
        />
        <AppTextField
          accessibilityLabel="비밀번호"
          autoCapitalize="none"
          autoCorrect={false}
          label="비밀번호"
          onChangeText={setPassword}
          onSubmitEditing={() => {
            void handleSubmit();
          }}
          placeholder="비밀번호를 입력하세요"
          ref={passwordInputRef}
          returnKeyType="go"
          secureTextEntry={!isPasswordVisible}
          spellCheck={false}
          testID="login-password-input"
          trailing={
            <PasswordVisibilityToggle
              onPress={() => setIsPasswordVisible((prev) => !prev)}
              testID="login-password-visibility-toggle"
              visible={isPasswordVisible}
            />
          }
          value={password}
          leading={<Ionicons color={colors.mutedText} name="lock-closed-outline" size={18} />}
        />
      </View>

      {errorMessage ? (
        <Text style={styles.errorMessage} testID="login-error-banner">
          {errorMessage}
        </Text>
      ) : null}

      <AppButton
        disabled={isSubmitting || !email.trim() || !password}
        label="로그인"
        loading={isSubmitting}
        onPress={handleSubmit}
        size="lg"
        testID="login-submit-button"
        variant="neutral"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: spacing.lg,
  },
  errorMessage: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  footerActions: {
    gap: spacing.xs,
    alignItems: 'center',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  footerDescription: {
    ...typography.caption,
    color: colors.mutedText,
  },
  inlineButton: {
    paddingVertical: spacing.xs,
  },
  inlineButtonLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  footerMutedLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
});
