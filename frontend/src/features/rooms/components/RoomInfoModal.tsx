import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import type { RoomDetails } from '../services/roomsService';
import RoomInfoPanel from './RoomInfoPanel';

interface Props {
  visible: boolean;
  room: RoomDetails;
  onClose: () => void;
}

export default function RoomInfoModal({ visible, room, onClose }: Props) {
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
            <RoomInfoPanel room={room} />
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
});
