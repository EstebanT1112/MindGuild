import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Bell, CalendarCheck, CheckCheck, ChevronLeft, Crown, Gift, Medal, MessageSquarePlus, Target, Trash2, Trophy, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import {
  clearAllNotifications,
  fetchMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from '../services/notificationsService';

export default function NotificationsScreen({ navigation }: any) {
  const accessToken = useAuthStore(state => state.access_token);
  const colors = useThemeStore(state => state.colors);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  );

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
      showAlert('Notificaciones', error.message ?? 'No se pudieron cargar las notificaciones.', 'error');
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
      showAlert('Notificaciones', error.message ?? 'No se pudo marcar como leída.', 'error');
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
      showAlert('Notificaciones', error.message ?? 'No se pudieron marcar las notificaciones.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (!accessToken || saving || notifications.length === 0) return;

    showAlert(
      'Limpiar notificaciones',
      'Se van a borrar todas las notificaciones de tu bandeja.',
      'warning',
      async () => {
        const previousNotifications = notifications;
        setSaving(true);
        setNotifications([]);

        try {
          await clearAllNotifications(accessToken);
        } catch (error: any) {
          setNotifications(previousNotifications);
          showAlert('Notificaciones', error.message ?? 'No se pudieron limpiar las notificaciones.', 'error');
        } finally {
          setSaving(false);
        }
      },
      'Limpiar',
      true,
      'Cancelar',
      () => {}
    );
  };

  // Estilos dinámicos basados en el tema
  const styles = useMemo(
    () =>
      StyleSheet.create({
        topBar: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        },
        backBtn: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        summary: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.surface,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 9,
        },
        summaryText: {
          color: colors.text,
          fontWeight: '900',
          fontSize: 13,
        },
        actionsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        },
        sectionTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '900',
        },
        readAllBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.accentSoft,
          borderWidth: 1,
          borderColor: colors.accent,
          borderRadius: 13,
          paddingHorizontal: 10,
          paddingVertical: 8,
          opacity: unreadCount === 0 || saving ? 0.5 : 1,
        },
        readAllText: {
          color: colors.accentStrong,
          fontSize: 12,
          fontWeight: '900',
        },
        clearAllBtn: {
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.dangerSoft,
          borderWidth: 1,
          borderColor: colors.dangerBorder,
          borderRadius: 14,
          paddingVertical: 12,
          paddingHorizontal: 14,
          opacity: saving ? 0.5 : 1,
        },
        clearAllText: {
          color: colors.danger,
          fontSize: 13,
          fontWeight: '900',
        },
        disabled: { opacity: 0.5 },
        loadingState: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        },
        listContent: {
          paddingBottom: 36,
          gap: 10,
        },
        emptyCard: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          padding: 24,
          gap: 8,
        },
        emptyTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '900',
        },
        mutedText: {
          color: colors.textMuted,
          fontSize: 13,
          textAlign: 'center',
        },
        notificationCard: {
          flexDirection: 'row',
          gap: 12,
          backgroundColor: colors.surfaceElevated,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
        },
        notificationUnread: {
          borderColor: colors.warning + '55',
          backgroundColor: colors.warningSoft,
        },
        notificationIcon: {
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        notificationIconUnread: {
          backgroundColor: colors.warningSoft,
        },
        notificationContent: {
          flex: 1,
        },
        notificationHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        notificationTitle: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '900',
          flex: 1,
        },
        unreadDot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.warning,
        },
        notificationBody: {
          color: colors.textSoft,
          fontSize: 13,
          marginTop: 4,
          lineHeight: 18,
        },
        notificationDate: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '800',
          marginTop: 8,
        },
      }),
    [colors, unreadCount, saving]
  );

  return (
    <ScreenLayout title="NOTIFICACIONES" type="profiles">
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.text} size={22} />
        </Pressable>
        <View style={styles.summary}>
          <Bell color={colors.warning} size={18} />
          <Text style={styles.summaryText}>
            {unreadCount === 0 ? 'Sin pendientes' : `${unreadCount} sin leer`}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Text style={styles.sectionTitle}>Bandeja interna</Text>
        <Pressable
          style={styles.readAllBtn}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0 || saving}
        >
          <CheckCheck color={colors.accent} size={16} />
          <Text style={styles.readAllText}>{saving ? 'Marcando...' : 'Leer todas'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
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
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyCard}>
              <Bell color={colors.textMuted} size={34} />
              <Text style={styles.emptyTitle}>No tenés notificaciones</Text>
              <Text style={styles.mutedText}>Cuando pase algo importante, va a aparecer acá.</Text>
            </View>
          ) : (
            <>
              {notifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onPress={() => handlePressNotification(notification)}
                  colors={colors}
                />
              ))}

              <Pressable
                style={styles.clearAllBtn}
                onPress={handleClearAll}
                disabled={saving}
              >
                <Trash2 color={colors.danger} size={16} />
                <Text style={styles.clearAllText}>Limpiar todas las notificaciones</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

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
    </ScreenLayout>
  );
}

// Componente auxiliar que ahora recibe colors como prop
function NotificationCard({
  notification,
  onPress,
  colors,
}: {
  notification: AppNotification;
  onPress: () => void;
  colors: any;
}) {
  const Icon = getNotificationIcon(notification.type);

  // Estilos locales con los colores recibidos (se podría optimizar con useMemo pero no es necesario aquí)
  const isUnread = !notification.read;

  return (
    <Pressable
      style={[
        {
          flexDirection: 'row',
          gap: 12,
          backgroundColor: colors.surfaceElevated,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isUnread ? colors.warning + '55' : colors.border,
          padding: 14,
        },
        isUnread && { backgroundColor: colors.warningSoft },
      ]}
      onPress={onPress}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isUnread ? colors.warningSoft : colors.surface,
        }}
      >
        <Icon color={isUnread ? colors.warning : colors.textMuted} size={19} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', flex: 1 }}>
            {notification.title}
          </Text>
          {isUnread && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }} />
          )}
        </View>
        {!!notification.body && (
          <Text style={{ color: colors.textSoft, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
            {notification.body}
          </Text>
        )}
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '800', marginTop: 8 }}>
          {formatNotificationDate(notification.created_at)}
        </Text>
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