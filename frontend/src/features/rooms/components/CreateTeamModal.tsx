import React, { useState } from 'react';
import { ActivityIndicator, Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

const teamColors = ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function CreateTeamModal({
  visible,
  onClose,
  onCreate,
  saving,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
  saving?: boolean;
}) {
  const colors = useThemeStore((s) => s.colors);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(teamColors[0]);

  const handleCreate = () => {
    if (!name.trim() || saving) return;
    onCreate(name.trim(), selectedColor);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.content, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Crear Team</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
              <X color={colors.text} size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Nombre del Team</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.inputBorder }]}
              placeholder="Ej: Los Matemáticos"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>Color del Team</Text>
            <View style={styles.colorRow}>
              {teamColors.map(c => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    selectedColor === c && { borderWidth: 3, borderColor: colors.text }
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
          </View>

          <Pressable style={[styles.createBtn, { backgroundColor: colors.info }, saving && styles.disabledBtn]} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={[styles.createBtnText, { color: colors.text }]}>Crear Team</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 25
  },
  content: {
    borderRadius: 28,
    padding: 25,
    borderWidth: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  form: { marginBottom: 30 },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12
  },
  input: {
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    borderWidth: 1
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 12
  },
  createBtn: {
    borderRadius: 18,
    padding: 18,
    alignItems: 'center'
  },
  disabledBtn: { opacity: 0.7 },
  createBtnText: {
    fontWeight: 'bold',
    fontSize: 18
  }
});
