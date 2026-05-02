import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';

export default function CreateRoomModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [roomName, setRoomName] = useState('');
  const [selectedMode, setSelectedMode] = useState('Supervivencia');
  const [showModes, setShowModes] = useState(false);
  const [teamsEnabled, setTeamsEnabled] = useState(false);

  const modes = ['Supervivencia', 'Quiz semanal', 'Battle Royale'];

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          
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
              placeholderTextColor="#4b5563"
              value={roomName}
              onChangeText={setRoomName}
            />

            <Text style={styles.label}>Modo de Sala</Text>
            <View style={{ zIndex: 10 }}> 
              <Pressable 
                style={[styles.input, styles.customPickerBtn]} 
                onPress={() => setShowModes(!showModes)}
              >
                <Text style={{ color: 'white', fontSize: 16 }}>{selectedMode}</Text>
                <ChevronDown color="#4b5563" size={20} />
              </Pressable>

              {/* MENU FLOTANTE (No alarga el modal) */}
              {showModes && (
                <View style={styles.dropdownMenu}>
                  {modes.map((mode) => (
                    <Pressable 
                      key={mode} 
                      style={styles.dropdownItem} 
                      onPress={() => {
                        setSelectedMode(mode);
                        setShowModes(false);
                      }}
                    >
                      <Text style={[
                        styles.dropdownText, 
                        selectedMode === mode && { color: '#22c55e' }
                      ]}>
                        {mode}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable 
              style={styles.checkboxContainer} 
              onPress={() => setTeamsEnabled(!teamsEnabled)}
            >
              <View style={[styles.checkbox, teamsEnabled && styles.checkboxChecked]} />
              <View style={styles.checkboxTextContainer}>
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
    justifyContent: 'center'
  },
  customPickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenu: {
    position: 'absolute', // <--- Clave para que no empuje el contenido
    top: 60, 
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5, // Sombra para Android
    shadowColor: '#000', // Sombra para iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  dropdownText: { color: 'white', fontSize: 15, fontWeight: '500' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#4b5563', backgroundColor: '#0f172a', marginTop: 2 },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkboxTextContainer: { flex: 1 },
  checkboxLabel: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  checkboxSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
  createBtn: { backgroundColor: '#22c55e', borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 15 },
  createBtnText: { color: 'white', fontWeight: '900', fontSize: 18 }
});