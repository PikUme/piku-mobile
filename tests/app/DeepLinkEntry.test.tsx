import React from 'react';
import { waitFor } from '@testing-library/react-native';

import { DiaryDetailScreen } from '@/features/diary/screens/DiaryDetailScreen';
import { ProfileCalendarScreen } from '@/features/profile/screens/ProfileCalendarScreen';
import { buildLocalMonthlyDiaryMock } from '@/lib/api/diaries';
import { buildLocalProfilePreviewMock } from '@/lib/api/profile';
import * as diariesApi from '@/lib/api/diaries';
import * as profileApi from '@/lib/api/profile';
import { routerMock, useLocalSearchParams } from '../mocks/expo-router';
import { renderWithProviders } from '../test-utils/renderWithProviders';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('Deep link entry', () => {
  beforeEach(() => {
    mockedUseLocalSearchParams.mockReset();
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders diary detail from a direct route param array', async () => {
    const diary = diariesApi.buildLocalDiaryDetailMock(305);
    jest.spyOn(diariesApi, 'getDiaryDetail').mockResolvedValue(diary);
    mockedUseLocalSearchParams.mockReturnValue({ id: ['305'] });

    const screen = renderWithProviders(<DiaryDetailScreen />);

    await waitFor(() =>
      expect(screen.getByTestId('diary-detail-comment-entry')).toBeTruthy(),
    );

    expect(screen.getByText(diary.nickname)).toBeTruthy();
    expect(screen.getByText(/오늘의 장면을 기록한 상세 일기입니다/)).toBeTruthy();
  });

  it('opens story and normalizes the calendar url when a profile calendar deep link includes diaryId', async () => {
    const targetDate = '2026-02-01';
    jest
      .spyOn(profileApi, 'getProfileInfo')
      .mockResolvedValue(buildLocalProfilePreviewMock('user-2'));
    jest.spyOn(diariesApi, 'getMonthlyDiaries').mockResolvedValue(
      buildLocalMonthlyDiaryMock('user-2', 2026, 2),
    );
    mockedUseLocalSearchParams.mockReturnValue({
      userId: 'user-2',
      date: targetDate,
      diaryId: '202602080',
    });

    renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith({
        pathname: '/profile/[userId]/calendar',
        params: {
          userId: 'user-2',
          date: targetDate,
        },
      });
    });
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: '202602080' },
    });
  });
});
