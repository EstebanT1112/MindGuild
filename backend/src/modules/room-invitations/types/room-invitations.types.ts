export type RoomInvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface CreateRoomInvitationDTO {
  room_id: string;
  receiver_id: string;
}

export interface RoomInvitationData {
  id: string;
  status: RoomInvitationStatus;
  created_at: Date;
  room: {
    id: string;
    name: string;
    mode: string;
    members_count: number;
    max_members: number;
  };
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ❌ Excepciones personalizadas para el manejo limpio de errores en el Controller
export class RoomInvitationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomInvitationValidationError';
  }
}

export class RoomInvitationNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomInvitationNotFoundError';
  }
}

export class RoomInvitationForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomInvitationForbiddenError';
  }
}

export class RoomInvitationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoomInvitationConflictError';
  }
}