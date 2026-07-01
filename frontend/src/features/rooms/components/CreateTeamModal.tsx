import React, { useState } from 'react';
import { ActivityIndicator, Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X } from 'lucide-react-native';

// Colores idénticos a tu captura de Figma
const colors = ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

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
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleCreate = () => {
    if (!name.trim() || saving) return;
    onCreate(name.trim(), selectedColor);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Team</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Nombre del Team</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Los Matemáticos" 
              placeholderTextColor="#4b5563"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Color del Team</Text>
            <View style={styles.colorRow}>
              {colors.map(c => (
                <Pressable 
                  key={c} 
                  style={[
                    styles.colorCircle, 
                    { backgroundColor: c }, 
                    selectedColor === c && styles.colorActive
                  ]} 
                  onPress={() => setSelectedColor(c)} 
                />
              ))}
            </View>
          </View>

          <Pressable style={[styles.createBtn, saving && styles.disabledBtn]} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.createBtnText}>Crear Team</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.85)', 
    justifyContent: 'center', 
    padding: 25 
  },
  content: { 
    backgroundColor: '#1e293b', 
    borderRadius: 28, 
    padding: 25,
    borderWidth: 1,
    borderColor: '#334155'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#334155', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  form: { marginBottom: 30 },
  label: { 
    color: '#94a3b8', 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  input: { 
    backgroundColor: '#0f172a', 
    color: 'white', 
    borderRadius: 15, 
    padding: 18, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#334155' 
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
  colorActive: { 
    borderWidth: 3, 
    borderColor: 'white' 
  },
  createBtn: { 
    backgroundColor: '#3b82f6', 
    borderRadius: 18, 
    padding: 18, 
    alignItems: 'center' 
  },
  disabledBtn: { opacity: 0.7 },
  createBtnText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 18 
  }
});
