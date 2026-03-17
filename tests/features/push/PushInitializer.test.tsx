import React from 'react';
import { act, waitFor } from '@testing-library/react-native';
import * as ExpoNotifications from 'expo-notifications';

import * as pushApi from '@/lib/api/push';
import * as sessionStorage from '@/lib/auth/sessionStorage';
import { PushInitializer } from '@/features/push/PushInitializer';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const mockReceivedRemove = jest.fn();
const mockResponseRemove = jest.fn();
let mockReceivedListener: ((event: unknown) => void) | null = null;
let mockResponseListener: ((event: { notification: { request: { content: { data: Record<string, unknown> } } } }) => void) | null = null;

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'project-123' } } },
  easConfig: { projectId: 'project-123' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test-token]' })),
  addNotificationReceivedListener: jest.fn((listener: (event: unknown) => void) => {
    mockReceivedListener = listener;
    return { remove: mockReceivedRemove };
  }),
  addNotificationResponseReceivedListener: jest.fn((listener: (event: { notification: { request: { content: { data: Record<string, unknown> } } } }) => void) => {
    mockResponseListener = listener;
    return { remove: mockResponseRemove };
  }),
}));

describe('PushInitializer', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    mockReceivedRemove.mockClear();
    mockResponseRemove.mockClear();
    mockReceivedListener = null;
    mockResponseListener = null;
    useNotificationStore.setState({ unreadCount: 0 });
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'test@gmail.com',
        nickname: 'test',
        avatar: '',
      },
    });
    jest.spyOn(sessionStorage, 'getOrCreateDeviceId').mockResolvedValue('device-123');
    jest.spyOn(pushApi, 'registerPushToken').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers the Expo push token for the logged-in user', async () => {
    renderWithProviders(<PushInitializer forceEnable />);

    await waitFor(() =>
      expect(pushApi.registerPushToken).toHaveBeenCalledWith(
        'user-1',
        'ExponentPushToken[test-token]',
        'device-123',
      ),
    );
  });

  it('increments the unread count when a foreground notification is received', async () => {
    renderWithProviders(<PushInitializer forceEnable />);

    await waitFor(() => expect(mockReceivedListener).toBeTruthy());

    act(() => {
      mockReceivedListener?.({});
    });

    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it('navigates to the diary story when a comment notification response is tapped', async () => {
    renderWithProviders(<PushInitializer forceEnable />);

    await waitFor(() => expect(mockResponseListener).toBeTruthy());

    act(() => {
      mockResponseListener?.({
        notification: {
          request: {
            content: {
              data: {
                type: 'COMMENT',
                diaryUserId: 'user-2',
                diaryDate: '2026-03-08',
                relatedDiaryId: 202603080,
              },
            },
          },
        },
      });
    });

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: {
        id: '202603080',
      },
    });
  });

  it('skips token registration when push permission is denied', async () => {
    (ExpoNotifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    (ExpoNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });

    renderWithProviders(<PushInitializer forceEnable />);

    await waitFor(() => expect(ExpoNotifications.requestPermissionsAsync).toHaveBeenCalled());
    expect(pushApi.registerPushToken).not.toHaveBeenCalled();
  });
});
