import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListItemCard } from '@/components/ui/ListItemCard';
import { logout as requestLogout } from '@/lib/api/auth';
import { showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing, typography } from '@/theme';

interface TabItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  onPress: () => void;
  testID: string;
}

const ACTIVE_COLOR = colors.black;
const INACTIVE_COLOR = '#9ca3af';

export function AppBottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLoggedIn = useAuthStore((store) => store.isLoggedIn);
  const user = useAuthStore((store) => store.user);
  const localLogout = useAuthStore((store) => store.logout);
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);

  const diaryLabel = width < 500 ? '일기' : '오늘의 일기';

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    setIsMoreSheetVisible(false);
    showConfirm(
      '로그아웃',
      '현재 세션을 종료하고 공개 홈으로 이동합니다.',
      () => {
        void (async () => {
          try {
            await requestLogout();
          } catch {
            // 서버 로그아웃 실패와 무관하게 로컬 세션은 정리한다.
          } finally {
            await localLogout();
            router.replace('/');
          }
        })();
      },
    );
  };

  const items: TabItem[] = !isLoggedIn
    ? [
        {
          key: 'home',
          label: '홈',
          icon: isActive('/') ? 'home' : 'home-outline',
          isActive: isActive('/'),
          onPress: () => router.push('/'),
          testID: 'bottom-tab-home',
        },
        {
          key: 'feed',
          label: '피드',
          icon: isActive('/feed') ? 'compass' : 'compass-outline',
          isActive: isActive('/feed'),
          onPress: () => router.push('/feed'),
          testID: 'bottom-tab-feed',
        },
        {
          key: 'search',
          label: '검색',
          icon: isActive('/search') ? 'search' : 'search-outline',
          isActive: isActive('/search'),
          onPress: () => router.push('/search'),
          testID: 'bottom-tab-search',
        },
        {
          key: 'login',
          label: '로그인',
          icon: 'log-in-outline',
          isActive: pathname === '/login',
          onPress: () => router.push('/login'),
          testID: 'bottom-tab-login',
        },
      ]
    : [
        {
          key: 'home',
          label: '홈',
          icon: isActive('/') ? 'home' : 'home-outline',
          isActive: isActive('/'),
          onPress: () => router.push('/'),
          testID: 'bottom-tab-home',
        },
        {
          key: 'feed',
          label: '피드',
          icon: isActive('/feed') ? 'compass' : 'compass-outline',
          isActive: isActive('/feed'),
          onPress: () => router.push('/feed'),
          testID: 'bottom-tab-feed',
        },
        {
          key: 'search',
          label: '검색',
          icon: isActive('/search') ? 'search' : 'search-outline',
          isActive: isActive('/search'),
          onPress: () => router.push('/search'),
          testID: 'bottom-tab-search',
        },
        {
          key: 'compose',
          label: diaryLabel,
          icon: isActive('/compose') ? 'create' : 'create-outline',
          isActive: isActive('/compose'),
          onPress: () => router.push('/compose'),
          testID: 'bottom-tab-compose',
        },
        {
          key: 'friends',
          label: '친구',
          icon: isActive('/friends') ? 'people' : 'people-outline',
          isActive: isActive('/friends'),
          onPress: () => router.push('/friends'),
          testID: 'bottom-tab-friends',
        },
        {
          key: 'more',
          label: '더보기',
          icon:
            pathname.startsWith('/profile') ||
            pathname.startsWith('/settings') ||
            pathname.startsWith('/feedback')
              ? 'menu'
              : 'menu-outline',
          isActive:
            pathname.startsWith('/profile') ||
            pathname.startsWith('/settings') ||
            pathname.startsWith('/feedback'),
          onPress: () => setIsMoreSheetVisible(true),
          testID: 'bottom-tab-more',
        },
      ];

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingBottom: Math.max(insets.bottom, spacing.sm),
          },
        ]}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityLabel={item.label}
            accessibilityRole="button"
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.itemPressed,
            ]}
            testID={item.testID}>
            <Ionicons
              color={item.isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
              name={item.icon}
              size={23}
            />
            <Text
              style={[
                styles.label,
                { color: item.isActive ? ACTIVE_COLOR : INACTIVE_COLOR },
              ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <BottomSheet
        description="프로필, 설정, 문의로 이동하거나 로그아웃할 수 있습니다."
        onClose={() => setIsMoreSheetVisible(false)}
        title="더보기"
        visible={isMoreSheetVisible}>
        <View style={styles.sheetContent}>
          <ListItemCard
            description="내 프로필과 월별 기록을 확인합니다."
            onPress={() => {
              setIsMoreSheetVisible(false);
              if (user) {
                router.push(`/profile/${user.id}`);
              }
            }}
            title="프로필"
          />
          <ListItemCard
            description="앱 버전과 권한 상태를 확인합니다."
            onPress={() => {
              setIsMoreSheetVisible(false);
              router.push('/settings');
            }}
            title="설정"
          />
          <ListItemCard
            description="문의나 개선 의견을 남깁니다."
            onPress={() => {
              setIsMoreSheetVisible(false);
              router.push('/feedback');
            }}
            title="문의"
          />
          <ListItemCard
            description="현재 계정 세션을 종료합니다."
            onPress={handleLogout}
            title="로그아웃"
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  item: {
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
    flex: 1,
  },
  itemPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
  },
  sheetContent: {
    gap: spacing.sm,
  },
});
