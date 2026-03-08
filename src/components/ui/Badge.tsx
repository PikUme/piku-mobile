import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface BadgeProps {
  label?: string;
  count?: number;
  tone?: 'primary' | 'neutral' | 'danger' | 'success';
}

const toneStyles = {
  primary: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  neutral: {
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
  },
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success,
  },
};

export function Badge({ label, count, tone = 'primary' }: BadgeProps) {
  const value = label ?? (typeof count === 'number' ? String(count) : '');
  if (!value) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: toneStyles[tone].backgroundColor },
      ]}>
      <Text style={[styles.label, { color: toneStyles[tone].color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.caption,
  },
});
