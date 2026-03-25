import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { FeedScreen } from '@/features/feed/screens/FeedScreen';
import { buildLocalRootCommentPageMock } from '@/lib/api/comments';
import { useAuthStore } from '@/store/authStore';
import { FriendshipStatus } from '@/types/friend';
import { server } from '../../mocks/server';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

const buildFeedItem = (
  diaryId: number,
  overrides: Partial<{
    content: string;
    nickname: string;
    userId: string;
    commentCount: number;
    friendStatus: FriendshipStatus;
    imgUrls: string[];
  }> = {},
) => ({
  diaryId,
  status: 'PUBLIC' as const,
  content: overrides.content ?? `피드 카드 ${diaryId} 본문입니다.`,
  imgUrls:
    overrides.imgUrls ??
    [`https://picsum.photos/seed/feed-test-${diaryId}/640/640`],
  date: '2026-03-08',
  nickname: overrides.nickname ?? `user-${diaryId}`,
  avatar: '',
  userId: overrides.userId ?? `user-${diaryId}`,
  createdAt: '2026-03-08T01:00:00.000Z',
  commentCount: overrides.commentCount ?? 2,
  likeCount: 0,
  isLiked: false,
  friendStatus: overrides.friendStatus ?? FriendshipStatus.NONE,
});

describe('FeedScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: 'user-1',
        email: 'test@gmail.com',
        nickname: 'test',
        avatar: '',
      },
    });
  });

  it('renders feed cards and opens story detail on card press', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-301')).toBeTruthy());

    expect(screen.getByTestId('feed-floating-header').props.accessibilityState.expanded).toBe(
      true,
    );
    expect(screen.getByTestId('shell-brand-title')).toBeTruthy();
    expect(screen.queryByTestId('shell-user-name')).toBeNull();
    expect(screen.getAllByText('피쿠').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByTestId('feed-card-open-301'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: '301', source: 'feed' },
    });
  });

  it('opens the comment sheet on mobile without showing the story detail action', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('feed-comment-button-301')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('feed-comment-button-301'));

    expect(screen.getByText('댓글 4개')).toBeTruthy();
    expect(screen.getByTestId('feed-comment-sheet-body')).toBeTruthy();
    expect(screen.queryByTestId('feed-comment-sheet-preview-image')).toBeNull();
    expect(screen.queryByTestId('feed-comment-sheet-detail-button')).toBeNull();
  });

  it('shows the diary body and supports preview expansion inside the feed comment sheet', async () => {
    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({
          items: [
            buildFeedItem(901, {
              content:
                '이 본문은 충분히 길어서 댓글 시트 상단의 더 보기 버튼이 노출되어야 합니다. 사용자가 탭하면 전체 문자열을 확인할 수 있어야 합니다. 이 문장은 두 줄을 넘겨 더 보기 노출을 유도합니다.',
            }),
          ],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );

    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-901')).toBeTruthy());
    fireEvent.press(screen.getByTestId('feed-comment-button-901'));
    fireEvent(screen.getByTestId('feed-comment-sheet-preview-body-measure'), 'textLayout', {
      nativeEvent: {
        lines: [{ text: '본문 일부' }, { text: '본문 둘째 줄' }, { text: '본문 셋째 줄' }],
      },
    });

    expect(screen.getByTestId('feed-comment-sheet-preview-body-more')).toBeTruthy();
    expect(screen.getByTestId('feed-comment-sheet-preview-body').props.numberOfLines).toBe(2);

    fireEvent.press(screen.getByTestId('feed-comment-sheet-preview-body-more'));

    expect(screen.queryByTestId('feed-comment-sheet-preview-body-more')).toBeNull();
    expect(screen.getByTestId('feed-comment-sheet-preview-body').props.numberOfLines).toBeUndefined();
  });

  it('does not refetch comments in a loop when the feed comment sheet is opened', async () => {
    let commentRequestCount = 0;

    server.use(
      http.get(`${API_BASE_URL}/comments`, ({ request }) => {
        commentRequestCount += 1;

        const url = new URL(request.url);
        const diaryId = Number(url.searchParams.get('diaryId'));
        const page = Number(url.searchParams.get('page') ?? '0');
        const size = Number(url.searchParams.get('size') ?? '10');

        return HttpResponse.json(buildLocalRootCommentPageMock(diaryId, page, size));
      }),
    );

    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('feed-comment-button-301')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('feed-comment-button-301'));

    await waitFor(() => expect(screen.getByText('댓글 4개')).toBeTruthy());

    await act(async () => {
      await Promise.resolve();
    });

    expect(commentRequestCount).toBe(1);
  });

  it('loads the next feed page and shows the end label', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-301')).toBeTruthy());

    await act(async () => {
      screen.getByTestId('feed-list').props.onEndReached();
    });

    await waitFor(() => expect(screen.getByTestId('feed-card-303')).toBeTruthy());
    expect(screen.getByTestId('feed-end-label')).toBeTruthy();
  });

  it('updates image position label when the carousel is swiped', async () => {
    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({
          items: [
            buildFeedItem(777, {
              imgUrls: [
                'https://picsum.photos/seed/feed-test-777-1/640/640',
                'https://picsum.photos/seed/feed-test-777-2/640/640',
                'https://picsum.photos/seed/feed-test-777-3/640/640',
              ],
            }),
          ],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );

    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-777')).toBeTruthy());
    expect(screen.getByTestId('feed-image-pagination-label-777').props.children).toEqual([
      1,
      ' / ',
      3,
    ]);

    fireEvent(screen.getByTestId('feed-image-carousel-777'), 'momentumScrollEnd', {
      nativeEvent: {
        layoutMeasurement: { width: 320, height: 320 },
        contentOffset: { x: 320, y: 0 },
      },
    });

    expect(screen.getByTestId('feed-image-pagination-label-777').props.children).toEqual([
      2,
      ' / ',
      3,
    ]);
  });

  it('hides the floating header on downward scroll and shows it again on upward scroll', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-301')).toBeTruthy());

    fireEvent.scroll(screen.getByTestId('feed-list'), {
      nativeEvent: {
        contentOffset: { x: 0, y: 120 },
        contentSize: { width: 390, height: 1200 },
        layoutMeasurement: { width: 390, height: 844 },
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId('feed-floating-header').props.accessibilityState.expanded).toBe(
        false,
      ),
    );

    fireEvent.scroll(screen.getByTestId('feed-list'), {
      nativeEvent: {
        contentOffset: { x: 0, y: 70 },
        contentSize: { width: 390, height: 1200 },
        layoutMeasurement: { width: 390, height: 844 },
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId('feed-floating-header').props.accessibilityState.expanded).toBe(
        true,
      ),
    );
  });

  it('handles friend CTA transitions', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('feed-friend-action-301')).toBeTruthy(),
    );

    expect(screen.getByText('친구 추가')).toBeTruthy();
    expect(screen.getByText('요청 취소')).toBeTruthy();
    fireEvent.press(screen.getByTestId('feed-friend-action-301'));

    await waitFor(() => expect(screen.getAllByText('요청 취소').length).toBeGreaterThan(1));

    fireEvent.press(screen.getByTestId('feed-friend-action-302'));
    await waitFor(() => expect(screen.getByText('친구 추가')).toBeTruthy());

    await act(async () => {
      screen.getByTestId('feed-list').props.onEndReached();
    });

    await waitFor(() => expect(screen.getByTestId('feed-friend-action-303')).toBeTruthy());
    fireEvent.press(screen.getByTestId('feed-friend-action-303'));

    expect(routerMock.push).toHaveBeenCalledWith('/friends');
  });

  it('shows guest restrictions when the comment sheet is opened', async () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });

    const screen = renderWithProviders(<FeedScreen />);

    expect(screen.queryByTestId('public-feed-title')).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId('feed-comment-button-301')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('feed-comment-button-301'));
    expect(screen.getByTestId('feed-comment-sheet-login-button')).toBeTruthy();

    fireEvent.press(screen.getByTestId('feed-comment-sheet-login-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });

  it('shows error and empty states for feed responses', async () => {
    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({ message: '피드를 불러오지 못했습니다.' }, { status: 500 }),
      ),
    );

    const errorScreen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(errorScreen.getAllByText('피드를 불러오지 못했습니다.').length).toBeGreaterThan(0),
    );

    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({
          items: [],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );

    const emptyScreen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(emptyScreen.getByText('피드가 비어 있습니다.')).toBeTruthy(),
    );
  });

  it('expands long feed card content on demand', async () => {
    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({
          items: [
            buildFeedItem(901, {
              content:
                '이 본문은 충분히 길어서 더 보기 버튼이 노출되어야 합니다.\n사용자가 탭하면 전체 문자열을 확인할 수 있어야 합니다.',
            }),
          ],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );

    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-901')).toBeTruthy());
    fireEvent(screen.getByTestId('feed-content-measure-901'), 'textLayout', {
      nativeEvent: {
        lines: [{ text: 'user-901 본문 일부' }, { text: '본문 다음 줄' }],
      },
    });

    expect(screen.getByTestId('feed-content-more-901')).toBeTruthy();
    expect(screen.getByText('더보기')).toBeTruthy();
    expect(screen.getByTestId('feed-content-text-901').props.children[1]).not.toContain('\n');
    fireEvent.press(screen.getByTestId('feed-content-more-901'));

    expect(screen.queryByTestId('feed-content-more-901')).toBeNull();
    expect(screen.getByTestId('feed-content-text-901').props.numberOfLines).toBeUndefined();
  });
});
