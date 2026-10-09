import { apiClient } from '@/lib/api/client';
import { addFeedLike, getFeedCursor, removeFeedLike } from '@/lib/api/feed';

describe('feed api', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests the latest feed by default and keeps the cursor with the sort', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], nextCursor: null, hasNext: false },
    });

    await getFeedCursor('latest-cursor');

    expect(getSpy).toHaveBeenCalledWith('/diary', {
      params: { cursor: 'latest-cursor', limit: 20, sort: 'latest' },
    });
  });

  it('uses the backend default for recommended feed requests', async () => {
    const getSpy = jest.spyOn(apiClient, 'get').mockResolvedValue({
      data: { items: [], nextCursor: null, hasNext: false },
    });

    await getFeedCursor(null, 10, 'recommended');

    expect(getSpy).toHaveBeenCalledWith('/diary', {
      params: { limit: 10 },
    });
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
