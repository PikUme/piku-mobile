import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { CommentItem } from '@/features/diary/components/CommentItem';
import type { Comment } from '@/types/comment';

const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 42,
  diaryId: 10,
  userId: 'user-42',
  nickname: '작성자',
  avatar: null,
  content: '댓글 내용',
  parentId: null,
  createdAt: '2026-03-01T00:00:00.000Z',
  replyCount: 0,
  ...overrides,
});

const renderComment = (comment: Comment, isAnonymousDiary = false) =>
  render(
    <CommentItem
      comment={comment}
      isAnonymousDiary={isAnonymousDiary}
      onOpenProfile={jest.fn()}
      replies={[]}
    />,
  );

describe('CommentItem anonymous identity', () => {
  it('masks an optimistic identified comment in an anonymous diary while preserving its model identity', () => {
    const comment = makeComment({ nickname: '실제 작성자', avatar: 'https://example.com/a.png' });
    const onOpenProfile = jest.fn();
    const screen = render(
      <CommentItem
        comment={comment}
        isAnonymousDiary
        onOpenProfile={onOpenProfile}
        replies={[]}
      />,
    );

    expect(screen.getByRole('image', { name: '익명 프로필 아이콘' })).toHaveStyle({
      width: 32,
      height: 32,
      backgroundColor: '#e5e7eb',
    });
    expect(screen.getByText('익명')).toBeTruthy();
    expect(screen.queryByText('실제 작성자')).toBeNull();
    fireEvent.press(screen.getByTestId('comment-profile-button-42'));
    fireEvent.press(screen.getByTestId('comment-name-button-42'));
    expect(onOpenProfile).not.toHaveBeenCalled();
    expect(comment.userId).toBe('user-42');
  });

  it('keeps a normal commenter named 익명 on the regular avatar and profile path', () => {
    const onOpenProfile = jest.fn();
    const screen = render(
      <CommentItem
        comment={makeComment({ nickname: '익명' })}
        onOpenProfile={onOpenProfile}
        replies={[]}
      />,
    );

    expect(screen.getByText('익')).toBeTruthy();
    expect(screen.queryByRole('image', { name: '익명 프로필 아이콘' })).toBeNull();
    fireEvent.press(screen.getByTestId('comment-name-button-42'));
    expect(onOpenProfile).toHaveBeenCalledWith('user-42');
  });

  it('keeps deleted comments distinct from anonymous authors', () => {
    const screen = renderComment(
      makeComment({ userId: null, nickname: null, content: '삭제된 댓글입니다.' }),
    );

    expect(screen.getByText('?')).toBeTruthy();
    expect(screen.getByText('삭제된 댓글입니다.')).toBeTruthy();
    expect(screen.queryByRole('image', { name: '익명 프로필 아이콘' })).toBeNull();
  });
});
