import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { ProfileCalendarScreen } from '@/features/profile/screens/ProfileCalendarScreen';
import {
  addCalendarMonths,
  formatMonthLabel,
  startOfCalendarMonth,
} from '@/features/home/lib/calendar';
import { buildLocalMonthlyDiaryMock } from '@/lib/api/diaries';
import { buildLocalProfilePreviewMock } from '@/lib/api/profile';
import * as diariesApi from '@/lib/api/diaries';
import * as profileApi from '@/lib/api/profile';
import { routerMock, useLocalSearchParams } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

const PROFILE_USER_ID = 'user-2';

function formatDateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

describe('ProfileCalendarScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue(buildLocalProfilePreviewMock(PROFILE_USER_ID));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the selected month and disables friend switching controls', async () => {
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    mockedUseLocalSearchParams.mockReturnValue({
      userId: PROFILE_USER_ID,
      date: formatDateParam(targetDate),
    });
    jest
      .spyOn(diariesApi, 'getMonthlyDiaries')
      .mockResolvedValue(buildLocalMonthlyDiaryMock(PROFILE_USER_ID, targetDate.getFullYear(), targetDate.getMonth() + 1));

    const screen = renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() => expect(screen.getByTestId('home-calendar-grid')).toBeTruthy());
    expect(screen.getByTestId('home-month-label').props.children).toBe(formatMonthLabel(targetDate));
    expect(screen.getByTestId('home-viewed-user-name').props.children).toBe('도리');
    expect(screen.queryByTestId('home-friend-next-button')).toBeNull();
    expect(screen.queryByTestId('home-friend-prev-button')).toBeNull();
  });

  it('opens the story view when a recorded date is pressed', async () => {
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    const diaries = buildLocalMonthlyDiaryMock(
      PROFILE_USER_ID,
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
    );
    const diary = diaries.find((item) => item.date.endsWith('-08')) ?? diaries[0];

    mockedUseLocalSearchParams.mockReturnValue({
      userId: PROFILE_USER_ID,
      date: formatDateParam(targetDate),
    });
    jest.spyOn(diariesApi, 'getMonthlyDiaries').mockResolvedValue(diaries);

    const screen = renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() =>
      expect(screen.getByLabelText('도리 2026-02-08 기록 있음')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('home-calendar-current-day-8'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: String(diary.diaryId) },
    });
  });

  it('does not open compose for an empty day on another user calendar', async () => {
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    mockedUseLocalSearchParams.mockReturnValue({
      userId: PROFILE_USER_ID,
      date: formatDateParam(targetDate),
    });
    jest
      .spyOn(diariesApi, 'getMonthlyDiaries')
      .mockResolvedValue(buildLocalMonthlyDiaryMock(PROFILE_USER_ID, targetDate.getFullYear(), targetDate.getMonth() + 1));

    const screen = renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() => expect(screen.getByTestId('home-calendar-grid')).toBeTruthy());
    routerMock.push.mockClear();

    fireEvent.press(screen.getByTestId('home-calendar-current-day-10'));

    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('opens the requested diary immediately from route params and cleans the calendar url', async () => {
    mockedUseLocalSearchParams.mockReturnValue({
      userId: PROFILE_USER_ID,
      date: '2026-02-01',
      diaryId: '202602080',
    });
    jest.spyOn(diariesApi, 'getMonthlyDiaries').mockResolvedValue([]);

    renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith({
        pathname: '/profile/[userId]/calendar',
        params: {
          userId: 'user-2',
          date: '2026-02-01',
        },
      });
    });
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: '202602080' },
    });
  });

  it('shows an error state when profile information cannot be loaded', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: PROFILE_USER_ID });
    jest.spyOn(profileApi, 'getProfileInfo').mockRejectedValue(new Error('프로필 오류'));
    jest.spyOn(diariesApi, 'getMonthlyDiaries').mockResolvedValue([]);

    const screen = renderWithProviders(<ProfileCalendarScreen />);

    await waitFor(() => {
      expect(screen.getByText('사용자 정보를 불러오지 못했습니다.')).toBeTruthy();
    });
  });
});
