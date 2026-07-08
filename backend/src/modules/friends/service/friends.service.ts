import { FriendsRepository } from '../repository/friends.repository.js';
import { FriendValidationError, FriendNotFoundError, FriendConflictError } from '../types/friends.types.js';

export const FriendsService = {
  async sendRequest(senderId: string, targetUsername: string) {
    if (!targetUsername || targetUsername.trim() === '') {
      throw new FriendValidationError('El username es requerido.');
    }

    const targetProfile = await FriendsRepository.findProfileByUsername(targetUsername.trim());
    if (!targetProfile) {
      throw new FriendNotFoundError('Usuario no encontrado.');
    }

    if (senderId === targetProfile.id) {
      throw new FriendValidationError('No podés enviarte una solicitud de amistad a vos mismo.');
    }

    const alreadyFriends = await FriendsRepository.areFriends(senderId, targetProfile.id);
    if (alreadyFriends) {
      throw new FriendConflictError('Ya son amigos.');
    }

    const existingRequest = await FriendsRepository.findPendingRequestBetween(senderId, targetProfile.id);
    if (existingRequest) {
      if (existingRequest.sender_id === senderId) {
        throw new FriendConflictError('Ya enviaste una solicitud pendiente a este usuario.');
      } else {
        throw new FriendConflictError('Ya existe una solicitud pendiente de este usuario hacia vos.');
      }
    }

    return await FriendsRepository.createFriendRequest(senderId, targetProfile.id);
  },

  async acceptRequest(userId: string, requestId: string) {
    const request = await FriendsRepository.findRequestById(requestId);
    if (!request) throw new FriendNotFoundError('La solicitud no existe.');
    if (request.status !== 'pending') throw new FriendConflictError('La solicitud ya fue respondida.');
    if (request.receiver_id !== userId) throw new FriendValidationError('No tenés permiso para aceptar esta solicitud.');

    await FriendsRepository.acceptRequestTransaction(requestId, request.sender_id, request.receiver_id);
    return { success: true };
  },

  async rejectRequest(userId: string, requestId: string) {
    const request = await FriendsRepository.findRequestById(requestId);
    if (!request) throw new FriendNotFoundError('La solicitud no existe.');
    if (request.status !== 'pending') throw new FriendConflictError('La solicitud ya fue respondida.');
    if (request.receiver_id !== userId) throw new FriendValidationError('No tenés permiso para rechazar esta solicitud.');

    await FriendsRepository.rejectRequest(requestId);
    return { success: true };
  },

  async getFriendsList(userId: string) {
    return await FriendsRepository.getFriends(userId);
  },

  async getIncomingRequests(userId: string) {
    return await FriendsRepository.getReceivedRequests(userId);
  },

  /**
   * ✅ Elimina un amigo (elimina la relación bidireccional)
   */
  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    // Verificar que son amigos
    const areFriends = await FriendsRepository.areFriends(userId, friendId);

    if (!areFriends) {
      return { success: false, error: 'No existe una relación de amistad entre estos usuarios' };
    }

    // Eliminar ambas direcciones de la tabla friendships
    await FriendsRepository.removeFriend(userId, friendId);

    return { success: true };
  },
};