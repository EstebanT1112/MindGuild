import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { X, Check, Trash2, MailOpen } from 'lucide-react-native';
import { roomInvitationsService } from '../services/roomInvitationsService';
import { useNavigation } from '@react-navigation/native';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';

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
  const colors = useThemeStore(state => state.colors);
  const currentAccessToken = useAuthStore(state => state.access_token);
  const invalidateAfterRoomParticipation = useAppDataStore(state => state.invalidateAfterRoomParticipation);

  const [invitations, setInvitations] = useState<RoomInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ✅ Estado para AppAlert
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ✅ Función para mostrar alertas personalizadas
  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean,
    cancelText?: string,
    onCancel?: () => void
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText: confirmText || 'Aceptar',
      showCancel: showCancel || false,
      cancelText: cancelText || 'Cancelar',
      onCancel,
    });
  };

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
        invalidateAfterRoomParticipation();
        onInvitationProcessed();
        setInvitations(prev => prev.filter(item => item.id !== invitationId));
        
        showAlert('Éxito', `Te uniste a la sala ${roomName}`, 'success');
        onClose();

        if (roomMode === 'battle_royale') {
          navigation.navigate('BattleRoyale', { roomId: roomId, roomName: roomName });
        } else {
          navigation.navigate('LiveRoom', { roomId: roomId, roomName: roomName });
        }
      }
    } catch (error: any) {
      showAlert('No se pudo unir', error.message || 'La sala podría estar llena o inactiva.', 'error');
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
      showAlert('Error', 'No se pudo rechazar la invitación.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.content, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Invitaciones de Sala</Text>
              <Pressable style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}>
                <X color={colors.textMuted} size={20} />
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.accent} />
              </View>
            ) : invitations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MailOpen size={36} color={colors.textSoft} style={styles.emptyIcon} />
                <Text style={[styles.emptyText, { color: colors.textSoft }]}>No tenés invitaciones pendientes.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
                {invitations.map(invite => (
                  <View key={invite.id} style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.infoBox}>
                      <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>{invite.room.name}</Text>
                      <Text style={[styles.senderText, { color: colors.textMuted }]}>Invitado por: <Text style={[styles.username, { color: colors.accent }]}>{invite.sender.username}</Text></Text>
                      <Text style={[styles.modeText, { color: colors.textSoft }]}>Modo: {invite.room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia'}</Text>
                      <Text style={[styles.countText, { color: colors.textSoft }]}>Capacidad: {invite.room.members_count}/{invite.room.max_members}</Text>
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
                        style={[styles.actionBtn, styles.rejectBtn, { backgroundColor: colors.surface, borderColor: colors.border }, processingId !== null && styles.disabledBtn]}
                        onPress={() => handleReject(invite.id)}
                        disabled={processingId !== null}
                      >
                        {processingId === invite.id ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Trash2 size={16} color={colors.danger} />
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

      {/* ✅ AppAlert personalizado */}
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
        onConfirm={() => {
          if (alert.onConfirm) {
            alert.onConfirm();
          } else {
            setAlert(prev => ({ ...prev, visible: false }));
          }
        }}
        onCancel={() => {
          if (alert.onCancel) alert.onCancel();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        confirmText={alert.confirmText || 'Aceptar'}
        cancelText={alert.cancelText || 'Cancelar'}
        showCancel={alert.showCancel || false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, borderWidth: 1, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { opacity: 0.4 },
  emptyText: { fontSize: 14, fontWeight: 'bold' },
  list: { width: '100%' },
  card: { padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoBox: { flex: 1, marginRight: 10 },
  roomName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  senderText: { fontSize: 13, marginBottom: 4 },
  username: { fontWeight: 'bold' },
  modeText: { fontSize: 12 },
  countText: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 38, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { borderWidth: 1 },
  disabledBtn: { opacity: 0.5 },
});