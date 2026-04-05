import 'react-native-reanimated';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/store/authStore';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const router = useRouter();
  const segments = useSegments() as readonly string[];

  const firstSegment = segments[0];
  const secondSegment = segments[1];
  const isAuthRoute = firstSegment === '(auth)';
  const isProtectedTab =
    firstSegment === '(tabs)' &&
    (secondSegment === 'compose' || secondSegment === 'friends');
  const isProtectedStack =
    firstSegment === 'notifications' ||
    firstSegment === 'settings' ||
    (firstSegment === 'profile' && secondSegment === 'edit');
  const requiresAuth = isProtectedTab || isProtectedStack;

  useEffect(() => {
    void useAuthStore.getState().hydrateSession();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isLoggedIn && requiresAuth) {
      router.replace('/login');
      return;
    }

    if (isLoggedIn && isAuthRoute) {
      router.replace('/');
    }
  }, [isAuthRoute, isHydrated, isLoggedIn, requiresAuth, router]);

  useEffect(() => {
    if (isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated || (!isLoggedIn && requiresAuth) || (isLoggedIn && isAuthRoute)) {
    return null;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="profile/[userId]/index" />
        <Stack.Screen name="profile/[userId]/calendar" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="diary/[id]" />
        <Stack.Screen
          name="diary/story"
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="settings/index" />
        <Stack.Screen
          name="feedback/index"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </AppProviders>
  );
}
