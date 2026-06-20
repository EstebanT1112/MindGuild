import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarClock, X } from 'lucide-react-native';
import {
    createWeeklyQuiz,
    updateWeeklyQuiz,
    type WeeklyQuiz,
    type WeeklyQuizInput,
} from '../services/battleRoyaleService';

interface WeeklyQuizModalProps {
    visible: boolean;
    onClose: () => void;
    accessToken?: string | null;
    roomId?: string | null;
    quiz?: WeeklyQuiz | null;
    isOwner: boolean;
    onSaved: (quiz: WeeklyQuiz) => void;
}

const weekdays = [
    { label: 'Lun', value: 'monday' },
    { label: 'Mar', value: 'tuesday' },
    { label: 'Mie', value: 'wednesday' },
    { label: 'Jue', value: 'thursday' },
    { label: 'Vie', value: 'friday' },
    { label: 'Sab', value: 'saturday' },
    { label: 'Dom', value: 'sunday' },
];

export default function WeeklyQuizModal({
    visible,
    onClose,
    accessToken,
    roomId,
    quiz,
    isOwner,
    onSaved,
}: WeeklyQuizModalProps) {
    const [title, setTitle] = useState('Cuestionario semanal');
    const [weekday, setWeekday] = useState('monday');
    const [startTime, setStartTime] = useState('21:00');
    const [duration, setDuration] = useState('1440');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;

        setTitle(quiz?.title ?? 'Cuestionario semanal');
        setWeekday(quiz?.weekday ?? 'monday');
        setStartTime((quiz?.start_time ?? '21:00').slice(0, 5));
        setDuration(String(quiz?.duration_minutes ?? 1440));
    }, [visible, quiz]);

    const handleSave = async () => {
        if (!accessToken || !roomId || !isOwner) return;

        const input: WeeklyQuizInput = {
            title: title.trim(),
            weekday,
            start_time: startTime.trim(),
            duration_minutes: Number(duration),
        };

        setSaving(true);
        try {
            const savedQuiz = quiz?.id
                ? await updateWeeklyQuiz(accessToken, roomId, quiz.id, input)
                : await createWeeklyQuiz(accessToken, roomId, input);

            onSaved(savedQuiz);
            onClose();
        } catch (error: any) {
            Alert.alert('No se pudo guardar', error.message ?? 'Revisa los datos e intenta nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <CalendarClock color="#a855f7" size={22} />
                            <Text style={styles.title}>Cuestionario semanal</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X color="white" size={20} />
                        </Pressable>
                    </View>

                    {!isOwner ? (
                        <View style={styles.readOnlyBox}>
                            <Text style={styles.readOnlyTitle}>
                                {quiz ? quiz.title : 'Sin cuestionario configurado'}
                            </Text>
                            <Text style={styles.readOnlyText}>
                                Solo el owner puede configurar el dia y horario del cuestionario.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.label}>Titulo</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Cuestionario semanal"
                                placeholderTextColor="#64748b"
                            />

                            <Text style={styles.label}>Dia recurrente</Text>
                            <View style={styles.weekdayRow}>
                                {weekdays.map(day => (
                                    <Pressable
                                        key={day.value}
                                        style={[styles.weekdayBtn, weekday === day.value && styles.weekdayBtnActive]}
                                        onPress={() => setWeekday(day.value)}
                                    >
                                        <Text style={[styles.weekdayText, weekday === day.value && styles.weekdayTextActive]}>
                                            {day.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.label}>Hora de inicio</Text>
                            <TextInput
                                style={styles.input}
                                value={startTime}
                                onChangeText={setStartTime}
                                placeholder="21:00"
                                placeholderTextColor="#64748b"
                            />

                            <Text style={styles.label}>Duracion en minutos</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="numeric"
                                placeholder="1440"
                                placeholderTextColor="#64748b"
                            />

                            <Text style={styles.hint}>Por defecto dura 24 horas. El backend guarda las fechas concretas en UTC.</Text>

                            <Pressable
                                style={[styles.saveBtn, saving && styles.disabledBtn]}
                                onPress={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.saveText}>{quiz ? 'Actualizar cuestionario' : 'Configurar cuestionario'}</Text>
                                )}
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: 20 },
    content: { backgroundColor: '#0f172a', borderRadius: 28, padding: 22, borderWidth: 1, borderColor: '#a855f744' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: '#1e293b', color: 'white', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155' },
    weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekdayBtn: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
    weekdayBtnActive: { backgroundColor: '#6b21a8', borderColor: '#a855f7' },
    weekdayText: { color: '#94a3b8', fontWeight: 'bold' },
    weekdayTextActive: { color: 'white' },
    hint: { color: '#64748b', fontSize: 12, marginTop: 12, lineHeight: 18 },
    saveBtn: { backgroundColor: '#a855f7', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    disabledBtn: { opacity: 0.7 },
    saveText: { color: 'white', fontSize: 16, fontWeight: '900' },
    readOnlyBox: { backgroundColor: '#1e293b', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#334155' },
    readOnlyTitle: { color: 'white', fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
    readOnlyText: { color: '#94a3b8', lineHeight: 20 },
});
