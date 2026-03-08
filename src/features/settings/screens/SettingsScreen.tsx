import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { logout as requestLogout } from '@/lib/api/auth';
import { showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { colors, radius, spacing, typography } from '@/theme';

function getPermissionLabel(status: Notifications.PermissionStatus | 'unknown') {
  switch (status) {
    case 'granted':
      return '허용됨';
    case 'denied':
      return '거부됨';
    case 'undetermined':
      return '확인 필요';
    default:
      return '확인 중';
  }
}

function SettingsRow({
  label,
  value,
  onPress,
  testID,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const content = (
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueBlock}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? <Ionicons color={colors.mutedText} name="chevron-forward" size={18} /> : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.rowCard} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}
      testID={testID}>
      {content}
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | 'unknown'>('unknown');
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const appVersion = useMemo(() => {
    return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0';
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (isMounted) {
          setPermissionStatus(permission.status);
        }
      } finally {
        if (isMounted) {
          setIsCheckingPermissions(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  const handleLogout = () => {
    showConfirm('로그아웃', '로그아웃하시겠습니까?', () => {
      void (async () => {
        setIsLoggingOut(true);
        try {
          await requestLogout();
        } catch {
          // 서버 로그아웃 실패와 무관하게 클라이언트 로그아웃은 진행합니다.
        } finally {
          await logout();
          setUnreadCount(0);
          setIsLoggingOut(false);
          router.replace('/');
        }
      })();
    });
  };

  if (isCheckingPermissions) {
    return (
      <ScreenContainer>
        <LoadingState label="설정 정보를 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <AppHeader
        leftSlot={
          <Pressable
            accessibilityLabel="뒤로가기"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            testID="settings-back-button">
            <Ionicons color={colors.text} name="chevron-back" size={20} />
          </Pressable>
        }
        title="설정"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <SettingsRow label="앱 버전" testID="settings-app-version" value={appVersion} />
        <SettingsRow
          label="푸시 권한"
          testID="settings-push-permission"
          value={getPermissionLabel(permissionStatus)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>지원</Text>
        <SettingsRow
          label="피드백 보내기"
          onPress={() => router.push('/feedback')}
          testID="settings-feedback-row"
        />
      </View>

      <View style={styles.footerAction}>
        <AppButton
          label="로그아웃"
          loading={isLoggingOut}
          onPress={handleLogout}
          testID="settings-logout-button"
          variant="destructive"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  rowValueBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowValue: {
    ...typography.body,
    color: colors.mutedText,
  },
  footerAction: {
    marginTop: 'auto',
  },
  pressed: {
    opacity: 0.85,
  },
});
