import React from 'react';

export const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export const useRouter = () => routerMock;
export const usePathname = jest.fn(() => '/');
export const useSegments = jest.fn(() => []);
export const useLocalSearchParams = jest.fn(() => ({}));
export const useGlobalSearchParams = jest.fn(() => ({}));

export const Link = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Redirect = () => null;
export const Slot = () => null;

const createNavigatorMock = () => {
  const Navigator = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
  Navigator.Screen = () => null;
  return Navigator;
};

export const Stack = createNavigatorMock();
export const Tabs = createNavigatorMock();
