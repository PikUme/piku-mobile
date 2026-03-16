import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import { getNotifications } from '@/lib/api/notifications';

describe('notifications api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes relative notification asset urls into absolute urls', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        content: [
          {
            id: 701,
            message: '님의 새 일기를 확인해보세요.',
            nickname: '도리',
            avatarUrl: 'characters/fixed/base_image_1.png',
            type: 'FRIEND_DIARY',
            relatedDiaryId: 202603080,
            thumbnailUrl: '/uploads/diary/cover-701.jpg',
            isRead: false,
            diaryDate: '2026-03-08',
            diaryUserId: 'user-2',
          },
        ],
        number: 0,
        last: true,
        totalElements: 1,
        size: 20,
      },
    });

    await expect(getNotifications(0, 20)).resolves.toEqual({
      content: [
        {
          id: 701,
          message: '님의 새 일기를 확인해보세요.',
          nickname: '도리',
          avatarUrl: `${env.apiBaseUrl}/characters/fixed/base_image_1.png`,
          type: 'FRIEND_DIARY',
          relatedDiaryId: 202603080,
          thumbnailUrl: `${env.apiBaseUrl}/uploads/diary/cover-701.jpg`,
          isRead: false,
          diaryDate: '2026-03-08',
          diaryUserId: 'user-2',
        },
      ],
      number: 0,
      last: true,
      totalElements: 1,
      size: 20,
    });

    expect(getSpy).toHaveBeenCalledWith('/sse/notifications', {
      params: { page: 0, size: 20 },
    });
  });
});
