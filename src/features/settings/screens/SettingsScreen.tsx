import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function SettingsScreen() {
  return (
    <PlaceholderScreen
      title="설정"
      description="앱 버전, 푸시 권한 상태, 로그아웃 등 Lite 설정 화면이다."
      bullets={[
        '버전 정보 표시',
        '푸시 권한 상태 표시',
        '로그아웃 연결',
      ]}
    />
  );
}
