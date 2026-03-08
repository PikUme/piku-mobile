import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function HomeScreen() {
  return (
    <PlaceholderScreen
      title="홈"
      description="로그인 사용자는 캘린더 홈, 비로그인 사용자는 공개 피드가 보이도록 구현할 화면이다."
      bullets={[
        '월간 캘린더 그리드 구성',
        '월별 일기 썸네일 로딩',
        '친구 캘린더 전환',
      ]}
      showShellHeader
    />
  );
}
