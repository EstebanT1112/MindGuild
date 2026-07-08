import { Pressable, StyleSheet, Text } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { leaveRoom } from '../services/roomsService';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';

interface Props {
  roomId?: string;
  hidden?: boolean;
}

export default function LeaveRoomButton({ roomId, hidden = false }: Props) {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const removeRoom = useAppDataStore(state => state.removeRoom);
  const [submitting, setSubmitting] = useState(false);

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

  if (hidden) {
    return null;
  }

  const confirmLeave = () => {
    showAlert(
      'Abandonar sala',
      'Vas a dejar de aparecer como integrante activo de esta sala.',
      'warning',
      handleLeave,
      'Abandonar',
      true,
      'Cancelar'
    );
  };

  const handleLeave = async () => {
    if (!roomId || !accessToken || submitting) return;

    setSubmitting(true);

    try {
      await leaveRoom(accessToken, roomId);
      removeRoom(roomId);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', {
          screen: 'Salas',
          params: { screen: 'RoomsList' },
        });
      }
    } catch (error: any) {
      showAlert('Error de sala', error.message ?? 'No se pudo abandonar la sala.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={confirmLeave}
        disabled={submitting || !roomId}
      >
        <LogOut color="#f87171" size={20} />
        <Text style={styles.text}>{submitting ? 'Saliendo...' : 'Abandonar sala'}</Text>
      </Pressable>

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
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 28,
    marginBottom: 10,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#7f1d1d',
    backgroundColor: '#450a0a55',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: { opacity: 0.65 },
  text: { color: '#f87171', fontSize: 16, fontWeight: '900' },
});