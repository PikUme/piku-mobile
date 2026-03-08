export interface Friend {
  userId: string;
  nickname: string;
  avatar: string;
}

export enum FriendshipStatus {
  NONE = 'NONE',
  FRIEND = 'FRIENDS',
  SENT = 'REQUESTED',
  RECEIVED = 'RECEIVED',
}

export interface PaginatedFriendsResponse {
  friends: Friend[];
  hasNext: boolean;
  totalElements: number;
}

export interface FriendRequestDto {
  toUserId: string;
}

export interface FriendRequestResponseDto {
  isAccepted: boolean;
  message: string;
}
