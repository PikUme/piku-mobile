import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { DiaryCommentSheet } from '@/features/diary/components/DiaryCommentSheet';
import { buildLocalDiaryDetailMock } from '@/lib/api/diaries';
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
    fireEvent.press(screen.getByTestId('diary-comment-sheet-login-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });
});
