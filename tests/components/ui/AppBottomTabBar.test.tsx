import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ReactNative from 'react-native';
import { Keyboard, Modal, Platform } from 'react-native';

import { BottomNavIcon } from '@/components/shell/BottomNavIcon';
import { AppBottomTabBar } from '@/components/shell/AppBottomTabBar';
import * as authApi from '@/lib/api/auth';
import * as feedback from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { routerMock, usePathname } from '../../mocks/expo-router';

jest.mock('../../../assets/bottom-nav/fox.webp', () => 101);
jest.mock('../../../assets/bottom-nav/pencil.webp', () => 102);
jest.mock('../../../assets/bottom-nav/bread.webp', () => 103);
jest.mock('../../../assets/bottom-nav/cat.webp', () => 104);

const mockedUsePathname = usePathname as jest.Mock;
const user = { id: 'user-1', email: 'tester@example.com', nickname: 'tester' };
const fox = require('../../../assets/bottom-nav/fox.webp');
const cat = require('../../../assets/bottom-nav/cat.webp');

function logIn() {
  useAuthStore.setState({ isLoggedIn: true, user });
}

describe('AppBottomTabBar', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/');
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(false);
    useAuthStore.setState({ isHydrated: true, isLoggedIn: false, user: null });
  });

  afterEach(() => jest.restoreAllMocks());

  it('offers guest home, centered login and search without visible text labels', () => {
    const screen = render(<AppBottomTabBar />);
    expect(
      screen
        .getAllByRole('button')
        .map((node) => node.props.accessibilityLabel),
    ).toEqual(['홈', '로그인', '검색']);
    for (const label of ['홈', '로그인', '검색', '피드']) {
      expect(screen.queryByText(label)).toBeNull();
    }
    expect(
      screen.getByTestId('bottom-tab-character', {
        includeHiddenElements: true,
      }),
    ).toHaveProp('source', fox);
    fireEvent.press(screen.getByRole('button', { name: '로그인' }));
    expect(routerMock.push).toHaveBeenCalledWith('/login');
    fireEvent.press(screen.getByRole('button', { name: '홈' }));
    expect(routerMock.push).toHaveBeenCalledWith('/');
    fireEvent.press(screen.getByRole('button', { name: '검색' }));
    expect(routerMock.push).toHaveBeenCalledWith('/search');
  });

  it('offers exactly five authenticated actions in Figma order without a friends tab', () => {
    logIn();
    const screen = render(<AppBottomTabBar />);
    expect(
      screen
        .getAllByRole('button')
        .map((node) => node.props.accessibilityLabel),
    ).toEqual(['홈', '피드', '일기 쓰기', '검색', '더보기']);
    expect(screen.queryByTestId('bottom-tab-friends')).toBeNull();
    expect(screen.queryByText('친구')).toBeNull();
    expect(screen.queryByText('일기 쓰기')).toBeNull();
    expect(
      screen.getByRole('button', { name: '일기 쓰기' }).props.accessibilityState
        ?.selected,
    ).toBeUndefined();
  });

  it.each([
    ['홈', '/'],
    ['피드', '/feed'],
    ['일기 쓰기', '/compose'],
    ['검색', '/search'],
  ])('navigates the %s action to %s', (name, href) => {
    logIn();
    const screen = render(<AppBottomTabBar />);
    fireEvent.press(screen.getByRole('button', { name }));
    expect(routerMock.push).toHaveBeenCalledWith(href);
  });

  it.each([
    ['/', '홈'],
    ['/feed', '피드'],
    ['/feed/detail', '피드'],
    ['/search', '검색'],
    ['/search/users', '검색'],
    ['/friends', '더보기'],
    ['/friends/requests', '더보기'],
    ['/profile/user-1', '더보기'],
    ['/settings/reminder', '더보기'],
    ['/feedback', '더보기'],
  ])('selects the correct item for %s', (path, label) => {
    logIn();
    mockedUsePathname.mockReturnValue(path);
    const screen = render(<AppBottomTabBar />);
    const selected = screen.getAllByRole('button', { selected: true });
    expect(selected.map((node) => node.props.accessibilityLabel)).toEqual([
      label,
    ]);
  });

  it.each([
    '/feedstock',
    '/searching',
    '/friendship',
    '/profiles',
    '/settings-old',
    '/feedbacks',
    '/other',
  ])('does not select a route with a similar prefix: %s', (path) => {
    logIn();
    mockedUsePathname.mockReturnValue(path);
    const screen = render(<AppBottomTabBar />);
    expect(screen.queryAllByRole('button', { selected: true })).toHaveLength(0);
  });

  it('uses orange for the selected route and Figma inactive colors', () => {
    logIn();
    mockedUsePathname.mockReturnValue('/feed');
    const screen = render(<AppBottomTabBar />);
    expect(
      screen
        .UNSAFE_getAllByType(BottomNavIcon)
        .map((node) => [node.props.name, node.props.color]),
    ).toEqual([
      ['home', '#9CA3AF'],
      ['feed', '#FF5A00'],
      ['search', '#9CA3AF'],
      ['more', '#94A3B8'],
    ]);
  });

  it('opens and dismisses More while reflecting the expanded and orange state', () => {
    logIn();
    const screen = render(<AppBottomTabBar />);
    fireEvent.press(screen.getByRole('button', { name: '더보기' }));
    expect(
      screen.getByTestId('bottom-tab-more', { includeHiddenElements: true })
        .props.accessibilityState,
    ).toMatchObject({ expanded: true });
    expect(
      screen
        .UNSAFE_getAllByType(BottomNavIcon)
        .find((node) => node.props.name === 'more')?.props.color,
    ).toBe('#FF5A00');
    expect(screen.getByText('프로필')).toBeTruthy();
    expect(screen.getByText('설정')).toBeTruthy();
    expect(screen.getByText('로그아웃')).toBeTruthy();
    expect(screen.getByText('문의')).toBeTruthy();
    fireEvent.press(screen.getByTestId('bottom-sheet-scrim'));
    expect(
      screen.getByRole('button', { name: '더보기' }).props.accessibilityState,
    ).toMatchObject({ expanded: false });
    expect(
      screen
        .UNSAFE_getAllByType(BottomNavIcon)
        .find((node) => node.props.name === 'more')?.props.color,
    ).toBe('#94A3B8');
  });

  it.each([
    ['프로필', '/profile/user-1'],
    ['설정', '/settings'],
    ['문의', '/feedback'],
  ])('keeps the existing More %s action', (label, href) => {
    logIn();
    const screen = render(<AppBottomTabBar />);
    fireEvent.press(screen.getByRole('button', { name: '더보기' }));
    fireEvent.press(screen.getByText(label));
    expect(routerMock.push).toHaveBeenCalledWith(href);
    expect(screen.queryByText(label)).toBeNull();
  });

  it('closes More using the native Android back request', () => {
    logIn();
    const screen = render(<AppBottomTabBar />);
    fireEvent.press(screen.getByRole('button', { name: '더보기' }));
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose');
    expect(screen.queryByText('프로필')).toBeNull();
    expect(
      screen.getByRole('button', { name: '더보기' }).props.accessibilityState,
    ).toMatchObject({ expanded: false });
  });

  it('logs out locally and replaces home even when server logout fails', async () => {
    logIn();
    jest.spyOn(authApi, 'logout').mockRejectedValue(new Error('offline'));
    jest
      .spyOn(feedback, 'showConfirm')
      .mockImplementation((_title, _body, confirm) => confirm());
    const screen = render(<AppBottomTabBar />);
    fireEvent.press(screen.getByRole('button', { name: '더보기' }));
    fireEvent.press(screen.getByText('로그아웃'));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'));
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(
      screen
        .getAllByRole('button')
        .map((node) => node.props.accessibilityLabel),
    ).toEqual(['홈', '로그인', '검색']);
  });

  it('reacts to login, character updates and logout without remounting', () => {
    const screen = render(<AppBottomTabBar />);
    act(() => logIn());
    expect(screen.getByRole('button', { name: '일기 쓰기' })).toBeTruthy();
    act(() =>
      useAuthStore.setState({
        user: { ...user, avatar: 'https://cdn.test/base_image_4.png' },
      }),
    );
    expect(
      screen.getByTestId('bottom-tab-character', {
        includeHiddenElements: true,
      }),
    ).toHaveProp('source', cat);
    act(() => useAuthStore.setState({ isLoggedIn: false, user: null }));
    expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy();
    expect(
      screen.getByTestId('bottom-tab-character', {
        includeHiddenElements: true,
      }),
    ).toHaveProp('source', fox);
  });

  it.each([
    [
      {
        avatarPath: '/base_image_2.png',
        avatarUrl: '/base_image_3.png',
        avatar: '/base_image_4.png',
      },
      'pencil',
    ],
    [
      {
        avatarPath: '',
        avatarUrl: '/base_image_3.webp',
        avatar: '/base_image_4.png',
      },
      'bread',
    ],
    [{ avatar: '/base_image_4.png' }, 'cat'],
  ])(
    'preserves avatarPath → avatarUrl → avatar priority: %j',
    (avatarFields, character) => {
      useAuthStore.setState({
        isLoggedIn: true,
        user: { ...user, ...avatarFields },
      });
      const screen = render(<AppBottomTabBar />);
      const sources: Record<string, unknown> = {
        pencil: require('../../../assets/bottom-nav/pencil.webp'),
        bread: require('../../../assets/bottom-nav/bread.webp'),
        cat,
      };
      expect(
        screen.getByTestId('bottom-tab-character', {
          includeHiddenElements: true,
        }).props.source,
      ).toEqual(sources[character]);
    },
  );

  it.each([0, 34])(
    'reserves exactly 84 + %i bottom inset and uses the scene background',
    (bottom) => {
      jest
        .spyOn(
          jest.requireMock('react-native-safe-area-context'),
          'useSafeAreaInsets',
        )
        .mockReturnValue({ top: 0, right: 0, left: 0, bottom });
      const screen = render(<AppBottomTabBar backgroundColor="#cceeff" />);
      expect(screen.getByTestId('bottom-tab-bar')).toHaveStyle({
        height: 84 + bottom,
        backgroundColor: '#cceeff',
      });
    },
  );

  it.each([320, 390])(
    'separates side targets from the central action at width %i',
    (width) => {
      logIn();
      jest
        .spyOn(jest.requireActual('react-native'), 'useWindowDimensions')
        .mockReturnValue({ width, height: 844, scale: 1, fontScale: 1 });
      const screen = render(<AppBottomTabBar />);
      const left = ReactNative.StyleSheet.flatten(
        screen.getByTestId('bottom-tab-left-group').props.style,
      );
      const right = ReactNative.StyleSheet.flatten(
        screen.getByTestId('bottom-tab-right-group').props.style,
      );
      expect(left.width).toBeGreaterThanOrEqual(88);
      expect(right.width).toBeGreaterThanOrEqual(88);
      expect(left.width + right.width).toBeLessThanOrEqual(width - 96);
      for (const name of ['홈', '피드', '검색', '더보기']) {
        expect(screen.getByRole('button', { name })).toHaveStyle({
          width: 44,
          height: 44,
        });
      }
      expect(screen.getByRole('button', { name: '일기 쓰기' })).toHaveStyle({
        width: 58,
        height: 58,
      });
      expect(screen.queryAllByRole('image')).toHaveLength(0);
    },
  );

  it.each(['ios', 'android'] as const)(
    'removes the bar reservation while the %s keyboard is open and restores it',
    (os) => {
      jest.replaceProperty(Platform, 'OS', os);
      const listeners = new Map<string, () => void>();
      const subscriptions: jest.SpyInstance[] = [];
      const addListener = Keyboard.addListener.bind(Keyboard);
      jest
        .spyOn(Keyboard, 'addListener')
        .mockImplementation((event, callback) => {
          listeners.set(event, callback as () => void);
          const subscription = addListener(event, callback);
          const remove = jest.spyOn(subscription, 'remove');
          subscriptions.push(remove);
          return subscription;
        });
      const screen = render(<AppBottomTabBar />);
      expect(screen.getByTestId('bottom-tab-bar')).toHaveStyle({ height: 84 });
      act(() => listeners.get('keyboardDidShow')?.());
      expect(screen.queryByTestId('bottom-tab-bar')).toBeNull();
      act(() => listeners.get('keyboardDidHide')?.());
      expect(screen.getByTestId('bottom-tab-bar')).toHaveStyle({ height: 84 });
      screen.unmount();
      subscriptions.forEach((remove) =>
        expect(remove).toHaveBeenCalledTimes(1),
      );
    },
  );

  it('does not reserve space when mounted with an already visible keyboard', () => {
    jest.spyOn(Keyboard, 'isVisible').mockReturnValue(true);
    const screen = render(<AppBottomTabBar />);
    expect(screen.queryByTestId('bottom-tab-bar')).toBeNull();
  });
});
