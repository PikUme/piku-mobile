import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import {
  type ColorValue,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BottomNavIcon,
  type BottomNavIconName,
} from '@/components/shell/BottomNavIcon';
import { BottomNavSurface } from '@/components/shell/BottomNavSurface';
import { getBottomNavCharacterImage } from '@/components/shell/bottomNavCharacter';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ListItemCard } from '@/components/ui/ListItemCard';
import { logout as requestLogout } from '@/lib/api/auth';
import { showConfirm } from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing } from '@/theme';

interface TabItem {
  key: BottomNavIconName;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

interface AppBottomTabBarProps {
  backgroundColor?: ColorValue;
}

const ACTIVE_COLOR = '#FF5A00';
const INACTIVE_COLOR = '#9CA3AF';
const MORE_INACTIVE_COLOR = '#94A3B8';

export function AppBottomTabBar({
  backgroundColor = colors.background,
}: AppBottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLoggedIn = useAuthStore((store) => store.isLoggedIn);
  const user = useAuthStore((store) => store.user);
  const localLogout = useAuthStore((store) => store.logout);
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(() =>
    Keyboard.isVisible(),
  );

  useEffect(() => {
    const show = () => setIsKeyboardVisible(true);
    const hide = () => setIsKeyboardVisible(false);
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', show),
      Keyboard.addListener('keyboardDidHide', hide),
    ];
    if (Platform.OS === 'ios') {
      subscriptions.push(Keyboard.addListener('keyboardWillShow', show));
    }
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsMoreSheetVisible(false);
    }
  }, [isLoggedIn]);

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

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

  const home: TabItem = {
    key: 'home',
    label: '홈',
    isActive: isActive('/'),
    onPress: () => router.push('/'),
  };
  const search: TabItem = {
    key: 'search',
    label: '검색',
    isActive: isActive('/search'),
    onPress: () => router.push('/search'),
  };
  const leftItems: TabItem[] = isLoggedIn
    ? [
        home,
        {
          key: 'feed',
          label: '피드',
          isActive: isActive('/feed'),
          onPress: () => router.push('/feed'),
        },
      ]
    : [home];
  const rightItems: TabItem[] = isLoggedIn
    ? [
        search,
        {
          key: 'more',
          label: '더보기',
          isActive: ['/profile', '/settings', '/feedback', '/friends'].some(
            isActive,
          ),
          onPress: () => setIsMoreSheetVisible(true),
        },
      ]
    : [search];
  const sideWidth = width / 2 - 48;
  const height = 84 + insets.bottom;
  const characterImage = getBottomNavCharacterImage(
    isLoggedIn
      ? user?.avatarPath || user?.avatarUrl || user?.avatar
      : undefined,
  );

  const renderItem = (item: TabItem) => {
    const isMore = item.key === 'more';
    const isHighlighted = item.isActive || (isMore && isMoreSheetVisible);
    const color = isHighlighted
      ? ACTIVE_COLOR
      : isMore
        ? MORE_INACTIVE_COLOR
        : INACTIVE_COLOR;
    return (
      <Pressable
        key={item.key}
        accessibilityLabel={item.label}
        accessibilityRole="button"
        accessibilityState={{
          selected: item.isActive,
          ...(isMore ? { expanded: isMoreSheetVisible } : {}),
        }}
        onPress={item.onPress}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        testID={`bottom-tab-${item.key}`}
      >
        <BottomNavIcon
          name={item.key}
          color={color}
          testID={`bottom-tab-${item.key}-icon`}
        />
      </Pressable>
    );
  };

  if (isKeyboardVisible) {
    return null;
  }

  return (
    <>
      <View
        style={[styles.container, { height, backgroundColor }]}
        testID="bottom-tab-bar"
      >
        <BottomNavSurface width={width} height={height} />
        <View
          style={[styles.sideGroup, { left: 0, width: sideWidth }]}
          testID="bottom-tab-left-group"
        >
          {leftItems.map(renderItem)}
        </View>
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.characterHalo, { left: width / 2 - 35 }]}
        />
        <Pressable
          accessibilityLabel={isLoggedIn ? '일기 쓰기' : '로그인'}
          accessibilityRole="button"
          onPress={() => router.push(isLoggedIn ? '/compose' : '/login')}
          style={({ pressed }) => [
            styles.characterButton,
            { left: width / 2 - 29 },
            pressed && styles.pressed,
          ]}
          testID={isLoggedIn ? 'bottom-tab-compose' : 'bottom-tab-login'}
        >
          <Image
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            source={characterImage}
            resizeMode="cover"
            style={styles.characterImage}
            testID="bottom-tab-character"
          />
        </Pressable>
        <View
          style={[styles.sideGroup, { right: 0, width: sideWidth }]}
          testID="bottom-tab-right-group"
        >
          {rightItems.map(renderItem)}
        </View>
      </View>
      <BottomSheet
        description="프로필, 설정, 문의로 이동하거나 로그아웃할 수 있습니다."
        onClose={() => setIsMoreSheetVisible(false)}
        title="더보기"
        visible={isMoreSheetVisible}
      >
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
  container: { flexShrink: 0 },
  sideGroup: {
    position: 'absolute',
    top: 37.5,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  item: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
  characterHalo: {
    position: 'absolute',
    top: 0,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F3F4F6',
  },
  characterButton: {
    position: 'absolute',
    top: 6,
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    boxShadow: '0 6px 12px rgba(69,43,20,0.18)',
  },
  characterImage: { width: 58, height: 58, transform: [{ scale: 1.26 }] },
  sheetContent: { gap: spacing.sm },
});
