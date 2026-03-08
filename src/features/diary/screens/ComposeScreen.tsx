import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
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
import {
  MAX_DIARY_CONTENT_LENGTH,
  MAX_TOTAL_PHOTOS,
  buildDiaryCreatePayload,
  getAvailablePhotoSlots,
  getUserPhotoCount,
  moveComposePhoto,
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
  const userPhotoCount = useMemo(() => getUserPhotoCount(photos), [photos]);
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
    if (availablePhotoSlots <= 0) {
      setMessageBanner(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`, true);
      return;
    }

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
  };

  const handleTakePhoto = async () => {
    if (availablePhotoSlots <= 0) {
      setMessageBanner(`사진은 최대 ${MAX_TOTAL_PHOTOS}장까지 추가할 수 있습니다.`, true);
      return;
    }

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

  const handleMovePhoto = (fromIndex: number, direction: 'left' | 'right') => {
    const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
    setPhotos((current) => moveComposePhoto(current, fromIndex, toIndex));
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
              caption={`${userPhotoCount}장`}
              disabled={isPickingImages || availablePhotoSlots <= 0}
              icon="images-outline"
              loading={isPickingImages}
              onPress={() => {
                void handlePickFromLibrary();
              }}
              testID="compose-library-button"
              title="앨범"
            />
            <ActionCard
              caption={`${photos.length}/${MAX_TOTAL_PHOTOS}`}
              disabled={isPickingImages || availablePhotoSlots <= 0}
              icon="camera-outline"
              loading={isPickingImages}
              onPress={() => {
                void handleTakePhoto();
              }}
              testID="compose-camera-button"
              title="카메라"
            />
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.photoStrip}
            showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => (
              <View key={photo.id} style={styles.photoCard} testID={`compose-photo-card-${photo.id}`}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setPreviewUri(photo.previewUri);
                    setIsPreviewVisible(true);
                  }}
                  style={({ pressed }) => [styles.photoPreviewFrame, pressed && styles.pressed]}
                  testID={`compose-photo-preview-${photo.id}`}>
                  <Image source={{ uri: photo.previewUri }} style={styles.photoPreviewImage} />
                  {index === 0 ? (
                    <View
                      style={styles.coverBadge}
                      testID={`compose-photo-cover-badge-${photo.id}`}>
                      <Text style={styles.coverBadgeLabel}>대표 사진</Text>
                    </View>
                  ) : null}
                </Pressable>
                <View style={styles.photoActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={index === 0}
                    onPress={() => handleMovePhoto(index, 'left')}
                    style={({ pressed }) => [
                      styles.photoActionButton,
                      index === 0 && styles.photoActionButtonDisabled,
                      pressed && index !== 0 && styles.pressed,
                    ]}
                    testID={`compose-photo-move-left-${photo.id}`}>
                    <Ionicons color={colors.text} name="chevron-back" size={16} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleRemovePhoto(photo.id)}
                    style={({ pressed }) => [styles.photoActionButton, pressed && styles.pressed]}
                    testID={`compose-photo-remove-${photo.id}`}>
                    <Ionicons color={colors.danger} name="close" size={16} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={index === photos.length - 1}
                    onPress={() => handleMovePhoto(index, 'right')}
                    style={({ pressed }) => [
                      styles.photoActionButton,
                      index === photos.length - 1 && styles.photoActionButtonDisabled,
                      pressed && index !== photos.length - 1 && styles.pressed,
                    ]}
                    testID={`compose-photo-move-right-${photo.id}`}>
                    <Ionicons color={colors.text} name="chevron-forward" size={16} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

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
  photoStrip: {
    gap: spacing.md,
  },
  photoCard: {
    width: 128,
    gap: spacing.sm,
  },
  photoPreviewFrame: {
    width: 128,
    height: 128,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    left: spacing.sm,
    right: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
  },
  coverBadgeLabel: {
    ...typography.caption,
    color: colors.white,
    textAlign: 'center',
    fontWeight: '700',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  photoActionButton: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  photoActionButtonDisabled: {
    opacity: 0.35,
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
