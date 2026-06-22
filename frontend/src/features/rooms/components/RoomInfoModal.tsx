import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Settings, X } from 'lucide-react-native';
import type { RoomDetails } from '../services/roomsService';
import RoomInfoPanel from './RoomInfoPanel';

interface Props {
  visible: boolean;
  room: RoomDetails;
  accessToken?: string | null;
  currentUserId?: string;
  onClose: () => void;
  onRoomUpdated?: (room: RoomDetails) => void;
  canConfigure?: boolean;
  onOpenAdmin?: () => void;
}

export default function RoomInfoModal({
  visible,
  room,
  accessToken,
  currentUserId,
  onClose,
  onRoomUpdated,
  canConfigure,
  onOpenAdmin,
}: Props) {
  // RF-06: muestra en modal los datos de sala ya cargados por la pantalla.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Datos de sala</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#94a3b8" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <RoomInfoPanel
              room={room}
              accessToken={accessToken}
              currentUserId={currentUserId}
              onRoomUpdated={onRoomUpdated}
            />

            {canConfigure && onOpenAdmin && (
              <Pressable style={styles.configureBtn} onPress={onOpenAdmin}>
                <Settings color="white" size={18} />
                <Text style={styles.configureText}>Configurar sala</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#020617cc',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    maxHeight: '82%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { color: 'white', fontSize: 18, fontWeight: '900' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configureBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  configureText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
