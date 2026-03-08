import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function SearchScreen() {
  return (
    <PlaceholderScreen
      title="검색"
      description="닉네임 기반 사용자 검색 화면이다."
      bullets={[
        'debounce 검색',
        '무한 스크롤 결과',
        '프로필 이동 연결',
      ]}
      showShellHeader
    />
  );
}
