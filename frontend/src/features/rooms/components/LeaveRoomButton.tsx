import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { leaveRoom } from '../services/roomsService';

interface Props {
  roomId?: string;
}

export default function LeaveRoomButton({ roomId }: Props) {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const [submitting, setSubmitting] = useState(false);

  // RF-07: pide confirmacion antes de ejecutar la baja logica de membresia.
  const confirmLeave = () => {
    Alert.alert(
      'Abandonar sala',
      'Vas a dejar de aparecer como integrante activo de esta sala.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abandonar', style: 'destructive', onPress: handleLeave },
      ]
    );
  };

  // RF-07: llama al backend para abandonar la sala y saca al usuario de la vista.
  const handleLeave = async () => {
    if (!roomId || !accessToken || submitting) return;

    setSubmitting(true);

    try {
      await leaveRoom(accessToken, roomId);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('MainTabs', {
          screen: 'Salas',
          params: { screen: 'RoomsList' },
        });
      }
    } catch (error: any) {
      Alert.alert('Error de sala', error.message ?? 'No se pudo abandonar la sala.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Pressable
      style={[styles.button, submitting && styles.buttonDisabled]}
      onPress={confirmLeave}
      disabled={submitting || !roomId}
    >
      <LogOut color="#f87171" size={20} />
      <Text style={styles.text}>{submitting ? 'Saliendo...' : 'Abandonar sala'}</Text>
    </Pressable>
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
