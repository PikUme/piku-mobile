import 'react-native-gesture-handler/jestSetup';

import { act } from '@testing-library/react-native';
import { notifyManager } from '@tanstack/react-query';

import { resetMockData } from './tests/mocks/handlers';
import { server } from './tests/mocks/server';

notifyManager.setNotifyFunction((callback) => {
  act(() => {
    callback();
  });
});

jest.mock('react-native-reanimated', () => ({}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const Icon = ({
    name,
    testID,
  }: {
    name?: string;
    testID?: string;
  }) =>
    React.createElement(
      Text,
      { accessibilityRole: 'image', testID },
      name ?? 'icon',
    );

  return {
    Ionicons: Icon,
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    initialWindowMetrics: {
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      frame: { x: 0, y: 0, width: 390, height: 844 },
    },
  };
});
jest.mock('expo-router', () => require('./tests/mocks/expo-router'));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-secure-store', () => {
  let store = new Map<string, string>();

  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __reset: () => {
      store = new Map();
    },
  };
});
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: true,
    assets: [],
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: true,
    assets: [],
  })),
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: {
    JPEG: 'jpeg',
  },
  manipulateAsync: jest.fn(async (uri: string) => ({
    uri,
    width: 1200,
    height: 1200,
  })),
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  resetMockData();
  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
});
