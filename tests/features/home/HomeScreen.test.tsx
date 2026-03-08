import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@/features/home/screens/HomeScreen';
import {
  addCalendarMonths,
  createCalendarMonthDays,
  formatMonthLabel,
  startOfCalendarMonth,
} from '@/features/home/lib/calendar';
import { buildLocalMonthlyDiaryMock } from '@/lib/api/diaries';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { routerMock } from '../../mocks/expo-router';

const USER_ID = 'user-1';
const FIRST_FRIEND_NAME = '도리';

const moveToMonth = async (
  screen: ReturnType<typeof renderWithProviders>,
  targetDate: Date,
) => {
  fireEvent.press(screen.getByTestId('home-month-picker-toggle'));

  const currentMonth = startOfCalendarMonth(new Date());
  if (targetDate.getFullYear() < currentMonth.getFullYear()) {
    fireEvent.press(screen.getByTestId('home-month-picker-prev-year'));
  }

  if (targetDate.getFullYear() > currentMonth.getFullYear()) {
    fireEvent.press(screen.getByTestId('home-month-picker-next-year'));
  }

  fireEvent.press(screen.getByTestId(`home-month-option-${targetDate.getMonth() + 1}`));
  fireEvent.press(screen.getByTestId('home-month-picker-confirm'));

  await waitFor(() =>
    expect(screen.getByTestId('home-month-label').props.children).toBe(
      formatMonthLabel(targetDate),
    ),
  );
};

describe('HomeScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: true,
      user: {
        id: USER_ID,
        email: 'test@gmail.com',
        nickname: 'test',
        avatar: '',
      },
    });
  });

  it('renders the logged-in home calendar layout', async () => {
    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId('home-calendar-grid')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('home-friend-next-button')).toBeTruthy());

    expect(screen.getByText('test')).toBeTruthy();
    expect(screen.getByTestId('home-month-label')).toBeTruthy();
  });

  it('changes month through the picker', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const currentMonth = startOfCalendarMonth(new Date());
    const targetDate = addCalendarMonths(currentMonth, -1);
    await moveToMonth(screen, targetDate);

    expect(screen.getByTestId('home-month-label').props.children).toBe(
      formatMonthLabel(targetDate),
    );
  });

  it('opens diary detail when a recorded date is pressed', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    const diaries = buildLocalMonthlyDiaryMock(
      USER_ID,
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
    );
    const diary = diaries.find((item) => item.date.endsWith('-08')) ?? diaries[0];

    await moveToMonth(screen, targetDate);
    await waitFor(() =>
      expect(screen.getByLabelText('test 2026-02-08 기록 있음')).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId('home-calendar-current-day-8'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/diary/story',
      params: { id: String(diary.diaryId) },
    });
  });

  it('opens compose when an empty past date is pressed', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    await moveToMonth(screen, targetDate);
    fireEvent.press(screen.getByTestId('home-calendar-current-day-10'));

    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/compose',
      params: {
        date: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-10`,
      },
    });
  });

  it('moves to another month when an adjacent month day is pressed', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const currentMonth = startOfCalendarMonth(new Date());
    const adjacentDay = createCalendarMonthDays(currentMonth).find(
      (day) => !day.isCurrentMonth,
    );

    expect(adjacentDay).toBeDefined();

    fireEvent.press(
      screen.getByTestId(
        `home-calendar-adjacent-day-${adjacentDay!.date.getMonth() + 1}-${adjacentDay!.date.getDate()}`,
      ),
    );

    await waitFor(() =>
      expect(screen.getByTestId('home-month-label').props.children).toBe(
        formatMonthLabel(adjacentDay!.date),
      ),
    );
  });

  it('does not move to a future month when a trailing next-month day is pressed', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const currentMonth = startOfCalendarMonth(new Date());
    const nextMonthDay = createCalendarMonthDays(currentMonth).find(
      (day) => !day.isCurrentMonth && day.date > currentMonth,
    );

    expect(nextMonthDay).toBeDefined();
    await waitFor(() => expect(screen.getByTestId('home-calendar-grid')).toBeTruthy());

    fireEvent.press(
      screen.getByTestId(
        `home-calendar-adjacent-day-${nextMonthDay!.date.getMonth() + 1}-${nextMonthDay!.date.getDate()}`,
      ),
    );

    expect(screen.getByTestId('home-month-label').props.children).toBe(
      formatMonthLabel(currentMonth),
    );
  });

  it('does not change to a future month through the picker', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const currentMonth = startOfCalendarMonth(new Date());
    const futureMonth = addCalendarMonths(currentMonth, 1);

    fireEvent.press(screen.getByTestId('home-month-picker-toggle'));
    fireEvent.press(screen.getByTestId(`home-month-option-${futureMonth.getMonth() + 1}`));
    fireEvent.press(screen.getByTestId('home-month-picker-confirm'));

    expect(screen.getByTestId('home-month-label').props.children).toBe(
      formatMonthLabel(currentMonth),
    );
  });

  it('switches to the next friend calendar on upward swipe', async () => {
    const screen = renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(screen.getByTestId('home-friend-next-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('home-friend-next-button'));

    await waitFor(() =>
      expect(screen.getByTestId('home-viewed-user-name').props.children).toBe(
        FIRST_FRIEND_NAME,
      ),
    );
  });

  it('does not open compose for an empty past date on a friend calendar', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const targetDate = addCalendarMonths(startOfCalendarMonth(new Date()), -1);
    await waitFor(() => expect(screen.getByTestId('home-friend-next-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('home-friend-next-button'));

    await waitFor(() =>
      expect(screen.getByTestId('home-viewed-user-name').props.children).toBe(
        FIRST_FRIEND_NAME,
      ),
    );

    await moveToMonth(screen, targetDate);
    routerMock.push.mockClear();

    fireEvent.press(screen.getByTestId('home-calendar-current-day-10'));

    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('does not open compose for a future date on my calendar', async () => {
    const screen = renderWithProviders(<HomeScreen />);
    const currentMonth = startOfCalendarMonth(new Date());
    const futureDay = createCalendarMonthDays(currentMonth).find(
      (day) => day.isCurrentMonth && day.isFuture,
    );

    expect(futureDay).toBeDefined();
    await waitFor(() => expect(screen.getByTestId('home-calendar-grid')).toBeTruthy());

    routerMock.push.mockClear();

    fireEvent.press(
      screen.getByTestId(`home-calendar-current-day-${futureDay!.date.getDate()}`),
    );

    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
