export interface LeaveRoomDTO {
  user_id: string;
  room_id: string;
}

export type RoomMode = 'survival' | 'battle_royale';

export interface CreateRoomDTO {
  name: string;
  mode: RoomMode;
  teams_enabled: boolean;
}

export interface CreatedRoom {
  id: string;
  name: string;
  description?: string | null;
  mode: RoomMode;
  invite_code: string;
  owner_id: string;
  max_members: number;
  is_active: boolean;
  teams_enabled: boolean;
}

export interface UserRoom extends CreatedRoom {
  members_count: number;
  role: string;
}

export interface RoomMember {
  id: string;
  username: string;
  avatar_url: string | null;
  role: string;
}

export interface RoomDetails extends CreatedRoom {
  members: RoomMember[];
}

export interface UpdateRoomDTO {
  name?: string;
  description?: string | null;
}

export interface RoomAdminDetails extends RoomDetails {}

export interface JoinableRoom {
  id: string;
  name: string;
  mode: RoomMode;
  invite_code: string;
  max_members: number;
  is_active: boolean;
  teams_enabled: boolean;
}

export type MembershipJoinStatus = 'new' | 'reactivate';

export interface JoinedRoom extends JoinableRoom {
  membership_status: MembershipJoinStatus;
}

export class RoomValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomValidationError';
  }
}

export class RoomNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomNotFoundError';
  }
}

export class RoomConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomConflictError';
  }
}
