import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppHeader } from '@/components/ui/AppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getProfileInfo } from '@/lib/api/profile';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  deleteFriend,
  rejectFriendRequest,
  sendFriendRequest,
} from '@/lib/api/friends';
import { showAlert, showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import type { ApiError } from '@/lib/api/errors';
import { FriendshipStatus } from '@/types/friend';
import type { DiaryMonthCountDTO, UserProfileResponseDTO } from '@/types/profile';
import { colors, radius, spacing, typography } from '@/theme';

function DiaryMonthTimelineCard({
  item,
  onPress,
}: {
  item: DiaryMonthCountDTO;
  onPress: () => void;
}) {
  const percent = item.daysInMonth > 0 ? (item.count / item.daysInMonth) * 100 : 0;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.timelineRow, pressed && styles.timelinePressed]}
      testID={`profile-month-card-${item.year}-${item.month}`}>
      <View style={styles.timelineDotColumn}>
        <View style={styles.timelineDot} />
      </View>
      <View style={styles.timelineCard}>
        <View style={styles.timelineLabelRow}>
          <Text style={styles.timelineMonthLabel}>{item.month}월</Text>
          <Text style={styles.timelineMetaLabel}>
            {item.count}/{item.daysInMonth}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

function groupMonthlyDiaryCountByYear(items: DiaryMonthCountDTO[]) {
  const sections = new Map<number, DiaryMonthCountDTO[]>();

  items.forEach((item) => {
    const sectionItems = sections.get(item.year) ?? [];
    sectionItems.push(item);
    sections.set(item.year, sectionItems);
  });

  return Array.from(sections.entries()).map(([year, months]) => ({
    year,
    months,
  }));
}

function getNextFriendState(currentStatus: FriendshipStatus, action: 'send' | 'cancel' | 'accept' | 'reject' | 'delete') {
  switch (action) {
    case 'send':
      return FriendshipStatus.SENT;
    case 'cancel':
    case 'reject':
    case 'delete':
      return FriendshipStatus.NONE;
    case 'accept':
      return FriendshipStatus.FRIEND;
    default:
      return currentStatus;
  }
}

export function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId?: string }>();
  const viewer = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const profileUserId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
  const [friendStatusOverride, setFriendStatusOverride] = useState<FriendshipStatus | null>(null);
  const [friendCountOverride, setFriendCountOverride] = useState<number | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    setFriendStatusOverride(null);
    setFriendCountOverride(null);
    setIsActionLoading(false);
  }, [profileUserId]);

  const profileQuery = useQuery({
    queryKey: ['profile-preview', profileUserId],
    enabled: Boolean(profileUserId),
    queryFn: () => getProfileInfo(profileUserId as string),
  });

  const profile = useMemo(() => {
    if (!profileQuery.data) {
      return null;
    }

    const baseProfile = profileQuery.data;
    return {
      ...baseProfile,
      friendStatus: friendStatusOverride ?? baseProfile.friendStatus,
      friendCount: friendCountOverride ?? baseProfile.friendCount,
    } satisfies UserProfileResponseDTO;
  }, [friendCountOverride, friendStatusOverride, profileQuery.data]);
  const yearlyDiarySections = useMemo(
    () => (profile ? groupMonthlyDiaryCountByYear(profile.monthlyDiaryCount) : []),
    [profile],
  );

  const isOwner = Boolean(profile && viewer && profile.userId === viewer.id);
  const profileErrorStatus = (profileQuery.error as ApiError | null)?.status;

  useEffect(() => {
    if (!isLoggedIn && profileErrorStatus === 403) {
      router.replace('/login');
    }
  }, [isLoggedIn, profileErrorStatus, router]);

  const updateFriendshipState = (action: 'send' | 'cancel' | 'accept' | 'reject' | 'delete') => {
    if (!profile) {
      return;
    }

    setFriendStatusOverride(getNextFriendState(profile.friendStatus, action));
    if (action === 'accept') {
      setFriendCountOverride(profile.friendCount + 1);
    }
    if (action === 'delete') {
      setFriendCountOverride(Math.max(0, profile.friendCount - 1));
    }
  };

  const requireLogin = () => {
    showAlert('로그인이 필요합니다.', '친구 관련 기능은 로그인 후 사용할 수 있습니다.');
    router.push('/login');
  };

  const runFriendAction = async (
    action: 'send' | 'cancel' | 'accept' | 'reject' | 'delete',
  ) => {
    if (!profile) {
      return;
    }

    if (!isLoggedIn) {
      requireLogin();
      return;
    }

    setIsActionLoading(true);
    const previousStatus = profile.friendStatus;
    const previousCount = profile.friendCount;

    try {
      switch (action) {
        case 'send':
          await sendFriendRequest(profile.userId);
          break;
        case 'cancel':
          await cancelFriendRequest(profile.userId);
          break;
        case 'accept':
          await acceptFriendRequest(profile.userId);
          break;
        case 'reject':
          await rejectFriendRequest(profile.userId);
          break;
        case 'delete':
          await deleteFriend(profile.userId);
          break;
      }

      updateFriendshipState(action);
    } catch (error) {
      setFriendStatusOverride(previousStatus);
      setFriendCountOverride(previousCount);
      showAlert(
        '프로필 액션 실패',
        error instanceof Error ? error.message : '작업을 완료하지 못했습니다.',
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMonthPress = (item: DiaryMonthCountDTO) => {
    if (!profile) {
      return;
    }

    const date = `${item.year}-${String(item.month).padStart(2, '0')}-01`;
    router.push(`/profile/${profile.userId}/calendar?date=${date}`);
  };

  const renderActionArea = () => {
    if (!profile) {
      return null;
    }

    if (isOwner) {
      return (
        <AppButton
          fullWidth={false}
          label="프로필 편집"
          onPress={() => router.push('/profile/edit')}
          testID="profile-edit-button"
          variant="ghost"
        />
      );
    }

    if (!isLoggedIn) {
      return (
        <View style={styles.guestActionBlock}>
          <Text style={styles.guestActionText}>친구 요청은 로그인 후 사용할 수 있습니다.</Text>
          <View style={styles.guestActionButtons}>
            <AppButton
              fullWidth={false}
              label="로그인"
              onPress={() => router.push('/login')}
              testID="profile-login-button"
              variant="neutral"
            />
            <AppButton
              fullWidth={false}
              label="가입하기"
              onPress={() => router.push('/signup')}
              testID="profile-signup-button"
              variant="ghost"
            />
          </View>
        </View>
      );
    }

    switch (profile.friendStatus) {
      case FriendshipStatus.FRIEND:
        return (
          <AppButton
            fullWidth={false}
            label="친구 끊기"
            loading={isActionLoading}
            onPress={() => {
              showConfirm('친구 끊기', `${profile.nickname}님과 친구를 끊으시겠습니까?`, () => {
                void runFriendAction('delete');
              });
            }}
            testID="profile-unfriend-button"
            variant="destructive"
          />
        );
      case FriendshipStatus.NONE:
        return (
          <AppButton
            fullWidth={false}
            label="친구 추가"
            loading={isActionLoading}
            onPress={() => {
              void runFriendAction('send');
            }}
            testID="profile-add-friend-button"
            variant="neutral"
          />
        );
      case FriendshipStatus.SENT:
        return (
          <AppButton
            fullWidth={false}
            label="요청 취소"
            loading={isActionLoading}
            onPress={() => {
              void runFriendAction('cancel');
            }}
            testID="profile-cancel-request-button"
            variant="ghost"
          />
        );
      case FriendshipStatus.RECEIVED:
        return (
          <View style={styles.receivedActionRow}>
            <AppButton
              fullWidth={false}
              label="수락"
              loading={isActionLoading}
              onPress={() => {
                void runFriendAction('accept');
              }}
              testID="profile-accept-friend-button"
              variant="neutral"
            />
            <AppButton
              fullWidth={false}
              label="거절"
              loading={isActionLoading}
              onPress={() => {
                void runFriendAction('reject');
              }}
              testID="profile-reject-friend-button"
              variant="ghost"
            />
          </View>
        );
      default:
        return null;
    }
  };

  if (!profileUserId) {
    return (
      <ScreenContainer>
        <EmptyState
          description="잘못된 접근이거나 사용자 정보를 찾을 수 없습니다."
          title="프로필을 불러올 수 없습니다."
        />
      </ScreenContainer>
    );
  }

  if (profileQuery.isPending) {
    return (
      <ScreenContainer>
        <LoadingState label="프로필을 불러오는 중입니다." />
      </ScreenContainer>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <ScreenContainer>
        <ErrorState
          actionLabel="다시 시도"
          description={profileQuery.error instanceof Error ? profileQuery.error.message : undefined}
          onPressAction={() => {
            void profileQuery.refetch();
          }}
          title="프로필을 불러오지 못했습니다."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <AppHeader
            leftSlot={
              <Pressable
                accessibilityLabel="뒤로가기"
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                testID="profile-back-button">
                <Ionicons color={colors.text} name="chevron-back" size={20} />
              </Pressable>
            }
            title="프로필"
          />
        </View>
        <View style={styles.heroBackground} />
        <View style={styles.avatarWrap}>
          <Avatar name={profile.nickname} size={128} source={profile.avatar || null} />
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.nickname} testID="profile-nickname">
            {profile.nickname}
          </Text>
          <Text style={styles.userIdLabel}>@{profile.userId}</Text>
          <View style={styles.actionArea}>{renderActionArea()}</View>
        </View>

        <View style={styles.statsCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/friends')}
            style={({ pressed }) => [styles.statButton, pressed && styles.statPressed]}
            testID="profile-friend-count-button">
            <Text style={styles.statValue}>{profile.friendCount}</Text>
            <Text style={styles.statLabel}>friend</Text>
          </Pressable>
          <View style={styles.statsDivider} />
          <View style={styles.statButton} testID="profile-diary-count-card">
            <Text style={styles.statValue}>{profile.diaryCount}</Text>
            <Text style={styles.statLabel}>diary</Text>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineSectionHeader}>
            <Text style={styles.timelineSectionTitle}>Diary</Text>
            <Text style={styles.timelineSectionCaption}>월별 기록 달성도</Text>
          </View>
          {profile.monthlyDiaryCount.length > 0 ? (
            <View style={styles.timelineSectionList}>
              {yearlyDiarySections.map((section) => (
                <View key={section.year} style={styles.timelineYearSection}>
                  <Text style={styles.timelineYearLabel} testID={`profile-year-section-${section.year}`}>
                    {section.year}
                  </Text>
                  <View style={styles.timelineBlock}>
                    <View style={styles.timelineRail} />
                    {section.months.map((item) => (
                      <DiaryMonthTimelineCard
                        item={item}
                        key={`${item.year}-${item.month}`}
                        onPress={() => handleMonthPress(item)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              description="아직 작성된 일기 기록이 없습니다."
              title="기록이 비어 있습니다."
            />
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  headerContent: {
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  heroBackground: {
    height: 132,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: -64,
  },
  headerBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  nickname: {
    ...typography.title,
    color: colors.text,
  },
  userIdLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  actionArea: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestActionBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  guestActionText: {
    ...typography.caption,
    color: colors.mutedText,
    textAlign: 'center',
  },
  guestActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  receivedActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
  },
  statButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statPressed: {
    opacity: 0.84,
  },
  statsDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  statValue: {
    ...typography.title,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  timelineSection: {
    gap: spacing.lg,
  },
  timelineSectionList: {
    gap: spacing.xl,
  },
  timelineSectionHeader: {
    gap: spacing.xs,
  },
  timelineSectionTitle: {
    ...typography.heading,
    color: colors.text,
  },
  timelineSectionCaption: {
    ...typography.caption,
    color: colors.mutedText,
  },
  timelineYearSection: {
    gap: spacing.md,
  },
  timelineYearLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  timelineBlock: {
    position: 'relative',
    gap: spacing.md,
  },
  timelineRail: {
    position: 'absolute',
    left: 12,
    top: 12,
    bottom: 12,
    width: 2,
    backgroundColor: colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  timelinePressed: {
    opacity: 0.84,
  },
  timelineDotColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  timelineCard: {
    flex: 1,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  timelineMonthLabel: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  timelineMetaLabel: {
    ...typography.caption,
    color: colors.mutedText,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.82,
  },
});
