import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
import { ArrowLeft, Users, Flame, Trophy, Check, X, UserPlus } from 'lucide-react-native';
import AddFriendModal from '../components/AddFriendModal';

export default function FriendsScreen() {
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
    if (sortOrder === 'asc') result.sort((a, b) => a.username.localeCompare(b.username));
    if (sortOrder === 'desc') result.sort((a, b) => b.username.localeCompare(a.username));
    return result;
  }, [friends, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => (prev === 'none' || prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleAccept = (username: string, id: number) => {
    Alert.alert("Solicitud Aceptada", `Ahora eres amigo de @${username}`);
    setPendingRequests(prev => prev.filter(req => req.id !== id));
  };

  const handleReject = (username: string, id: number) => {
    Alert.alert("Solicitud Rechazada", `Se eliminó la solicitud de @${username}`);
    setPendingRequests(prev => prev.filter(req => req.id !== id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn}>
            <ArrowLeft color="#94a3b8" size={20} />
          </Pressable>
          <View style={styles.headerTitle}>
            <Users color="#22c55e" size={22} />
            <Text style={styles.headerText}>AMIGOS</Text>
          </View>
          <View style={styles.coinBadge}>
            <View style={styles.hCoin}><Text style={styles.hText}>H</Text></View>
            <Text style={styles.coinAmount}>1,250</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* SECCIÓN SOLICITUDES */}
          {pendingRequests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>SOLICITUDES PENDIENTES ({pendingRequests.length})</Text>
              {pendingRequests.map(req => (
                <View key={req.id} style={styles.cardBase}> 
                  <View style={styles.userRow}>
                    <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}>
                      <Text style={styles.avatarLetter}>{req.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.usernameText}>@{req.username}</Text>
                      <Text style={styles.subText}>{req.mutualFriends} amigos en común</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable 
                      style={[styles.btnAction, { backgroundColor: '#22c55e' }]}
                      onPress={() => handleAccept(req.username, req.id)}
                    >
                      <Check color="white" size={16} />
                      <Text style={styles.btnText}>Aceptar</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.btnAction, styles.btnReject]}
                      onPress={() => handleReject(req.username, req.id)}
                    >
                      <X color="#94a3b8" size={16} />
                      <Text style={styles.btnText}>Rechazar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* SECCIÓN AMIGOS */}
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>MIS AMIGOS ({friends.length})</Text>
            <Pressable onPress={toggleSort}>
              <Text style={styles.orderText}>
                {sortOrder === 'none' ? 'Ordenar' : sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </Text>
            </Pressable>
          </View>

          {sortedFriends.map(friend => (
            <View key={friend.id} style={styles.cardBase}>
              <View style={styles.userRow}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar, { backgroundColor: '#22c55e' }]}>
                    <Text style={styles.avatarLetter}>{friend.avatar}</Text>
                  </View>
                  <View style={styles.statusDot} />
                </View>
                <View>
                  <Text style={styles.usernameText}>@{friend.username}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.levelBadge}>
                      <View style={styles.levelCircle}><Text style={styles.levelNum}>{friend.level}</Text></View>
                      <Text style={styles.levelLabel}>Nivel {friend.level}</Text>
                    </View>
                    <View style={styles.streakBadge}>
                      <Flame color="#fb923c" size={12} />
                      <Text style={styles.streakLabel}>{friend.streak}d</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statInfo}>
                  <Trophy color="#facc15" size={18} />
                  <View>
                    <Text style={styles.statLabel}>Esta semana</Text>
                    <Text style={styles.statValue}>{friend.hours}h</Text>
                  </View>
                </View>
                <Pressable style={styles.profileBtn}>
                  <Text style={styles.profileBtnText}>Ver Perfil</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
          <UserPlus color="white" size={26} />
        </Pressable>

        <AddFriendModal 
          visible={isModalVisible} 
          onClose={() => setModalVisible(false)} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 25, padding: 5, paddingRight: 15 },
  hCoin: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center' },
  hText: { fontWeight: '900', fontSize: 14, color: '#0f172a' },
  coinAmount: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  scroll: { flex: 1 },
  sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '900', marginVertical: 15, letterSpacing: 1 },
  
  // ESTILO UNIFICADO PARA AMBAS TARJETAS
  cardBase: { 
    backgroundColor: '#1e293b', 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#3b82f622', // Borde sutil para ambas
  },
  
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  usernameText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subText: { color: '#94a3b8', fontSize: 14, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btnAction: { flex: 1, height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnReject: { backgroundColor: '#2d3748' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderText: { color: '#22c55e', fontWeight: 'bold', fontSize: 14 },
  
  avatarWrapper: { position: 'relative' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', borderWidth: 2, borderColor: '#1e293b' },
  badgeRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
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
  profileBtnText: { color: '#22c55e', fontSize: 13, fontWeight: 'bold' },
 fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, // Cambiado de 0 a 20 para que no esté pegado al borde
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#22c55e', 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 10, 
    shadowColor: '#22c55e', 
    shadowOpacity: 0.5, 
    shadowRadius: 10 
  }
});