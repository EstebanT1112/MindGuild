import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ visible, onClose }: Props) {
  const [roomName, setRoomName] = useState('');
  const [mode, setMode] = useState('Supervivencia');
  const [teamsEnabled, setTeamsEnabled] = useState(false);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Sala</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre de la Sala</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Cálculo I - Final"
              placeholderTextColor="#64748b"
              value={roomName}
              onChangeText={setRoomName}
            />

            <Text style={styles.label}>Modo de Sala</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={mode}
                onValueChange={(itemValue: React.SetStateAction<string>) => setMode(itemValue)}
                style={styles.picker}
                dropdownIconColor="white"
              >
                <Picker.Item label="Supervivencia" value="Supervivencia" />
                <Picker.Item label="Battle Royale" value="Battle Royale" />
                <Picker.Item label="Quiz Semanal" value="Quiz Semanal" />
              </Picker>
            </View>

            <Pressable 
              style={styles.checkboxRow} 
              onPress={() => setTeamsEnabled(!teamsEnabled)}
            >
              <View style={[styles.checkbox, teamsEnabled && styles.checkboxActive]} />
              <View>
                <Text style={styles.checkboxLabel}>Habilitar equipos (Teams)</Text>
                <Text style={styles.checkboxSub}>Los miembros podrán unirse a diferentes equipos</Text>
              </View>
            </Pressable>
          </View>

          <Pressable style={styles.createBtn} onPress={onClose}>
            <Text style={styles.createBtnText}>Crear Sala</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 28, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 30 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#0f172a', color: 'white', borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#334155' },
  pickerWrapper: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  picker: { color: 'white' },
  checkboxRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#4b5563', backgroundColor: '#334155' },
  checkboxActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxLabel: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  checkboxSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  createBtn: { backgroundColor: '#22c55e', borderRadius: 16, padding: 18, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});