import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { DiaryDetailScreen } from '@/features/diary/screens/DiaryDetailScreen';
import * as diariesApi from '@/lib/api/diaries';
import { routerMock, useLocalSearchParams } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const setDiaryParam = (id: string | string[]) => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id });
};

describe('DiaryDetailScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    routerMock.back.mockClear();
    routerMock.canGoBack.mockReturnValue(true);
  });

  it('renders detail from route params, expands content, and opens the comment sheet', async () => {
    const diary = {
      ...diariesApi.buildLocalDiaryDetailMock(305),
      content:
        '이 본문은 딥링크 상세 화면에서 더 보기 버튼이 노출되는지 확인하기 위한 충분히 긴 텍스트입니다. 사용자가 누르면 전체 문자열을 그대로 확인할 수 있어야 합니다. 같은 문장을 한 번 더 이어붙여 100자를 확실히 넘기겠습니다.',
    };
    jest.spyOn(diariesApi, 'getDiaryDetail').mockResolvedValue(diary);
    setDiaryParam(['305']);

    const screen = renderWithProviders(<DiaryDetailScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-detail-comment-entry')).toBeTruthy(),
    );

    expect(screen.getByText(diary.nickname)).toBeTruthy();

    fireEvent.press(screen.getByTestId('diary-detail-content-more'));
    expect(screen.getByText(diary.content)).toBeTruthy();

    fireEvent.press(screen.getByTestId('diary-detail-comment-entry'));
    expect(screen.getByText(`댓글 ${diary.commentCount}개`)).toBeTruthy();

    fireEvent.press(screen.getByTestId('diary-comment-sheet-profile-button'));
    expect(routerMock.push).toHaveBeenCalledWith(`/profile/${diary.userId}`);
  });

  it('replaces home when back stack is not available', async () => {
    setDiaryParam('305');
    routerMock.canGoBack.mockReturnValue(false);

    const screen = renderWithProviders(<DiaryDetailScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-detail-back-button')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('diary-detail-back-button'));
    expect(routerMock.replace).toHaveBeenCalledWith('/');
  });

  it('shows an error state when the detail route is invalid', () => {
    setDiaryParam('invalid');

    const screen = renderWithProviders(<DiaryDetailScreen />);

    expect(screen.getByText('일기를 찾을 수 없습니다.')).toBeTruthy();
    expect(screen.getByText('유효하지 않은 일기 경로입니다.')).toBeTruthy();
  });
});
