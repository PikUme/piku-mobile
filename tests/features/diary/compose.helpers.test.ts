import {
  buildDiaryCreatePayload,
  getAvailablePhotoSlots,
  getUserPhotoCount,
  MAX_TOTAL_PHOTOS,
  moveComposePhoto,
} from '@/features/diary/lib/compose';
import type { ComposePhoto } from '@/types/diary';

const SAMPLE_PHOTOS: ComposePhoto[] = [
  {
    id: 'user-photo-1',
    type: 'user',
    previewUri: 'file:///user-1.jpg',
    uploadFile: {
      uri: 'file:///user-1.jpg',
      name: 'user-1.jpg',
      type: 'image/jpeg',
    },
  },
  {
    id: 'ai-901',
    type: 'ai',
    previewUri: 'https://example.com/ai-901.jpg',
    aiPhotoId: 901,
  },
  {
    id: 'user-photo-2',
    type: 'user',
    previewUri: 'file:///user-2.jpg',
    uploadFile: {
      uri: 'file:///user-2.jpg',
      name: 'user-2.jpg',
      type: 'image/jpeg',
    },
  },
];

describe('compose helpers', () => {
  it('builds multipart payload preserving photo order', () => {
    const payload = buildDiaryCreatePayload({
      content: '  오늘의 기록  ',
      date: '2026-03-08',
      photos: SAMPLE_PHOTOS,
      privacy: 'FRIENDS',
    });

    expect(payload.diary.status).toBe('FRIENDS');
    expect(payload.diary.content).toBe('오늘의 기록');
    expect(payload.diary.imageInfos).toEqual([
      {
        type: 'USER_IMAGE',
        order: 0,
        photoIndex: 0,
      },
      {
        type: 'AI_IMAGE',
        order: 1,
        aiPhotoId: 901,
      },
      {
        type: 'USER_IMAGE',
        order: 2,
        photoIndex: 1,
      },
    ]);
    expect(payload.photos).toHaveLength(2);
  });

  it('moves a photo to another position', () => {
    const moved = moveComposePhoto(SAMPLE_PHOTOS, 2, 0);

    expect(moved.map((photo) => photo.id)).toEqual([
      'user-photo-2',
      'user-photo-1',
      'ai-901',
    ]);
  });

  it('calculates photo counts and remaining slots', () => {
    expect(getUserPhotoCount(SAMPLE_PHOTOS)).toBe(2);
    expect(getAvailablePhotoSlots(SAMPLE_PHOTOS)).toBe(
      MAX_TOTAL_PHOTOS - SAMPLE_PHOTOS.length,
    );
  });
});
