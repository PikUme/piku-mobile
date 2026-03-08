import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'neutral';
  size?: 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary,
    textColor: colors.white,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondarySoft,
    textColor: colors.secondary,
    borderColor: colors.secondarySoft,
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: colors.text,
    borderColor: colors.border,
  },
  destructive: {
    backgroundColor: colors.danger,
    textColor: colors.white,
    borderColor: colors.danger,
  },
  neutral: {
    backgroundColor: colors.black,
    textColor: colors.white,
    borderColor: colors.black,
  },
};

const sizeStyles = {
  md: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
};

export function AppButton({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  leftSlot,
  rightSlot,
  ...props
}: PropsWithChildren<AppButtonProps>) {
  const tone = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
          opacity: isDisabled ? 0.45 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={tone.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {leftSlot ? <View style={styles.slot}>{leftSlot}</View> : null}
          <Text style={[styles.label, { color: tone.textColor }]}>{label}</Text>
          {rightSlot ? <View style={styles.slot}>{rightSlot}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.button,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
