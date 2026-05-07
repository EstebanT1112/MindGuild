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
  mode: RoomMode;
  invite_code: string;
  owner_id: string;
  max_members: number;
  is_active: boolean;
  teams_enabled: boolean;
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
