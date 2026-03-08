import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { http, HttpResponse } from 'msw';

import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { useAuthStore } from '@/store/authStore';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { server } from '../../mocks/server';
import { routerMock } from '../../mocks/expo-router';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

describe('LoginScreen', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
    routerMock.replace.mockClear();
    useAuthStore.setState({
      ...useAuthStore.getState(),
      isHydrated: true,
      isLoggedIn: false,
      user: null,
    });
  });

  it('renders login form and navigation links', () => {
    const screen = renderWithProviders(<LoginScreen />);

    expect(screen.getByTestId('login-email-input')).toBeTruthy();
    expect(screen.getByTestId('login-password-input')).toBeTruthy();
    expect(screen.getByTestId('login-submit-button')).toBeTruthy();

    fireEvent.press(screen.getByTestId('login-signup-link'));
    expect(routerMock.push).toHaveBeenCalledWith('/signup');

    fireEvent.press(screen.getByTestId('login-password-reset-link'));
    expect(routerMock.push).toHaveBeenCalledWith('/password-reset');
  });

  it('toggles password visibility', () => {
    const screen = renderWithProviders(<LoginScreen />);

    expect(screen.getByTestId('login-password-input').props.secureTextEntry).toBe(
      true,
    );

    fireEvent.press(screen.getByTestId('login-password-visibility-toggle'));

    expect(screen.getByTestId('login-password-input').props.secureTextEntry).toBe(
      false,
    );
  });

  it('logs in successfully and redirects home', async () => {
    const screen = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(
      screen.getByTestId('login-email-input'),
      'test@gmail.com',
    );
    fireEvent.changeText(screen.getByTestId('login-password-input'), '1');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() =>
      expect(useAuthStore.getState().isLoggedIn).toBe(true),
    );
    expect(useAuthStore.getState().user?.nickname).toBe('test');
    expect(routerMock.replace).toHaveBeenCalledWith('/');
  });

  it('shows api error message when credentials are invalid', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async () =>
        HttpResponse.json(
          { message: '이메일 또는 비밀번호를 확인해 주세요.' },
          { status: 401 },
        ),
      ),
    );

    const screen = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(
      screen.getByTestId('login-email-input'),
      'test@gmail.com',
    );
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'wrong-pass');
    fireEvent.press(screen.getByTestId('login-submit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('login-error-banner')).toBeTruthy(),
    );
    expect(
      screen.getByText('이메일 또는 비밀번호를 확인해 주세요.'),
    ).toBeTruthy();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });
});
