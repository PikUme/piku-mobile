import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppModal } from '@/components/ui/AppModal';
import { colors, spacing, typography } from '@/theme';

interface PolicyModalProps {
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
  onAgree?: () => void;
}

export function PolicyModal({
  visible,
  title,
  content,
  onClose,
  onAgree,
}: PolicyModalProps) {
  return (
    <AppModal onClose={onClose} title={title} visible={visible}>
      <ScrollView
        showsVerticalScrollIndicator
        style={styles.content}
        testID="signup-policy-modal-content">
        <View style={styles.scrollInner}>
          <Text style={styles.body}>{content}</Text>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <AppButton
          label="닫기"
          onPress={onClose}
          testID="signup-policy-close-button"
          variant="ghost"
        />
        {onAgree ? (
          <AppButton
            label="동의"
            onPress={onAgree}
            testID="signup-policy-agree-button"
            variant="neutral"
          />
        ) : null}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    maxHeight: 420,
    flexGrow: 0,
  },
  scrollInner: {
    paddingBottom: spacing.md,
  },
  body: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
