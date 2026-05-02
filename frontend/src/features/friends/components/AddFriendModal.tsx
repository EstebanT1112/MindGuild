import React from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { X, Search } from 'lucide-react-native';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddFriendModal({ visible, onClose }: AddFriendModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar Amigo</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <Text style={styles.label}>Nombre de usuario</Text>
          <View style={styles.inputContainer}>
            <Search color="#64748b" size={18} />
            <TextInput 
              style={styles.input} 
              placeholder="@usuario" 
              placeholderTextColor="#64748b" 
            />
          </View>
          <Text style={styles.hint}>Busca por nombre de usuario exacto</Text>

          <Pressable style={styles.submitBtn}>
            <Text style={styles.submitText}>Enviar Solicitud</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#94a3b8', marginBottom: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 15, height: 50, gap: 10, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, color: 'white' },
  hint: { color: '#64748b', fontSize: 12, marginTop: 8 },
  submitBtn: { backgroundColor: '#334155', height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  submitText: { color: '#64748b', fontWeight: 'bold' }
});