import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import { Users2, Flame, Trophy, Check, X, UserPlus, SlidersHorizontal } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

// ⚡ IMPORTAMOS EXPO CONSTANTS PARA DETECTAR LA IP LOCAL AUTOMÁTICAMENTE
import Constants from 'expo-constants';

// ⚡ IMPORTAMOS TU STORE OFICIAL DE AUTH0
import { useAuthStore } from '../../../store/authStore'; 

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  streak_days: number;
  total_study_minutes: number;
  status: 'online' | 'offline';
}

interface IncomingRequest {
  id: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface AuthState {
  token: string | null;
  access_token?: string | null;
  user: any;
}

// 🌐 CONFIGURACIÓN INTELIGENTE DE API URL (RF-14 AUTOMATIZADO)
const getApiUrl = (): string => {
  // debuggerHost contiene algo como "192.168.1.50:8081" cuando estás en desarrollo
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGoLaunchContext?.debuggerHost;
  
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`; // Se conecta automáticamente al puerto de tu Node backend
  }
  
  // Fallback por si corrés en producción o web build ordinario
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

export default function FriendsScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para el envío de solicitud
  const [searchUsername, setSearchUsername] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<IncomingRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  const auth = useAuthStore() as unknown as AuthState;
  // Mapeamos de forma segura por si tu store usa token o access_token alternativamente
  const token = auth?.access_token || auth?.token;

  const loadData = async (showLoadingIndicator = true) => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      if (showLoadingIndicator) setLoading(true);
      
      // 🔄 1. Fetch de Amigos Aceptados
      const friendsRes = await authenticatedFetch(`${API_URL}/friends`, {}, token);
      const friendsJson = await friendsRes.json() as { success: boolean; data?: any[] };

      // 🔄 2. Fetch de Solicitudes Recibidas
      const requestsRes = await authenticatedFetch(`${API_URL}/friends/requests`, {}, token);
      const requestsJson = await requestsRes.json() as { success: boolean; received?: any[] };

      if (friendsJson.success && friendsJson.data) {
        const mappedFriends: Friend[] = friendsJson.data.map((f: any) => ({
          id: String(f.id),
          username: String(f.username || ''),
          avatar_url: f.avatar_url || null,
          streak_days: Number(f.streak_days || 0),
          total_study_minutes: Number(f.total_study_minutes || 0),
          status: 'offline'
        }));
        setFriends(mappedFriends);
      }
      
      if (requestsJson.success && requestsJson.received) {
        const mappedRequests: IncomingRequest[] = requestsJson.received.map((r: any) => ({
          id: String(r.id),
          created_at: String(r.created_at || ''),
          sender: {
            id: String(r.sender?.id || ''),
            username: String(r.sender?.username || 'Usuario'),
            avatar_url: r.sender?.avatar_url || null
          }
        }));
        setPendingRequests(mappedRequests);
      }

    } catch (error) {
      console.error('❌ Error cargando datos de amigos:', error);
      Alert.alert("Error", "No se pudieron sincronizar los datos sociales.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [token]);

  const sortedFriends = useMemo(() => {
    const result = [...friends];
    if (sortOrder === 'asc') result.sort((a, b) => a.total_study_minutes - b.total_study_minutes);
    if (sortOrder === 'desc') result.sort((a, b) => b.total_study_minutes - a.total_study_minutes);
    return result;
  }, [friends, sortOrder]);

  const toggleSort = () => {
    setSortOrder(prev => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  const handleSendRequest = async () => {
    if (!searchUsername.trim()) {
      Alert.alert("Campos incompletos", "Por favor ingresá un nombre de usuario.");
      return;
    }

    try {
      setSendingRequest(true);
      const response = await authenticatedFetch(`${API_URL}/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: searchUsername.trim() })
      }, token);

      const json = await response.json() as { success: boolean; error?: string };

      if (json.success) {
        Alert.alert("Solicitud enviada", `Se envió la solicitud a ${searchUsername.trim()} correctamente.`);
        setSearchUsername('');
        setModalVisible(false);
        loadData(false);
      } else {
        Alert.alert("Atención", json.error || "No se pudo procesar la solicitud.");
      }
    } catch (err) {
      Alert.alert("Error", "Fallo de conexión con el servidor.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (id: string, username: string) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/friends/requests/${id}/accept`, {
        method: 'POST',
      }, token);
      const json = await response.json() as { success: boolean; error?: string };

      if (json.success) {
        setPendingRequests(prev => prev.filter(r => r.id !== id));
        loadData(false);
        Alert.alert("Éxito", `Ahora eres amigo de ${username}`);
      } else {
        Alert.alert("Error", json.error || "No se pudo aceptar la solicitud.");
      }
    } catch (err) {
      Alert.alert("Error", "Ocurrió un error en la red al aceptar la solicitud.");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await authenticatedFetch(`${API_URL}/friends/requests/${id}/reject`, {
        method: 'POST',
      }, token);
      const json = await response.json() as { success: boolean; error?: string };

      if (json.success) {
        setPendingRequests(prev => prev.filter(r => r.id !== id));
      } else {
        Alert.alert("Error", json.error || "No se pudo rechazar la solicitud.");
      }
    } catch (err) {
      Alert.alert("Error", "Ocurrió un error en la red al rechazar la solicitud.");
    }
  };

  if (loading) {
    return (
      <ScreenLayout title="Amigos">
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Amigos">
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />
        }
      >
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
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {req.sender.username ? req.sender.username[0].toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.username}>{req.sender.username}</Text>
                    <Text style={styles.mutual}>Quiere ser tu amigo</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(req.id, req.sender.username)}>
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

          {friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users2 size={40} color="#64748b" style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Aún no tienes amigos agregados.</Text>
            </View>
          ) : (
            sortedFriends.map(friend => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.profileRow}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {friend.username ? friend.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View style={[styles.statusDot, friend.status === 'online' ? styles.online : styles.offline]} />
                  </View>
                  <View>
                    <Text style={styles.username}>{friend.username}</Text>
                    <View style={styles.row}>
                      <View style={styles.streakBadge}>
                        <Flame size={12} color="#fb923c" />
                        <Text style={styles.streakLabel}>{friend.streak_days} d</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statInfo}>
                    <Trophy size={16} color="#facc15" />
                    <View>
                      <Text style={styles.statLabel}>TIEMPO TOTAL</Text>
                      <Text style={styles.statValue}>
                        {(friend.total_study_minutes / 60).toFixed(1)}h
                      </Text>
                    </View>
                  </View>
                  <Pressable style={styles.profileBtn} onPress={() => Alert.alert("Perfil", `Ver el perfil de ${friend.username}`)}>
                    <Text style={styles.profileBtnText}>Ver</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Amigo</Text>
            <Text style={styles.modalSubtitle}>Ingresá el username exacto de tu compañero de gremio.</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              placeholderTextColor="#64748b" 
              value={searchUsername} 
              onChangeText={setSearchUsername} 
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.cancelBtn]} onPress={() => { setModalVisible(false); setSearchUsername(''); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.confirmBtn]} onPress={handleSendRequest} disabled={sendingRequest}>
                {sendingRequest ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.confirmBtnText}>Enviar</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f111a' },
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
  avatar: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#2a2d3d', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#22c55e' },
  avatarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#222533' },
  online: { backgroundColor: '#22c55e' },
  offline: { backgroundColor: '#64748b' },
  username: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  mutual: { color: '#64748b', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#451a03', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15 },
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
  declineBtn: { backgroundColor: '#2a2d3d' },
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { marginBottom: 10, opacity: 0.5 },
  emptyText: { color: '#64748b', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 17, 26, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 340, backgroundColor: '#1e293b', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#2e3245' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#ffffff', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 18 },
  input: { width: '100%', height: 48, backgroundColor: '#0f111a', borderRadius: 12, paddingHorizontal: 16, color: '#ffffff', fontSize: 15, borderWidth: 1, borderColor: '#2e3245', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, minWidth: 90, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#2a2d3d' },
  cancelBtnText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 14 },
  confirmBtn: { backgroundColor: '#22c55e' },
  confirmBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
