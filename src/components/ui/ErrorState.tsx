import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export function ErrorState({
  title = '문제가 발생했습니다.',
  description = '잠시 후 다시 시도해 주세요.',
  actionLabel = '다시 시도',
  onPressAction,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onPressAction ? (
        <Pressable onPress={onPressAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedText,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
