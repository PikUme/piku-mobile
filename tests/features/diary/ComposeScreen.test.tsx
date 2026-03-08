import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { ComposeScreen } from '@/features/diary/screens/ComposeScreen';
import { formatDateKey } from '@/features/home/lib/calendar';
import * as diariesApi from '@/lib/api/diaries';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { routerMock, useLocalSearchParams } from '../../mocks/expo-router';

const SecureStore = require('expo-secure-store') as {
  __reset: () => void;
};

const createPickerAsset = (overrides: Partial<ImagePicker.ImagePickerAsset> = {}) => ({
  uri: 'file:///picked-photo.jpg',
  assetId: 'picked-photo-1',
  width: 1800,
  height: 1200,
  type: 'image' as const,
  fileName: 'picked-photo.jpg',
  fileSize: 1000,
  mimeType: 'image/jpeg',
  ...overrides,
});

describe('ComposeScreen', () => {
  const renderComposeScreen = async () => {
    const screen = renderWithProviders(<ComposeScreen />);
    await waitFor(() => expect(screen.getByText('횟수 3')).toBeTruthy());
    return screen;
  };

  beforeEach(() => {
    SecureStore.__reset();
    routerMock.replace.mockClear();
    routerMock.push.mockClear();
    (useLocalSearchParams as jest.Mock).mockReturnValue({});
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: true,
      assets: [],
    });
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

  it('renders a selected past date and default privacy', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: formatDateKey(pastDate),
    });

    const screen = await renderComposeScreen();

    expect(screen.getByText('전체 공개')).toBeTruthy();
    expect(routerMock.replace).not.toHaveBeenCalledWith('/login');
  });

  it('redirects home when a future date is requested', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      date: formatDateKey(futureDate),
    });

    renderWithProviders(<ComposeScreen />);

    expect(routerMock.replace).toHaveBeenCalledWith('/');
  });

  it('redirects login when auth state is missing', () => {
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });

    renderWithProviders(<ComposeScreen />);

    expect(routerMock.replace).toHaveBeenCalledWith('/login');
  });

  it('changes privacy and restores the saved value on next mount', async () => {
    const firstScreen = await renderComposeScreen();

    fireEvent.press(firstScreen.getByTestId('compose-privacy-button'));
    fireEvent.press(firstScreen.getByTestId('compose-privacy-option-FRIENDS'));

    expect(firstScreen.getByText('친구 공개')).toBeTruthy();
    firstScreen.unmount();

    const secondScreen = await renderComposeScreen();
    expect(secondScreen.getByText('친구 공개')).toBeTruthy();
  });

  it('adds library photos and marks the first one as cover', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [createPickerAsset()],
    });

    const screen = await renderComposeScreen();

    fireEvent.press(screen.getByTestId('compose-library-button'));

    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-card-picked-photo-1')).toBeTruthy(),
    );
    expect(
      screen.getByTestId('compose-photo-cover-badge-picked-photo-1'),
    ).toBeTruthy();
  });

  it('adds a camera photo when the camera action is used', async () => {
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [createPickerAsset({ assetId: 'camera-photo-1', fileName: 'camera.jpg' })],
    });

    const screen = await renderComposeScreen();

    fireEvent.press(screen.getByTestId('compose-camera-button'));

    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-card-camera-photo-1')).toBeTruthy(),
    );
  });

  it('generates an ai photo when content is present', async () => {
    jest.spyOn(diariesApi, 'generateAiPhoto').mockResolvedValue({
      id: 901,
      url: 'https://picsum.photos/seed/test-ai-901/720/720',
    });

    const screen = await renderComposeScreen();

    fireEvent.changeText(
      screen.getByTestId('compose-content-input'),
      'AI 사진을 생성할 수 있는 내용입니다.',
    );
    fireEvent.press(screen.getByTestId('compose-ai-button'));

    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-card-ai-901')).toBeTruthy(),
    );
  });

  it('reorders and removes selected photos', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        createPickerAsset({ assetId: 'picked-photo-1', fileName: 'one.jpg' }),
        createPickerAsset({
          assetId: 'picked-photo-2',
          fileName: 'two.jpg',
          uri: 'file:///two.jpg',
        }),
      ],
    });

    const screen = await renderComposeScreen();

    fireEvent.press(screen.getByTestId('compose-library-button'));

    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-card-picked-photo-2')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('compose-photo-move-left-picked-photo-2'));
    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-cover-badge-picked-photo-2')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('compose-photo-remove-picked-photo-1'));

    await waitFor(() =>
      expect(screen.queryByTestId('compose-photo-card-picked-photo-1')).toBeNull(),
    );
  });

  it('shows an error when saving without photos', async () => {
    const screen = await renderComposeScreen();

    fireEvent.changeText(screen.getByTestId('compose-content-input'), '사진 없는 일기');
    fireEvent.press(screen.getByTestId('compose-save-button'));

    await waitFor(() =>
      expect(screen.getByTestId('compose-error-banner')).toBeTruthy(),
    );
    expect(screen.getByText('사진을 1장 이상 등록해주세요.')).toBeTruthy();
  });

  it('submits a diary and routes home after success', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [createPickerAsset()],
    });

    const screen = await renderComposeScreen();

    fireEvent.press(screen.getByTestId('compose-library-button'));
    await waitFor(() =>
      expect(screen.getByTestId('compose-photo-card-picked-photo-1')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId('compose-content-input'), '오늘의 기록입니다.');
    fireEvent.press(screen.getByTestId('compose-save-button'));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/'));
  });
});
