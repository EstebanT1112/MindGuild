import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import {
  Users2,
  Flame,
  Trophy,
  Check,
  X,
  UserPlus,
  SlidersHorizontal,
} from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { authenticatedFetch } from '../../../services/authenticatedFetch';
import Constants from 'expo-constants';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  streak_days: number;
  total_study_minutes: number;
  status: 'online' | 'offline';
  last_login_at?: string | null;
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

// 🌐 Configuración de API
const getApiUrl = (): string => {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGoLaunchContext?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};
const API_URL = getApiUrl();

// ✅ Función para obtener tiempo relativo
const getRelativeTime = (dateString: string): string => {
  if (!dateString) return 'Sin actividad reciente';
  
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  if (diffWeeks < 4) return `hace ${diffWeeks} semana${diffWeeks !== 1 ? 's' : ''}`;
  if (diffMonths < 12) return `hace ${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;
  return `hace ${diffYears} año${diffYears !== 1 ? 's' : ''}`;
};

export default function FriendsScreen() {
  const [isModalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<IncomingRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

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

  const auth = useAuthStore() as unknown as AuthState;
  const token = auth?.access_token || auth?.token;

  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  const loadData = async (showLoadingIndicator = true) => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      if (showLoadingIndicator) setLoading(true);
      const friendsRes = await authenticatedFetch(`${API_URL}/friends`, {}, token);
      const friendsJson = (await friendsRes.json()) as { success: boolean; data?: any[] };
      const requestsRes = await authenticatedFetch(`${API_URL}/friends/requests`, {}, token);
      const requestsJson = (await requestsRes.json()) as { success: boolean; received?: any[] };

      if (friendsJson.success && friendsJson.data) {
        const mappedFriends: Friend[] = friendsJson.data.map((f: any) => ({
          id: String(f.id),
          username: String(f.username || ''),
          avatar_url: f.avatar_url || null,
          streak_days: Number(f.streak_days || 0),
          total_study_minutes: Number(f.total_study_minutes || 0),
          status: 'offline',
          last_login_at: f.last_login_at || null,
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
            avatar_url: r.sender?.avatar_url || null,
          },
        }));
        setPendingRequests(mappedRequests);
      }
    } catch (error) {
      console.error('❌ Error cargando datos de amigos:', error);
      showAlert('Error', 'No se pudieron sincronizar los datos sociales.', 'error');
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
    setSortOrder((prev) => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  const handleSendRequest = async () => {
    if (!searchUsername.trim()) {
      showAlert('Campos incompletos', 'Por favor ingresá un nombre de usuario.', 'warning');
      return;
    }
    try {
      setSendingRequest(true);
      const response = await authenticatedFetch(
        `${API_URL}/friends/requests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: searchUsername.trim() }),
        },
        token
      );
      const json = (await response.json()) as { success: boolean; error?: string };
      if (json.success) {
        showAlert('Solicitud enviada', `Se envió la solicitud a ${searchUsername.trim()} correctamente.`, 'success');
        setSearchUsername('');
        setModalVisible(false);
        loadData(false);
      } else {
        showAlert('Atención', json.error || 'No se pudo procesar la solicitud.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Fallo de conexión con el servidor.', 'error');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleAccept = async (id: string, username: string) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/friends/requests/${id}/accept`,
        { method: 'POST' },
        token
      );
      const json = (await response.json()) as { success: boolean; error?: string };
      if (json.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
        loadData(false);
        showAlert('Éxito', `Ahora eres amigo de ${username}`, 'success');
      } else {
        showAlert('Error', json.error || 'No se pudo aceptar la solicitud.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Ocurrió un error en la red al aceptar la solicitud.', 'error');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const response = await authenticatedFetch(
        `${API_URL}/friends/requests/${id}/reject`,
        { method: 'POST' },
        token
      );
      const json = (await response.json()) as { success: boolean; error?: string };
      if (json.success) {
        setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        showAlert('Error', json.error || 'No se pudo rechazar la solicitud.', 'error');
      }
    } catch (err) {
      showAlert('Error', 'Ocurrió un error en la red al rechazar la solicitud.', 'error');
    }
  };

  const handleViewProfile = (username: string) => {
    showAlert('Perfil', `Ver el perfil de ${username}`, 'info');
  };

  if (loading) {
    return (
      <ScreenLayout title="Amigos" hideBackButton={true}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Amigos" hideBackButton={true}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
            {pendingRequests.map((req) => (
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
                  <Pressable
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAccept(req.id, req.sender.username)}
                  >
                    <Check size={16} color="#ffffff" />
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() => handleDecline(req.id)}
                  >
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Amigos ({friends.length})</Text>
            <Pressable
              style={[styles.filterBtn, sortOrder !== 'none' && styles.filterBtnActive]}
              onPress={toggleSort}
            >
              <SlidersHorizontal
                size={16}
                color={sortOrder !== 'none' ? colors.accent : colors.textMuted}
              />
              <Text
                style={[
                  styles.filterText,
                  sortOrder !== 'none' && styles.filterTextActive,
                ]}
              >
                {sortOrder === 'none'
                  ? 'Ordenar'
                  : sortOrder === 'desc'
                  ? 'Más horas'
                  : 'Menos horas'}
              </Text>
            </Pressable>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users2 size={40} color={colors.textMuted} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>Aún no tienes amigos agregados.</Text>
            </View>
          ) : (
            sortedFriends.map((friend) => (
              <View key={friend.id} style={styles.friendCard}>
                <View style={styles.profileRow}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {friend.username ? friend.username[0].toUpperCase() : '?'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusDot,
                        friend.status === 'online' ? styles.online : styles.offline,
                      ]}
                    />
                  </View>
                  <View>
                    <Text style={styles.username}>{friend.username}</Text>
                    <View style={styles.row}>
                      <View style={styles.streakBadge}>
                        <Flame size={12} color={colors.warning} />
                        <Text style={styles.streakLabel}>{friend.streak_days} d</Text>
                      </View>
                    </View>
                    <Text style={styles.lastLoginText}>
                      {friend.last_login_at
                        ? `Última conexión: ${getRelativeTime(friend.last_login_at)}`
                        : 'Sin actividad reciente'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Amigo</Text>
            <Text style={styles.modalSubtitle}>
              Ingresá el username exacto de tu compañero de gremio.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
              value={searchUsername}
              onChangeText={setSearchUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalVisible(false);
                  setSearchUsername('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleSendRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Enviar</Text>
                )}
              </Pressable>
            </View>
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
          if (alert.onConfirm) alert.onConfirm();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        onCancel={() => {
          if (alert.onCancel) alert.onCancel();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        confirmText={alert.confirmText || 'Aceptar'}
        cancelText={alert.cancelText || 'Cancelar'}
        showCancel={alert.showCancel || false}
      />
    </ScreenLayout>
  );
}

// 👇 Función que construye los estilos dinámicamente
const createStyles = (colors: any) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    container: {
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
    },
    addBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    section: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    filterBtnActive: {
      borderColor: colors.accent,
      borderWidth: 1,
    },
    filterText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    filterTextActive: {
      color: colors.accent,
    },
    requestCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      padding: 15,
      borderRadius: 16,
      marginBottom: 10,
    },
    friendCard: {
      backgroundColor: colors.surfaceElevated,
      padding: 16,
      borderRadius: 24,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 45,
      height: 45,
      borderRadius: 22,
      backgroundColor: colors.avatarAccent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.accent,
    },
    avatarText: {
      color: colors.avatarText,
      fontWeight: 'bold',
      fontSize: 16,
    },
    statusDot: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.surfaceElevated,
    },
    online: {
      backgroundColor: colors.accent,
    },
    offline: {
      backgroundColor: colors.textMuted,
    },
    username: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    mutual: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.warningSoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 15,
    },
    streakLabel: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: 'bold',
    },
    lastLoginText: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    acceptBtn: {
      backgroundColor: colors.accent,
    },
    declineBtn: {
      backgroundColor: colors.surface,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 30,
    },
    emptyIcon: {
      marginBottom: 10,
      opacity: 0.5,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.surfaceElevated,
      padding: 24,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 20,
      lineHeight: 18,
    },
    input: {
      width: '100%',
      height: 48,
      backgroundColor: colors.input,
      borderRadius: 12,
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      marginBottom: 24,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    modalBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      minWidth: 90,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.surface,
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontWeight: 'bold',
      fontSize: 14,
    },
    confirmBtn: {
      backgroundColor: colors.accent,
    },
    confirmBtnText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 14,
    },
  });