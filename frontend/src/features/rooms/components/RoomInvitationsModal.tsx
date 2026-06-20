import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, Check, Trash2, MailOpen } from 'lucide-react-native';
import { roomInvitationsService } from '../services/roomInvitationsService';
import { useNavigation } from '@react-navigation/native';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';

interface RoomInvitation {
  id: string;
  status: string;
  created_at: string;
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

interface RoomInvitationsModalProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  onInvitationProcessed: () => void;
}

export default function RoomInvitationsModal({ visible, onClose, accessToken, onInvitationProcessed }: RoomInvitationsModalProps) {
  const navigation = useNavigation<any>();
  const currentAccessToken = useAuthStore(state => state.access_token);
  const addOrReplaceRoom = useAppDataStore(state => state.addOrReplaceRoom);
  const invalidateAfterRoomParticipation = useAppDataStore(state => state.invalidateAfterRoomParticipation);

  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadInvitations = async () => {
    const token = currentAccessToken ?? accessToken;
    if (!token || !visible) return;
    try {
      setLoading(true);
      const data = await roomInvitationsService.fetchReceivedRoomInvitations(token);
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error al cargar invitaciones de sala:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [visible, accessToken, currentAccessToken]);

  const handleAccept = async (invitationId: string, roomName: string, roomId: string, roomMode: string) => {
    try {
      setProcessingId(invitationId);
      const result = await roomInvitationsService.acceptRoomInvitation(currentAccessToken ?? accessToken, invitationId);
      
      if (result.success) {
        // Actualizamos el listado global de salas del store de Zustand
        invalidateAfterRoomParticipation();
        onInvitationProcessed();
        setInvitations(prev => prev.filter(item => item.id !== invitationId));
        
        Alert.alert('Éxito', `Te uniste a la sala ${roomName}`);
        onClose();

        // Navegación automática según el modo de juego/sala configurado
        if (roomMode === 'battle_royale') {
          navigation.navigate('BattleRoyale', { roomId: roomId, roomName: roomName });
        } else {
          navigation.navigate('LiveRoom', { roomId: roomId, roomName: roomName });
        }
      }
    } catch (error: any) {
      Alert.alert('No se pudo unir', error.message || 'La sala podría estar llena o inactiva.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      setProcessingId(invitationId);
      await roomInvitationsService.rejectRoomInvitation(currentAccessToken ?? accessToken, invitationId);
      setInvitations(prev => prev.filter(item => item.id !== invitationId));
      onInvitationProcessed();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo rechazar la invitación.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Invitaciones de Sala</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#94a3b8" size={20} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : invitations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MailOpen size={36} color="#64748b" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No tenés invitaciones pendientes.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {invitations.map(invite => (
                <View key={invite.id} style={styles.card}>
                  <View style={styles.infoBox}>
                    <Text style={styles.roomName} numberOfLines={1}>{invite.room.name}</Text>
                    <Text style={styles.senderText}>Invitado por: <Text style={styles.username}>{invite.sender.username}</Text></Text>
                    <Text style={styles.modeText}>Modo: {invite.room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia'}</Text>
                    <Text style={styles.countText}>Capacidad: {invite.room.members_count}/{invite.room.max_members}</Text>
                  </View>

                  <View style={styles.actions}>
                    <Pressable 
                      style={[styles.actionBtn, styles.acceptBtn, processingId !== null && styles.disabledBtn]}
                      onPress={() => handleAccept(invite.id, invite.room.name, invite.room.id, invite.room.mode)}
                      disabled={processingId !== null}
                    >
                      {processingId === invite.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Check size={16} color="#ffffff" />
                      )}
                    </Pressable>

                    <Pressable 
                      style={[styles.actionBtn, styles.rejectBtn, processingId !== null && styles.disabledBtn]}
                      onPress={() => handleReject(invite.id)}
                      disabled={processingId !== null}
                    >
                      {processingId === invite.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Trash2 size={16} color="#ef4444" />
                      )}
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 17, 26, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 360, backgroundColor: '#1e293b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#334155', maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { opacity: 0.4 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: 'bold' },
  list: { width: '100%' },
  card: { backgroundColor: '#0f172a', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2e3245', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: { flex: 1, marginRight: 10 },
  roomName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  senderText: { color: '#94a3b8', fontSize: 13, marginBottom: 4 },
  username: { color: '#22c55e', fontWeight: 'bold' },
  modeText: { color: '#64748b', fontSize: 12 },
  countText: { color: '#64748b', fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 38, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#2a334d', borderWidth: 1, borderColor: '#3f4b66' },
  disabledBtn: { opacity: 0.5 },
});
