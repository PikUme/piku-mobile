import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function ProfileScreen() {
  return (
    <PlaceholderScreen
      title="프로필"
      description="프로필 정보와 월별 일기 통계를 보여주는 화면이다."
      bullets={[
        '친구 상태 액션',
        '월별 타임라인',
        '프로필 캘린더 이동',
      ]}
    />
  );
}
