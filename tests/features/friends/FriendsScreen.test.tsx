import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { FriendsScreen } from '@/features/friends/screens/FriendsScreen';
import * as friendsApi from '@/lib/api/friends';
import * as feedback from '@/lib/ui/feedback';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const buildFriendPage = (friends: Array<{ userId: string; nickname: string; avatar: string }>, hasNext = false) => ({
  friends,
  hasNext,
  totalElements: friends.length,
});

const buildRequestPage = (requests: Array<{ userId: string; nickname: string; avatar: string }>, hasNext = false, totalElements = requests.length) => ({
  requests,
  hasNext,
  totalElements,
});

describe('FriendsScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    routerMock.push.mockReset();
  });

  it('renders the friend tab, request badge, paginates, and opens a profile', async () => {
    const getFriendsSpy = jest.spyOn(friendsApi, 'getFriends').mockImplementation(async (page) => {
      if (page === 0) {
        return buildFriendPage(
          [
            {
              userId: 'user-2',
              nickname: '도리',
              avatar: '',
            },
          ],
          true,
        );
      }

      return buildFriendPage([
        {
          userId: 'user-3',
          nickname: '모아',
          avatar: '',
        },
      ]);
    });
    jest.spyOn(friendsApi, 'getFriendRequests').mockResolvedValue(
      buildRequestPage(
        [
          {
            userId: 'user-8',
            nickname: '다온',
            avatar: '',
          },
        ],
        false,
        1,
      ),
    );

    const screen = renderWithProviders(<FriendsScreen />);

    await waitFor(() => expect(screen.getByText('도리')).toBeTruthy());
    expect(screen.getByTestId('friends-requests-badge')).toBeTruthy();

    fireEvent(screen.getByTestId('friends-list'), 'onEndReached');

    await waitFor(() => expect(getFriendsSpy).toHaveBeenCalledWith(1, 10));
    await waitFor(() => expect(screen.getByText('모아')).toBeTruthy());

    fireEvent.press(screen.getByTestId('friends-open-profile-user-3'));
    expect(routerMock.push).toHaveBeenCalledWith('/profile/user-3');
  });

  it('accepts a friend request and moves it into the friend list', async () => {
    jest.spyOn(friendsApi, 'getFriends').mockResolvedValue(
      buildFriendPage([
        {
          userId: 'user-2',
          nickname: '도리',
          avatar: '',
        },
      ]),
    );
    jest.spyOn(friendsApi, 'getFriendRequests').mockResolvedValue(
      buildRequestPage([
        {
          userId: 'user-8',
          nickname: '다온',
          avatar: '',
        },
      ]),
    );
    const acceptSpy = jest.spyOn(friendsApi, 'acceptFriendRequest').mockResolvedValue({
      isAccepted: true,
      message: '친구 요청을 수락했습니다.',
    });

    const screen = renderWithProviders(<FriendsScreen />);

    fireEvent.press(screen.getByTestId('friends-tab-requests'));
    await waitFor(() => expect(screen.getByText('다온')).toBeTruthy());

    fireEvent.press(screen.getByTestId('friends-accept-user-8'));

    await waitFor(() => expect(acceptSpy).toHaveBeenCalledWith('user-8'));
    await waitFor(() => expect(screen.queryByText('다온')).toBeNull());

    fireEvent.press(screen.getByTestId('friends-tab-friends'));
    expect(screen.getByText('다온')).toBeTruthy();
  });

  it('rejects a friend request and removes it from the pending list', async () => {
    jest.spyOn(friendsApi, 'getFriends').mockResolvedValue(buildFriendPage([]));
    jest.spyOn(friendsApi, 'getFriendRequests').mockResolvedValue(
      buildRequestPage([
        {
          userId: 'user-8',
          nickname: '다온',
          avatar: '',
        },
      ]),
    );
    const rejectSpy = jest.spyOn(friendsApi, 'rejectFriendRequest').mockResolvedValue({
      isAccepted: false,
      message: '친구 요청을 거절했습니다.',
    });

    const screen = renderWithProviders(<FriendsScreen />);

    fireEvent.press(screen.getByTestId('friends-tab-requests'));
    await waitFor(() => expect(screen.getByText('다온')).toBeTruthy());

    fireEvent.press(screen.getByTestId('friends-reject-user-8'));

    await waitFor(() => expect(rejectSpy).toHaveBeenCalledWith('user-8'));
    await waitFor(() =>
      expect(screen.getByText('대기 중인 친구 요청이 없습니다.')).toBeTruthy(),
    );
  });

  it('confirms before deleting a friend and removes it from the list after confirmation', async () => {
    jest.spyOn(friendsApi, 'getFriends').mockResolvedValue(
      buildFriendPage([
        {
          userId: 'user-2',
          nickname: '도리',
          avatar: '',
        },
      ]),
    );
    jest.spyOn(friendsApi, 'getFriendRequests').mockResolvedValue(buildRequestPage([]));
    const deleteSpy = jest.spyOn(friendsApi, 'deleteFriend').mockResolvedValue();
    const confirmSpy = jest.spyOn(feedback, 'showConfirm').mockImplementation(
      (_title, _message, onConfirm) => {
        onConfirm();
      },
    );

    const screen = renderWithProviders(<FriendsScreen />);

    await waitFor(() => expect(screen.getByText('도리')).toBeTruthy());
    fireEvent.press(screen.getByTestId('friends-remove-user-2'));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('user-2'));
    await waitFor(() =>
      expect(screen.getByText('친구 목록이 비어 있습니다.')).toBeTruthy(),
    );
  });

  it('keeps the avatar, profile block, and remove button on one row for friends', async () => {
    jest.spyOn(friendsApi, 'getFriends').mockResolvedValue(
      buildFriendPage([
        {
          userId: 'user-2',
          nickname: '도리',
          avatar: '',
        },
      ]),
    );
    jest.spyOn(friendsApi, 'getFriendRequests').mockResolvedValue(buildRequestPage([]));

    const screen = renderWithProviders(<FriendsScreen />);

    await waitFor(() => expect(screen.getByText('도리')).toBeTruthy());

    expect(StyleSheet.flatten(screen.getByTestId('friends-row-user-2').props.style)).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        alignItems: 'center',
      }),
    );
    expect(
      StyleSheet.flatten(screen.getByTestId('friends-profile-block-user-2').props.style),
    ).toEqual(
      expect.objectContaining({
        flex: 1,
      }),
    );
  });
});
