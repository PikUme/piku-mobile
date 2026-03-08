import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiaryDetail } from '@/types/diary';
import { colors, spacing, typography } from '@/theme';
import { getDiaryContentPreview } from '@/features/diary/lib/detail';

interface DiaryDetailBodyProps {
  diary: DiaryDetail;
  testIDPrefix: string;
}

export function DiaryDetailBody({
  diary,
  testIDPrefix,
}: DiaryDetailBodyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const preview = useMemo(
    () => getDiaryContentPreview(diary.content),
    [diary.content],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.contentText} testID={`${testIDPrefix}-content`}>
        {isExpanded ? diary.content : preview.text}
      </Text>
      {!isExpanded && preview.truncated ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsExpanded(true)}
          style={({ pressed }) => pressed && styles.pressed}
          testID={`${testIDPrefix}-content-more`}>
          <Text style={styles.moreLabel}>더 보기</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  contentText: {
    ...typography.body,
    color: colors.text,
  },
  moreLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.82,
  },
});
