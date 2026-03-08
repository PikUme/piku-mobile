import { useNotificationStore } from '@/store/notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({ unreadCount: 0 });
  });

  it('sets the unread count explicitly', () => {
    useNotificationStore.getState().setUnreadCount(5);

    expect(useNotificationStore.getState().unreadCount).toBe(5);
  });

  it('increments and decrements the unread count without going below zero', () => {
    useNotificationStore.getState().increment();
    useNotificationStore.getState().increment();
    useNotificationStore.getState().decrement();
    useNotificationStore.getState().decrement();
    useNotificationStore.getState().decrement();

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
