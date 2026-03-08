import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function ComposeScreen() {
  return (
    <PlaceholderScreen
      title="오늘의 일기"
      description="사진 업로드와 AI 이미지 생성을 포함하는 일기 작성 화면이다."
      bullets={[
        '사진 선택 및 정렬',
        '공개 범위 선택',
        '일기 저장 API 연결',
      ]}
      showShellHeader
    />
  );
}
