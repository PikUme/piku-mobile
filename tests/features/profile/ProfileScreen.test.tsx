import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { ProfileScreen } from '@/features/profile/screens/ProfileScreen';
import { buildLocalProfilePreviewMock } from '@/lib/api/profile';
import * as profileApi from '@/lib/api/profile';
import * as friendsApi from '@/lib/api/friends';
import * as feedback from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { FriendshipStatus } from '@/types/friend';
import { routerMock, useLocalSearchParams } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('ProfileScreen', () => {
  beforeEach(() => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-1' });
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
    jest.restoreAllMocks();
  });

  it('renders the owner profile and links edit and calendar actions', async () => {
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue(buildLocalProfilePreviewMock('user-1'));

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-nickname')).toHaveTextContent('test'));

    fireEvent.press(screen.getByTestId('profile-edit-button'));
    expect(routerMock.push).toHaveBeenCalledWith('/profile/edit');

    fireEvent.press(screen.getByTestId('profile-month-card-2026-1'));
    expect(routerMock.push).toHaveBeenCalledWith('/profile/user-1/calendar?date=2026-01-01');
  });

  it('groups monthly diary achievement by year', async () => {
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue({
      ...buildLocalProfilePreviewMock('user-1'),
      monthlyDiaryCount: [
        { year: 2026, month: 3, count: 15, daysInMonth: 31 },
        { year: 2026, month: 2, count: 11, daysInMonth: 28 },
        { year: 2025, month: 12, count: 19, daysInMonth: 31 },
      ],
    });

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-year-section-2026')).toBeTruthy());

    expect(screen.getByTestId('profile-year-section-2025')).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-month-card-2025-12'));
    expect(routerMock.push).toHaveBeenCalledWith('/profile/user-1/calendar?date=2025-12-01');
  });

  it('shows login and signup actions for guests viewing another profile', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-4' });
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue({
      ...buildLocalProfilePreviewMock('user-4'),
      friendStatus: FriendshipStatus.NONE,
      isOwner: false,
    });
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-nickname')).toHaveTextContent('하루'));
    fireEvent.press(screen.getByTestId('profile-login-button'));
    expect(routerMock.push).toHaveBeenCalledWith('/login');

    fireEvent.press(screen.getByTestId('profile-signup-button'));
    expect(routerMock.push).toHaveBeenCalledWith('/signup');
  });

  it('sends a friend request and can cancel it from the profile action area', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-4' });
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue({
      ...buildLocalProfilePreviewMock('user-4'),
      friendStatus: FriendshipStatus.NONE,
      isOwner: false,
    });
    const sendSpy = jest.spyOn(friendsApi, 'sendFriendRequest').mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    });
    const cancelSpy = jest.spyOn(friendsApi, 'cancelFriendRequest').mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 취소했습니다.',
    });

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-add-friend-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('profile-add-friend-button'));
    await waitFor(() => expect(sendSpy).toHaveBeenCalledWith('user-4'));
    await waitFor(() => expect(screen.getByTestId('profile-cancel-request-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('profile-cancel-request-button'));
    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('user-4'));
    await waitFor(() => expect(screen.getByTestId('profile-add-friend-button')).toBeTruthy());
  });

  it('accepts and rejects received friend requests from the profile', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-8' });
    const baseProfile = {
      ...buildLocalProfilePreviewMock('user-8'),
      friendStatus: FriendshipStatus.RECEIVED,
      isOwner: false,
    };
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue(baseProfile);
    const acceptSpy = jest.spyOn(friendsApi, 'acceptFriendRequest').mockResolvedValue({
      isAccepted: true,
      message: '친구 요청을 수락했습니다.',
    });

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-accept-friend-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('profile-accept-friend-button'));
    await waitFor(() => expect(acceptSpy).toHaveBeenCalledWith('user-8'));
    await waitFor(() => expect(screen.getByTestId('profile-unfriend-button')).toBeTruthy());

    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue(baseProfile);
    const rejectSpy = jest.spyOn(friendsApi, 'rejectFriendRequest').mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 거절했습니다.',
    });
    const secondScreen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(secondScreen.getByTestId('profile-reject-friend-button')).toBeTruthy());
    fireEvent.press(secondScreen.getByTestId('profile-reject-friend-button'));
    await waitFor(() => expect(rejectSpy).toHaveBeenCalledWith('user-8'));
    await waitFor(() => expect(secondScreen.getByTestId('profile-add-friend-button')).toBeTruthy());
  });

  it('confirms before unfriending and updates the action state', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-2' });
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue({
      ...buildLocalProfilePreviewMock('user-2'),
      friendStatus: FriendshipStatus.FRIEND,
      isOwner: false,
    });
    const deleteSpy = jest.spyOn(friendsApi, 'deleteFriend').mockResolvedValue();
    const confirmSpy = jest.spyOn(feedback, 'showConfirm').mockImplementation(
      (_title, _message, onConfirm) => {
        onConfirm();
      },
    );

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-unfriend-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('profile-unfriend-button'));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('user-2'));
    await waitFor(() => expect(screen.getByTestId('profile-add-friend-button')).toBeTruthy());
  });

  it('resets local friendship overrides when navigating to another profile', async () => {
    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-4' });
    jest
      .spyOn(profileApi, 'getProfileInfo')
      .mockResolvedValueOnce({
        ...buildLocalProfilePreviewMock('user-4'),
        friendStatus: FriendshipStatus.NONE,
        isOwner: false,
      })
      .mockResolvedValueOnce({
        ...buildLocalProfilePreviewMock('user-2'),
        friendStatus: FriendshipStatus.FRIEND,
        isOwner: false,
      });
    jest.spyOn(friendsApi, 'sendFriendRequest').mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    });

    const screen = renderWithProviders(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-add-friend-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('profile-add-friend-button'));
    await waitFor(() => expect(screen.getByTestId('profile-cancel-request-button')).toBeTruthy());

    mockedUseLocalSearchParams.mockReturnValue({ userId: 'user-2' });
    screen.rerender(<ProfileScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-unfriend-button')).toBeTruthy());
  });
});
