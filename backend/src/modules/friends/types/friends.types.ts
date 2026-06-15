export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendProfile {
  id: string;
  username: string;
  email?: string;
  avatar_url: string | null;
  bio?: string | null;
  streak_days: number;
  total_study_minutes: number;
}

export class FriendValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'FriendValidationError'; }
}
export class FriendNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'FriendNotFoundError'; }
}
export class FriendConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'FriendConflictError'; }
}