import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({
  label = '불러오는 중입니다.',
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        accessible
        accessibilityLabel={label}
        accessibilityRole="progressbar"
        color={colors.primary}
        size="small"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
