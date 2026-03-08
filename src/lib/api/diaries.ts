import { apiClient } from '@/lib/api/client';
import { env } from '@/lib/env';
import type { ApiError } from '@/lib/api/errors';
import type {
  AiPhotoResult,
  DiaryCreatePayload,
  DiaryDetail,
  MonthlyDiary,
} from '@/types/diary';

const LOCAL_MOCK_DAYS = [2, 5, 8, 12, 18, 22, 27];
let localRemainingAiRequests = 3;

const shouldUseLocalDiaryMock =
  process.env.NODE_ENV !== 'test' &&
  env.appEnv === 'local' &&
  (env.apiBaseUrl.includes('localhost') || env.apiBaseUrl.includes('api.example.com'));

const formatDateKey = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

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

export function buildLocalMonthlyDiaryMock(
  userId: string,
  year: number,
  month: number,
): MonthlyDiary[] {
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);

  return LOCAL_MOCK_DAYS.filter((day) => day <= daysInMonth)
    .filter((day) => {
      const target = new Date(year, month - 1, day, 12, 0, 0, 0);
      const now = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0,
        0,
      );

      return target.getTime() <= now.getTime();
    })
    .map((day, index) => ({
      diaryId: Number(
        `${String(year).slice(-2)}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${index}`,
      ),
      date: formatDateKey(year, month, day),
      coverPhotoUrl: `https://picsum.photos/seed/${encodeURIComponent(
        `${userId}-${year}-${month}-${day}`,
      )}/480/480`,
    }))
    .filter((item) => Number.isFinite(item.diaryId) && Boolean(userId));
}

export function buildLocalDiaryDetailMock(diaryId: number): DiaryDetail {
  const day = Number(String(diaryId).slice(-2)) || 8;
  const normalizedDay = Math.min(Math.max(day, 1), 28);
  const isOwnDiary = diaryId % 4 === 0;
  const userId = isOwnDiary ? 'user-1' : `user-${(diaryId % 7) + 2}`;
  const nickname = isOwnDiary ? 'test' : ['소담', '도리', '모아', '하루'][diaryId % 4];
  const imageCount = (diaryId % 3) + 1;

  return {
    diaryId,
    content:
      '오늘의 장면을 기록한 상세 일기입니다. 스토리형과 딥링크형 화면에서 같은 데이터를 사용합니다. 필요할 때는 더 보기를 눌러 전체 내용을 확인할 수 있습니다.',
    date: `2026-03-${String(normalizedDay).padStart(2, '0')}`,
    status: 'PUBLIC',
    createdAt: `2026-03-${String(normalizedDay).padStart(2, '0')}T08:30:00.000Z`,
    updatedAt: `2026-03-${String(normalizedDay).padStart(2, '0')}T08:30:00.000Z`,
    isLiked: false,
    likeCount: diaryId % 9,
    commentCount: (diaryId % 5) + 1,
    imgUrls: Array.from({ length: imageCount }, (_, index) => {
      return `https://picsum.photos/seed/${encodeURIComponent(
        `pikume-diary-${diaryId}-${index + 1}`,
      )}/1200/1200`;
    }),
    nickname,
    avatar: '',
    userId,
    comments: [
      {
        commentId: diaryId * 10 + 1,
        content: '상세 화면에서 댓글 영역은 별도 바텀시트로 연결됩니다.',
        createdAt: `2026-03-${String(normalizedDay).padStart(2, '0')}T10:00:00.000Z`,
        updatedAt: `2026-03-${String(normalizedDay).padStart(2, '0')}T10:00:00.000Z`,
        member: {
          nickname: '피쿠',
          avatar: '',
        },
      },
    ],
  };
}

export async function getMonthlyDiaries(
  userId: string,
  year: number,
  month: number,
): Promise<MonthlyDiary[]> {
  if (shouldUseLocalDiaryMock) {
    return buildLocalMonthlyDiaryMock(userId, year, month);
  }

  try {
    const response = await apiClient.get<MonthlyDiary[]>(
      `/diary/user/${userId}/monthly?year=${year}&month=${month}`,
    );

    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function getRemainingAiRequests(): Promise<number> {
  if (shouldUseLocalDiaryMock) {
    return localRemainingAiRequests;
  }

  try {
    const response = await apiClient.get<{ remainingRequests: number }>(
      '/diary/ai/generate',
    );
    return response.data.remainingRequests;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return localRemainingAiRequests;
    }

    throw error;
  }
}

export async function generateAiPhoto(content: string): Promise<AiPhotoResult> {
  if (shouldUseLocalDiaryMock) {
    if (localRemainingAiRequests <= 0) {
      throw new Error('AI 사진 생성 가능 횟수를 모두 사용했습니다.');
    }

    return {
      id: Date.now(),
      url: `https://picsum.photos/seed/${encodeURIComponent(content)}/960/960`,
    };
  }

  try {
    const response = await apiClient.post<AiPhotoResult>('/diary/ai/generate', {
      content,
    });
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      if (localRemainingAiRequests <= 0) {
        throw new Error('AI 사진 생성 가능 횟수를 모두 사용했습니다.');
      }

      return {
        id: Date.now(),
        url: `https://picsum.photos/seed/${encodeURIComponent(content)}/960/960`,
      };
    }

    throw error;
  }
}

export async function createDiary(payload: DiaryCreatePayload) {
  if (shouldUseLocalDiaryMock) {
    return {
      diaryId: Date.now(),
      message: '일기가 저장되었습니다.',
      diary: payload.diary,
    };
  }

  try {
    const formData = new FormData();
    formData.append('diary', JSON.stringify(payload.diary));

    payload.photos.forEach((photo) => {
      formData.append('photos', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as never);
    });

    const response = await apiClient.post('/diary', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return {
        diaryId: Date.now(),
        message: '일기가 저장되었습니다.',
        diary: payload.diary,
      };
    }

    throw error;
  }
}

export async function getDiaryDetail(diaryId: number): Promise<DiaryDetail> {
  if (shouldUseLocalDiaryMock) {
    return buildLocalDiaryDetailMock(diaryId);
  }

  try {
    const response = await apiClient.get<DiaryDetail>(`/diary/${diaryId}`);
    return response.data;
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return buildLocalDiaryDetailMock(diaryId);
    }

    throw error;
  }
}

export async function deleteDiary(diaryId: number) {
  if (shouldUseLocalDiaryMock) {
    return;
  }

  try {
    await apiClient.delete(`/diary/${diaryId}`);
  } catch (error) {
    if (isRecoverableLocalNetworkError(error)) {
      return;
    }

    throw error;
  }
}
