import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { X, UserPlus, Users } from 'lucide-react-native';
import { roomInvitationsService } from '../services/roomInvitationsService';
import Constants from 'expo-constants';
import { authenticatedFetch } from '../../../services/authenticatedFetch';
import { useThemeStore } from '../../../store/themeStore';

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
  const colors = useThemeStore(state => state.colors);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const loadFriendsList = async () => {
    if (!accessToken || !visible) return;
    try {
      setLoading(true);
      const response = await authenticatedFetch(`${API_URL}/friends`, {}, accessToken);
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
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.content, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Invitar Amigos</Text>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}>
              <X color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSoft }]}>Seleccioná un compañero de tu lista para sumarlo a la sesión.</Text>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={36} color={colors.textSoft} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, { color: colors.textSoft }]}>No tenés amigos para invitar.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {friends.map(friend => (
                <View key={friend.id} style={[styles.friendRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.profileBox}>
                    <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated, borderColor: colors.accent }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>
                        {friend.username ? friend.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                      {friend.username}
                    </Text>
                  </View>

                  <Pressable 
                    style={[styles.inviteBtn, { backgroundColor: colors.accent }, invitingId === friend.id && { opacity: 0.7 }]}
                    onPress={() => handleSendInvite(friend.id, friend.username)}
                    disabled={invitingId !== null}
                  >
                    {invitingId === friend.id ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <>
                        <UserPlus size={14} color={colors.background} />
                        <Text style={[styles.inviteBtnText, { color: colors.background }]}>Invitar</Text>
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { width: '100%', maxWidth: 360, padding: 24, borderRadius: 24, borderWidth: 1, maxHeight: '70%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  subtitle: { fontSize: 13, marginBottom: 20, lineHeight: 18 },
  center: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon: { opacity: 0.4 },
  emptyText: { fontSize: 14, fontWeight: 'bold' },
  list: { width: '100%' },
  friendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  profileBox: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  avatarText: { fontWeight: 'bold', fontSize: 13 },
  username: { fontSize: 15, fontWeight: 'bold' },
  inviteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, minWidth: 85, justifyContent: 'center' },
  inviteBtnText: { fontWeight: 'bold', fontSize: 12 }
});