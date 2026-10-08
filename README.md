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

### API 환경과 실서버 검증

`.env`와 `.env*.local`은 Git 제외 파일이므로 새 worktree에 자동 복사되지 않습니다. 작업할 worktree에서 `EXPO_PUBLIC_API_BASE_URL`과 `EXPO_PUBLIC_APP_ENV`를 확인하세요. `.env.example`을 복사한 기본 설정도 local mock 환경입니다.

앱 런타임(`NODE_ENV !== 'test'`)에서 `EXPO_PUBLIC_APP_ENV=local`이고 API URL에 `localhost` 또는 `api.example.com`이 포함되면, 로그인·피드·프로필 등 local mock을 지원하는 API는 HTTP 요청 전에 mock을 선택합니다. 서버 실행 여부를 확인한 결과가 아닙니다. `local`에서는 일부 API의 네트워크 오류·시간 초과에도 mock fallback이 있으므로, Docker 실행이나 화면 표시만으로 실 API 연결을 확인할 수 없습니다.

실제 로컬 API를 검증하려면 확인한 Docker 공개 포트, 대상 기기에서 접근 가능한 주소와 `/api` 경로를 `EXPO_PUBLIC_API_BASE_URL`에 설정하고, `EXPO_PUBLIC_APP_ENV=development`처럼 `local` 이외 모드로 초기 mock과 오류 fallback을 끄세요. Release 앱은 환경값이 bundle에 고정되므로 변경한 환경으로 새 bundle을 만들고 앱을 다시 빌드·설치해야 합니다.

기존 Maestro mock 계정이 실제 서버에도 존재하는지는 확인되지 않았습니다. 실 API 검증에는 확인된 테스트 계정·데이터와 앱에서 발생한 요청·응답 근거가 필요하며, mock UI 검증과 구분해 결과를 기록하세요. flow 준비 조건은 [Maestro 실행 전 조건](.maestro/README.md#실행-전-조건)을 따릅니다.
