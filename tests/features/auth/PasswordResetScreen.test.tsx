import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { PasswordResetScreen } from '@/features/auth/screens/PasswordResetScreen';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { routerMock } from '../../mocks/expo-router';
import { server } from '../../mocks/server';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

describe('PasswordResetScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  const renderScreen = () => renderWithProviders(<PasswordResetScreen />);

  const moveToStep2 = async (screen: ReturnType<typeof renderScreen>) => {
    fireEvent.changeText(
      screen.getByTestId('password-reset-email-input'),
      'test@gmail.com',
    );
    fireEvent.press(screen.getByTestId('password-reset-send-verification-button'));

    await waitFor(() =>
      expect(
        screen.getByTestId('password-reset-verification-code-input'),
      ).toBeTruthy(),
    );
  };

  const moveToStep3 = async (screen: ReturnType<typeof renderScreen>) => {
    await moveToStep2(screen);

    fireEvent.changeText(
      screen.getByTestId('password-reset-verification-code-input'),
      '123456',
    );
    fireEvent.press(screen.getByTestId('password-reset-verify-code-button'));

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-password-input')).toBeTruthy(),
    );
  };

  it('renders password reset step 1', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );
    expect(screen.getByTestId('password-reset-step-indicator')).toBeTruthy();
    expect(screen.getByTestId('password-reset-step-label-1')).toBeTruthy();
    expect(screen.getByTestId('password-reset-step-label-2')).toBeTruthy();
    expect(screen.getByTestId('password-reset-step-label-3')).toBeTruthy();
    expect(screen.queryByText('1. 이메일 입력')).toBeNull();
    expect(
      screen.getByTestId('password-reset-send-verification-button'),
    ).toBeTruthy();
  });

  it('validates disallowed email domains while typing', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByTestId('password-reset-email-input'),
      'test@t.t',
    );

    await waitFor(() =>
      expect(screen.getByText('허용된 이메일 도메인이 아닙니다.')).toBeTruthy(),
    );
  });

  it('moves from email step to verification step', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    await moveToStep2(screen);
  });

  it('moves to new password step after verification', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    await moveToStep3(screen);
  });

  it('toggles new password visibility', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    await moveToStep3(screen);

    expect(
      screen.getByTestId('password-reset-password-input').props.secureTextEntry,
    ).toBe(true);

    fireEvent.press(
      screen.getByTestId('password-reset-password-visibility-toggle'),
    );

    expect(
      screen.getByTestId('password-reset-password-input').props.secureTextEntry,
    ).toBe(false);
  });

  it('submits new password and routes back to login', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    await moveToStep3(screen);

    fireEvent.changeText(
      screen.getByTestId('password-reset-password-input'),
      'password123!',
    );
    fireEvent.changeText(
      screen.getByTestId('password-reset-password-confirm-input'),
      'password123!',
    );
    fireEvent.press(screen.getByTestId('password-reset-submit-button'));

    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/login'),
    );
  });

  it('shows backend error on verification failure', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/verify-code`, async () =>
        HttpResponse.json(
          { message: '인증코드가 올바르지 않습니다.' },
          { status: 400 },
        ),
      ),
    );

    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('password-reset-email-input')).toBeTruthy(),
    );

    await moveToStep2(screen);
    fireEvent.changeText(
      screen.getByTestId('password-reset-verification-code-input'),
      '000000',
    );
    fireEvent.press(screen.getByTestId('password-reset-verify-code-button'));

    await waitFor(() =>
      expect(screen.getByText('인증코드가 올바르지 않습니다.')).toBeTruthy(),
    );
  });
});
