import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface ImagePreviewViewerProps {
  visible: boolean;
  imageUri?: string | null;
  title?: string;
  onClose: () => void;
}

export function ImagePreviewViewer({
  visible,
  imageUri,
  title,
  onClose,
}: ImagePreviewViewerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text numberOfLines={1} style={styles.title}>
            {title ?? '이미지 미리보기'}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>닫기</Text>
          </Pressable>
        </View>
        <View style={styles.imageFrame}>
          {imageUri ? (
            <Image resizeMode="contain" source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <Text style={styles.emptyText}>이미지를 불러올 수 없습니다.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.92)',
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    ...typography.heading,
    color: colors.white,
  },
  closeButton: {
    marginLeft: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeLabel: {
    ...typography.caption,
    color: colors.white,
  },
  imageFrame: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    ...typography.body,
    color: colors.white,
  },
});
