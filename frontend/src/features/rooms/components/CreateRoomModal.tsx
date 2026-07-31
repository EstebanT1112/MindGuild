import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
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
  const colors = useThemeStore(state => state.colors);
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
        <View style={[styles.content, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Crear Sala</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]} disabled={loading}>
              <X color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Nombre de la Sala</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Ej: Calculo I - Final"
              placeholderTextColor={colors.textSoft}
              value={roomName}
              onChangeText={setRoomName}
              editable={!loading}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Modo de Sala</Text>
            <View style={{ zIndex: 10 }}>
              <Pressable
                style={[styles.input, styles.customPickerBtn, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}
                onPress={() => setShowModes(!showModes)}
                disabled={loading}
              >
                <Text style={{ color: colors.text, fontSize: 16 }}>{selectedModeLabel}</Text>
                <ChevronDown color={colors.textSoft} size={20} />
              </Pressable>

              {showModes && (
                <View style={[styles.dropdownMenu, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
                  {modes.map((mode) => (
                    <Pressable
                      key={mode.value}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedMode(mode.value);
                        setShowModes(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText,
                        { color: colors.text },
                        selectedMode === mode.value && { color: colors.accent },
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
              <View style={[styles.checkbox, { backgroundColor: colors.input, borderColor: colors.inputBorder }, teamsEnabled && { backgroundColor: colors.accent, borderColor: colors.accent }]} />
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Habilitar equipos</Text>
                <Text style={[styles.checkboxSub, { color: colors.textSoft }]}>Permite crear teams dentro de esta sala</Text>
              </View>
            </Pressable>
          </View>

          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.accent }, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.createBtnText, { color: colors.avatarText }]}>Crear Sala</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
  content: { borderRadius: 28, padding: 25, borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  form: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
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
    borderRadius: 15,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownText: { fontSize: 15, fontWeight: '500' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, marginTop: 2 },
  checkboxTextContainer: { flex: 1 },
  checkboxLabel: { fontSize: 16, fontWeight: 'bold' },
  checkboxSub: { fontSize: 13, marginTop: 2 },
  createBtn: { borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 15 },
  createBtnText: { fontWeight: '900', fontSize: 18 },
});