import { http, HttpResponse } from 'msw';

import {
  buildLocalDiaryDetailMock,
  buildLocalMonthlyDiaryMock,
} from '@/lib/api/diaries';
import {
  buildLocalRepliesPageMock,
  buildLocalRootCommentPageMock,
  createLocalCommentMock,
  deleteLocalCommentMock,
  resetLocalCommentMockState,
  updateLocalCommentMock,
} from '@/lib/api/comments';
import type { FeedDiary } from '@/types/diary';
import type { Friend } from '@/types/friend';
import { FriendshipStatus } from '@/types/friend';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api';

const HOME_FRIENDS: Friend[] = [
  {
    userId: 'user-2',
    nickname: '도리',
    avatar: '',
  },
  {
    userId: 'user-3',
    nickname: '모아',
    avatar: '',
  },
  {
    userId: 'user-4',
    nickname: '하루',
    avatar: '',
  },
];

const FRIEND_REQUESTS: Friend[] = [
  {
    userId: 'user-8',
    nickname: '다온',
    avatar: '',
  },
  {
    userId: 'user-9',
    nickname: '시우',
    avatar: '',
  },
  {
    userId: 'user-10',
    nickname: '지안',
    avatar: '',
  },
];

const SEARCH_USERS: Friend[] = [
  {
    userId: 'user-2',
    nickname: '도리',
    avatar: '',
  },
  {
    userId: 'user-3',
    nickname: '도영',
    avatar: '',
  },
  {
    userId: 'user-4',
    nickname: '도하',
    avatar: '',
  },
  {
    userId: 'user-5',
    nickname: '하루',
    avatar: '',
  },
  {
    userId: 'user-6',
    nickname: '모아',
    avatar: '',
  },
];

const FEED_ITEMS: FeedDiary[] = [
  {
    diaryId: 301,
    status: 'PUBLIC',
    content:
      '피드 목록 첫 번째 카드입니다. 본문이 길 때 더 보기 버튼이 필요합니다.',
    imgUrls: [
      'https://picsum.photos/seed/test-feed-301-1/720/720',
      'https://picsum.photos/seed/test-feed-301-2/720/720',
    ],
    date: '2026-03-08',
    nickname: '피쿠',
    avatar: '',
    userId: 'user-301',
    createdAt: '2026-03-08T01:00:00.000Z',
    commentCount: 4,
    likeCount: 0,
    isLiked: false,
    friendStatus: FriendshipStatus.NONE,
  },
  {
    diaryId: 302,
    status: 'PUBLIC',
    content: '두 번째 카드입니다.',
    imgUrls: ['https://picsum.photos/seed/test-feed-302-1/720/720'],
    date: '2026-03-07',
    nickname: '모아',
    avatar: '',
    userId: 'user-302',
    createdAt: '2026-03-07T02:00:00.000Z',
    commentCount: 1,
    likeCount: 0,
    isLiked: false,
    friendStatus: FriendshipStatus.SENT,
  },
  {
    diaryId: 303,
    status: 'PUBLIC',
    content: '세 번째 카드입니다.',
    imgUrls: ['https://picsum.photos/seed/test-feed-303-1/720/720'],
    date: '2026-03-06',
    nickname: '하루',
    avatar: '',
    userId: 'user-303',
    createdAt: '2026-03-06T03:00:00.000Z',
    commentCount: 2,
    likeCount: 0,
    isLiked: false,
    friendStatus: FriendshipStatus.RECEIVED,
  },
];

const getFeedPage = (cursor?: string | null) => {
  if (cursor === 'cursor-2') {
    return {
      items: FEED_ITEMS.slice(2),
      nextCursor: null,
      hasNext: false,
    };
  }

  return {
    items: FEED_ITEMS.slice(0, 2),
    nextCursor: 'cursor-2',
    hasNext: true,
  };
};

export const resetMockData = () => {
  resetLocalCommentMockState();
};

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
          email: 'test@gmail.com',
          nickname: 'test',
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
  http.post(`${API_BASE_URL}/auth/send-verification/password-reset`, async () => {
    return HttpResponse.json('비밀번호 재설정 인증 이메일이 발송되었습니다.');
  }),
  http.post(`${API_BASE_URL}/auth/verify-code`, async () => {
    return HttpResponse.json('이메일 인증이 완료되었습니다.');
  }),
  http.post(`${API_BASE_URL}/auth/signup`, async () => {
    return HttpResponse.text('회원가입 성공', { status: 201 });
  }),
  http.post(`${API_BASE_URL}/auth/password-reset`, async () => {
    return HttpResponse.text('비밀번호가 재설정되었습니다.', { status: 200 });
  }),
  http.get(`${API_BASE_URL}/characters/fixed`, async () => {
    return HttpResponse.json([
      { id: 1, type: 'fox', displayImageUrl: '' },
      { id: 2, type: 'cat', displayImageUrl: '' },
      { id: 3, type: 'bear', displayImageUrl: '' },
      { id: 4, type: 'rabbit', displayImageUrl: '' },
    ]);
  }),
  http.get(`${API_BASE_URL}/relation`, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const start = page * size;
    const end = start + size;
    const friends = HOME_FRIENDS.slice(start, end);

    return HttpResponse.json({
      content: friends,
      last: end >= HOME_FRIENDS.length,
      totalElements: HOME_FRIENDS.length,
    });
  }),
  http.get(`${API_BASE_URL}/relation/requests`, async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const start = page * size;
    const end = start + size;
    const requests = FRIEND_REQUESTS.slice(start, end);

    return HttpResponse.json({
      content: requests,
      last: end >= FRIEND_REQUESTS.length,
      totalElements: FRIEND_REQUESTS.length,
    });
  }),
  http.get(`${API_BASE_URL}/search`, async ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '10');
    const filteredUsers = keyword
      ? SEARCH_USERS.filter((user) => user.nickname.toLowerCase().includes(keyword))
      : [];
    const start = page * size;
    const end = start + size;

    return HttpResponse.json({
      content: filteredUsers.slice(start, end),
      last: end >= filteredUsers.length,
      totalElements: filteredUsers.length,
      number: page,
      size,
    });
  }),
  http.post(`${API_BASE_URL}/relation`, async () => {
    return HttpResponse.json({
      isAccepted: false,
      message: '친구 요청을 보냈습니다.',
    });
  }),
  http.delete(`${API_BASE_URL}/relation/requests/:userId`, async () => {
    return HttpResponse.json({
      isAccepted: false,
      message: '친구 요청을 거절했습니다.',
    });
  }),
  http.delete(`${API_BASE_URL}/relation/:userId`, async () => {
    return HttpResponse.text('', { status: 204 });
  }),
  http.delete(`${API_BASE_URL}/relation/cancel/:userId`, async () => {
    return HttpResponse.json({
      isAccepted: false,
      message: '친구 요청을 취소했습니다.',
    });
  }),
  http.get(`${API_BASE_URL}/diary`, ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');

    return HttpResponse.json(getFeedPage(cursor));
  }),
  http.get(`${API_BASE_URL}/diary/ai/generate`, () => {
    return HttpResponse.json({ remainingRequests: 3 });
  }),
  http.post(`${API_BASE_URL}/diary/ai/generate`, async () => {
    return HttpResponse.json({
      id: 901,
      url: 'https://picsum.photos/seed/test-ai-901/720/720',
    });
  }),
  http.post(`${API_BASE_URL}/diary`, async () => {
    return HttpResponse.json(
      {
        diaryId: 999,
        message: '일기가 저장되었습니다.',
      },
      { status: 201 },
    );
  }),
  http.get(`${API_BASE_URL}/diary/:diaryId`, ({ params }) => {
    const diaryId = Number(params.diaryId);
    return HttpResponse.json(buildLocalDiaryDetailMock(diaryId));
  }),
  http.delete(`${API_BASE_URL}/diary/:diaryId`, () => {
    return HttpResponse.text('', { status: 204 });
  }),
  http.get(`${API_BASE_URL}/diary/user/:userId/monthly`, ({ params, request }) => {
    const url = new URL(request.url);
    const year = Number(url.searchParams.get('year'));
    const month = Number(url.searchParams.get('month'));
    const userId = String(params.userId ?? '');

    return HttpResponse.json(buildLocalMonthlyDiaryMock(userId, year, month));
  }),
  http.get(`${API_BASE_URL}/comments`, ({ request }) => {
    const url = new URL(request.url);
    const diaryId = Number(url.searchParams.get('diaryId'));
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '10');

    return HttpResponse.json(buildLocalRootCommentPageMock(diaryId, page, size));
  }),
  http.get(`${API_BASE_URL}/comments/:commentId/replies`, ({ params, request }) => {
    const url = new URL(request.url);
    const commentId = Number(params.commentId);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '5');

    return HttpResponse.json(buildLocalRepliesPageMock(commentId, page, size));
  }),
  http.post(`${API_BASE_URL}/comments`, async ({ request }) => {
    const body = (await request.json()) as {
      diaryId: number;
      content: string;
      parentId?: number;
    };

    return HttpResponse.json(
      createLocalCommentMock(body, {
        id: 'user-1',
        nickname: 'test',
        avatar: '',
      }),
      { status: 201 },
    );
  }),
  http.patch(`${API_BASE_URL}/comments/:commentId`, async ({ params, request }) => {
    const body = (await request.json()) as { content: string };
    const commentId = Number(params.commentId);
    return HttpResponse.json(updateLocalCommentMock(commentId, body.content));
  }),
  http.delete(`${API_BASE_URL}/comments/:commentId`, ({ params }) => {
    const commentId = Number(params.commentId);
    deleteLocalCommentMock(commentId);
    return HttpResponse.text('', { status: 204 });
  }),
];
