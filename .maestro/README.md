# Maestro Smoke Flows

이 디렉터리는 모바일 MVP의 핵심 흐름을 검증하는 Maestro flow를 담습니다.

## 디렉터리 구성

- `required/`
  - 커밋 전 필수로 통과해야 하는 Maestro smoke flow를 둡니다.
  - 현재는 `bootstrap-smoke.yaml`, `login-smoke.yaml`, `signup-smoke.yaml`이 들어 있습니다.
- 루트의 `*.yaml`
  - 기능 구현 전 미리 작성해 둔 템플릿 flow입니다.
  - 해당 기능이 실제로 완성되면 selector와 시나리오를 보정한 뒤 `required/`로 승격합니다.

## 실행 전 조건

- Maestro CLI가 설치되어 있어야 합니다.
- iOS 기준으로는 앱이 시뮬레이터에 설치되어 있어야 합니다.
  - Expo Go가 아니라 앱 자체가 설치되어 있어야 하므로 `npm run ios:dev`를 먼저 실행하는 방식을 권장합니다.
- 화면 텍스트/버튼 라벨이 구현본과 다르면 selector를 수정해야 합니다.
- 로그인/데이터가 필요한 flow는 테스트 계정 또는 테스트 서버가 준비되어 있어야 합니다.
  - 로컬 mock 기준 로그인 계정은 `tester@example.com / password123!`입니다.
  - 로컬 mock 기준 회원가입 인증코드는 `123456`입니다.

## 권장 명령어

```bash
npm run test:e2e:smoke
```

## 기능 완료 워크플로우

1. 기능 구현과 함께 관련 Jest 테스트를 작성합니다.
2. 해당 기능을 검증하는 Maestro flow를 작성하거나 수정합니다.
3. flow가 안정적으로 동작하면 `.maestro/required/`로 승격합니다.
4. `npm run verify:feature`로 Jest와 Maestro를 함께 검증합니다.
5. `npm run commit:verified -- -m "type: message"`로 검증 후 커밋합니다.
