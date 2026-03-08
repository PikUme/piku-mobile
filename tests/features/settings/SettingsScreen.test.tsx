import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as ExpoNotifications from 'expo-notifications';

import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import * as authApi from '@/lib/api/auth';
import * as feedback from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

jest.mock('expo-constants', () => ({
  expoConfig: { version: '0.1.0' },
  nativeAppVersion: '0.1.0',
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
}));

describe('SettingsScreen', () => {
  beforeEach(() => {
    routerMock.replace.mockClear();
    routerMock.push.mockClear();
    routerMock.back.mockClear();
    routerMock.canGoBack.mockReturnValue(true);
    useNotificationStore.setState({ unreadCount: 4 });
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
    (ExpoNotifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders app version and push permission status', async () => {
    const screen = renderWithProviders(<SettingsScreen />);

    await waitFor(() => expect(screen.getByTestId('settings-app-version')).toBeTruthy());
    expect(screen.getByText('0.1.0')).toBeTruthy();
    expect(screen.getByText('허용됨')).toBeTruthy();
  });

  it('opens the feedback screen from the support section', async () => {
    const screen = renderWithProviders(<SettingsScreen />);

    await waitFor(() => expect(screen.getByTestId('settings-feedback-row')).toBeTruthy());
    fireEvent.press(screen.getByTestId('settings-feedback-row'));

    expect(routerMock.push).toHaveBeenCalledWith('/feedback');
  });

  it('logs out, clears unread count, and returns to home', async () => {
    jest.spyOn(authApi, 'logout').mockResolvedValue();
    jest.spyOn(feedback, 'showConfirm').mockImplementation(
      (_title, _message, onConfirm) => {
        onConfirm();
      },
    );

    const screen = renderWithProviders(<SettingsScreen />);

    await waitFor(() => expect(screen.getByTestId('settings-logout-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('settings-logout-button'));

    await waitFor(() => expect(authApi.logout).toHaveBeenCalled());
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'));
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
