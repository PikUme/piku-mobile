import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import RootLayout from '../../app/_layout';
import { useAuthStore } from '@/store/authStore';
import { routerMock, useSegments } from '../mocks/expo-router';

const mockedUseSegments = useSegments as jest.Mock;

describe('RootLayout auth guard', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    mockedUseSegments.mockReturnValue([]);

    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
      hydrateSession: jest.fn(async () => undefined),
    });
  });

  it('redirects guests away from protected tabs', async () => {
    mockedUseSegments.mockReturnValue(['(tabs)', 'compose']);

    render(<RootLayout />);

    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/login'),
    );
  });

  it('redirects logged in users away from auth routes', async () => {
    mockedUseSegments.mockReturnValue(['(auth)', 'login']);
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
      hydrateSession: jest.fn(async () => undefined),
    });

    render(<RootLayout />);

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'));
  });

  it('handles single segment routes without crashing', () => {
    mockedUseSegments.mockReturnValue(['notifications']);

    expect(() => render(<RootLayout />)).not.toThrow();
  });
});
