import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, CalendarCheck, CheckCheck, ChevronLeft, Crown, Gift, Medal, MessageSquarePlus, Target, Trash2, Trophy, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import {
  clearAllNotifications,
  fetchMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '../services/notificationsService';

export default function NotificationsScreen({ navigation }: any) {
  const accessToken = useAuthStore(state => state.access_token);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  );

  useEffect(() => {
    loadNotifications();
  }, [accessToken]);

  const loadNotifications = async (forceRefresh = false) => {
    if (!accessToken) return;

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchMyNotifications(accessToken, { limit: 50 });
      setNotifications(data);
    } catch (error: any) {
      Alert.alert('Notificaciones', error.message ?? 'No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePressNotification = async (notification: AppNotification) => {
    if (!accessToken || notification.read) return;

    setNotifications(current =>
      current.map(item => item.id === notification.id ? { ...item, read: true } : item)
    );

    try {
      await markNotificationAsRead(accessToken, notification.id);
    } catch (error: any) {
      setNotifications(current =>
        current.map(item => item.id === notification.id ? { ...item, read: false } : item)
      );
      Alert.alert('Notificaciones', error.message ?? 'No se pudo marcar como leida.');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accessToken || saving || unreadCount === 0) return;

    const previousNotifications = notifications;
    setSaving(true);
    setNotifications(current => current.map(notification => ({ ...notification, read: true })));

    try {
      await markAllNotificationsAsRead(accessToken);
    } catch (error: any) {
      setNotifications(previousNotifications);
      Alert.alert('Notificaciones', error.message ?? 'No se pudieron marcar las notificaciones.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (!accessToken || saving || notifications.length === 0) return;

    Alert.alert(
      'Limpiar notificaciones',
      'Se van a borrar todas las notificaciones de tu bandeja.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            const previousNotifications = notifications;
            setSaving(true);
            setNotifications([]);

            try {
              await clearAllNotifications(accessToken);
            } catch (error: any) {
              setNotifications(previousNotifications);
              Alert.alert('Notificaciones', error.message ?? 'No se pudieron limpiar las notificaciones.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout title="NOTIFICACIONES" type="profiles">
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color="#e2e8f0" size={22} />
        </Pressable>
        <View style={styles.summary}>
          <Bell color="#facc15" size={18} />
          <Text style={styles.summaryText}>
            {unreadCount === 0 ? 'Sin pendientes' : `${unreadCount} sin leer`}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Text style={styles.sectionTitle}>Bandeja interna</Text>
        <Pressable
          style={[styles.readAllBtn, (unreadCount === 0 || saving) && styles.disabled]}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0 || saving}
        >
          <CheckCheck color="#22c55e" size={16} />
          <Text style={styles.readAllText}>{saving ? 'Marcando...' : 'Leer todas'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#22c55e" />
          <Text style={styles.mutedText}>Cargando notificaciones...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor="#22c55e"
              colors={['#22c55e']}
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Bell color="#64748b" size={34} />
              <Text style={styles.emptyTitle}>No tenes notificaciones</Text>
              <Text style={styles.mutedText}>Cuando pase algo importante, va a aparecer aca.</Text>
            </View>
          ) : (
            <>
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handlePressNotification(notification)}
                />
              ))}

              <Pressable
                style={[styles.clearAllBtn, saving && styles.disabled]}
                onPress={handleClearAll}
                disabled={saving}
              >
                <Trash2 color="#fecaca" size={16} />
                <Text style={styles.clearAllText}>Limpiar todas las notificaciones</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const Icon = getNotificationIcon(notification.type);

  return (
    <Pressable
      style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
      onPress={onPress}
    >
      <View style={[styles.notificationIcon, !notification.read && styles.notificationIconUnread]}>
        <Icon color={!notification.read ? '#facc15' : '#94a3b8'} size={19} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          {!notification.read && <View style={styles.unreadDot} />}
        </View>
        {!!notification.body && <Text style={styles.notificationBody}>{notification.body}</Text>}
        <Text style={styles.notificationDate}>{formatNotificationDate(notification.created_at)}</Text>
      </View>
    </Pressable>
  );
}

function getNotificationIcon(type: string) {
  if (type === 'achievement_unlocked') return Medal;
  if (type === 'mission_completed') return Target;
  if (type === 'room_invitation') return MessageSquarePlus;
  if (
    type === 'weekly_quiz_configured' ||
    type === 'weekly_quiz_updated' ||
    type === 'weekly_quiz_opened' ||
    type === 'weekly_validation_opened' ||
    type === 'weekly_results_ready'
  ) return CalendarCheck;
  if (type === 'reward_available') return Gift;
  if (type === 'ranking_changed') return Trophy;
  if (type === 'boss_assigned') return Crown;
  if (type === 'team_needs_points') return Users;
  return Bell;
}

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e293b', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  summaryText: { color: '#e2e8f0', fontWeight: '900', fontSize: 13 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  readAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534', borderRadius: 13, paddingHorizontal: 10, paddingVertical: 8 },
  readAllText: { color: '#bbf7d0', fontSize: 12, fontWeight: '900' },
  clearAllBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3f1212',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  clearAllText: { color: '#fecaca', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  listContent: { paddingBottom: 36, gap: 10 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 20, borderWidth: 1, borderColor: '#334155', alignItems: 'center', padding: 24, gap: 8 },
  emptyTitle: { color: 'white', fontSize: 17, fontWeight: '900' },
  mutedText: { color: '#94a3b8', fontSize: 13, textAlign: 'center' },
  notificationCard: { flexDirection: 'row', gap: 12, backgroundColor: '#1e293b', borderRadius: 18, borderWidth: 1, borderColor: '#334155', padding: 14 },
  notificationUnread: { borderColor: '#facc1555', backgroundColor: '#201a0b' },
  notificationIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  notificationIconUnread: { backgroundColor: '#3b2f0c' },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  notificationTitle: { color: 'white', fontSize: 14, fontWeight: '900', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#facc15' },
  notificationBody: { color: '#cbd5e1', fontSize: 13, marginTop: 4, lineHeight: 18 },
  notificationDate: { color: '#64748b', fontSize: 11, fontWeight: '800', marginTop: 8 },
});
