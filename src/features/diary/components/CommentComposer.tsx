import { StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import type { Comment } from '@/types/comment';
import { colors, radius, spacing, typography } from '@/theme';

interface CommentComposerProps {
  isLoggedIn: boolean;
  isSubmitting: boolean;
  editingComment: Comment | null;
  replyTo: Comment | null;
  value: string;
  onChange: (value: string) => void;
  onCancelContext: () => void;
  onSubmit: () => void;
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  testIDPrefix?: string;
}

export function CommentComposer({
  isLoggedIn,
  isSubmitting,
  editingComment,
  replyTo,
  value,
  onChange,
  onCancelContext,
  onSubmit,
  onOpenLogin,
  onOpenSignup,
  testIDPrefix = 'diary-comment',
}: CommentComposerProps) {
  if (!isLoggedIn) {
    return (
      <View style={styles.guestContainer} testID={`${testIDPrefix}-guest-actions`}>
        <Text style={styles.guestMessage}>댓글을 작성하려면 로그인해주세요.</Text>
        <View style={styles.guestButtons}>
          <AppButton
            fullWidth={false}
            label="로그인"
            onPress={onOpenLogin}
            testID={`${testIDPrefix}-login-button`}
            variant="neutral"
          />
          <AppButton
            fullWidth={false}
            label="가입하기"
            onPress={onOpenSignup}
            testID={`${testIDPrefix}-signup-button`}
            variant="ghost"
          />
        </View>
      </View>
    );
  }

  const contextLabel = editingComment
    ? '댓글 수정 중'
    : replyTo
      ? `${replyTo.nickname}님에게 답글 작성 중`
      : null;

  return (
    <View style={styles.container}>
      {contextLabel ? (
        <View style={styles.contextRow}>
          <Text style={styles.contextLabel}>{contextLabel}</Text>
          <AppButton
            fullWidth={false}
            label="취소"
            onPress={onCancelContext}
            testID={`${testIDPrefix}-cancel-context-button`}
            variant="ghost"
          />
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          multiline
          onChangeText={onChange}
          placeholder={editingComment ? '댓글 수정...' : '댓글 달기...'}
          placeholderTextColor={colors.mutedText}
          style={styles.input}
          testID={`${testIDPrefix}-input`}
          value={value}
        />
        <AppButton
          fullWidth={false}
          label={editingComment ? '수정' : '게시'}
          loading={isSubmitting}
          onPress={onSubmit}
          testID={`${testIDPrefix}-submit-button`}
          variant="neutral"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  guestContainer: {
    gap: spacing.sm,
  },
  guestMessage: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
  },
  guestButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  contextLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
});
