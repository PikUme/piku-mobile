import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function DiaryStoryScreen() {
  return (
    <PlaceholderScreen
      title="스토리형 일기 상세"
      description="피드/홈 내부에서 열리는 몰입형 전체화면 상세 화면이다."
      bullets={[
        '좌우 스와이프 이미지 이동',
        '댓글 바텀시트 오픈',
        '일기 삭제 액션',
      ]}
    />
  );
}
