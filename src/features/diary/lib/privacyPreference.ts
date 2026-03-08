import * as SecureStore from 'expo-secure-store';

import type { DiaryVisibility } from '@/types/diary';

const PRIVACY_PREFERENCE_KEY = 'pikume.compose.privacy';

function isDiaryVisibility(value: string): value is DiaryVisibility {
  return value === 'PUBLIC' || value === 'FRIENDS' || value === 'PRIVATE';
}

export async function getSavedComposePrivacy(): Promise<DiaryVisibility> {
  const saved = await SecureStore.getItemAsync(PRIVACY_PREFERENCE_KEY);

  if (!saved || !isDiaryVisibility(saved)) {
    return 'PUBLIC';
  }

  return saved;
}

export async function setSavedComposePrivacy(privacy: DiaryVisibility) {
  await SecureStore.setItemAsync(PRIVACY_PREFERENCE_KEY, privacy);
}
