import { http, HttpResponse } from 'msw';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

export const handlers = [
  http.get(`${API_BASE_URL}/health`, () => {
    return HttpResponse.json({ ok: true });
  }),
  http.get(`${API_BASE_URL}/auth/email-domains`, () => {
    return HttpResponse.json(['example.com', 'gmail.com', 'naver.com']);
  }),
  http.post(`${API_BASE_URL}/auth/login`, async () => {
    return HttpResponse.json(
      {
        user: {
          id: 'user-1',
          email: 'tester@example.com',
          nickname: 'tester',
          avatar: '',
        },
      },
      {
        headers: {
          authorization: 'Bearer test-access-token',
        },
      },
    );
  }),
  http.post(`${API_BASE_URL}/auth/send-verification/sign-up`, async () => {
    return HttpResponse.json('회원가입 인증 이메일이 발송되었습니다.');
  }),
  http.post(`${API_BASE_URL}/auth/verify-code`, async () => {
    return HttpResponse.json('이메일 인증이 완료되었습니다.');
  }),
  http.post(`${API_BASE_URL}/auth/signup`, async () => {
    return HttpResponse.text('회원가입 성공', { status: 201 });
  }),
  http.get(`${API_BASE_URL}/characters/fixed`, async () => {
    return HttpResponse.json([
      { id: 1, type: 'fox', displayImageUrl: '' },
      { id: 2, type: 'cat', displayImageUrl: '' },
      { id: 3, type: 'bear', displayImageUrl: '' },
      { id: 4, type: 'rabbit', displayImageUrl: '' },
    ]);
  }),
];
