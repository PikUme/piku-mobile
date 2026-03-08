# PikUme Mobile

PikUme Mobile은 PikUme 모바일 앱을 개발하기 위한 프로젝트입니다. 캘린더 기반 홈, 일기 작성, 피드, 댓글, 친구, 프로필, 알림 기능을 모바일 UX에 맞게 구현하는 것을 목표로 합니다.

## 기술 스택

### 앱 플랫폼

- React Native
- Expo
- TypeScript

### 라우팅

- Expo Router

### 상태/데이터

- `@tanstack/react-query`
- `zustand`

### 테스트

- Jest
- Maestro

## 실행 방법

### 요구 사항

- Node.js `20.19.6`
- npm `10.8.2`

### 설치

```bash
nvm use
cp .env.example .env
npm install
```

### 개발 서버 실행

```bash
npm start
```

### 플랫폼별 실행

```bash
npm run ios
npm run android
npm run web
```

### 테스트 실행

```bash
npm test -- --runInBand
npm run test:e2e:smoke
npm run verify:feature
```

- 로컬 백엔드가 내려가 있거나 `EXPO_PUBLIC_API_BASE_URL`이 `localhost/example`를 가리키는 경우, `local` 환경의 로그인 smoke는 `test@gmail.com / 1` 계정으로 mock adapter를 사용합니다.
