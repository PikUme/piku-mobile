import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function DiaryDetailScreen() {
  return (
    <PlaceholderScreen
      title="일기 상세"
      description="딥링크 또는 알림 진입용 상세 화면이다."
      bullets={[
        '상세 API 조회',
        '이미지 스와이퍼',
        '댓글 입력 진입',
      ]}
    />
  );
}
