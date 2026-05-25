import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Minus, Plus, Timer, Infinity as InfinityIcon } from 'lucide-react-native';

// Interfaz para pasar la configuración limpia
export interface SessionConfigData {
  sessionType: 'pomodoro' | 'libre';
  duration: number;
  cycles: number;
  shortBreak: number;
  longBreak: number;
  longBreakFreq: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: (data: SessionConfigData) => void;
}

export default function SessionConfigModal({ visible, onClose, onSave }: Props) {
  const [sessionType, setSessionType] = useState<'pomodoro' | 'libre'>('pomodoro');
  const [duration, setDuration] = useState(25);
  const [cycles, setCycles] = useState(4);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakFreq, setLongBreakFreq] = useState(4);

  // Opciones rápidas para los chips
  const durationOptions = [15, 25, 45, 60];
  const shortBreakOptions = [3, 5, 10];

  const handleSave = () => {
    if (onSave) {
      onSave({
        sessionType,
        duration,
        cycles,
        shortBreak,
        longBreak,
        longBreakFreq
      });
    }
    onClose();
  };

  const Counter = ({ value, setter, color = '#22c55e', min = 1 }: any) => (
    <View style={styles.counterRow}>
      <Pressable style={styles.stepBtn} onPress={() => setter(Math.max(min, value - 1))}>
        <Minus color="#94a3b8" size={20} />
      </Pressable>
      <View style={styles.valueDisplay}>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
      </View>
      <Pressable style={styles.stepBtn} onPress={() => setter(value + 1)}>
        <Plus color="#94a3b8" size={20} />
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Timer color="#22c55e" size={22} />
              <Text style={styles.title}>Configurar Sesión</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="#94a3b8" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            
            {/* TIPO DE ESTUDIO */}
            <Text style={styles.label}>MODO DE ESTUDIO</Text>
            <View style={styles.modeToggleRow}>
              <Pressable 
                style={[styles.modeBtn, sessionType === 'pomodoro' && styles.modeBtnActive]} 
                onPress={() => setSessionType('pomodoro')}
              >
                <Timer color={sessionType === 'pomodoro' ? 'white' : '#64748b'} size={20} />
                <Text style={[styles.modeBtnText, sessionType === 'pomodoro' && styles.modeBtnTextActive]}>Pomodoro</Text>
              </Pressable>

              <Pressable 
                style={[styles.modeBtn, sessionType === 'libre' && styles.modeBtnActive]} 
                onPress={() => setSessionType('libre')}
              >
                <InfinityIcon color={sessionType === 'libre' ? 'white' : '#64748b'} size={20} />
                <Text style={[styles.modeBtnText, sessionType === 'libre' && styles.modeBtnTextActive]}>Modo Libre</Text>
              </Pressable>
            </View>

            {sessionType === 'pomodoro' ? (
              <>
                {/* CONFIG POMODORO */}
                <Text style={styles.label}>TIEMPO DE ENFOQUE (MINUTOS)</Text>
                <Counter value={duration} setter={setDuration} color="#22c55e" min={5} />
                <View style={styles.chipRow}>
                  {durationOptions.map(opt => (
                    <Pressable 
                      key={opt} 
                      style={[styles.chip, duration === opt && styles.chipActive]} 
                      onPress={() => setDuration(opt)}
                    >
                      <Text style={[styles.chipText, duration === opt && styles.chipTextActive]}>{opt}m</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>CANTIDAD DE CICLOS</Text>
                <Counter value={cycles} setter={setCycles} color="#eab308" min={1} />

                <View style={styles.divider} />

                <Text style={styles.label}>RECREO CORTO (MINUTOS)</Text>
                <Counter value={shortBreak} setter={setShortBreak} color="#06b6d4" min={1} />
                <View style={styles.chipRow}>
                  {shortBreakOptions.map(opt => (
                    <Pressable 
                      key={opt} 
                      style={[styles.chip, shortBreak === opt && styles.chipActiveBreak]} 
                      onPress={() => setShortBreak(opt)}
                    >
                      <Text style={[styles.chipText, shortBreak === opt && styles.chipTextActive]}>{opt}m</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.divider} />

                <Text style={styles.label}>RECREO LARGO (MINUTOS)</Text>
                <Counter value={longBreak} setter={setLongBreak} color="#3b82f6" min={5} />

                <View style={styles.divider} />

                <Text style={styles.label}>FRECUENCIA DE RECREO LARGO (CADA X CICLOS)</Text>
                <Counter value={longBreakFreq} setter={setLongBreakFreq} color="#a855f7" min={1} />

                <Text style={styles.totalStudy}>Tiempo total de estudio: {duration * cycles} minutos</Text>
              </>
            ) : (
              <View style={styles.libreNoticeBox}>
                <InfinityIcon color="#22c55e" size={40} />
                <Text style={styles.libreNoticeTitle}>Modo Libre Activado</Text>
                <Text style={styles.libreNoticeDesc}>
                  El cronómetro contará de forma progresiva comenzando en 00:00. Ideal para flujos de enfoque continuos sin pausas preprogramadas.
                </Text>
              </View>
            )}

          </ScrollView>

          {/* BOTÓN DE ACCIÓN PRINCIPAL */}
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>GUARDAR CONFIGURACIÓN</Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#0f172a', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%', borderWidth: 1, borderColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: 'white', fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 30 },
  label: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  valueDisplay: { width: 80, alignItems: 'center' },
  valueText: { fontSize: 42, fontWeight: '900' },
  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 15 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#14532d', borderColor: '#22c55e' },
  chipActiveBreak: { backgroundColor: '#083344', borderColor: '#06b6d4' },
  chipText: { color: '#94a3b8', fontWeight: 'bold' },
  chipTextActive: { color: 'white' },
  totalStudy: { color: '#64748b', textAlign: 'center', marginTop: 15, fontWeight: 'bold', fontSize: 13 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
  modeToggleRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  modeBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#1e293b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  modeBtnActive: { backgroundColor: '#12a14b', borderColor: '#22c55e' },
  modeBtnText: { color: '#64748b', fontWeight: 'bold', fontSize: 14 },
  modeBtnTextActive: { color: 'white' },
  libreNoticeBox: { alignItems: 'center', padding: 20, backgroundColor: '#22c55e10', borderRadius: 20, borderWidth: 1, borderColor: '#22c55e30', marginVertical: 20 },
  libreNoticeTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  libreNoticeDesc: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  saveBtn: { backgroundColor: '#22c55e', height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  saveBtnText: { color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 }
});