import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function ProfileCalendarScreen() {
  return (
    <PlaceholderScreen
      title="프로필 캘린더"
      description="특정 사용자의 월간 일기를 탐색하는 캘린더 화면이다."
      bullets={[
        'date 파라미터 초기화',
        'diaryId 즉시 오픈',
        '친구 전환 비활성화',
      ]}
    />
  );
}
