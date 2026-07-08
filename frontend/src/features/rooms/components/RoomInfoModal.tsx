import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Settings, X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { RoomDetails } from '../services/roomsService';
import RoomInfoPanel from './RoomInfoPanel';

interface Props {
  visible: boolean;
  onClose: () => void;
  room: RoomDetails;
  accessToken?: string | null;
  currentUserId?: string;
  onRoomUpdated?: (room: RoomDetails) => void;
  canConfigure?: boolean;
  onOpenAdmin?: () => void;
}

export default function RoomInfoModal(props: Props) {
  const colors = useThemeStore(state => state.colors);

  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Datos de sala</Text>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={props.onClose}>
              <X color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <RoomInfoPanel
              room={props.room}
              accessToken={props.accessToken}
              currentUserId={props.currentUserId}
              onRoomUpdated={props.onRoomUpdated}
            />

            {props.canConfigure && props.onOpenAdmin && (
              <Pressable style={[styles.configureBtn, { backgroundColor: colors.accent }]} onPress={props.onOpenAdmin}>
                <Settings color={colors.background} size={18} />
                <Text style={{ color: colors.background, fontWeight: '900' }}>Configurar sala</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  modal: { maxHeight: '82%', borderRadius: 24, borderWidth: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  configureBtn: { height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
});