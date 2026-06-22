import { ChatRepository } from '../repository/chat.repository.js';
import {
  ChatAccessError,
  ChatValidationError,
  type ListRoomMessagesInput,
  type RoomMessage,
  type SendRoomMessageInput,
} from '../types/chat.types.js';

const MAX_MESSAGE_LENGTH = 50;
const DEFAULT_MESSAGE_LIMIT = 50;
const DAILY_MESSAGE_LIMIT_PER_ROOM = 30;

export class ChatService {
  static async listRoomMessages(input: ListRoomMessagesInput): Promise<RoomMessage[]> {
    validateUuidLike(input.roomId, 'Sala invalida.');
    validateDateFilter(input.before, 'before');
    validateDateFilter(input.after, 'after');

    const limit = normalizeLimit(input.limit);
    await ensureUserCanAccessRoom(input.roomId, input.userId);

    return ChatRepository.listRoomMessages({
      roomId: input.roomId,
      limit,
      before: input.before,
      after: input.after,
    });
  }

  static async sendRoomMessage(input: SendRoomMessageInput): Promise<RoomMessage> {
    validateUuidLike(input.roomId, 'Sala invalida.');

    const content = input.content.trim();
    if (!content) {
      throw new ChatValidationError('El mensaje no puede estar vacio.');
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new ChatValidationError(`El mensaje no puede superar ${MAX_MESSAGE_LENGTH} caracteres.`);
    }

    await ensureUserCanAccessRoom(input.roomId, input.userId);
    await ensureDailyMessageLimit(input.roomId, input.userId);

    return ChatRepository.createRoomMessage({
      roomId: input.roomId,
      senderId: input.userId,
      content,
    });
  }

  static async deleteExpiredMessages(): Promise<number> {
    return ChatRepository.deleteMessagesOlderThan(7);
  }
}

async function ensureDailyMessageLimit(roomId: string, userId: string): Promise<void> {
  const sentToday = await ChatRepository.countTodayMessagesByUserInRoom({
    roomId,
    senderId: userId,
  });

  if (sentToday >= DAILY_MESSAGE_LIMIT_PER_ROOM) {
    throw new ChatValidationError('Alcanzaste el limite diario de 30 mensajes para esta sala.');
  }
}

async function ensureUserCanAccessRoom(roomId: string, userId: string): Promise<void> {
  const hasAccess = await ChatRepository.isActiveRoomMember(roomId, userId);
  if (!hasAccess) {
    throw new ChatAccessError('No tenes acceso al chat de esta sala.');
  }
}

function normalizeLimit(limit?: number): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_MESSAGE_LIMIT;
  }

  return Math.max(1, Math.min(DEFAULT_MESSAGE_LIMIT, Math.floor(limit)));
}

function validateDateFilter(value: string | undefined, name: string): void {
  if (!value) return;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new ChatValidationError(`El parametro ${name} debe ser una fecha valida.`);
  }
}

function validateUuidLike(value: string, message: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new ChatValidationError(message);
  }
}
