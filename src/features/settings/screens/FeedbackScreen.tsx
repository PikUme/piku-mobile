import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextField } from '@/components/ui/AppTextField';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { submitInquiry } from '@/lib/api/inquiry';
import { showAlert } from '@/lib/ui/feedback';
import { colors, radius, spacing, typography } from '@/theme';

export function FeedbackScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/settings');
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInquiry({
        content: content.trim(),
        image: image
          ? {
              uri: image.uri,
              name: image.fileName ?? `inquiry-${Date.now()}.jpg`,
              type: image.mimeType ?? 'image/jpeg',
            }
          : null,
      });
      showAlert('문의 접수 완료', '보내주신 내용을 확인한 뒤 안내드리겠습니다.');
      router.back();
    } catch (error) {
      showAlert(
        '문의 접수 실패',
        error instanceof Error ? error.message : '문의를 접수하지 못했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={styles.screen} scroll>
      <AppHeader
        leftSlot={
          <Pressable
            accessibilityLabel="뒤로가기"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            testID="feedback-back-button">
            <Ionicons color={colors.text} name="close" size={20} />
          </Pressable>
        }
        title="문의"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>문의 내용</Text>
        <AppTextField
          helperText={`${content.length}/1000`}
          label="문의 내용"
          maxLength={1000}
          multiline
          onChangeText={setContent}
          placeholder="문의하실 내용을 입력해주세요."
          style={styles.textArea}
          testID="feedback-content-input"
          value={content}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>사진 첨부</Text>
        <Text style={styles.sectionDescription}>선택 사항이며 최대 1장까지 첨부할 수 있습니다.</Text>
        <View style={styles.imageRow}>
          <AppButton
            disabled={Boolean(image)}
            fullWidth={false}
            label="사진 선택"
            onPress={() => {
              void handlePickImage();
            }}
            testID="feedback-pick-image-button"
            variant="ghost"
          />
          {image ? (
            <View style={styles.previewCard} testID="feedback-image-preview">
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <Pressable
                accessibilityLabel="첨부 이미지 제거"
                onPress={() => setImage(null)}
                style={({ pressed }) => [styles.removeImageButton, pressed && styles.pressed]}
                testID="feedback-remove-image-button">
                <Ionicons color={colors.white} name="close" size={14} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <AppButton
        disabled={!content.trim() || isSubmitting}
        label="제출하기"
        loading={isSubmitting}
        onPress={() => {
          void handleSubmit();
        }}
        testID="feedback-submit-button"
        variant="neutral"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing['2xl'],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: -spacing.sm,
  },
  textArea: {
    minHeight: 148,
    textAlignVertical: 'top',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewCard: {
    position: 'relative',
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  pressed: {
    opacity: 0.85,
  },
});
