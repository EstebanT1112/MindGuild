import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, UserPlus, Users } from 'lucide-react-native';
import { roomInvitationsService } from '../services/roomInvitationsService';
import Constants from 'expo-constants';

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface InviteFriendsModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
  accessToken: string;
}

const getApiUrl = (): string => {
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGoLaunchContext?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

export default function InviteFriendsModal({ visible, onClose, roomId, accessToken }: InviteFriendsModalProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const loadFriendsList = async () => {
    if (!accessToken || !visible) return;

    try {
      setLoading(true);
      // Consumimos el endpoint real de tus amigos aceptados
      const response = await fetch(`${API_URL}/friends`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const json = await response.json();

      if (json.success) {
        setFriends(json.data || []);
      }
    } catch (error) {
      console.error('Error al cargar amigos en modal:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsList();
  }, [visible, accessToken]);

  const handleSendInvite = async (friendId: string, username: string) => {
    try {
      setInvitingId(friendId);
      await roomInvitationsService.sendRoomInvitation(accessToken, roomId, friendId);
      Alert.alert('Invitación enviada', `Se envió la invitación a ${username} correctamente.`);
    } catch (error: any) {
      Alert.alert('Atención', error.message || 'No se pudo enviar la invitación a la sala.');
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Invitar Amigos</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#94a3b8" size={20} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>Seleccioná un compañero de tu lista para sumarlo a la sesión.</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#22c55e" />
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={36} color="#64748b" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No tenés amigos para invitar.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {friends.map(friend => (
                <View key={friend.id} style={styles.friendRow}>
                  <View style={styles.profileBox}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {friend.username ? friend.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <Text style={styles.username} numberOfLines={1}>
                      {friend.username}
                    </Text>
                  </View>

                  <Pressable 
                    style={[styles.inviteBtn, invitingId === friend.id && styles.inviteBtnDisabled]}
                    onPress={() => handleSendInvite(friend.id, friend.username)}
                    disabled={invitingId !== null}
                  >
                    {invitingId === friend.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <UserPlus size={14} color="#ffffff" />
                        <Text style={styles.inviteBtnText}>Invitar</Text>
                      </>
                    )}
                  </Pressable>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#ffffff' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 18 },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { opacity: 0.4 },
  emptyText: { color: '#64748b', fontSize: 14, fontWeight: 'bold' },
  list: { width: '100%' },
  friendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2e3245' },
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#22c55e' },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  username: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, minWidth: 85, justifyContent: 'center' },
  inviteBtnDisabled: { backgroundColor: '#166534', opacity: 0.7 },
  inviteBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 }
});