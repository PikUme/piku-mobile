import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, AlertButton } from 'react-native';

import { DiaryStoryScreen } from '@/features/diary/screens/DiaryStoryScreen';
import * as diariesApi from '@/lib/api/diaries';
import { useAuthStore } from '@/store/authStore';
import { routerMock, useLocalSearchParams } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const setDiaryParam = (id: string | string[], source?: string) => {
  (useLocalSearchParams as jest.Mock).mockReturnValue(
    source ? { id, source } : { id },
  );
};

describe('DiaryStoryScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    routerMock.back.mockClear();
    routerMock.canGoBack.mockReturnValue(true);
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

  it('renders story detail, opens the comment sheet, and routes to profile', async () => {
    const diary = diariesApi.buildLocalDiaryDetailMock(305);
    setDiaryParam('305');

    const screen = renderWithProviders(<DiaryStoryScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-story-author-button')).toBeTruthy(),
    );

    expect(screen.getByText(diary.nickname)).toBeTruthy();
    expect(screen.getByTestId('diary-story-content')).toBeTruthy();
    expect(screen.queryByTestId('diary-story-more-button')).toBeNull();

    fireEvent.press(screen.getByTestId('diary-story-author-button'));
    expect(routerMock.push).toHaveBeenCalledWith(`/profile/${diary.userId}`);

    fireEvent.press(screen.getByTestId('diary-story-comment-open-button'));

    await waitFor(() =>
      expect(screen.getByText('사진 분위기가 좋아요. 오늘 하루가 잘 전해집니다.')).toBeTruthy(),
    );
  });

  it('hides the story body when the screen is opened from feed', async () => {
    setDiaryParam('305', 'feed');

    const screen = renderWithProviders(<DiaryStoryScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-story-author-button')).toBeTruthy(),
    );

    expect(screen.queryByTestId('diary-story-content')).toBeNull();
  });

  it('shows delete actions for own diary and deletes after confirmation', async () => {
    const deleteSpy = jest
      .spyOn(diariesApi, 'deleteDiary')
      .mockResolvedValue(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    setDiaryParam('304');
    const screen = renderWithProviders(<DiaryStoryScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-story-more-button')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('diary-story-more-button'));
    fireEvent.press(screen.getByTestId('diary-story-delete-button'));

    expect(alertSpy).toHaveBeenCalledWith(
      '일기 삭제',
      '정말 이 일기를 삭제하시겠습니까?',
      expect.any(Array),
    );

    const buttons = alertSpy.mock.calls[0]?.[2] as AlertButton[];
    buttons[1]?.onPress?.();

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(304));
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('shows an error state when the story route is invalid', () => {
    setDiaryParam('invalid');

    const screen = renderWithProviders(<DiaryStoryScreen />);

    expect(screen.getByText('일기를 찾을 수 없습니다.')).toBeTruthy();
    expect(screen.getByText('유효하지 않은 일기 경로입니다.')).toBeTruthy();
  });
});
