import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { colors, spacing } from '@/theme';

interface PasswordVisibilityToggleProps {
  visible: boolean;
  onPress: () => void;
  testID?: string;
}

export function PasswordVisibilityToggle({
  visible,
  onPress,
  testID,
}: PasswordVisibilityToggleProps) {
  return (
    <Pressable
      accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
      accessibilityRole="button"
      hitSlop={spacing.sm}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      testID={testID}>
      <Ionicons
        color={colors.mutedText}
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
