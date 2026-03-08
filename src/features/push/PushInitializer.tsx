import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { getOrCreateDeviceId } from '@/lib/auth/sessionStorage';
import { registerPushToken } from '@/lib/api/push';
import {
  getExpoPushToken,
  requestPushPermission,
  resolvePushNotificationRoute,
} from '@/lib/push/notifications';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';

interface PushInitializerProps {
  forceEnable?: boolean;
}

export function PushInitializer({ forceEnable = false }: PushInitializerProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const incrementUnread = useNotificationStore((state) => state.increment);
  const initializedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && !forceEnable) {
      return;
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      incrementUnread();
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = resolvePushNotificationRoute(
        response.notification.request.content.data as Record<string, unknown>,
      );
      if (route) {
        router.push(route);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [forceEnable, incrementUnread, router]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' && !forceEnable) {
      return;
    }

    if (!isLoggedIn || !user) {
      initializedUserIdRef.current = null;
      return;
    }

    if (initializedUserIdRef.current === user.id) {
      return;
    }

    let isMounted = true;

    void (async () => {
      const permissionStatus = await requestPushPermission();
      if (permissionStatus !== 'granted') {
        if (isMounted) {
          initializedUserIdRef.current = user.id;
        }
        return;
      }

      const pushToken = await getExpoPushToken();
      if (!pushToken) {
        if (isMounted) {
          initializedUserIdRef.current = user.id;
        }
        return;
      }

      const deviceId = await getOrCreateDeviceId();
      await registerPushToken(user.id, pushToken, deviceId);

      if (isMounted) {
        initializedUserIdRef.current = user.id;
      }
    })().catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [forceEnable, isLoggedIn, user]);

  return null;
}
