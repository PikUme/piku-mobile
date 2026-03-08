import { PropsWithChildren, ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors, spacing, typography } from '@/theme';

interface AuthScreenLayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  footer?: ReactNode;
  onBack?: () => void;
}

export function AuthScreenLayout({
  title,
  description,
  footer,
  onBack,
  children,
}: AuthScreenLayoutProps) {
  return (
    <ScreenContainer scroll>
      <View style={styles.page}>
        <View style={styles.panel}>
          <View style={styles.header}>
            {onBack ? (
              <Pressable
                accessibilityLabel="뒤로가기"
                accessibilityRole="button"
                onPress={onBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
                testID="auth-back-button">
                <Ionicons color={colors.text} name="chevron-back" size={22} />
              </Pressable>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.xl,
  },
  header: {
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  title: {
    ...typography.title,
    color: colors.text,
    fontWeight: '700',
  },
  description: {
    ...typography.body,
    color: colors.mutedText,
    textAlign: 'center',
  },
  content: {
    gap: spacing.lg,
  },
  footer: {
    gap: spacing.md,
  },
});
