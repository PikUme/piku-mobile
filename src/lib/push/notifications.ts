import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPushPermission() {
  const currentPermission = await Notifications.getPermissionsAsync();
  if (currentPermission.status === 'granted') {
    return currentPermission.status;
  }

  const requestedPermission = await Notifications.requestPermissionsAsync();
  return requestedPermission.status;
}

export async function getExpoPushToken() {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    undefined;

  try {
    const response = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();

    return response.data;
  } catch {
    return null;
  }
}

function getStringValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

export function resolvePushNotificationRoute(data: Record<string, unknown>) {
  const notificationType = getStringValue(data.type);
  const diaryUserId = getStringValue(data.diaryUserId ?? data.userId ?? data.senderUserId);
  const diaryDate = getStringValue(data.diaryDate ?? data.date);
  const diaryId = getStringValue(data.relatedDiaryId ?? data.diaryId);

  if ((notificationType === 'LIKE' || notificationType === 'COMMENT') && diaryId) {
    return {
      pathname: '/diary/story' as const,
      params: {
        id: diaryId,
      },
    };
  }

  if (diaryUserId && diaryDate) {
    return {
      pathname: '/profile/[userId]/calendar' as const,
      params: diaryId
        ? {
            userId: diaryUserId,
            date: diaryDate,
            diaryId,
          }
        : {
            userId: diaryUserId,
            date: diaryDate,
          },
    };
  }

  if (diaryUserId) {
    return {
      pathname: '/profile/[userId]' as const,
      params: {
        userId: diaryUserId,
      },
    };
  }

  return null;
}
