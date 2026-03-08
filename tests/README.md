# Test Boilerplate

## Fixed Stack

- Unit/UI: `jest`, `jest-expo`, `@testing-library/react-native`
- Network mocking: `msw`
- E2E smoke: `Maestro`

## Expected Package Scripts

```json
{
  "scripts": {
    "test": "jest --config ./jest.config.cjs",
    "test:watch": "jest --watch --config ./jest.config.cjs",
    "test:coverage": "jest --coverage --config ./jest.config.cjs",
    "test:e2e:smoke": "maestro test .maestro"
  }
}
```

## Generated Files

- `jest.config.cjs`: Jest baseline config for Expo/RN
- `jest.setup.ts`: global mocks and MSW lifecycle hooks
- `tests/test-utils/renderWithProviders.tsx`: React Query + Safe Area wrapper
- `tests/mocks/*`: MSW server and Expo Router mock
- `tests/fixtures/index.ts`: reusable test fixtures
- `tests/smoke/*`: smoke tests
- `.maestro/*`: E2E flow templates

## Notes

- Expo Router 앱 스캐폴드와 패키지 설치가 완료된 상태다.
- 현재 smoke test는 provider, router mock, MSW lifecycle이 정상 연결되는지 확인하는 최소 검증 역할을 한다.
- `EXPO_PUBLIC_API_BASE_URL`은 앱 런타임에서 `.env`로 주입하고, 테스트/mock 예제 base URL은 `https://api.example.com`을 기준으로 둔다.
