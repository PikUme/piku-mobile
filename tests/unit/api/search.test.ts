import { apiClient } from '@/lib/api/client';
import { searchUsers } from '@/lib/api/search';

describe('search api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps server id fields into mobile userId fields', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: {
        content: [
          {
            id: 'user1',
            nickname: 'test',
            avatar: 'http://localhost:8080/api/characters/fixed/base_image_1.png',
          },
          {
            userId: 'user2',
            nickname: 'test2',
            avatar: 'http://localhost:8080/api/characters/fixed/base_image_2.png',
          },
        ],
        last: true,
        totalElements: 2,
        number: 0,
        size: 10,
      },
    });

    await expect(searchUsers('test', 0, 10)).resolves.toEqual({
      content: [
        {
          userId: 'user1',
          nickname: 'test',
          avatar: 'http://localhost:8080/api/characters/fixed/base_image_1.png',
        },
        {
          userId: 'user2',
          nickname: 'test2',
          avatar: 'http://localhost:8080/api/characters/fixed/base_image_2.png',
        },
      ],
      last: true,
      totalElements: 2,
      number: 0,
      size: 10,
    });

    expect(getSpy).toHaveBeenCalledWith('/search', {
      params: {
        keyword: 'test',
        page: 0,
        size: 10,
      },
    });
  });
});
