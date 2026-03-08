import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { formatMonthLabel } from '@/features/home/lib/calendar';
import type { AuthUser } from '@/types/auth';
import { colors, spacing, typography } from '@/theme';

interface HomeCalendarHeaderProps {
  user: AuthUser;
  currentDate: Date;
  onOpenMonthPicker: () => void;
  canCycleFriends?: boolean;
  onPrevFriend?: () => void;
  onNextFriend?: () => void;
}

export function HomeCalendarHeader({
  user,
  currentDate,
  onOpenMonthPicker,
  canCycleFriends = false,
  onPrevFriend,
  onNextFriend,
}: HomeCalendarHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.userBlock}>
        <Avatar name={user.nickname} size={46} source={user.avatar ?? null} />
        <View style={styles.userTextBlock}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.userName} testID="home-viewed-user-name">
              {user.nickname}
            </Text>
            {canCycleFriends ? (
              <View style={styles.friendNav}>
                <Pressable
                  accessibilityLabel="이전 친구 캘린더"
                  onPress={onPrevFriend}
                  style={({ pressed }) => [styles.friendNavButton, pressed && styles.pressed]}
                  testID="home-friend-prev-button">
                  <Ionicons color={colors.mutedText} name="chevron-down" size={14} />
                </Pressable>
                <Pressable
                  accessibilityLabel="다음 친구 캘린더"
                  onPress={onNextFriend}
                  style={({ pressed }) => [styles.friendNavButton, pressed && styles.pressed]}
                  testID="home-friend-next-button">
                  <Ionicons color={colors.mutedText} name="chevron-up" size={14} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="년월 선택"
          onPress={onOpenMonthPicker}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
          testID="home-month-picker-toggle">
          <Text style={styles.monthLabel} testID="home-month-label">
            {formatMonthLabel(currentDate)}
          </Text>
          <Ionicons color={colors.text} name="chevron-down" size={18} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  userBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userTextBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  friendNav: {
    flexDirection: 'column',
    gap: 2,
  },
  friendNavButton: {
    width: 18,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    ...typography.heading,
    color: colors.text,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  monthLabel: {
    ...typography.heading,
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
