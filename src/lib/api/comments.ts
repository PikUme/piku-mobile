import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/store/authStore';
import type {
  Comment,
  CommentCreatePayload,
  CommentPage,
} from '@/types/comment';

const shouldUseLocalCommentMock =
  process.env.NODE_ENV !== 'test' &&
  env.appEnv === 'local' &&
  (env.apiBaseUrl.includes('localhost') || env.apiBaseUrl.includes('api.example.com'));

let localCommentIdSeed = 20_000;
let localCommentStore = new Map<number, Comment[]>();

const isRecoverableLocalNetworkError = (error: unknown) => {
  if (env.appEnv !== 'local') {
    return false;
  }

  const apiError = error as ApiError;
  if (typeof apiError?.status === 'number') {
    return false;
  }

  return (
    apiError?.code === 'ERR_NETWORK' ||
    apiError?.code === 'ECONNABORTED' ||
    apiError?.message === 'Network Error' ||
    apiError?.message?.toLowerCase().includes('timeout') === true
  );
};

const buildCommentTimestamp = (offsetMinutes: number) => {
  const date = new Date(Date.now() - offsetMinutes * 60_000);
  return date.toISOString();
};

const refreshReplyCounts = (diaryId: number) => {
  const comments = localCommentStore.get(diaryId) ?? [];
  const replyCounts = new Map<number, number>();

  comments.forEach((comment) => {
    if (comment.parentId !== null) {
      replyCounts.set(comment.parentId, (replyCounts.get(comment.parentId) ?? 0) + 1);
    }
  });

  localCommentStore.set(
    diaryId,
    comments.map((comment) => ({
      ...comment,
      replyCount: comment.parentId === null ? replyCounts.get(comment.id) ?? 0 : 0,
    })),
  );
};

const createInitialCommentsForDiary = (diaryId: number): Comment[] => {
  const baseUserIndex = (diaryId % 7) + 1;
  const rootOneId = diaryId * 100 + 1;
  const rootTwoId = diaryId * 100 + 2;
  const replyId = diaryId * 100 + 11;

  const comments: Comment[] = [
    {
      id: rootOneId,
      diaryId,
      userId: `user-${baseUserIndex}`,
      nickname: '피쿠',
      avatar: '',
      content: '사진 분위기가 좋아요. 오늘 하루가 잘 전해집니다.',
      parentId: null,
      createdAt: buildCommentTimestamp(90),
      updatedAt: buildCommentTimestamp(90),
      replyCount: 1,
    },
    {
      id: replyId,
      diaryId,
      userId: `user-${baseUserIndex + 1}`,
      nickname: '모아',
      avatar: '',
      content: '저도 같은 생각이에요.',
      parentId: rootOneId,
      createdAt: buildCommentTimestamp(70),
      updatedAt: buildCommentTimestamp(70),
      replyCount: 0,
    },
    {
      id: rootTwoId,
      diaryId,
      userId: 'user-1',
      nickname: 'test',
      avatar: '',
      content: '내일도 기록 기대할게요.',
      parentId: null,
      createdAt: buildCommentTimestamp(35),
      updatedAt: buildCommentTimestamp(35),
      replyCount: 0,
    },
  ];

  return comments;
};

const ensureDiaryComments = (diaryId: number) => {
  if (!localCommentStore.has(diaryId)) {
    localCommentStore.set(diaryId, createInitialCommentsForDiary(diaryId));
  }

  refreshReplyCounts(diaryId);
  return localCommentStore.get(diaryId) ?? [];
};

const paginateComments = (comments: Comment[], page: number, size: number): CommentPage => {
  const start = page * size;
  const end = start + size;
  const sliced = comments.slice(start, end);

  return {
    content: sliced,
    last: end >= comments.length,
    totalElements: comments.length,
  };
};

const findDiaryIdByCommentId = (commentId: number) => {
  for (const [diaryId, comments] of localCommentStore.entries()) {
    if (comments.some((comment) => comment.id === commentId)) {
      return diaryId;
    }
  }

  return null;
};

export function resetLocalCommentMockState() {
  localCommentIdSeed = 20_000;
  localCommentStore = new Map();
}

export function buildLocalRootCommentPageMock(
  diaryId: number,
  page: number,
  size: number,
): CommentPage {
  const allComments = ensureDiaryComments(diaryId);
  const roots = allComments.filter((comment) => comment.parentId === null);
  const pageData = paginateComments(roots, page, size);

  return {
    ...pageData,
    totalElements: allComments.length,
  };
}

export function buildLocalRepliesPageMock(
  commentId: number,
  page: number,
  size: number,
): CommentPage {
  const diaryId = findDiaryIdByCommentId(commentId);
  if (diaryId === null) {
    return {
      content: [],
      last: true,
      totalElements: 0,
    };
  }

  const replies = ensureDiaryComments(diaryId).filter((comment) => comment.parentId === commentId);
  return paginateComments(replies, page, size);
}

export function createLocalCommentMock(
  payload: CommentCreatePayload,
  author?: { id: string; nickname: string; avatar?: string },
): Comment {
  const diaryId = payload.diaryId;
  const nextComment: Comment = {
    id: localCommentIdSeed++,
    diaryId,
    userId: author?.id ?? 'user-1',
    nickname: author?.nickname ?? 'test',
    avatar: author?.avatar ?? null,
    content: payload.content.trim(),
    parentId: payload.parentId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replyCount: 0,
  };

  const comments = ensureDiaryComments(diaryId);
  localCommentStore.set(diaryId, [...comments, nextComment]);
  refreshReplyCounts(diaryId);
  return nextComment;
}

export function updateLocalCommentMock(commentId: number, content: string): Comment {
  const diaryId = findDiaryIdByCommentId(commentId);
  if (diaryId === null) {
    throw new Error('수정할 댓글을 찾을 수 없습니다.');
  }

  const comments = ensureDiaryComments(diaryId);
  const target = comments.find((comment) => comment.id === commentId);
  if (!target) {
    throw new Error('수정할 댓글을 찾을 수 없습니다.');
  }

  const updatedComment = {
    ...target,
    content: content.trim(),
    updatedAt: new Date().toISOString(),
  };

  localCommentStore.set(
    diaryId,
    comments.map((comment) => (comment.id === commentId ? updatedComment : comment)),
  );
  refreshReplyCounts(diaryId);
  return updatedComment;
}

export function deleteLocalCommentMock(commentId: number) {
  const diaryId = findDiaryIdByCommentId(commentId);
  if (diaryId === null) {
    return;
  }

  const comments = ensureDiaryComments(diaryId);
  const target = comments.find((comment) => comment.id === commentId);
  if (!target) {
    return;
  }

  localCommentStore.set(
    diaryId,
    comments.filter((comment) => {
      if (comment.id === commentId) {
        return false;
      }

      if (target.parentId === null && comment.parentId === commentId) {
        return false;
      }

      return true;
    }),
  );
  refreshReplyCounts(diaryId);
}

export async function getRootComments(
  diaryId: number,
  page: number,
  size: number,
): Promise<CommentPage> {
  if (shouldUseLocalCommentMock) {
    return buildLocalRootCommentPageMock(diaryId, page, size);
  }

  try {
    const response = await apiClient.get<CommentPage>('/comments', {
      params: {
        diaryId,
        page,
        size,
        sort: 'createdAt,asc',
      },
    });

    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalRootCommentPageMock(diaryId, page, size);
    }

    throw error;
  }
}

export async function getReplies(
  commentId: number,
  page: number,
  size: number,
): Promise<CommentPage> {
  if (shouldUseLocalCommentMock) {
    return buildLocalRepliesPageMock(commentId, page, size);
  }

  try {
    const response = await apiClient.get<CommentPage>(`/comments/${commentId}/replies`, {
      params: {
        page,
        size,
        sort: 'createdAt,asc',
      },
    });

    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalRepliesPageMock(commentId, page, size);
    }

    throw error;
  }
}

export async function createComment(payload: CommentCreatePayload): Promise<Comment> {
  const user = useAuthStore.getState().user;

  if (shouldUseLocalCommentMock) {
    return createLocalCommentMock(payload, user ?? undefined);
  }

  try {
    const response = await apiClient.post<Comment>('/comments', payload);
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return createLocalCommentMock(payload, user ?? undefined);
    }

    throw error;
  }
}

export async function updateComment(commentId: number, content: string): Promise<Comment> {
  if (shouldUseLocalCommentMock) {
    return updateLocalCommentMock(commentId, content);
  }

  try {
    const response = await apiClient.patch<Comment>(`/comments/${commentId}`, {
      content,
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return updateLocalCommentMock(commentId, content);
    }

    throw error;
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  if (shouldUseLocalCommentMock) {
    deleteLocalCommentMock(commentId);
    return;
  }

  try {
    await apiClient.delete(`/comments/${commentId}`);
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      deleteLocalCommentMock(commentId);
      return;
    }

    throw error;
  }
}
