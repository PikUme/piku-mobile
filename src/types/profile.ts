import { FriendshipStatus } from '@/types/friend';

export interface DiaryMonthCountDTO {
  year: number;
  month: number;
  count: number;
  daysInMonth: number;
}

export interface UserProfileResponseDTO {
  id: string;
  userId: string;
  nickname: string;
  avatar: string;
  friendCount: number;
  diaryCount: number;
  friendStatus: FriendshipStatus;
  isOwner: boolean;
  monthlyDiaryCount: DiaryMonthCountDTO[];
}
