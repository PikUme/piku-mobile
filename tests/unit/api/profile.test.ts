import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import { getProfileInfo } from '@/lib/api/profile';
import { FriendshipStatus } from '@/types/friend';

describe('profile api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalizes the server profile response into the mobile profile shape', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        id: 'user1',
        nickname: 'test',
        avatar: 'characters/fixed/base_image_1.png',
        friendCount: 1,
        diaryCount: 11,
        friendStatus: 'NONE',
        isOwner: true,
        monthlyDiaryCount: [
          {
            year: 2026,
            month: 3,
            count: 1,
          },
        ],
      },
    });

    await expect(getProfileInfo('user1')).resolves.toEqual({
      id: 'user1',
      userId: 'user1',
      nickname: 'test',
      avatar: `${env.apiBaseUrl}/characters/fixed/base_image_1.png`,
      friendCount: 1,
      diaryCount: 11,
      friendStatus: FriendshipStatus.NONE,
      isOwner: true,
      monthlyDiaryCount: [
        {
          year: 2026,
          month: 3,
          count: 1,
          daysInMonth: 31,
        },
      ],
    });
    expect(getSpy).toHaveBeenCalledWith('/users/user1');
  });
});
