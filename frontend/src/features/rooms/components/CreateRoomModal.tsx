import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import type { RoomMode } from '../services/roomsService';

interface CreateRoomModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; mode: RoomMode; teams_enabled: boolean }) => void;
}

const modes: Array<{ label: string; value: RoomMode }> = [
  { label: 'Supervivencia', value: 'survival' },
  { label: 'Battle Royale', value: 'battle_royale' },
];

export default function CreateRoomModal({
  visible,
  loading = false,
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [selectedMode, setSelectedMode] = useState<RoomMode>('survival');
  const [showModes, setShowModes] = useState(false);
  const [teamsEnabled, setTeamsEnabled] = useState(false);

  const selectedModeLabel = modes.find(mode => mode.value === selectedMode)?.label ?? 'Supervivencia';

  const handleCreate = () => {
    onCreate({ name: roomName, mode: selectedMode, teams_enabled: teamsEnabled });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Sala</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre de la Sala</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Calculo I - Final"
              placeholderTextColor="#4b5563"
              value={roomName}
              onChangeText={setRoomName}
              editable={!loading}
            />

            <Text style={styles.label}>Modo de Sala</Text>
            <View style={{ zIndex: 10 }}>
              <Pressable
                style={[styles.input, styles.customPickerBtn]}
                onPress={() => setShowModes(!showModes)}
                disabled={loading}
              >
                <Text style={{ color: 'white', fontSize: 16 }}>{selectedModeLabel}</Text>
                <ChevronDown color="#4b5563" size={20} />
              </Pressable>

              {showModes && (
                <View style={styles.dropdownMenu}>
                  {modes.map((mode) => (
                    <Pressable
                      key={mode.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedMode(mode.value);
                        setShowModes(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText,
                        selectedMode === mode.value && { color: '#22c55e' },
                      ]}>
                        {mode.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={styles.checkboxContainer}
              onPress={() => setTeamsEnabled(!teamsEnabled)}
              disabled={loading}
            >
              <View style={[styles.checkbox, teamsEnabled && styles.checkboxChecked]} />
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>Habilitar equipos</Text>
                <Text style={styles.checkboxSub}>Permite crear teams dentro de esta sala</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            style={[styles.createBtn, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Crear Sala</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 25 },
  content: { backgroundColor: '#1e293b', borderRadius: 28, padding: 25, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 20 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  input: {
    backgroundColor: '#0f172a',
    color: 'white',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
    height: 58,
    justifyContent: 'center',
  },
  customPickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dropdownText: { color: 'white', fontSize: 15, fontWeight: '500' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#4b5563', backgroundColor: '#0f172a', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxTextContainer: { flex: 1 },
  checkboxLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  checkboxSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
  createBtn: { backgroundColor: '#22c55e', borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 15 },
  createBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
});
