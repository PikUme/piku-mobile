import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { TabIcon } from '@/components/ui/TabIcon';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { colors, radius, spacing, typography } from '@/theme';

interface AppTopBarProps {
  title?: string;
  subtitle?: string;
  variant?: 'auto' | 'brand';
  compact?: boolean;
}

function IconChipButton({
  icon,
  label,
  onPress,
  badgeCount,
  testID,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badgeCount?: number;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}
      testID={testID}>
      <TabIcon badgeCount={badgeCount} name={icon} />
    </Pressable>
  );
}

export function AppTopBar({
  title = 'PikUme',
  subtitle,
  variant = 'auto',
  compact = false,
}: AppTopBarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const shouldShowUserProfile = variant !== 'brand' && isLoggedIn && user;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {shouldShowUserProfile ? (
        <View style={styles.userBlock}>
          <Avatar name={user.nickname} size={40} source={user.avatar ?? null} />
          <View style={styles.userTextBlock}>
            <Text numberOfLines={1} style={styles.userName} testID="shell-user-name">
              {user.nickname}
            </Text>
            <Text numberOfLines={1} style={styles.userCaption}>
              {subtitle ?? '오늘도 한 장면을 남겨보세요.'}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle} testID="shell-brand-title">
            {title}
          </Text>
          {subtitle ? <Text style={styles.brandCaption}>{subtitle}</Text> : null}
        </View>
      )}

      <View style={styles.actions}>
        {isLoggedIn ? (
          <IconChipButton
            badgeCount={unreadCount}
            icon="notifications"
            label="알림"
            onPress={() => router.push('/notifications')}
            testID="shell-notifications-button"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  containerCompact: {
    minHeight: 42,
    marginBottom: 0,
  },
  userBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  userCaption: {
    ...typography.caption,
    color: colors.mutedText,
  },
  brandBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  brandTitle: {
    ...typography.heading,
    color: colors.text,
  },
  brandCaption: {
    ...typography.caption,
    color: colors.mutedText,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconPressed: {
    opacity: 0.85,
  },
});
