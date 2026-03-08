import { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppTopBar } from '@/components/shell/AppTopBar';
import { AppHeader } from '@/components/ui/AppHeader';
import { Badge } from '@/components/ui/Badge';
import { ListItemCard } from '@/components/ui/ListItemCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { colors, radius, spacing, typography } from '@/theme';

interface PlaceholderScreenProps {
  title: string;
  description: string;
  bullets?: string[];
  showShellHeader?: boolean;
}

export function PlaceholderScreen({
  title,
  description,
  bullets = [],
  showShellHeader = false,
  children,
}: PropsWithChildren<PlaceholderScreenProps>) {
  return (
    <ScreenContainer scroll>
      {showShellHeader ? <AppTopBar title={title} /> : null}
      <View style={styles.badgeRow}>
        <Badge label="Bootstrap Complete" />
      </View>
      <AppHeader subtitle="공통 UI 기반 반영" title={title} />
      <Text style={styles.description}>{description}</Text>
      {children}
      <View style={styles.section}>
        <Text style={styles.cardTitle}>Next implementation targets</Text>
        {bullets.map((item) => (
          <ListItemCard
            key={item}
            description="tasks.md 순서에 맞춰 순차 구현"
            title={item}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  description: {
    ...typography.body,
    color: colors.mutedText,
    marginBottom: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  cardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
});
