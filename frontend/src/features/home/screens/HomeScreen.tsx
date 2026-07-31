import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BarChart3, Brain, ChevronRight, Clock3, Inbox, Target, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { SessionExpiredError } from '../../../services/authenticatedFetch';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { type UserRoom } from '../../rooms/services/roomsService';
import MissionCard from '../components/MissionCard';
import MissionsModal from '../components/MissionsModal';
import StreakCard from '../components/StreakCard';
import { claimMissionReward } from '../services/missionsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const colors = useThemeStore(state => state.colors);

  // ── Store data ──
  const profile = useAppDataStore(state => state.profile.data);
  const profileLoading = useAppDataStore(state => state.profile.isLoading);
  const rooms = useAppDataStore(state => state.rooms.data) ?? [];
  const roomsLoading = useAppDataStore(state => state.rooms.isLoading);
  const missionsRaw = useAppDataStore(state => state.missions.data) ?? [];
  const missionsLoading = useAppDataStore(state => state.missions.isLoading);
  const achievements = useAppDataStore(state => state.achievements.data) ?? [];

  // 🔥 Filtro de misiones expiradas: ocultar si expiró hace >24hs
  const activeMissions = missionsRaw.filter(m => !m.expired && !m.expiredMoreThan24h);

  // Logros con recompensa sin reclamar
  const hasClaimableAchievements = achievements.some(a => a.unlocked && !a.reward_claimed_at);

  // ── Store actions ──
  const loadProfile = useAppDataStore(state => state.loadProfile);
  const loadRooms = useAppDataStore(state => state.loadRooms);
  const loadMissions = useAppDataStore(state => state.loadMissions);
  const loadAchievements = useAppDataStore(state => state.loadAchievements);
  const setProfile = useAppDataStore(state => state.setProfile);

  // ── Estados locales ──
  const [missionsVisible, setMissionsVisible] = useState(false);
  const [claimingMissionId, setClaimingMissionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── Refs para estabilizar funciones en useFocusEffect ──
  const loadProfileRef = useRef(loadProfile);
  const loadRoomsRef = useRef(loadRooms);
  const loadMissionsRef = useRef(loadMissions);
  const loadAchievementsRef = useRef(loadAchievements);
  const accessTokenRef = useRef(accessToken);

  // Actualizar refs cuando cambien las funciones o el token
  loadProfileRef.current = loadProfile;
  loadRoomsRef.current = loadRooms;
  loadMissionsRef.current = loadMissions;
  loadAchievementsRef.current = loadAchievements;
  accessTokenRef.current = accessToken;

  // ── Carga inicial y refresco al enfocar ──
  const loadAllData = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) return;

    try {
      await Promise.all([
        loadProfileRef.current(token),
        loadRoomsRef.current(token),
        loadMissionsRef.current(token),
        loadAchievementsRef.current(token),
      ]);
    } catch (error) {
      if (error instanceof SessionExpiredError) return;
      console.error('Error cargando datos iniciales:', error);
    }
  }, []);

  // useFocusEffect con dependencias estables gracias a useRef
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  // ── Manejo de refresh manual ──
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
      if (!(error instanceof SessionExpiredError)) {
        console.error('Error refrescando Home:', error);
      }
    } finally {
      setRefreshing(false);
    }
  };

  // ── Handlers ──
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
      if (!(error instanceof SessionExpiredError)) {
        console.error('Error reclamando misión:', error);
      }
    } finally {
      setClaimingMissionId(null);
    }
  };

  // ── Cálculos derivados ──
  const favoriteRooms = rooms.filter(room => room.is_favorite).slice(0, 3);
  const completedMissionsCount = activeMissions.filter(m => m.completed && !m.expired).length;
  const claimableMissionsCount = activeMissions.filter(m => m.completed && !m.claimed && !m.expired).length;

  // ── Render ──
  return (
    <ScreenLayout 
      title="MINDGUILD" 
      type="home"
      rightAction={
        <Pressable style={[styles.walletBadge, { backgroundColor: colors.warning }]} onPress={() => navigation.navigate('Wallet')}>
          <View style={[styles.hCoin, { backgroundColor: colors.warning }]}><Brain color="#000000" size={20} strokeWidth={2.2} /></View>
          <Text style={[styles.coinAmount, { color: '#000000' }]}>{profile?.coins_balance ?? 0}</Text>
        </Pressable>
      }
    >
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <StreakCard
          currentStreak={profile?.streak_days ?? 0}
          active={Boolean(profile?.streak_completed_today)}
          status={profile?.streak_status}
          shieldUntil={profile?.streak_shield_until}
          loading={profileLoading}
        />

        {hasClaimableAchievements && (
          <Pressable
            style={[styles.claimIndicator, { backgroundColor: colors.warning }]}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Text style={[styles.claimIndicatorText, { color: colors.rankBadgeText }]}>
              Tenés logros para reclamar!
            </Text>
          </Pressable>
        )}

        <Text style={[styles.section, { color: colors.textSoft }]}>SALAS FAVORITAS</Text>
        {roomsLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 10 }} />
        ) : favoriteRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox color={colors.textSoft} size={24} />
            <Text style={[styles.emptyText, { color: colors.textSoft }]}>
              Marca hasta 3 salas favoritas para verlas acá.
            </Text>
          </View>
        ) : (
          favoriteRooms.map(room => {
            const roomAccent = getRoomAccentColor(room.mode);
            return (
              <Pressable
                key={room.id}
                style={[
                  styles.roomCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => handleRoomPress(room)}
              >
                <View style={styles.roomLeft}>
                  <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
                  <View style={styles.roomMeta}>
                    <View
                      style={[
                        styles.codeBox,
                        { borderColor: roomAccent, backgroundColor: `${roomAccent}18` },
                      ]}
                    >
                      <Text style={[styles.codeText, { color: roomAccent }]}>
                        {room.invite_code}
                      </Text>
                    </View>
                    <View style={styles.membersMeta}>
                      <Users color={colors.textMuted} size={13} />
                      <Text style={[styles.roomMembers, { color: colors.textMuted }]}>
                        {room.members_count}
                      </Text>
                    </View>
                    <Text style={[styles.roomMode, { color: roomAccent }]}>
                      {room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia'}
                    </Text>
                  </View>
                </View>
                <View style={styles.roomRight}>
                  <ChevronRight color={colors.textSoft} size={18} />
                </View>
              </Pressable>
            );
          })
        )}

        <View
          style={[
            styles.weekSummaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.weekSummaryHeader}>
            <Text style={[styles.weekSummaryTitle, { color: colors.text }]}>TU SEMANA</Text>
            {claimableMissionsCount > 0 && (
              <View style={[styles.claimBadge, { backgroundColor: colors.accentStrong }]}>
                <Text style={[styles.claimBadgeText, { color: '#000000' }]}>
                  {claimableMissionsCount} por reclamar
                </Text>
              </View>
            )}
          </View>
          <View style={styles.weekSummaryGrid}>
            <View
              style={[
                styles.weekSummaryItem,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={styles.weekIconBox}>
                <Clock3 color="#38bdf8" size={18} />
              </View>
              <Text style={[styles.weekSummaryValue, { color: colors.text }]}>
                {profile?.weekly_stats?.total_minutes ?? 0}m
              </Text>
              <Text style={[styles.weekSummaryLabel, { color: colors.textMuted }]}>Estudio</Text>
            </View>
            <View
              style={[
                styles.weekSummaryItem,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={styles.weekIconBox}>
                <Target color={colors.accent} size={18} />
              </View>
              <Text style={[styles.weekSummaryValue, { color: colors.text }]}>
                {completedMissionsCount}/{activeMissions.length}
              </Text>
              <Text style={[styles.weekSummaryLabel, { color: colors.textMuted }]}>Misiones</Text>
            </View>
            <View
              style={[
                styles.weekSummaryItem,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.weekIconBox,
                  { backgroundColor: colors.warning, borderRadius: 12 },
                ]}
              >
                <Brain color={colors.rankBadgeText} size={18} strokeWidth={2.2} />
              </View>
              <Text style={[styles.weekSummaryValue, { color: colors.text }]}>
                {profile?.weekly_stats?.coins_earned ?? 0}
              </Text>
              <Text style={[styles.weekSummaryLabel, { color: colors.textMuted }]}>Ganadas</Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.dashboardLink,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
            onPress={() => navigation.navigate('SmartDashboard', { scope: 'global' })}
          >
            <View style={[styles.dashboardIconBox, { backgroundColor: colors.accentSoft }]}>
              <BarChart3 color="#38bdf8" size={18} />
            </View>
            <View style={styles.dashboardTextBox}>
              <Text style={[styles.dashboardTitle, { color: colors.text }]}>
                Ver dashboard inteligente
              </Text>
              <Text style={[styles.dashboardSub, { color: colors.textMuted }]}>
                Comparación semanal e insights
              </Text>
            </View>
            <ChevronRight color={colors.textSoft} size={18} />
          </Pressable>
        </View>

        <Text style={[styles.section, { color: colors.textSoft }]}>MISIONES ACTIVAS</Text>
        {missionsLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 10 }} />
        ) : activeMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox color={colors.textSoft} size={24} />
            <Text style={[styles.emptyText, { color: colors.textSoft }]}>
              No hay misiones asignadas para hoy.
            </Text>
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

// ── Funciones auxiliares ──
function logLoadError(message: string, error: any) {
  if (error instanceof SessionExpiredError) return;
  console.error(message, error);
}

function getRoomAccentColor(mode: UserRoom['mode']) {
  return mode === 'battle_royale' ? '#a855f7' : '#22c55e';
}

// ── Estilos ──
const styles = StyleSheet.create({
  content: { paddingVertical: 10, paddingBottom: 120 },
  section: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 20 },
  claimIndicator: { padding: 12, borderRadius: 16, marginVertical: 10, alignItems: 'center' },
  claimIndicatorText: { fontWeight: '900', fontSize: 14 },
  weekSummaryCard: { borderRadius: 18, borderWidth: 1, padding: 14, marginTop: 12 },
  weekSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  weekSummaryTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  claimBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  claimBadgeText: { fontSize: 11, fontWeight: '900' },
  weekSummaryGrid: { flexDirection: 'row', gap: 10 },
  weekSummaryItem: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  weekIconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  weekSummaryValue: { fontSize: 16, fontWeight: '900', marginTop: 6 },
  weekSummaryLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  dashboardLink: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashboardIconBox: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dashboardTextBox: { flex: 1 },
  dashboardTitle: { fontSize: 13, fontWeight: '900' },
  dashboardSub: { fontSize: 11, marginTop: 2 },
  roomCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomLeft: { flex: 1 },
  roomName: { fontWeight: 'bold', fontSize: 15, marginBottom: 8 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membersMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeBox: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  codeText: { fontSize: 11, fontWeight: 'bold' },
  roomMembers: { fontSize: 12 },
  roomMode: { fontSize: 12 },
  roomRight: { alignItems: 'center', gap: 6 },
  emptyState: { alignItems: 'center', gap: 8, marginTop: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 10 },

  walletBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, padding: 5, paddingRight: 15 },
  hCoin: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coinAmount: { fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});
