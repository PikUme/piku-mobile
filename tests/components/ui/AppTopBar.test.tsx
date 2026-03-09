import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppTopBar } from '@/components/shell/AppTopBar';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { routerMock } from '../../mocks/expo-router';

describe('AppTopBar', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    useAuthStore.setState({
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
    useNotificationStore.setState({ unreadCount: 0 });
  });

  it('renders brand copy for guests without a login shortcut', () => {
    const screen = render(<AppTopBar />);

    expect(screen.getByText('PikUme')).toBeTruthy();
    expect(screen.queryByText('로그인')).toBeNull();
  });

  it('renders notification action for logged in users', () => {
    useAuthStore.setState({
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });
    useNotificationStore.setState({ unreadCount: 3 });

    const screen = render(<AppTopBar />);

    expect(screen.getByTestId('shell-user-name')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('알림'));
    expect(routerMock.push).toHaveBeenCalledWith('/notifications');
    expect(screen.queryByLabelText('더보기')).toBeNull();
  });

  it('renders the brand variant with notifications for logged in users', () => {
    useAuthStore.setState({
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    const screen = render(<AppTopBar variant="brand" />);

    expect(screen.getByTestId('shell-brand-title')).toBeTruthy();
    expect(screen.queryByTestId('shell-user-name')).toBeNull();
    expect(screen.getByLabelText('알림')).toBeTruthy();
  });
});
