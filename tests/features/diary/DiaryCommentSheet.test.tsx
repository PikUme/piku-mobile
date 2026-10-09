import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import { buildLocalDiaryDetailMock } from '@/lib/api/diaries';
import * as commentsApi from '@/lib/api/comments';
import { createLocalCommentMock } from '@/lib/api/comments';
import * as feedback from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const ROOT_COMMENT_ID = 30501;
const OWN_COMMENT_ID = 30502;
const originalConsoleError = console.error;

describe('DiaryCommentSheet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      const message = args
        .map((argument) => (typeof argument === 'string' ? argument : String(argument)))
        .join(' ');

      if (message.includes('not wrapped in act')) {
        return;
      }

      originalConsoleError(...args);
    });
    routerMock.push.mockClear();
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

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('loads comments, toggles replies, and posts a reply', async () => {
    const onCommentCountChange = jest.fn();
    const screen = renderWithProviders(
      <DiaryCommentSheet
        diary={buildLocalDiaryDetailMock(305)}
        onClose={jest.fn()}
        onCommentCountChange={onCommentCountChange}
        visible
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('사진 분위기가 좋아요. 오늘 하루가 잘 전해집니다.')).toBeTruthy(),
    );
    expect(screen.getByText('2026.03.05')).toBeTruthy();
    expect(screen.queryByText(/일 전$/)).toBeNull();

    fireEvent.press(screen.getByTestId(`comment-toggle-replies-${ROOT_COMMENT_ID}`));
    await waitFor(() =>
      expect(screen.getByText('저도 같은 생각이에요.')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId(`comment-reply-button-${ROOT_COMMENT_ID}`));
    expect(screen.getByText('피쿠님에게 답글 작성 중')).toBeTruthy();

    fireEvent.changeText(
      screen.getByTestId('diary-comment-sheet-input'),
      '새 답글입니다.',
    );
    fireEvent.press(screen.getByTestId('diary-comment-sheet-submit-button'));

    await waitFor(() => expect(screen.getByText('새 답글입니다.')).toBeTruthy());
    expect(onCommentCountChange).toHaveBeenCalled();
  });

  it('does not render the detail action when no detail handler is provided', async () => {
    const screen = renderWithProviders(
      <DiaryCommentSheet diary={buildLocalDiaryDetailMock(305)} onClose={jest.fn()} visible />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('diary-comment-sheet-preview-body')).toBeTruthy(),
    );

    expect(screen.queryByTestId('diary-comment-sheet-detail-button')).toBeNull();
  });

  it('uses anonymous avatars for an anonymous diary preview and its masked comments without profile navigation', async () => {
    jest.spyOn(commentsApi, 'getRootComments').mockResolvedValueOnce({
      content: [
        {
          id: 30503,
          diaryId: 305,
          userId: null,
          nickname: '익명',
          avatar: null,
          content: '익명 일기에 남긴 댓글입니다.',
          parentId: null,
          createdAt: '2026-03-05T10:00:00.000Z',
          replyCount: 1,
        },
      ],
      last: true,
      totalElements: 1,
    });
    jest.spyOn(commentsApi, 'getReplies').mockResolvedValueOnce({
      content: [
        {
          id: 30504,
          diaryId: 305,
          userId: null,
          nickname: '익명',
          avatar: null,
          content: '익명 일기에 남긴 답글입니다.',
          parentId: 30503,
          createdAt: '2026-03-05T10:01:00.000Z',
          replyCount: 0,
        },
      ],
      last: true,
      totalElements: 1,
    });
    jest.spyOn(commentsApi, 'createComment').mockResolvedValue({
      id: 30505,
      content: '새 익명 댓글입니다.',
      createdAt: '2026-03-05T10:02:00.000Z',
    } as never);
    const diary = {
      ...buildLocalDiaryDetailMock(305),
      status: 'ANONYMOUS' as const,
      userId: null,
      nickname: '익명',
      avatar: null,
    };
    const screen = renderWithProviders(
      <DiaryCommentSheet diary={diary} onClose={jest.fn()} visible />,
    );

    await waitFor(() =>
      expect(screen.getByText('익명 일기에 남긴 댓글입니다.')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('comment-toggle-replies-30503'));
    await waitFor(() => expect(screen.getByText('익명 일기에 남긴 답글입니다.')).toBeTruthy());
    expect(screen.getAllByRole('image', { name: '익명 프로필 아이콘' })).toHaveLength(3);
    expect(screen.getAllByRole('image', { name: '익명 프로필 아이콘' })[2]).toHaveStyle({
      width: 28,
      height: 28,
    });
    fireEvent.press(screen.getByTestId('diary-comment-sheet-profile-button'));
    fireEvent.press(screen.getByTestId('comment-profile-button-30503'));
    fireEvent.press(screen.getByTestId('comment-profile-button-30504'));
    expect(routerMock.push).not.toHaveBeenCalledWith('/profile/null');

    fireEvent.press(screen.getByTestId('comment-reply-button-30503'));
    expect(screen.getByText('익명님에게 답글 작성 중')).toBeTruthy();
    expect(screen.queryByText('test님에게 답글 작성 중')).toBeNull();
    fireEvent.press(screen.getByTestId('diary-comment-sheet-cancel-context-button'));

    fireEvent.changeText(screen.getByTestId('diary-comment-sheet-input'), '새 익명 댓글입니다.');
    fireEvent.press(screen.getByTestId('diary-comment-sheet-submit-button'));
    await waitFor(() => expect(screen.getByText('새 익명 댓글입니다.')).toBeTruthy());
    expect(screen.getAllByRole('image', { name: '익명 프로필 아이콘' })).toHaveLength(4);
  });

  it('shows the preview more action when the diary body contains explicit line breaks', async () => {
    const screen = renderWithProviders(
      <DiaryCommentSheet
        diary={{
          ...buildLocalDiaryDetailMock(305),
          content: '진짜 오늘 하루 너무 힘들었다\n피곤한데 회의는 하고 발표시키고 ㅠㅠ',
        }}
        onClose={jest.fn()}
        visible
      />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('diary-comment-sheet-preview-body-measure')).toBeTruthy(),
    );

    fireEvent(screen.getByTestId('diary-comment-sheet-preview-body-measure'), 'textLayout', {
      nativeEvent: {
        lines: [{ text: '진짜 오늘 하루 너무 힘들었다' }, { text: '피곤한데 회의는 하고 발표시키고 ㅠㅠ' }],
      },
    });

    expect(screen.getByTestId('diary-comment-sheet-preview-body-more')).toBeTruthy();
  });

  it('keeps reply pagination available after posting a reply to a partially loaded thread', async () => {
    for (let index = 0; index < 6; index += 1) {
      createLocalCommentMock(
        {
          diaryId: 305,
          parentId: ROOT_COMMENT_ID,
          content: `기존 답글 ${index + 1}`,
        },
        {
          id: `seed-user-${index + 1}`,
          nickname: `seed-${index + 1}`,
          avatar: '',
        },
      );
    }

    const screen = renderWithProviders(
      <DiaryCommentSheet diary={buildLocalDiaryDetailMock(305)} onClose={jest.fn()} visible />,
    );

    await waitFor(() =>
      expect(screen.getByText('사진 분위기가 좋아요. 오늘 하루가 잘 전해집니다.')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId(`comment-reply-button-${ROOT_COMMENT_ID}`));
    fireEvent.changeText(
      screen.getByTestId('diary-comment-sheet-input'),
      '부분 로드 상태에서 추가한 답글입니다.',
    );
    fireEvent.press(screen.getByTestId('diary-comment-sheet-submit-button'));

    await waitFor(() =>
      expect(screen.getByText('부분 로드 상태에서 추가한 답글입니다.')).toBeTruthy(),
    );
    expect(screen.getByTestId(`comment-load-more-replies-${ROOT_COMMENT_ID}`)).toBeTruthy();
  });

  it('edits and deletes own comments through the action sheet flow', async () => {
    const actionSheetSpy = jest.spyOn(feedback, 'showActionSheet');
    const confirmSpy = jest.spyOn(feedback, 'showConfirm');
    const screen = renderWithProviders(
      <DiaryCommentSheet diary={buildLocalDiaryDetailMock(305)} onClose={jest.fn()} visible />,
    );

    await waitFor(() =>
      expect(screen.getByText('내일도 기록 기대할게요.')).toBeTruthy(),
    );

    actionSheetSpy.mockImplementationOnce(({ options }) => {
      options[0]?.onPress?.();
    });

    fireEvent.press(screen.getByTestId(`comment-more-button-${OWN_COMMENT_ID}`));
    fireEvent.changeText(
      screen.getByTestId('diary-comment-sheet-input'),
      '수정된 댓글입니다.',
    );
    fireEvent.press(screen.getByTestId('diary-comment-sheet-submit-button'));

    await waitFor(() => expect(screen.getByText('수정된 댓글입니다.')).toBeTruthy());

    actionSheetSpy.mockImplementationOnce(({ options }) => {
      options[1]?.onPress?.();
    });
    confirmSpy.mockImplementationOnce((title, message, onConfirm) => {
      onConfirm();
    });

    fireEvent.press(screen.getByTestId(`comment-more-button-${OWN_COMMENT_ID}`));

    await waitFor(() =>
      expect(screen.queryByText('수정된 댓글입니다.')).toBeNull(),
    );
  });

  it('shows login actions for guests', async () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
    const screen = renderWithProviders(
      <DiaryCommentSheet diary={buildLocalDiaryDetailMock(305)} onClose={jest.fn()} visible />,
    );

    expect(screen.getByTestId('diary-comment-sheet-login-button')).toBeTruthy();
    expect(screen.queryByText('댓글을 작성하려면 로그인해주세요.')).toBeNull();
    fireEvent.press(screen.getByTestId('diary-comment-sheet-login-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });
});
