import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import { Badge } from '@/components/ui/Badge';

interface TabIconProps {
  name: ComponentProps<typeof Ionicons>['name'];
  focused?: boolean;
  badgeCount?: number;
  size?: number;
}

export function TabIcon({
  name,
  focused = false,
  badgeCount,
  size = 22,
}: TabIconProps) {
  return (
    <View style={styles.container}>
      <Ionicons
        color={focused ? colors.primary : colors.mutedText}
        name={name}
        size={size}
      />
      {typeof badgeCount === 'number' && badgeCount > 0 ? (
        <View style={styles.badge}>
          <Badge count={badgeCount > 99 ? 99 : badgeCount} tone="danger" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    minHeight: 28,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.md,
  },
});
