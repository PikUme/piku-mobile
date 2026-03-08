import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function FeedScreen() {
  return (
    <PlaceholderScreen
      title="피드"
      description="친구 및 공개 일기를 카드형 리스트로 탐색하는 화면이다."
      bullets={[
        '무한 스크롤 피드 로딩',
        '이미지 캐러셀',
        '댓글 바텀시트 진입',
      ]}
      showShellHeader
    />
  );
}
