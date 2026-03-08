import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';

interface AppModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function AppModal({
  visible,
  title,
  description,
  onClose,
  children,
}: AppModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="모달 닫기 배경"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    padding: spacing['2xl'],
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing['2xl'],
    gap: spacing.md,
    ...shadows.card,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.mutedText,
  },
});
