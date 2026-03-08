import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function FriendsScreen() {
  return (
    <PlaceholderScreen
      title="친구"
      description="친구 목록과 친구 요청 탭을 관리하는 화면이다."
      bullets={[
        '친구 목록 무한 스크롤',
        '요청 수락/거절',
        '친구 끊기 확인 모달',
      ]}
      showShellHeader
    />
  );
}
