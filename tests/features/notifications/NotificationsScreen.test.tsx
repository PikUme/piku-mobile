import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { NotificationsScreen } from '@/features/notifications/screens/NotificationsScreen';
import * as notificationsApi from '@/lib/api/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import type { Page } from '@/types/api';
import type { AppNotification } from '@/types/notification';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const buildNotification = (
  id: number,
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id,
  message: overrides.message ?? '님의 새 알림입니다.',
  nickname: overrides.nickname ?? `user-${id}`,
  avatarUrl: overrides.avatarUrl ?? '',
  type: overrides.type ?? 'COMMENT',
  relatedDiaryId:
    overrides.relatedDiaryId === undefined ? 202603000 + id : overrides.relatedDiaryId,
  thumbnailUrl: overrides.thumbnailUrl ?? null,
  isRead: overrides.isRead ?? false,
  diaryDate: overrides.diaryDate === undefined ? '2026-03-08' : overrides.diaryDate,
  diaryUserId: overrides.diaryUserId === undefined ? `user-${id}` : overrides.diaryUserId,
});

const buildPage = (
  content: AppNotification[],
  number: number,
  last: boolean,
): Page<AppNotification> => ({
  content,
  number,
  last,
  totalElements: last ? content.length : content.length + 1,
  size: 20,
});

describe('NotificationsScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    routerMock.back.mockClear();
    routerMock.canGoBack.mockReturnValue(true);
    useNotificationStore.setState({ unreadCount: 0 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders notifications and syncs the unread badge count', async () => {
    jest.spyOn(notificationsApi, 'getNotifications').mockResolvedValue(
      buildPage(
        [
          buildNotification(501, {
            nickname: '도리',
            isRead: false,
            thumbnailUrl: 'https://picsum.photos/seed/notification-501/120/120',
          }),
          buildNotification(502, { nickname: '모아', isRead: true }),
          buildNotification(503, { nickname: '하루', isRead: false }),
        ],
        0,
        true,
      ),
    );

    const screen = renderWithProviders(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByTestId('notification-row-501')).toBeTruthy());
    expect(screen.getByTestId('notification-thumbnail-501')).toBeTruthy();
    expect(useNotificationStore.getState().unreadCount).toBe(2);
    expect(screen.getByTestId('notifications-read-all-button')).toBeTruthy();
  });

  it('marks a notification as read and opens the profile calendar deep link', async () => {
    const readSpy = jest.spyOn(notificationsApi, 'markNotificationAsRead').mockResolvedValue();
    jest.spyOn(notificationsApi, 'getNotifications').mockResolvedValue(
      buildPage(
        [
          buildNotification(502, {
            nickname: '모아',
            diaryUserId: 'user-3',
            diaryDate: '2026-03-07',
            relatedDiaryId: 202603070,
            isRead: false,
          }),
        ],
        0,
        true,
      ),
    );

    const screen = renderWithProviders(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByTestId('notification-row-502')).toBeTruthy());

    fireEvent.press(screen.getByTestId('notification-row-502'));

    await waitFor(() => expect(readSpy).toHaveBeenCalledWith(502));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith({
        pathname: '/profile/[userId]/calendar',
        params: {
          userId: 'user-3',
          date: '2026-03-07',
          diaryId: '202603070',
        },
      }),
    );
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(screen.queryByTestId('notification-unread-dot-502')).toBeNull();
  });

  it('opens a user profile when the notification does not have diary context', async () => {
    jest.spyOn(notificationsApi, 'markNotificationAsRead').mockResolvedValue();
    jest.spyOn(notificationsApi, 'getNotifications').mockResolvedValue(
      buildPage(
        [
          buildNotification(504, {
            nickname: '다온',
            type: 'FRIEND_REQUEST',
            diaryDate: null,
            relatedDiaryId: null,
            diaryUserId: 'user-8',
            isRead: false,
          }),
        ],
        0,
        true,
      ),
    );

    const screen = renderWithProviders(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByTestId('notification-row-504')).toBeTruthy());
    fireEvent.press(screen.getByTestId('notification-row-504'));

    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith({
        pathname: '/profile/[userId]',
        params: {
          userId: 'user-8',
        },
      }),
    );
  });

  it('marks all loaded notifications as read', async () => {
    const readAllSpy = jest.spyOn(notificationsApi, 'markAllNotificationsAsRead').mockResolvedValue();
    jest.spyOn(notificationsApi, 'getNotifications').mockResolvedValue(
      buildPage(
        [
          buildNotification(501, { isRead: false }),
          buildNotification(502, { isRead: false }),
        ],
        0,
        true,
      ),
    );

    const screen = renderWithProviders(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByTestId('notifications-read-all-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('notifications-read-all-button'));

    await waitFor(() => expect(readAllSpy).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('notifications-read-all-button')).toBeNull());
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('deletes an unread notification and requests the next page', async () => {
    const getSpy = jest
      .spyOn(notificationsApi, 'getNotifications')
      .mockResolvedValueOnce(
        buildPage(
          [
            buildNotification(501, { nickname: '도리', isRead: false }),
            buildNotification(502, { nickname: '모아', isRead: true }),
          ],
          0,
          false,
        ),
      )
      .mockResolvedValueOnce(
        buildPage([buildNotification(503, { nickname: '하루', isRead: false })], 1, true),
      );
    const deleteSpy = jest.spyOn(notificationsApi, 'deleteNotification').mockResolvedValue();

    const screen = renderWithProviders(<NotificationsScreen />);

    await waitFor(() => expect(screen.getByTestId('notification-row-501')).toBeTruthy());
    expect(useNotificationStore.getState().unreadCount).toBe(1);

    fireEvent.press(screen.getByTestId('notification-delete-501'));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith(501));
    await waitFor(() => expect(screen.queryByTestId('notification-row-501')).toBeNull());
    expect(useNotificationStore.getState().unreadCount).toBe(0);

    fireEvent(screen.getByTestId('notifications-list'), 'onEndReached');

    await waitFor(() => expect(getSpy).toHaveBeenCalledWith(1, 20));
    await waitFor(() => expect(screen.getByTestId('notification-row-503')).toBeTruthy());
  });
});
