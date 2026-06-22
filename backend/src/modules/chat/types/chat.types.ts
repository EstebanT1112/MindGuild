export interface RoomMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface ListRoomMessagesInput {
  roomId: string;
  userId: string;
  limit?: number;
  before?: string;
  after?: string;
}

export interface SendRoomMessageInput {
  roomId: string;
  userId: string;
  content: string;
}

export class ChatValidationError extends Error {
  statusCode = 400;
}

export class ChatAccessError extends Error {
  statusCode = 403;
}
