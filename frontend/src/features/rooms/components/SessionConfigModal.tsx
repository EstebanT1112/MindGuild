import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Minus, Plus, Timer, Infinity as InfinityIcon } from 'lucide-react-native';

export default function SessionConfigModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [sessionType, setSessionType] = useState<'pomodoro' | 'libre'>('pomodoro');
  const [duration, setDuration] = useState(25);
  const [cycles, setCycles] = useState(4);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakFreq, setLongBreakFreq] = useState(4);

  // Opciones rápidas para los chips
  const durationOptions = [15, 25, 45, 60];
  const shortBreakOptions = [3, 5, 10];

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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Configurar Sesión</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}><X color="white" size={20} /></Pressable>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            
            {/* TIPO DE SESIÓN */}
            <Text style={styles.sectionLabel}>TIPO DE SESIÓN</Text>
            <View style={styles.typeRow}>
              <Pressable 
                style={[styles.typeCard, sessionType === 'pomodoro' && styles.typeCardActive]} 
                onPress={() => setSessionType('pomodoro')}
              >
                <Timer color={sessionType === 'pomodoro' ? '#22c55e' : '#64748b'} size={32} />
                <Text style={[styles.typeTitle, sessionType === 'pomodoro' && { color: '#22c55e' }]}>Pomodoro</Text>
                <Text style={styles.typeSub}>Sesión enfocada</Text>
              </Pressable>
              <Pressable 
                style={[styles.typeCard, sessionType === 'libre' && styles.typeCardActiveLibre]} 
                onPress={() => setSessionType('libre')}
              >
                <InfinityIcon color={sessionType === 'libre' ? '#94a3b8' : '#64748b'} size={32} />
                <Text style={styles.typeTitle}>Libre</Text>
                <Text style={styles.typeSub}>Sin límites</Text>
              </Pressable>
            </View>

            {/* DURACIÓN */}
            <View style={styles.configBox}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxTitle}>Duración</Text>
                <Text style={styles.boxSub}>por ciclo</Text>
              </View>
              <Counter value={duration} setter={setDuration} />
              <Text style={styles.unitLabel}>minutos</Text>
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
            </View>

            {/* CICLOS */}
            <View style={styles.configBox}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxTitle}>Ciclos</Text>
                <Text style={styles.boxSub}>repeticiones</Text>
              </View>
              <Counter value={cycles} setter={setCycles} />
              <Text style={styles.unitLabel}>ciclos</Text>
              <Text style={styles.totalStudy}>Total estudio: <Text style={{color: '#22c55e'}}>{duration * cycles} min</Text></Text>
            </View>

            {/* DESCANSO CORTO */}
            <View style={styles.configBox}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxTitle}>Descanso Corto</Text>
                <Text style={styles.boxSub}>entre ciclos</Text>
              </View>
              <Counter value={shortBreak} setter={setShortBreak} color="#06b6d4" />
              <Text style={styles.unitLabel}>minutos</Text>
              <View style={styles.chipRow}>
                {shortBreakOptions.map(opt => (
                  <Pressable 
                    key={opt} 
                    style={[styles.chip, styles.chipBreak, shortBreak === opt && styles.chipActiveBreak]} 
                    onPress={() => setShortBreak(opt)}
                  >
                    <Text style={[styles.chipText, shortBreak === opt && styles.chipTextActive]}>{opt}m</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* DESCANSO LARGO */}
            <View style={styles.configBox}>
              <View style={styles.boxHeader}>
                <Text style={styles.boxTitle}>Descanso Largo</Text>
                <Text style={styles.boxSub}>ocasional</Text>
              </View>
              <Counter value={longBreak} setter={setLongBreak} color="#a855f7" />
              <Text style={styles.unitLabel}>minutos</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.subBoxTitle}>Cada cuántos ciclos</Text>
              <View style={styles.freqRow}>
                 <Counter value={longBreakFreq} setter={setLongBreakFreq} color="#a855f7" />
              </View>
              <Text style={styles.freqHint}>Descanso largo después del ciclo {longBreakFreq}, {longBreakFreq*2}, {longBreakFreq*3}...</Text>
            </View>

            <Pressable style={styles.saveBtn} onPress={onClose}>
              <Text style={styles.saveBtnText}>Guardar Configuración</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#1e293b', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 25, height: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  
  sectionLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  typeRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  typeCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  typeCardActive: { borderColor: '#22c55e', backgroundColor: '#14532d22' },
  typeCardActiveLibre: { borderColor: '#4b5563' },
  typeTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  typeSub: { color: '#64748b', fontSize: 12 },

  configBox: { backgroundColor: '#0f172a', borderRadius: 28, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  boxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 },
  boxTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  boxSub: { color: '#64748b', fontSize: 12 },
  
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  valueDisplay: { width: 80, alignItems: 'center' },
  valueText: { fontSize: 42, fontWeight: '900' },
  unitLabel: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 5 },
  
  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#14532d', borderColor: '#22c55e' },
  chipBreak: { },
  chipActiveBreak: { backgroundColor: '#083344', borderColor: '#06b6d4' },
  chipText: { color: '#94a3b8', fontWeight: 'bold' },
  chipTextActive: { color: 'white' },

  totalStudy: { color: '#64748b', textAlign: 'center', marginTop: 15, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 20 },
  subBoxTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  freqRow: { marginBottom: 10 },
  freqHint: { color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 10 },

  saveBtn: { backgroundColor: '#22c55e', borderRadius: 24, padding: 20, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: '900', fontSize: 18 }
});