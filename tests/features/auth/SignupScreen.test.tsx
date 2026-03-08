import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { SignupScreen } from '@/features/auth/screens/SignupScreen';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { routerMock } from '../../mocks/expo-router';
import { server } from '../../mocks/server';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

describe('SignupScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
  });

  const renderScreen = () => renderWithProviders(<SignupScreen />);

  const completeStep1Verification = async (
    screen: ReturnType<typeof renderScreen>,
    code = '123456',
  ) => {
    fireEvent.changeText(
      screen.getByTestId('signup-email-input'),
      'new-user@example.com',
    );
    fireEvent.press(screen.getByTestId('signup-send-verification-button'));

    await waitFor(() =>
      expect(screen.getByTestId('signup-verification-code-input')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId('signup-verification-code-input'), code);
    fireEvent.press(screen.getByTestId('signup-verify-code-button'));
  };

  it('renders step 1 fields and policy links', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-email-input')).toBeTruthy(),
    );

    expect(screen.getByTestId('signup-password-input')).toBeTruthy();
    expect(screen.getByTestId('signup-password-confirm-input')).toBeTruthy();
    expect(screen.getByTestId('signup-nickname-input')).toBeTruthy();
    expect(screen.getByTestId('signup-agreement-terms-view')).toBeTruthy();
    expect(screen.getByTestId('signup-agreement-privacy-view')).toBeTruthy();
  });

  it('validates disallowed email domains while typing', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-email-input')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId('signup-email-input'), 'test@t.t');

    await waitFor(() =>
      expect(screen.getByText('허용된 이메일 도메인이 아닙니다.')).toBeTruthy(),
    );
  });

  it('toggles signup password visibility', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-password-input')).toBeTruthy(),
    );

    expect(screen.getByTestId('signup-password-input').props.secureTextEntry).toBe(
      true,
    );
    expect(
      screen.getByTestId('signup-password-confirm-input').props.secureTextEntry,
    ).toBe(true);

    fireEvent.press(screen.getByTestId('signup-password-visibility-toggle'));
    fireEvent.press(
      screen.getByTestId('signup-password-confirm-visibility-toggle'),
    );

    expect(screen.getByTestId('signup-password-input').props.secureTextEntry).toBe(
      false,
    );
    expect(
      screen.getByTestId('signup-password-confirm-input').props.secureTextEntry,
    ).toBe(false);
  });

  it('opens policy modal and agrees to terms', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-agreement-terms-view')).toBeTruthy(),
    );

    expect(
      screen.getByTestId('signup-agreement-terms').props.accessibilityState.checked,
    ).toBe(false);

    fireEvent.press(screen.getByTestId('signup-agreement-terms-view'));

    await waitFor(() =>
      expect(screen.getByTestId('signup-policy-modal-content')).toBeTruthy(),
    );
    expect(screen.getByText('이용약관')).toBeTruthy();

    fireEvent.press(screen.getByTestId('signup-policy-agree-button'));

    expect(
      screen.getByTestId('signup-agreement-terms').props.accessibilityState.checked,
    ).toBe(true);
  });

  it('completes step 1 verification and moves to step 2', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-email-input')).toBeTruthy(),
    );

    await completeStep1Verification(screen);

    await waitFor(() =>
      expect(screen.getByText('이메일 인증이 완료되었습니다.')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId('signup-password-input'), 'password123!');
    fireEvent.changeText(
      screen.getByTestId('signup-password-confirm-input'),
      'password123!',
    );
    fireEvent.changeText(screen.getByTestId('signup-nickname-input'), 'newbie');
    fireEvent.press(screen.getByTestId('signup-agreement-terms'));
    fireEvent.press(screen.getByTestId('signup-agreement-privacy'));
    fireEvent.press(screen.getByTestId('signup-next-button'));

    await waitFor(() =>
      expect(screen.getByTestId('signup-character-option-1')).toBeTruthy(),
    );
  });

  it('submits signup and routes back to login', async () => {
    const screen = renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('signup-email-input')).toBeTruthy(),
    );

    await completeStep1Verification(screen);

    await waitFor(() =>
      expect(screen.getByText('이메일 인증이 완료되었습니다.')).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByTestId('signup-password-input'), 'password123!');
    fireEvent.changeText(
      screen.getByTestId('signup-password-confirm-input'),
      'password123!',
    );
    fireEvent.changeText(screen.getByTestId('signup-nickname-input'), 'newbie');
    fireEvent.press(screen.getByTestId('signup-agreement-terms'));
    fireEvent.press(screen.getByTestId('signup-agreement-privacy'));
    fireEvent.press(screen.getByTestId('signup-next-button'));

    await waitFor(() =>
      expect(screen.getByTestId('signup-character-option-1')).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId('signup-character-option-1'));
    fireEvent.press(screen.getByTestId('signup-submit-button'));

    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/login'),
    );
  });

  it('shows backend error message on verification failure', async () => {
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
      expect(screen.getByTestId('signup-email-input')).toBeTruthy(),
    );

    await completeStep1Verification(screen, '000000');

    await waitFor(() =>
      expect(screen.getByText('인증코드가 올바르지 않습니다.')).toBeTruthy(),
    );
  });
});
