import { forwardRef, ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(
  (
    {
      label,
      helperText,
      errorText,
      leading,
      trailing,
      editable = true,
      style,
      ...props
    },
    ref,
  ) => {
    const hasError = Boolean(errorText);

    return (
      <View style={styles.container}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.field,
            hasError && styles.fieldError,
            !editable && styles.fieldDisabled,
          ]}>
          {leading ? <View style={styles.slot}>{leading}</View> : null}
          <TextInput
            accessibilityLabel={props.accessibilityLabel ?? label}
            editable={editable}
            placeholderTextColor={colors.mutedText}
            ref={ref}
            style={[styles.input, style]}
            {...props}
          />
          {trailing ? <View style={styles.slot}>{trailing}</View> : null}
        </View>
        {errorText ? (
          <Text style={styles.errorText}>{errorText}</Text>
        ) : helperText ? (
          <Text style={styles.helperText}>{helperText}</Text>
        ) : null}
      </View>
    );
  },
);

AppTextField.displayName = 'AppTextField';

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text,
  },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  fieldDisabled: {
    backgroundColor: colors.surfaceMuted,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  helperText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
});
