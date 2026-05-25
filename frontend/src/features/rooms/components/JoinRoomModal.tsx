import React, { useState } from 'react';
import { ActivityIndicator, Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onJoin: (inviteCode: string) => void;
}

export default function JoinRoomModal({ visible, loading = false, onClose, onJoin }: Props) {
  const [code, setCode] = useState('');

  // RF-05: envia el codigo ingresado para intentar unirse a la sala.
  const handleJoin = () => {
    onJoin(code);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Unirse a Sala</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Codigo de Invitacion</Text>
            <TextInput
              style={styles.input}
              placeholder="EJ: ABCD1234"
              placeholderTextColor="#64748b"
              autoCapitalize="characters"
              value={code}
              onChangeText={setCode}
              editable={!loading}
            />
          </View>

          <Pressable
            style={[styles.joinBtn, loading && { opacity: 0.7 }]}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 28, padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 30 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  input: { backgroundColor: '#0f172a', color: 'white', borderRadius: 15, padding: 18, fontSize: 16, borderWidth: 1, borderColor: '#334155', textAlign: 'center', letterSpacing: 2 },
  joinBtn: { backgroundColor: '#3b82f6', borderRadius: 18, padding: 18, alignItems: 'center' },
  joinBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
