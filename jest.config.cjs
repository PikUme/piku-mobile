/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.maestro/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
    '!tests/mocks/**',
    '!tests/fixtures/**',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 75,
      lines: 70,
    },
  },
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-native|expo(nent)?|@expo(nent)?/.*|expo-router|@react-navigation/.*|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|msw|@mswjs|until-async|headers-polyfill|is-node-process|outvariant|strict-event-emitter|@open-draft)',
  ],
};
