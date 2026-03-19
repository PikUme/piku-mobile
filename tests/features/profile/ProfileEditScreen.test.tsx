import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { ProfileEditScreen } from '@/features/profile/screens/ProfileEditScreen';
import * as charactersApi from '@/lib/api/characters';
import * as profileApi from '@/lib/api/profile';
import * as feedback from '@/lib/ui/feedback';
import { useAuthStore } from '@/store/authStore';
import { FriendshipStatus } from '@/types/friend';
import type { FixedCharacter } from '@/types/character';
import { routerMock } from '../../mocks/expo-router';
import { renderWithProviders } from '../../test-utils/renderWithProviders';

const CHARACTER_FIXTURES: FixedCharacter[] = [
  { id: 1, type: 'fox', displayImageUrl: 'https://cdn.example.com/fox.png' },
  { id: 2, type: 'cat', displayImageUrl: 'https://cdn.example.com/cat.png' },
  { id: 3, type: 'bear', displayImageUrl: 'https://cdn.example.com/bear.png' },
  { id: 4, type: 'rabbit', displayImageUrl: 'https://cdn.example.com/rabbit.png' },
];

const buildProfile = () => ({
  id: 'user-1',
  userId: 'user-1',
  nickname: 'test',
  avatar: 'https://cdn.example.com/cat.png',
  friendCount: 12,
  diaryCount: 20,
  friendStatus: FriendshipStatus.FRIEND,
  isOwner: true,
  monthlyDiaryCount: [],
});

describe('ProfileEditScreen', () => {
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
        avatar: 'https://cdn.example.com/cat.png',
      },
    });
    jest.spyOn(profileApi, 'getProfileInfo').mockResolvedValue(buildProfile());
    jest.spyOn(charactersApi, 'getFixedCharacters').mockResolvedValue(CHARACTER_FIXTURES);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders current profile values and selects the current character', async () => {
    const screen = renderWithProviders(<ProfileEditScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-edit-nickname-input').props.value).toBe('test'));

    expect(screen.getByTestId('profile-edit-email-input').props.value).toBe('test@gmail.com');
    expect(screen.getByTestId('profile-edit-character-option-2').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('profile-edit-save-button')).toBeDisabled();
    expect(screen.queryByText('cat')).toBeNull();
    expect(screen.queryByText('fox')).toBeNull();
  });

  it('checks nickname availability and resets the check when the nickname changes again', async () => {
    jest.spyOn(profileApi, 'checkNicknameAvailability').mockResolvedValue({
      success: true,
      message: '사용 가능한 닉네임입니다.',
    });

    const screen = renderWithProviders(<ProfileEditScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-edit-nickname-input').props.value).toBe('test'));

    fireEvent.changeText(screen.getByTestId('profile-edit-nickname-input'), 'pikume');
    fireEvent.press(screen.getByTestId('profile-edit-check-nickname-button'));

    await waitFor(() => expect(profileApi.checkNicknameAvailability).toHaveBeenCalledWith('pikume'));
    await waitFor(() => expect(screen.getByText('사용 가능한 닉네임입니다.')).toBeTruthy());
    expect(screen.getByTestId('profile-edit-save-button')).not.toBeDisabled();

    fireEvent.changeText(screen.getByTestId('profile-edit-nickname-input'), 'pikume-next');

    await waitFor(() => expect(screen.queryByText('사용 가능한 닉네임입니다.')).toBeNull());
    expect(screen.getByTestId('profile-edit-save-button')).toBeDisabled();
  });

  it('saves a character-only change and updates the auth user avatar', async () => {
    const updateSpy = jest.spyOn(profileApi, 'updateUserProfile').mockResolvedValue({
      success: true,
      message: '프로필이 성공적으로 변경되었습니다.',
      avatar: 'https://cdn.example.com/bear.png',
    });

    const screen = renderWithProviders(<ProfileEditScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-edit-character-option-2').props.accessibilityState.selected).toBe(true));

    fireEvent.press(screen.getByTestId('profile-edit-character-option-3'));
    fireEvent.press(screen.getByTestId('profile-edit-save-button'));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith({ characterId: 3 }));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/profile/user-1'));
    expect(useAuthStore.getState().user?.avatar).toBe('https://cdn.example.com/bear.png');
    expect(useAuthStore.getState().user?.nickname).toBe('test');
  });

  it('saves a checked nickname change and updates the auth user', async () => {
    jest.spyOn(profileApi, 'checkNicknameAvailability').mockResolvedValue({
      success: true,
      message: '사용 가능한 닉네임입니다.',
    });
    const updateSpy = jest.spyOn(profileApi, 'updateUserProfile').mockResolvedValue({
      success: true,
      message: '프로필이 성공적으로 변경되었습니다.',
      newNickname: 'pikume',
      avatar: 'https://cdn.example.com/cat.png',
    });
    const alertSpy = jest.spyOn(feedback, 'showAlert');

    const screen = renderWithProviders(<ProfileEditScreen />);

    await waitFor(() => expect(screen.getByTestId('profile-edit-nickname-input').props.value).toBe('test'));

    fireEvent.changeText(screen.getByTestId('profile-edit-nickname-input'), 'pikume');
    fireEvent.press(screen.getByTestId('profile-edit-check-nickname-button'));

    await waitFor(() => expect(screen.getByTestId('profile-edit-save-button')).not.toBeDisabled());

    fireEvent.press(screen.getByTestId('profile-edit-save-button'));

    await waitFor(() => expect(updateSpy).toHaveBeenCalledWith({ newNickname: 'pikume' }));
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/profile/user-1'));
    expect(useAuthStore.getState().user?.nickname).toBe('pikume');
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
