import { apiClient } from '@/lib/api/client';
import { addFeedLike, removeFeedLike } from '@/lib/api/feed';

describe('feed api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('maps the like response to the mobile shape on add', async () => {
    const postSpy = jest.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        diaryId: 301,
        likeCount: 5,
        liked: true,
      },
    });

    await expect(addFeedLike(301)).resolves.toEqual({
      diaryId: 301,
      likeCount: 5,
      isLiked: true,
    });
    expect(postSpy).toHaveBeenCalledWith('/likes/diary/301');
  });

  it('maps the like response to the mobile shape on remove', async () => {
    const deleteSpy = jest.spyOn(apiClient, 'delete').mockResolvedValue({
      data: {
        diaryId: 301,
        likeCount: 4,
        liked: false,
      },
    });

    await expect(removeFeedLike(301)).resolves.toEqual({
      diaryId: 301,
      likeCount: 4,
      isLiked: false,
    });
    expect(deleteSpy).toHaveBeenCalledWith('/likes/diary/301');
  });
});
