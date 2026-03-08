import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function FeedbackScreen() {
  return (
    <PlaceholderScreen
      title="피드백"
      description="사용자 피드백과 문의를 제출하는 화면 또는 시트다."
      bullets={[
        '텍스트 입력',
        '이미지 1장 첨부',
        '문의 API 전송',
      ]}
    />
  );
}
