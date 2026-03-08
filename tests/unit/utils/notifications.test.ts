import { resolvePushNotificationRoute } from '@/lib/push/notifications';

describe('resolvePushNotificationRoute', () => {
  it('builds a profile calendar route when diary context exists', () => {
    expect(
      resolvePushNotificationRoute({
        diaryUserId: 'user-2',
        diaryDate: '2026-03-08',
        relatedDiaryId: 202603080,
      }),
    ).toEqual({
      pathname: '/profile/[userId]/calendar',
      params: {
        userId: 'user-2',
        date: '2026-03-08',
        diaryId: '202603080',
      },
    });
  });

  it('falls back to the profile route when only a user id exists', () => {
    expect(resolvePushNotificationRoute({ userId: 'user-8' })).toEqual({
      pathname: '/profile/[userId]',
      params: {
        userId: 'user-8',
      },
    });
  });

  it('uses senderUserId when the notification payload does not include diaryUserId', () => {
    expect(
      resolvePushNotificationRoute({
        senderUserId: 'user-9',
        date: '2026-03-01',
        diaryId: 202603010,
      }),
    ).toEqual({
      pathname: '/profile/[userId]/calendar',
      params: {
        userId: 'user-9',
        date: '2026-03-01',
        diaryId: '202603010',
      },
    });
  });

  it('returns null when no supported routing payload exists', () => {
    expect(resolvePushNotificationRoute({})).toBeNull();
  });
});
