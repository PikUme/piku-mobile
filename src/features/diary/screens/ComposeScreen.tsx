import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ImagePreviewViewer } from '@/components/ui/ImagePreviewViewer';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ComposePhotoReorderGrid } from '@/features/diary/components/ComposePhotoReorderGrid';
import {
  MAX_DIARY_CONTENT_LENGTH,
  MAX_TOTAL_PHOTOS,
  buildDiaryCreatePayload,
  getAvailablePhotoSlots,
} from '@/features/diary/lib/compose';
import { compressPickedImage, createAiComposePhoto } from '@/features/diary/lib/media';
import {
  getSavedComposePrivacy,
  setSavedComposePrivacy,
} from '@/features/diary/lib/privacyPreference';
import { isFutureCalendarDay, parseDateKey } from '@/features/home/lib/calendar';
import {
  createDiary,
  generateAiPhoto,
  getRemainingAiRequests,
} from '@/lib/api/diaries';
import { useAuthStore } from '@/store/authStore';
import type { ComposePhoto, DiaryVisibility } from '@/types/diary';
import { colors, radius, spacing, typography } from '@/theme';

const PRIVACY_OPTIONS: {
  value: DiaryVisibility;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'PUBLIC',
    label: '전체 공개',
    description: '모든 사용자가 볼 수 있습니다.',
    icon: 'globe-outline',
  },
  {
    value: 'FRIENDS',
    label: '친구 공개',
    description: '친구 관계의 사용자에게만 노출됩니다.',
    icon: 'people-outline',
  },
  {
    value: 'PRIVATE',
    label: '나만 보기',
    description: '본인만 확인할 수 있습니다.',
    icon: 'lock-closed-outline',
  },
];

const formatComposeDateLabel = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  if (!date) {
    return dateKey;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);
};

const getTodayDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
};

const waitForPickerPresentation = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 180);
    });
  });

function ActionCard({
  disabled = false,
  icon,
  title,
  caption,
  onPress,
  testID,
  loading = false,
}: {
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  caption?: string;
  onPress: () => void;
  testID: string;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        disabled && styles.actionCardDisabled,
        pressed && !disabled && styles.pressed,
      ]}
      testID={testID}>
      <Ionicons color={disabled ? colors.mutedText : colors.text} name={icon} size={24} />
      <Text style={[styles.actionCardTitle, disabled && styles.actionCardTitleDisabled]}>
        {loading ? '처리 중' : title}
      </Text>
      {caption ? (
        <Text style={styles.actionCardCaption}>{caption}</Text>
      ) : null}
    </Pressable>
  );
}

export function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const selectedDateParam = Array.isArray(params.date) ? params.date[0] : params.date;
  const selectedDate = selectedDateParam ?? getTodayDateKey();
  const parsedSelectedDate = parseDateKey(selectedDate);
  const isInvalidDate = !parsedSelectedDate;
  const isFutureDate = parsedSelectedDate ? isFutureCalendarDay(parsedSelectedDate) : false;
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [privacy, setPrivacy] = useState<DiaryVisibility>('PUBLIC');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<ComposePhoto[]>([]);
  const [isPrivacySheetVisible, setIsPrivacySheetVisible] = useState(false);
  const [isPhotoSourceSheetVisible, setIsPhotoSourceSheetVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const aiRemainingQuery = useQuery({
    queryKey: ['diary-ai-remaining'],
    queryFn: getRemainingAiRequests,
    enabled: isLoggedIn,
  });
  const remainingAiRequests = aiRemainingQuery.data ?? null;

  const availablePhotoSlots = useMemo(() => getAvailablePhotoSlots(photos), [photos]);
  const formattedDate = useMemo(() => formatComposeDateLabel(selectedDate), [selectedDate]);
  const selectedPrivacyOption = PRIVACY_OPTIONS.find((option) => option.value === privacy);

  useEffect(() => {
    if (isInvalidDate || isFutureDate) {
      router.replace('/');
      return;
    }

    if (!isLoggedIn || !user) {
      router.replace('/login');
    }
  }, [isFutureDate, isInvalidDate, isLoggedIn, router, user]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const savedPrivacy = await getSavedComposePrivacy();
      if (isMounted) {
        setPrivacy(savedPrivacy);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isInvalidDate || isFutureDate || !isLoggedIn || !user) {
    return null;
  }

  const setMessageBanner = (nextMessage: string, isError = false) => {
    if (isError) {
      setErrorMessage(nextMessage);
      setMessage('');
      return;
    }

    setMessage(nextMessage);
    setErrorMessage('');
  };

  const handleAddAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (assets.length === 0) {
      return;
    }

    setIsPickingImages(true);
    setErrorMessage('');

    try {
      const nextPhotos = await Promise.all(assets.map((asset) => compressPickedImage(asset)));
      setPhotos((current) => [...current, ...nextPhotos].slice(0, MAX_TOTAL_PHOTOS));
      setMessageBanner('사진이 추가되었습니다.');
    } catch (requestError) {
      setMessageBanner(
        requestError instanceof Error
          ? requestError.message
          : '사진을 추가하지 못했습니다.',
        true,
      );
    } finally {
      setIsPickingImages(false);
    }
  };

  const handlePickFromLibrary = async () => {
    setIsPhotoSourceSheetVisible(false);

    if (availablePhotoSlots <= 0) {
      setMessageBanner(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`, true);
      return;
    }

    try {
      await waitForPickerPresentation();

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessageBanner('사진 보관함 접근 권한이 필요합니다.', true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: availablePhotoSlots,
      });

      if (!result.canceled) {
        await handleAddAssets(result.assets.slice(0, availablePhotoSlots));
      }
    } catch (requestError) {
      setMessageBanner(
        requestError instanceof Error
          ? requestError.message
          : '앨범을 열지 못했습니다.',
        true,
      );
    }
  };

  const handleTakePhoto = async () => {
    setIsPhotoSourceSheetVisible(false);

    if (availablePhotoSlots <= 0) {
      setMessageBanner(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`, true);
      return;
    }

    try {
      await waitForPickerPresentation();

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessageBanner('카메라 접근 권한이 필요합니다.', true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled) {
        await handleAddAssets(result.assets.slice(0, 1));
      }
    } catch (requestError) {
      setMessageBanner(
        requestError instanceof Error
          ? requestError.message
          : '카메라를 열지 못했습니다.',
        true,
      );
    }
  };

  const handleGenerateAi = async () => {
    if (availablePhotoSlots <= 0) {
      setMessageBanner(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`, true);
      return;
    }

    if (!content.trim()) {
      setMessageBanner('일기 내용을 먼저 입력해주세요.', true);
      return;
    }

    if (remainingAiRequests === null || remainingAiRequests <= 0) {
      setMessageBanner('AI 사진 생성 가능 횟수를 모두 사용했습니다.', true);
      return;
    }

    setIsGeneratingAi(true);
    setErrorMessage('');

    try {
      const aiPhoto = await generateAiPhoto(content);
      setPhotos((current) => [...current, createAiComposePhoto(aiPhoto)].slice(0, MAX_TOTAL_PHOTOS));
      queryClient.setQueryData<number>(
        ['diary-ai-remaining'],
        Math.max(0, (remainingAiRequests ?? 0) - 1),
      );
      setMessageBanner('AI 사진이 추가되었습니다.');
    } catch (requestError) {
      setMessageBanner(
        requestError instanceof Error
          ? requestError.message
          : 'AI 사진 생성에 실패했습니다.',
        true,
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    setMessageBanner('사진을 삭제했습니다.');
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setMessageBanner('일기 내용을 입력해주세요.', true);
      return;
    }

    if (content.length > MAX_DIARY_CONTENT_LENGTH) {
      setMessageBanner(`일기는 ${MAX_DIARY_CONTENT_LENGTH}자까지 입력할 수 있습니다.`, true);
      return;
    }

    if (photos.length === 0) {
      setMessageBanner('사진을 1장 이상 등록해주세요.', true);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const payload = buildDiaryCreatePayload({
        content,
        date: selectedDate,
        photos,
        privacy,
      });
      await createDiary(payload);
      await setSavedComposePrivacy(privacy);
      router.replace('/');
    } catch (requestError) {
      setMessageBanner(
        requestError instanceof Error
          ? requestError.message
          : '일기 저장에 실패했습니다.',
        true,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <ScreenContainer contentStyle={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/')}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
            testID="compose-close-button">
            <Text style={styles.headerButtonLabel}>닫기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>오늘의 일기</Text>
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.headerButton,
              isSaving && styles.headerButtonDisabled,
              pressed && !isSaving && styles.pressed,
            ]}
            testID="compose-save-button">
            <Text style={styles.headerSaveLabel}>{isSaving ? '저장 중' : '완료'}</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.actionRow}>
            <ActionCard
              caption={`횟수 ${remainingAiRequests ?? '...'}`}
              disabled={
                isGeneratingAi ||
                remainingAiRequests === 0 ||
                availablePhotoSlots <= 0
              }
              icon="sparkles-outline"
              loading={isGeneratingAi}
              onPress={() => {
                void handleGenerateAi();
              }}
              testID="compose-ai-button"
              title="AI 사진"
            />
            <ActionCard
              caption={`${photos.length}/${MAX_TOTAL_PHOTOS}`}
              disabled={isPickingImages || availablePhotoSlots <= 0}
              icon="add-circle-outline"
              loading={isPickingImages}
              onPress={() => {
                setIsPhotoSourceSheetVisible(true);
              }}
              testID="compose-add-photo-button"
              title="사진 추가"
            />
          </View>

          <Text style={styles.photoHelperText}>
            길게 눌러 드래그하면 순서를 바꿀 수 있고, 첫 사진이 대표 사진이 됩니다.
            사진을 탭하면 대표 사진으로 이동하거나 크게 볼 수 있습니다.
          </Text>

          <ComposePhotoReorderGrid
            onChange={(nextPhotos) => {
              setPhotos(nextPhotos);
              setMessageBanner('사진 순서를 변경했습니다.');
            }}
            onPreview={(uri) => {
              setPreviewUri(uri);
              setIsPreviewVisible(true);
            }}
            onRemove={handleRemovePhoto}
            photos={photos}
          />

          <View style={styles.metaRow}>
            <View style={styles.userBlock}>
              <Avatar name={user.nickname} size={36} source={user.avatar ?? null} />
              <View style={styles.userText}>
                <Text style={styles.userName}>{user.nickname}</Text>
                <Text style={styles.dateLabel} testID="compose-selected-date">
                  {formattedDate}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsPrivacySheetVisible(true)}
              style={({ pressed }) => [styles.privacyButton, pressed && styles.pressed]}
              testID="compose-privacy-button">
              <Ionicons
                color={colors.text}
                name={selectedPrivacyOption?.icon ?? 'globe-outline'}
                size={16}
              />
              <Text style={styles.privacyButtonLabel}>
                {selectedPrivacyOption?.label ?? '전체 공개'}
              </Text>
            </Pressable>
          </View>

          {message ? (
            <View style={styles.messageBanner} testID="compose-message-banner">
              <Text style={styles.messageBannerLabel}>{message}</Text>
            </View>
          ) : null}
          {errorMessage ? (
            <View style={styles.errorBanner} testID="compose-error-banner">
              <Text style={styles.errorBannerLabel}>{errorMessage}</Text>
            </View>
          ) : null}

          <View style={styles.editorCard}>
            <TextInput
              multiline
              onChangeText={(value) =>
                setContent(value.slice(0, MAX_DIARY_CONTENT_LENGTH))
              }
              placeholder="오늘의 하루를 기록해보세요..."
              placeholderTextColor={colors.mutedText}
              style={styles.contentInput}
              testID="compose-content-input"
              textAlignVertical="top"
              value={content}
            />
            <Text style={styles.counterLabel} testID="compose-content-count">
              {content.length}/{MAX_DIARY_CONTENT_LENGTH}
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>

      <BottomSheet
        description="앨범에서 여러 장을 고르거나 카메라로 바로 촬영할 수 있습니다."
        onClose={() => setIsPhotoSourceSheetVisible(false)}
        title="사진 추가"
        visible={isPhotoSourceSheetVisible}>
        <View style={styles.photoSourceSheetContent}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handlePickFromLibrary();
            }}
            style={({ pressed }) => [styles.photoSourceOption, pressed && styles.pressed]}
            testID="compose-photo-source-library">
            <Ionicons color={colors.text} name="images-outline" size={20} />
            <View style={styles.photoSourceText}>
              <Text style={styles.photoSourceTitle}>앨범에서 선택</Text>
              <Text style={styles.photoSourceDescription}>
                여러 장을 한 번에 선택할 수 있습니다.
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handleTakePhoto();
            }}
            style={({ pressed }) => [styles.photoSourceOption, pressed && styles.pressed]}
            testID="compose-photo-source-camera">
            <Ionicons color={colors.text} name="camera-outline" size={20} />
            <View style={styles.photoSourceText}>
              <Text style={styles.photoSourceTitle}>카메라 촬영</Text>
              <Text style={styles.photoSourceDescription}>
                지금 바로 사진을 촬영해 추가합니다.
              </Text>
            </View>
          </Pressable>
        </View>
      </BottomSheet>

      <BottomSheet
        description="저장 시 마지막으로 선택한 값이 다음 작성 화면의 기본값으로 유지됩니다."
        onClose={() => setIsPrivacySheetVisible(false)}
        title="공개 범위"
        visible={isPrivacySheetVisible}>
        <View style={styles.privacySheetContent}>
          {PRIVACY_OPTIONS.map((option) => {
            const selected = option.value === privacy;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => {
                  setPrivacy(option.value);
                  void setSavedComposePrivacy(option.value);
                  setIsPrivacySheetVisible(false);
                }}
                style={({ pressed }) => [
                  styles.privacyOption,
                  selected && styles.privacyOptionSelected,
                  pressed && styles.pressed,
                ]}
                testID={`compose-privacy-option-${option.value}`}>
                <Ionicons
                  color={selected ? colors.white : colors.text}
                  name={option.icon}
                  size={20}
                />
                <View style={styles.privacyOptionText}>
                  <Text
                    style={[
                      styles.privacyOptionTitle,
                      selected && styles.privacyOptionTitleSelected,
                    ]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.privacyOptionDescription,
                      selected && styles.privacyOptionDescriptionSelected,
                    ]}>
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      <ImagePreviewViewer
        imageUri={previewUri}
        onClose={() => setIsPreviewVisible(false)}
        title="선택한 사진"
        visible={isPreviewVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.heading,
    color: colors.text,
  },
  headerButton: {
    minWidth: 48,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.45,
  },
  headerButtonLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '700',
  },
  headerSaveLabel: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  content: {
    gap: spacing.lg,
    padding: spacing['2xl'],
    paddingBottom: spacing['5xl'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actionCardDisabled: {
    opacity: 0.45,
  },
  actionCardTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  actionCardTitleDisabled: {
    color: colors.mutedText,
  },
  actionCardCaption: {
    ...typography.caption,
    color: colors.mutedText,
  },
  photoHelperText: {
    ...typography.caption,
    color: colors.mutedText,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  userBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userText: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  privacyButtonLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  messageBanner: {
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageBannerLabel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  errorBanner: {
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorBannerLabel: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '700',
  },
  editorCard: {
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  contentInput: {
    minHeight: 180,
    ...typography.body,
    color: colors.text,
  },
  counterLabel: {
    alignSelf: 'flex-end',
    ...typography.caption,
    color: colors.mutedText,
  },
  photoSourceSheetContent: {
    gap: spacing.sm,
  },
  photoSourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  photoSourceText: {
    flex: 1,
    gap: spacing.xs,
  },
  photoSourceTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  photoSourceDescription: {
    ...typography.caption,
    color: colors.mutedText,
  },
  privacySheetContent: {
    gap: spacing.sm,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
  },
  privacyOptionSelected: {
    backgroundColor: colors.black,
  },
  privacyOptionText: {
    flex: 1,
    gap: spacing.xs,
  },
  privacyOptionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  privacyOptionTitleSelected: {
    color: colors.white,
  },
  privacyOptionDescription: {
    ...typography.caption,
    color: colors.mutedText,
  },
  privacyOptionDescriptionSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  pressed: {
    opacity: 0.82,
  },
});
