import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Users2, Flame, Trophy, Check, X, UserPlus, SlidersHorizontal } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AddFriendModal from '../components/AddFriendModal';

export default function FriendsScreen() {
  /* ==========================================
     ⚠️ CÓDIGO COMENTADO PARA ENTREGA 2 (E2)
     ==========================================
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');

  const [pendingRequests, setPendingRequests] = useState([
    { id: 1, username: "maria_lopez", avatar: "M", mutualFriends: 2 },
    { id: 2, username: "carlos_ruiz", avatar: "C", mutualFriends: 1 },
  ]);

  const [friends, setFriends] = useState([
    { id: 1, username: "kenji_tanaka", avatar: "K", streak: 7, level: 8, hours: 15.5, status: 'online' },
    { id: 2, username: "yuki_yamamoto", avatar: "Y", streak: 5, level: 6, hours: 12.3, status: 'online' },
  ]);

  const sortedFriends = useMemo(() => {
    let result = [...friends];
    if (sortOrder === 'asc') result.sort((a, b) => a.hours - b.hours);
    if (sortOrder === 'desc') result.sort((a, b) => b.hours - a.hours);
    return result;
  }, [friends, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  const handleAccept = (id: number, username: string) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
    setFriends(prev => [
      ...prev,
      { id: Date.now(), username, avatar: username[0].toUpperCase(), streak: 0, level: 1, hours: 0, status: 'offline' }
    ]);
    Alert.alert("Éxito", `Ahora eres amigo de ${username}`);
  };

  const handleDecline = (id: number) => {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };
  ========================================== */

  return (
    <ScreenLayout title="Amigos">
      {/* VISTA DE LA ENTREGA 1: PANTALLA DE PRÓXIMAMENTE */}
      <View style={styles.upcomingContainer}>
        <Users2 size={64} color="#22c55e" style={styles.upcomingIcon} />
        <Text style={styles.upcomingTitle}>Sección de Amigos</Text>
        <Text style={styles.upcomingSubtitle}>
          Las funciones de interacción social, búsqueda de usuarios y solicitudes compartidas estarán disponibles en la Entrega 2.
        </Text>
        <View style={styles.badgeE2}>
          <Text style={styles.badgeText}>PRÓXIMAMENTE (E2)</Text>
        </View>
      </View>

      {/* ==========================================
         ⚠️ RENDER DE INTERFAZ COMENTADO PARA E2
         ==========================================
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Amigos</Text>
          <Pressable style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <UserPlus size={20} color="#ffffff" />
            <Text style={styles.addBtnText}>Agregar</Text>
          </Pressable>
        </View>

        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitudes Pendientes ({pendingRequests.length})</Text>
            {pendingRequests.map(req => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.profileRow}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{req.avatar}</Text></View>
                  <View>
                    <Text style={styles.username}>{req.username}</Text>
                    <Text style={styles.mutual}>{req.mutualFriends} amigos en común</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(req.id, req.username)}>
                    <Check size={16} color="#ffffff" />
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleDecline(req.id)}>
                    <X size={16} color="#94a3b8" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Amigos ({friends.length})</Text>
            <Pressable style={[styles.filterBtn, sortOrder !== 'none' && styles.filterBtnActive]} onPress={toggleSort}>
              <SlidersHorizontal size={16} color={sortOrder !== 'none' ? "#22c55e" : "#94a3b8"} />
              <Text style={[styles.filterText, sortOrder !== 'none' && styles.filterTextActive]}>
                {sortOrder === 'none' ? 'Ordenar' : sortOrder === 'desc' ? 'Más horas' : 'Menos horas'}
              </Text>
            </Pressable>
          </View>

          {sortedFriends.map(friend => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.profileRow}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{friend.avatar}</Text></View>
                  <View style={[styles.statusDot, friend.status === 'online' ? styles.online : styles.offline]} />
                </View>
                <View>
                  <Text style={styles.username}>{friend.username}</Text>
                  <View style={styles.row}>
                    <View style={styles.levelBadge}>
                      <View style={styles.levelCircle}><Text style={styles.levelNum}>{friend.level}</Text></View>
                      <Text style={styles.levelLabel}>LVL</Text>
                    </View>
                    <View style={styles.streakBadge}>
                      <Flame size={12} color="#fb923c" />
                      <Text style={styles.streakLabel}>{friend.streak} d</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statInfo}>
                  <Trophy size={16} color="#facc15" />
                  <View>
                    <Text style={styles.statLabel}>TIEMPO TOTAL</Text>
                    <Text style={styles.statValue}>{friend.hours}h</Text>
                  </View>
                </View>
                <Pressable style={styles.profileBtn} onPress={() => Alert.alert("Perfil", `Ver el perfil de ${friend.username}`)}>
                  <Text style={styles.profileBtnText}>Ver</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AddFriendModal isVisible={isModalVisible} onClose={() => setModalVisible(false)} />
      ========================================== */}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Estilos de la Pantalla Próximamente (E1)
  upcomingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#1a1d29', // Acorde al theme de la app
  },
  upcomingIcon: {
    marginBottom: 20,
    opacity: 0.9,
  },
  upcomingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  upcomingSubtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  badgeE2: {
    backgroundColor: '#14532d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  badgeText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  /* ==========================================
     ⚠️ ESTILOS COMENTADOS (MANTENIDOS PARA E2)
     ==========================================
  container: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#a1a1aa', letterSpacing: 0.5 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#222533', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  filterBtnActive: { borderColor: '#22c55e', borderWidth: 1 },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#22c55e' },
  requestCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222533', padding: 15, borderRadius: 16, marginBottom: 10 },
  friendCard: { backgroundColor: '#222533', padding: 16, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#2e3245' },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#2a2d3d', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#3b82f6' },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#222533' },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#64748b' },
  username: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  mutual: { color: '#64748b', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  levelBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14532d', borderRadius: 15, paddingRight: 10 },
  levelCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center' },
  levelNum: { fontSize: 10, fontWeight: '900', color: '#0f172a' },
  levelLabel: { color: '#22c55e', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#451a03', paddingHorizontal: 10, borderRadius: 15 },
  streakLabel: { color: '#fb923c', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, backgroundColor: '#0f172a', padding: 15, borderRadius: 20 },
  statInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statLabel: { color: '#64748b', fontSize: 11 },
  statValue: { color: '#facc15', fontSize: 16, fontWeight: '900' },
  profileBtn: { backgroundColor: '#14532d', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  profileBtnText: { color: '#4ade80', fontSize: 12, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#22c55e' },
  declineBtn: { backgroundColor: '#2a2d3d' }
  ========================================== */
});