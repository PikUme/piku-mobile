import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

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

  it('shows the feed directly on home for guests without a public banner', async () => {
    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-list')).toBeTruthy());
    expect(screen.queryByTestId('public-feed-title')).toBeNull();
  });

  it('shows guest action restrictions only in comment actions', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('feed-comment-button-301')).toBeTruthy(),
    );
    expect(screen.queryByTestId('public-feed-title')).toBeNull();

    fireEvent.press(screen.getByTestId('feed-comment-button-301'));
    fireEvent.press(screen.getByTestId('feed-comment-sheet-login-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });
});
