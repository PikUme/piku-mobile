export const authFixture = {
  user: {
    id: 'user-1',
    email: 'tester@example.com',
    nickname: 'tester',
    avatar: '',
  },
  token: 'test-access-token',
};

export const notificationFixture = {
  id: 1,
  message: '새 댓글이 달렸습니다.',
  nickname: 'friend-a',
  avatarUrl: '',
  type: 'COMMENT',
  relatedDiaryId: 101,
  thumbnailUrl: null,
  isRead: false,
  diaryDate: '2026-03-07',
  diaryUserId: 'friend-a',
};
