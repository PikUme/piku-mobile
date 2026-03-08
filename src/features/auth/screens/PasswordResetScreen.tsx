import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function PasswordResetScreen() {
  return (
    <PlaceholderScreen
      title="비밀번호 재설정"
      description="이메일 인증 후 새 비밀번호를 입력하는 3단계 화면이다."
      bullets={[
        '인증코드 발송',
        '인증코드 검증',
        '새 비밀번호 저장',
      ]}
    />
  );
}
