import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AppBottomTabBar } from '@/components/shell/AppBottomTabBar';
import { useAuthStore } from '@/store/authStore';
import { routerMock, usePathname } from '../../mocks/expo-router';

const mockedUsePathname = usePathname as jest.Mock;

describe('AppBottomTabBar', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    mockedUsePathname.mockReturnValue('/');
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  });

  it('renders guest tabs including login', () => {
    const screen = render(<AppBottomTabBar />);

    expect(screen.getByText('홈')).toBeTruthy();
    expect(screen.getByText('피드')).toBeTruthy();
    expect(screen.getByText('검색')).toBeTruthy();
    expect(screen.getByText('로그인')).toBeTruthy();
    expect(screen.queryByText('더보기')).toBeNull();

    fireEvent.press(screen.getByTestId('bottom-tab-login'));
    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });

  it('renders authenticated tabs including more sheet', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'tester@example.com',
        nickname: 'tester',
      },
    });

    const screen = render(<AppBottomTabBar />);

    expect(screen.getByText('더보기')).toBeTruthy();
    expect(screen.getByText('친구')).toBeTruthy();

    fireEvent.press(screen.getByTestId('bottom-tab-more'));
    expect(screen.getByText('프로필')).toBeTruthy();
    expect(screen.getByText('설정')).toBeTruthy();
    expect(screen.getByText('문의')).toBeTruthy();
    expect(screen.getByText('로그아웃')).toBeTruthy();
  });
});
