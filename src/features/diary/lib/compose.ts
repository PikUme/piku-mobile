import type {
  ComposePhoto,
  DiaryCreatePayload,
  DiaryVisibility,
} from '@/types/diary';

export const MAX_TOTAL_PHOTOS = 5;
export const MAX_DIARY_CONTENT_LENGTH = 500;

export function moveComposePhoto(
  photos: ComposePhoto[],
  fromIndex: number,
  toIndex: number,
) {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= photos.length ||
    toIndex >= photos.length ||
    fromIndex === toIndex
  ) {
    return photos;
  }

  const next = [...photos];
  const [target] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, target);
  return next;
}

export function buildDiaryCreatePayload({
  content,
  date,
  photos,
  privacy,
}: {
  content: string;
  date: string;
  photos: ComposePhoto[];
  privacy: DiaryVisibility;
}): DiaryCreatePayload {
  const uploadFiles: DiaryCreatePayload['photos'] = [];
  const imageInfos = photos.map((photo, index) => {
    if (photo.type === 'ai') {
      return {
        type: 'AI_IMAGE' as const,
        order: index,
        aiPhotoId: photo.aiPhotoId,
      };
    }

    const photoIndex = uploadFiles.length;
    if (photo.uploadFile) {
      uploadFiles.push(photo.uploadFile);
    }

    return {
      type: 'USER_IMAGE' as const,
      order: index,
      photoIndex,
    };
  });

  return {
    diary: {
      status: privacy,
      content: content.trim(),
      date,
      imageInfos,
    },
    photos: uploadFiles,
  };
}

export function getUserPhotoCount(photos: ComposePhoto[]) {
  return photos.filter((photo) => photo.type === 'user').length;
}

export function getAvailablePhotoSlots(photos: ComposePhoto[]) {
  return Math.max(0, MAX_TOTAL_PHOTOS - photos.length);
}
