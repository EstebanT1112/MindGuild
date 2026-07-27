import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalendarClock, X } from 'lucide-react-native';
import {
    createWeeklyQuiz,
    updateWeeklyQuiz,
    type WeeklyQuiz,
    type WeeklyQuizInput,
} from '../services/battleRoyaleService';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useThemeStore } from '../../../store/themeStore';

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
    const colors = useThemeStore((s) => s.colors);
    const [title, setTitle] = useState('Cuestionario semanal');
    const [weekday, setWeekday] = useState('monday');
    const [startTime, setStartTime] = useState('21:00');
    const [duration, setDuration] = useState('1440');
    const [saving, setSaving] = useState(false);

    const [alert, setAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
        confirmText?: string;
        showCancel?: boolean;
        cancelText?: string;
        onCancel?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (
        title: string,
        message: string,
        type: AlertType = 'info',
        onConfirm?: () => void,
        confirmText?: string,
        showCancel?: boolean,
        cancelText?: string,
        onCancel?: () => void
    ) => {
        setAlert({
            visible: true,
            title,
            message,
            type,
            onConfirm,
            confirmText: confirmText || 'Aceptar',
            showCancel: showCancel || false,
            cancelText: cancelText || 'Cancelar',
            onCancel,
        });
    };

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
            showAlert('No se pudo guardar', error.message ?? 'Revisa los datos e intenta nuevamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Modal visible={visible} animationType="fade" transparent>
                <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                    <View style={[styles.content, { backgroundColor: colors.background, borderColor: `${colors.purple}44` }]}>
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <CalendarClock color={colors.purple} size={22} />
                                <Text style={[styles.title, { color: colors.text }]}>Cuestionario semanal</Text>
                            </View>
                            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }]}>
                                <X color={colors.text} size={20} />
                            </Pressable>
                        </View>

                        {!isOwner ? (
                            <View style={[styles.readOnlyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                <Text style={[styles.readOnlyTitle, { color: colors.text }]}>
                                    {quiz ? quiz.title : 'Sin cuestionario configurado'}
                                </Text>
                                <Text style={[styles.readOnlyText, { color: colors.textMuted }]}>
                                    Solo el owner puede configurar el día y horario del cuestionario.
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={[styles.label, { color: colors.textMuted }]}>Título</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Cuestionario semanal"
                                    placeholderTextColor={colors.textSoft}
                                />

                                <Text style={[styles.label, { color: colors.textMuted }]}>Día recurrente</Text>
                                <View style={styles.weekdayRow}>
                                    {weekdays.map(day => (
                                        <Pressable
                                            key={day.value}
                                            style={[
                                                styles.weekdayBtn,
                                                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                                weekday === day.value && { backgroundColor: colors.purpleSoft, borderColor: colors.purple }
                                            ]}
                                            onPress={() => setWeekday(day.value)}
                                        >
                                            <Text style={[
                                                styles.weekdayText,
                                                { color: colors.textMuted },
                                                weekday === day.value && { color: colors.text }
                                            ]}>
                                                {day.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={[styles.label, { color: colors.textMuted }]}>Hora de inicio</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="21:00"
                                    placeholderTextColor={colors.textSoft}
                                />

                                <Text style={[styles.label, { color: colors.textMuted }]}>Duración en minutos</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                                    value={duration}
                                    onChangeText={setDuration}
                                    keyboardType="numeric"
                                    placeholder="1440"
                                    placeholderTextColor={colors.textSoft}
                                />

                                <Text style={[styles.hint, { color: colors.textSoft }]}>Por defecto dura 24 horas. El backend guarda las fechas concretas en UTC.</Text>

                                <Pressable
                                    style={[styles.saveBtn, { backgroundColor: colors.purple }, saving && styles.disabledBtn]}
                                    onPress={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color={colors.text} />
                                    ) : (
                                        <Text style={[styles.saveText, { color: colors.text }]}>{quiz ? 'Actualizar cuestionario' : 'Configurar cuestionario'}</Text>
                                    )}
                                </Pressable>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            <AppAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    if (alert.onConfirm) {
                        alert.onConfirm();
                    } else {
                        setAlert(prev => ({ ...prev, visible: false }));
                    }
                }}
                onCancel={() => {
                    if (alert.onCancel) alert.onCancel();
                    setAlert(prev => ({ ...prev, visible: false }));
                }}
                confirmText={alert.confirmText || 'Aceptar'}
                cancelText={alert.cancelText || 'Cancelar'}
                showCancel={alert.showCancel || false}
            />
        </>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'center', padding: 20 },
    content: { borderRadius: 28, padding: 22, borderWidth: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 20, fontWeight: 'bold' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, marginTop: 12 },
    input: { padding: 14, borderRadius: 14, borderWidth: 1 },
    weekdayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekdayBtn: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    weekdayText: { fontWeight: 'bold' },
    hint: { fontSize: 12, marginTop: 12, lineHeight: 18 },
    saveBtn: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    disabledBtn: { opacity: 0.7 },
    saveText: { fontSize: 16, fontWeight: '900' },
    readOnlyBox: { borderRadius: 18, padding: 18, borderWidth: 1 },
    readOnlyTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 8 },
    readOnlyText: { lineHeight: 20 },
});
