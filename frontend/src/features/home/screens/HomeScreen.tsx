import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronRight, Inbox, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { SessionExpiredError } from '../../../services/authenticatedFetch';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { type UserRoom } from '../../rooms/services/roomsService';
import MissionCard from '../components/MissionCard';
import MissionsModal from '../components/MissionsModal';
import StreakCard from '../components/StreakCard';
import { claimMissionReward } from '../services/missionsService';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const profile = useAppDataStore(state => state.profile.data);
  const profileLoading = useAppDataStore(state => state.profile.isLoading);
  const rooms = useAppDataStore(state => state.rooms.data ?? []);
  const roomsLoading = useAppDataStore(state => state.rooms.isLoading);
  const activeMissions = useAppDataStore(state => state.missions.data ?? []);
  const missionsLoading = useAppDataStore(state => state.missions.isLoading);
  const loadProfile = useAppDataStore(state => state.loadProfile);
  const loadRooms = useAppDataStore(state => state.loadRooms);
  const loadMissions = useAppDataStore(state => state.loadMissions);
  const setProfile = useAppDataStore(state => state.setProfile);

  const [missionsVisible, setMissionsVisible] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!accessToken) return;
    loadProfile(accessToken).catch(err => logLoadError('Error cargando perfil del usuario:', err));
    loadRooms(accessToken, { force: true }).catch(err => logLoadError('Error cargando salas del usuario:', err));
    loadMissions(accessToken).catch(err => logLoadError('Error cargando misiones:', err));
  }, [accessToken, loadProfile, loadRooms, loadMissions]));

  const favoriteRooms = rooms.filter(room => room.is_favorite).slice(0, 3);

  const handleRefresh = async () => {
    if (!accessToken) return;

    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(accessToken, { force: true }),
        loadRooms(accessToken, { force: true }),
        loadMissions(accessToken, { force: true }),
      ]);
    } catch (error) {
      logLoadError('Error refrescando Home:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoomPress = (room: UserRoom) => {
    navigation.navigate('Salas', {
      screen: room.mode === 'battle_royale' ? 'BattleRoyale' : 'LiveRoom',
      params: { roomId: room.id, roomName: room.name },
    });
  };

  const handleClaimMission = async (missionId: string) => {
    if (!accessToken || claimingMissionId) return;

    setClaimingMissionId(missionId);
    try {
      const result = await claimMissionReward(accessToken, missionId);
      if (profile && typeof result?.coins_balance === 'number') {
        setProfile({ ...profile, coins_balance: result.coins_balance });
      }
      await Promise.all([
        loadProfile(accessToken, { force: true }),
        loadMissions(accessToken, { force: true }),
      ]);
    } catch (error) {
      logLoadError('Error reclamando mision:', error);
    } finally {
      setClaimingMissionId(null);
    }
  };

  return (
    <ScreenLayout title="MINDGUILD" type="home">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#22c55e"
            colors={['#22c55e']}
          />
        }
      >
        <StreakCard
          currentStreak={profile?.streak_days ?? 0}
          active={Boolean(profile?.streak_completed_today)}
          loading={profileLoading}
        />

        <Text style={styles.section}>SALAS FRECUENTES</Text>
        {roomsLoading ? (
          <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 10 }} />
        ) : favoriteRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox color="#64748b" size={24} />
            <Text style={styles.emptyText}>Marca hasta 3 salas favoritas para verlas aca.</Text>
          </View>
        ) : (
          favoriteRooms.map(room => (
            <Pressable key={room.id} style={styles.roomCard} onPress={() => handleRoomPress(room)}>
              <View style={styles.roomLeft}>
                <Text style={styles.roomName}>{room.name}</Text>
                <View style={styles.roomMeta}>
                  <View style={styles.codeBox}><Text style={styles.codeText}>{room.invite_code}</Text></View>
                  <View style={styles.membersMeta}>
                    <Users color="#94a3b8" size={13} />
                    <Text style={styles.roomMembers}>{room.members_count}</Text>
                  </View>
                  <Text style={styles.roomMode}>{room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia'}</Text>
                </View>
              </View>
              <View style={styles.roomRight}>
                <ChevronRight color="#64748b" size={18} />
              </View>
            </Pressable>
          ))
        )}

        <Text style={styles.section}>MISIONES ACTIVAS</Text>
        {missionsLoading ? (
          <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 10 }} />
        ) : activeMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox color="#64748b" size={24} />
            <Text style={styles.emptyText}>No hay misiones asignadas para hoy.</Text>
          </View>
        ) : (
          activeMissions.map(m => (
            <MissionCard
              key={m.id}
              mission={m}
              onPress={() => setMissionsVisible(true)}
            />
          ))
        )}

        <MissionsModal
          visible={missionsVisible}
          onClose={() => setMissionsVisible(false)}
          missions={activeMissions}
          onClaimMission={handleClaimMission}
          claimingMissionId={claimingMissionId}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

function logLoadError(message: string, error: any) {
  if (error instanceof SessionExpiredError) {
    return;
  }

  const detail = String(error?.message ?? error ?? '').toLowerCase();

  if (detail.includes('token invalido') || detail.includes('token inválido')) {
    console.warn(message, error);
    return;
  }

  console.error(message, error);
}

const styles = StyleSheet.create({
  content: { paddingVertical: 10, paddingBottom: 120 },
  section: { color: '#64748b', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 20 },
  roomCard: { backgroundColor: '#1a1d29', borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2f45', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomLeft: { flex: 1 },
  roomName: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membersMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeBox: { backgroundColor: '#111', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { color: '#22c55e', fontSize: 11, fontWeight: 'bold' },
  roomMembers: { color: '#aaa', fontSize: 12 },
  roomMode: { color: '#aaa', fontSize: 12 },
  roomRight: { alignItems: 'center', gap: 6 },
  emptyState: { alignItems: 'center', gap: 8, marginTop: 12 },
  emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
