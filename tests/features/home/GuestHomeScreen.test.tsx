import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { FeedScreen } from '@/features/feed/screens/FeedScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { useAuthStore } from '@/store/authStore';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

describe('Guest public feed entry', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  });

  it('shows the public feed entry on home for guests', () => {
    const screen = renderWithProviders(<HomeScreen />);

    expect(screen.getByTestId('public-feed-title')).toBeTruthy();
    expect(screen.getByText('공개 일기만 노출')).toBeTruthy();

    fireEvent.press(screen.getByTestId('public-feed-login-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });

  it('shows guest action restrictions on the feed screen', () => {
    const screen = renderWithProviders(<FeedScreen />);

    expect(screen.getByText('댓글 액션 제한')).toBeTruthy();
    expect(screen.getByText('친구 액션 제한')).toBeTruthy();

    fireEvent.press(screen.getByTestId('public-feed-signup-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/signup');
  });
});
