import { PlaceholderScreen } from '@/features/placeholder/PlaceholderScreen';

export function ProfileEditScreen() {
  return (
    <PlaceholderScreen
      title="프로필 편집"
      description="닉네임과 캐릭터를 수정하는 화면이다."
      bullets={[
        '닉네임 중복확인',
        '캐릭터 선택',
        '프로필 업데이트 API 연결',
      ]}
    />
  );
}
