import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { X, Minus, Plus, Timer, Infinity as InfinityIcon } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

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
  const colors = useThemeStore(state => state.colors);
  const [sessionType, setSessionType] = useState<'pomodoro' | 'libre'>('pomodoro');
  const [duration, setDuration] = useState(25);
  const [cycles, setCycles] = useState(4);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakFreq, setLongBreakFreq] = useState(4);

  const durationOptions = [15, 25, 45, 60];
  const shortBreakOptions = [3, 5, 10];

  const handleSave = () => {
    if (onSave) {
      onSave({ sessionType, duration, cycles, shortBreak, longBreak, longBreakFreq });
    }
    onClose();
  };

  const Counter = ({ value, setter, color, min = 1 }: any) => (
    <View style={styles.counterRow}>
      <Pressable style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setter(Math.max(min, value - 1))}>
        <Minus color={colors.textMuted} size={20} />
      </Pressable>
      <View style={styles.valueDisplay}>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
      </View>
      <Pressable style={[styles.stepBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setter(value + 1)}>
        <Plus color={colors.textMuted} size={20} />
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>

          <View style={styles.header}>
            <View style={styles.headerTitleBox}>
              <Timer color={colors.accent} size={22} />
              <Text style={[styles.title, { color: colors.text }]}>Configurar Sesión</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X color={colors.textMuted} size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={[styles.label, { color: colors.textSoft }]}>MODO DE ESTUDIO</Text>
            <View style={styles.modeToggleRow}>
              <Pressable style={[styles.modeBtn, { backgroundColor: colors.background, borderColor: colors.border }, sessionType === 'pomodoro' && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setSessionType('pomodoro')}>
                <Timer color={sessionType === 'pomodoro' ? colors.background : colors.textSoft} size={20} />
                <Text style={[styles.modeBtnText, { color: colors.textSoft }, sessionType === 'pomodoro' && { color: colors.background }]}>Pomodoro</Text>
              </Pressable>

              <Pressable style={[styles.modeBtn, { backgroundColor: colors.background, borderColor: colors.border }, sessionType === 'libre' && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setSessionType('libre')}>
                <InfinityIcon color={sessionType === 'libre' ? colors.background : colors.textSoft} size={20} />
                <Text style={[styles.modeBtnText, { color: colors.textSoft }, sessionType === 'libre' && { color: colors.background }]}>Modo Libre</Text>
              </Pressable>
            </View>

            {sessionType === 'pomodoro' ? (
              <>
                <Text style={[styles.label, { color: colors.textSoft }]}>TIEMPO DE ENFOQUE (MINUTOS)</Text>
                <Counter value={duration} setter={setDuration} color={colors.accent} min={5} />
                <View style={styles.chipRow}>
                  {durationOptions.map(opt => (
                    <Pressable key={opt} style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }, duration === opt && { backgroundColor: `${colors.accent}20`, borderColor: colors.accent }]} onPress={() => setDuration(opt)}>
                      <Text style={[styles.chipText, { color: colors.textSoft }, duration === opt && { color: colors.accent }]}>{opt}m</Text>
                    </Pressable>
                  ))}
                </View>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.label, { color: colors.textSoft }]}>CANTIDAD DE CICLOS</Text>
                <Counter value={cycles} setter={setCycles} color={colors.accent} min={1} />
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.label, { color: colors.textSoft }]}>RECREO CORTO (MINUTOS)</Text>
                <Counter value={shortBreak} setter={setShortBreak} color={colors.accent} min={1} />
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.label, { color: colors.textSoft }]}>RECREO LARGO (MINUTOS)</Text>
                <Counter value={longBreak} setter={setLongBreak} color={colors.accent} min={5} />
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.label, { color: colors.textSoft }]}>FRECUENCIA (CADA X CICLOS)</Text>
                <Counter value={longBreakFreq} setter={setLongBreakFreq} color={colors.accent} min={1} />
                
                <Text style={[styles.totalStudy, { color: colors.textSoft }]}>
                  Tiempo total de estudio: {duration * cycles} minutos
                </Text>
              </>
            ) : (
              <View style={[styles.libreNoticeBox, { backgroundColor: `${colors.accent}10`, borderColor: `${colors.accent}30` }]}>
                <InfinityIcon color={colors.accent} size={40} />
                <Text style={[styles.libreNoticeTitle, { color: colors.text }]}>Modo Libre Activado</Text>
                <Text style={[styles.libreNoticeDesc, { color: colors.textSoft }]}>El cronómetro contará de forma progresiva. Ideal para flujos de enfoque continuos.</Text>
              </View>
            )}
          </ScrollView>

          <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
            <Text style={[styles.saveBtnText, { color: colors.background }]}>GUARDAR CONFIGURACIÓN</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%', borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 30 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  stepBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  valueDisplay: { width: 80, alignItems: 'center' },
  valueText: { fontSize: 42, fontWeight: '900' },
  chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 20 },
  modeToggleRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  modeBtn: { flex: 1, height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  modeBtnText: { fontWeight: 'bold', fontSize: 14 },
  libreNoticeBox: { alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1, marginVertical: 20 },
  libreNoticeTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  libreNoticeDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  saveBtn: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  saveBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  totalStudy: { textAlign: 'center', marginTop: 15, fontWeight: 'bold', fontSize: 13 }
});
