import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextField } from '@/components/ui/AppTextField';
import { Avatar } from '@/components/ui/Avatar';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getFixedCharacters } from '@/lib/api/characters';
import {
  checkNicknameAvailability,
  getProfileInfo,
  updateUserProfile,
} from '@/lib/api/profile';
import { showAlert } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import type { FixedCharacter } from '@/types/character';
import { colors, radius, spacing, typography } from '@/theme';

const CHARACTER_EMOJI: Record<string, string> = {
  fox: '🦊',
  cat: '🐱',
  bear: '🐻',
  rabbit: '🐰',
};

function stripProtocol(url: string) {
  return url.replace(/^(https?):\/\//, '');
}

function findCharacterIdFromAvatar(
  avatar: string | undefined,
  characters: FixedCharacter[],
): string {
  if (!avatar) {
    return '';
  }

  const normalizedAvatar = stripProtocol(avatar);
  const matchedCharacter = characters.find((character) => {
    if (!character.displayImageUrl) {
      return false;
    }

    return normalizedAvatar.includes(stripProtocol(character.displayImageUrl));
  });

  return matchedCharacter ? String(matchedCharacter.id) : '';
}

function CharacterOption({
  character,
  isSelected,
  onPress,
}: {
  character: FixedCharacter;
  isSelected: boolean;
  onPress: () => void;
}) {
  const fallbackEmoji = CHARACTER_EMOJI[character.type.toLowerCase()] ?? '✨';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.characterCard,
        isSelected && styles.characterCardSelected,
        pressed && styles.characterCardPressed,
      ]}
      testID={`profile-edit-character-option-${character.id}`}>
      {character.displayImageUrl ? (
        <Image
          resizeMode="cover"
          source={{ uri: character.displayImageUrl }}
          style={styles.characterImage}
        />
      ) : (
        <Text style={styles.characterFallback}>{fallbackEmoji}</Text>
      )}
    </Pressable>
  );
}

export function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [nickname, setNickname] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [hasInitializedForm, setHasInitializedForm] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['profile-edit', user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => getProfileInfo(user!.id),
  });

  const charactersQuery = useQuery({
    queryKey: ['fixed-characters'],
    queryFn: getFixedCharacters,
  });

  const originalNickname = profileQuery.data?.nickname ?? user?.nickname ?? '';
  const originalAvatar = profileQuery.data?.avatar ?? user?.avatar ?? '';
  const originalCharacterId = useMemo(() => {
    if (!charactersQuery.data) {
      return '';
    }

    return findCharacterIdFromAvatar(originalAvatar, charactersQuery.data);
  }, [charactersQuery.data, originalAvatar]);

  useEffect(() => {
    if (!profileQuery.data || !charactersQuery.data || hasInitializedForm) {
      return;
    }

    setNickname(profileQuery.data.nickname);
    setSelectedCharacterId(originalCharacterId);
    setHasInitializedForm(true);
  }, [charactersQuery.data, hasInitializedForm, originalCharacterId, profileQuery.data]);

  useEffect(() => {
    if (!hasInitializedForm) {
      return;
    }

    if (nickname.trim() === originalNickname.trim()) {
      setIsNicknameAvailable(true);
      setNicknameMessage('');
      return;
    }

    setIsNicknameAvailable(null);
    setNicknameMessage('');
  }, [hasInitializedForm, nickname, originalNickname]);

  const selectedCharacter = useMemo(() => {
    return charactersQuery.data?.find((item) => String(item.id) === selectedCharacterId) ?? null;
  }, [charactersQuery.data, selectedCharacterId]);

  const isNicknameChanged = nickname.trim() !== originalNickname.trim();
  const isCharacterChanged = selectedCharacterId !== originalCharacterId;
  const hasChanges = isNicknameChanged || isCharacterChanged;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (user) {
      router.replace(`/profile/${user.id}`);
      return;
    }

    router.replace('/');
  };

  const handleCheckNickname = async () => {
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname || !isNicknameChanged) {
      return;
    }

    setIsCheckingNickname(true);
    try {
      const result = await checkNicknameAvailability(trimmedNickname);
      setIsNicknameAvailable(result.success);
      setNicknameMessage(result.message);
    } catch (error) {
      setIsNicknameAvailable(false);
      setNicknameMessage(
        error instanceof Error ? error.message : '닉네임 확인 중 오류가 발생했습니다.',
      );
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      return;
    }

    if (!hasChanges) {
      router.replace(`/profile/${user.id}`);
      return;
    }

    if (isNicknameChanged && isNicknameAvailable !== true) {
      showAlert('닉네임 확인 필요', '닉네임 중복 확인을 통과해야 합니다.');
      return;
    }

    const payload: {
      newNickname?: string;
      characterId?: number;
    } = {};

    if (isNicknameChanged) {
      payload.newNickname = nickname.trim();
    }

    if (isCharacterChanged && selectedCharacterId) {
      payload.characterId = Number(selectedCharacterId);
    }

    setIsSaving(true);
    try {
      const response = await updateUserProfile(payload);
      const nextUser = {
        ...user,
        nickname: response.newNickname ?? payload.newNickname ?? user.nickname,
        avatar:
          response.avatar ??
          (isCharacterChanged ? selectedCharacter?.displayImageUrl ?? user.avatar : user.avatar),
      };

      await setUser(nextUser);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-preview', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['profile-edit', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['profile-calendar-user', user.id] }),
      ]);

      router.replace(`/profile/${user.id}`);
    } catch (error) {
      showAlert(
        '프로필 저장 실패',
        error instanceof Error ? error.message : '프로필을 저장하지 못했습니다.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <ScreenContainer>
        <ErrorState title="프로필 편집 정보를 확인할 수 없습니다." />
      </ScreenContainer>
    );
  }

  if (profileQuery.isError || charactersQuery.isError) {
    return (
      <ScreenContainer>
        <ErrorState
          description={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : charactersQuery.error instanceof Error
                ? charactersQuery.error.message
                : undefined
          }
          onPressAction={() => {
            void profileQuery.refetch();
            void charactersQuery.refetch();
          }}
          title="프로필 편집 정보를 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  if (profileQuery.isPending || charactersQuery.isPending || !hasInitializedForm) {
    return (
      <ScreenContainer>
        <LoadingState label="프로필 편집 정보를 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screenContent} scroll>
      <View style={styles.headerRow}>
        <AppHeader
          leftSlot={
            <Pressable
              accessibilityLabel="뒤로가기"
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              testID="profile-edit-back-button">
              <Ionicons color={colors.text} name="chevron-back" size={20} />
            </Pressable>
          }
          title="프로필 편집"
        />
      </View>

      <View style={styles.profileSummaryCard}>
        <Avatar name={nickname || user.nickname} size={64} source={selectedCharacter?.displayImageUrl ?? originalAvatar} />
        <View style={styles.profileSummaryText}>
          <Text style={styles.summaryName}>{nickname || user.nickname}</Text>
          <Text style={styles.summaryDescription}>
            닉네임과 캐릭터를 변경하면 홈과 프로필 화면에 바로 반영됩니다.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <AppTextField
          editable={false}
          label="이메일"
          testID="profile-edit-email-input"
          value={user.email}
        />

        <View style={styles.nicknameBlock}>
          <View style={styles.nicknameFieldBlock}>
            <AppTextField
              autoCapitalize="none"
              autoCorrect={false}
              errorText={isNicknameAvailable === false ? nicknameMessage : undefined}
              helperText={isNicknameAvailable === true ? nicknameMessage : '닉네임 변경 시 중복확인이 필요합니다.'}
              label="닉네임"
              maxLength={12}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              testID="profile-edit-nickname-input"
              value={nickname}
            />
          </View>
          <AppButton
            disabled={!nickname.trim() || !isNicknameChanged || isCheckingNickname}
            fullWidth={false}
            label="중복확인"
            loading={isCheckingNickname}
            onPress={() => {
              void handleCheckNickname();
            }}
            testID="profile-edit-check-nickname-button"
            variant="ghost"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>캐릭터 선택</Text>
        <Text style={styles.sectionDescription}>
          선택한 캐릭터는 프로필 이미지와 일기 생성 흐름에 사용됩니다.
        </Text>
        <View style={styles.characterGrid}>
          {charactersQuery.data?.map((character) => (
            <CharacterOption
              character={character}
              isSelected={selectedCharacterId === String(character.id)}
              key={character.id}
              onPress={() => setSelectedCharacterId(String(character.id))}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <AppButton
          fullWidth={false}
          label="취소"
          onPress={handleBack}
          testID="profile-edit-cancel-button"
          variant="ghost"
        />
        <AppButton
          disabled={isSaving || (isNicknameChanged && isNicknameAvailable !== true) || !hasChanges}
          fullWidth={false}
          label="저장"
          loading={isSaving}
          onPress={() => {
            void handleSubmit();
          }}
          testID="profile-edit-save-button"
          variant="neutral"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: spacing['2xl'],
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  profileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  profileSummaryText: {
    flex: 1,
    gap: spacing.xs,
  },
  summaryName: {
    ...typography.heading,
    color: colors.text,
  },
  summaryDescription: {
    ...typography.caption,
    color: colors.mutedText,
    lineHeight: 20,
  },
  section: {
    gap: spacing.lg,
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
  nicknameBlock: {
    gap: spacing.md,
  },
  nicknameFieldBlock: {
    flex: 1,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  characterCard: {
    width: '47%',
    minWidth: 148,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  characterCardSelected: {
    borderColor: colors.black,
    backgroundColor: colors.surfaceMuted,
  },
  characterCardPressed: {
    opacity: 0.85,
  },
  characterImage: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
  },
  characterFallback: {
    fontSize: 42,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
