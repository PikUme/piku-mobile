import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { FeedScreen } from '@/features/feed/screens/FeedScreen';
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
  }> = {},
) => ({
  diaryId,
  status: 'PUBLIC' as const,
  content: overrides.content ?? `피드 카드 ${diaryId} 본문입니다.`,
  imgUrls: [`https://picsum.photos/seed/feed-test-${diaryId}/640/640`],
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

    expect(screen.getAllByText('피쿠').length).toBeGreaterThan(0);
    fireEvent.press(screen.getByTestId('feed-card-open-301'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: '301' },
    });
  });

  it('opens the comment sheet on mobile and routes to detail from the sheet', async () => {
    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('feed-comment-button-301')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('feed-comment-button-301'));

    expect(screen.getByText('댓글 4개')).toBeTruthy();
    expect(screen.getByTestId('feed-comment-sheet-body')).toBeTruthy();

    fireEvent.press(screen.getByTestId('feed-comment-sheet-detail-button'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: '301' },
    });
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

  it('expands long content on demand', async () => {
    server.use(
      http.get(`${API_BASE_URL}/diary`, () =>
        HttpResponse.json({
          items: [
            buildFeedItem(901, {
              content:
                '이 본문은 충분히 길어서 더 보기 버튼이 노출되어야 합니다. 사용자가 탭하면 전체 문자열을 확인할 수 있어야 합니다.',
            }),
          ],
          nextCursor: null,
          hasNext: false,
        }),
      ),
    );

    const screen = renderWithProviders(<FeedScreen />);

    await waitFor(() => expect(screen.getByTestId('feed-card-901')).toBeTruthy());
    fireEvent.press(screen.getByTestId('feed-content-more-901'));

    expect(
      screen.getByText(
        'user-901 이 본문은 충분히 길어서 더 보기 버튼이 노출되어야 합니다. 사용자가 탭하면 전체 문자열을 확인할 수 있어야 합니다.',
      ),
    ).toBeTruthy();
  });
});
