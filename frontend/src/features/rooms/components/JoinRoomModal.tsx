import React, { useState } from 'react';
import { ActivityIndicator, Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

interface Props {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => void;
}

export default function JoinRoomModal({ visible, loading = false, onClose, onJoin }: Props) {
  const colors = useThemeStore(state => state.colors);
  const [code, setCode] = useState('');

  const handleJoin = () => {
    onJoin(code);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Unirse a Sala</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]} disabled={loading}>
              <X color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Codigo de Invitacion</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="EJ: ABCD1234"
              placeholderTextColor={colors.textSoft}
              autoCapitalize="characters"
              value={code}
              onChangeText={setCode}
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.joinBtn, { backgroundColor: '#3b82f6' }, loading && { opacity: 0.7 }]}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.joinBtnText}>Unirse</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  modalContent: { borderRadius: 28, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 30 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  input: { borderRadius: 15, padding: 18, fontSize: 16, borderWidth: 1, textAlign: 'center', letterSpacing: 2 },
  joinBtn: { borderRadius: 18, padding: 18, alignItems: 'center' },
  joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});