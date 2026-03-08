import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function NotificationsScreen() {
  return (
    <PlaceholderScreen
      title="알림"
      description="알림 목록 조회, 읽음 처리, 관련 화면 이동을 담당하는 화면이다."
      bullets={[
        '알림 목록 무한 스크롤',
        '모두 읽기',
        '딥링크 이동',
      ]}
    />
  );
}
