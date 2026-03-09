import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  heightRatio?: number;
}

export function BottomSheet({
  visible,
  title,
  description,
  onClose,
  children,
  footer,
  heightRatio = 0.72,
}: BottomSheetProps) {
  const [isMounted, setIsMounted] = useState(visible);
  const translateY = useRef(new Animated.Value(28)).current;
  const shouldAnimate = process.env.NODE_ENV !== 'test';

  useEffect(() => {
    if (!shouldAnimate) {
      setIsMounted(visible);
      return;
    }

    if (visible) {
      translateY.setValue(28);
      setIsMounted(true);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 22,
        mass: 0.9,
        stiffness: 260,
        useNativeDriver: true,
      }).start();
      return;
    }

    if (!isMounted) {
      return;
    }

    Animated.timing(translateY, {
      toValue: 28,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [isMounted, shouldAnimate, translateY, visible]);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      visible={isMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <Pressable
          accessibilityLabel="바텀시트 닫기 배경"
          onPress={onClose}
          style={styles.scrim}
          testID="bottom-sheet-scrim"
        />
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: `${heightRatio * 100}%`, transform: [{ translateY }] },
          ]}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
    ...shadows.card,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  description: {
    ...typography.body,
    color: colors.mutedText,
  },
  content: {
    flexShrink: 1,
  },
  footer: {
    marginTop: spacing.sm,
  },
});
