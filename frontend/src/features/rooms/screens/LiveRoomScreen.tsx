import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ChevronRight, Info, Settings, Users } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import LeaveRoomButton from '../components/LeaveRoomButton';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import SessionConfigModal, { type SessionConfigData } from '../components/SessionConfigModal';
import TeamsSection from '../components/TeamsSection';
import { type RoomDetails } from '../services/roomsService';
import { endStudySession, startStudySession } from '../services/sessionsService';

export default function LiveRoomScreen() {
    const route = useRoute<any>();
    const accessToken = useAuthStore(state => state.access_token);
    const invalidateAfterValidStudySession = useAppDataStore(state => state.invalidateAfterValidStudySession);
    const loadRoomDetails = useAppDataStore(state => state.loadRoomDetails);

    const [configVisible, setConfigVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);

    // ⚡ CONFIGURACIÓN DE LA SESIÓN DINÁMICA
    const [sessionType, setSessionType] = useState<'pomodoro' | 'libre'>('pomodoro');
    const [durationMinutes, setDurationMinutes] = useState(25);

    // ⚡ ESTADOS PARA EL TIMER
    const [isStudying, setIsStudying] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0); 
    const [secondsLeft, setSecondsLeft] = useState(25 * 60);  
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const timerRef = useRef<any>(null);

    useEffect(() => {
        loadRoom();
    }, [route.params?.roomId, accessToken]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // RF-06: carga datos de sala e integrantes activos para la visualizacion.
    const loadRoom = async () => {
        if (!accessToken || !route.params?.roomId) return;

        setLoading(true);
        try {
            const data = await loadRoomDetails(accessToken, String(route.params.roomId));
            setRoom(data);
        } catch (error: any) {
            Alert.alert('Error de sala', error.message ?? 'No se pudo cargar la sala.');
        } finally {
            setLoading(false);
        }
    };

    // Captura y guarda las opciones elegidas del modal
    const handleSaveConfig = (newConfig: SessionConfigData) => {
        if (isStudying) {
            Alert.alert("Acción bloqueada", "No podés cambiar la configuración en medio de una sesión activa.");
            return;
        }
        setSessionType(newConfig.sessionType);
        setDurationMinutes(newConfig.duration);
        
        if (newConfig.sessionType === 'pomodoro') {
            setSecondsLeft(newConfig.duration * 60);
            setSecondsElapsed(0);
        } else {
            setSecondsElapsed(0);
            setSecondsLeft(0);
        }
    };

    const handleStartSession = async () => {
        if (isStudying) {
            clearInterval(timerRef.current);

            const totalMinutesStudied = sessionType === 'pomodoro'
                ? Math.floor(((durationMinutes * 60) - secondsLeft) / 60)
                : Math.floor(secondsElapsed / 60);

            if (!accessToken || !activeSessionId) {
                Alert.alert('Error de sesion', 'No se encontro una sesion activa para finalizar.');
                return;
            }

            try {
                const result = await endStudySession(accessToken, activeSessionId, {
                    ended_at: new Date().toISOString(),
                    duration_minutes: totalMinutesStudied,
                    paused_seconds: 0,
                    evidence_photo_url: null,
                    summary_text: null,
                });

                setActiveSessionId(null);
                setIsStudying(false);
                if (result.valid || result.duration_minutes >= 30) {
                    invalidateAfterValidStudySession(room?.id);
                }

                Alert.alert(
                    'Sesion Finalizada',
                    result.valid
                        ? `Se acreditaron ${result.duration_minutes} minutos.`
                        : `Estudiaste ${result.duration_minutes} minutos. Para sumar al ranking necesitas al menos 60 minutos.`
                );
            } catch (error: any) {
                Alert.alert('Error de sesion', error.message ?? 'No se pudo finalizar la sesion.');
            }
        } else {
            if (!accessToken || !room?.id) {
                Alert.alert('Error de sesion', 'No se pudo iniciar la sesion.');
                return;
            }

            try {
                const session = await startStudySession(accessToken, {
                    room_id: room.id,
                    mode: sessionType === 'pomodoro' ? 'pomodoro' : 'free',
                });

                setActiveSessionId(session.session_id);
                setIsStudying(true);
            } catch (error: any) {
                Alert.alert('Error de sesion', error.message ?? 'No se pudo iniciar la sesion.');
                return;
            }

            if (sessionType === 'pomodoro') {
                timerRef.current = setInterval(() => {
                    setSecondsLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            Alert.alert('Tiempo cumplido', 'Finaliza la sesion para guardar el tiempo.');
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                timerRef.current = setInterval(() => {
                    setSecondsElapsed(prev => prev + 1);
                }, 1000);
            }
        }
    };

    const getDisplayTime = () => {
        const targetSeconds = sessionType === 'pomodoro' ? secondsLeft : secondsElapsed;
        const mins = Math.floor(targetSeconds / 60);
        const secs = targetSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <ScreenLayout title="SALA EN VIVO" type="rooms" icon={<Users color="#22c55e" size={22} />}>
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#22c55e" />
                    <Text style={styles.loadingText}>Cargando sala...</Text>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout
            title={room?.name ?? 'SALA EN VIVO'}
            type="rooms"
            icon={<Users color="#22c55e" size={22} />}
            rightAction={
                room ? (
                    <Pressable style={styles.infoBtn} onPress={() => setInfoVisible(true)}>
                        <Info color="#22c55e" size={20} />
                    </Pressable>
                ) : undefined
            }
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Config Card */}
                <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                    <View style={styles.configIconBox}>
                        <Settings color="#22c55e" size={24} />
                    </View>
                    <View style={styles.configInfo}>
                        <Text style={styles.configTitle}>Configurar Sesion</Text>
                        <Text style={styles.configSub}>
                            {sessionType === 'pomodoro' ? `Pomodoro • ${durationMinutes} min` : 'Modo Libre • Sin límite'}
                        </Text>
                    </View>
                    <ChevronRight color="#4b5563" size={20} />
                </Pressable>

                {/* Timer Section */}
                <View style={styles.timerSection}>
                    <TimerProgressRing
                        isPomodoro={sessionType === 'pomodoro'}
                        remainingRatio={durationMinutes > 0 ? secondsLeft / (durationMinutes * 60) : 0}
                    >
                        <Text style={styles.timerValue}>{getDisplayTime()}</Text>
                        <Text style={styles.timerCycles}>
                            {sessionType === 'pomodoro' ? 'Fase de Enfoque' : 'Tiempo Acumulado'}
                        </Text>
                    </TimerProgressRing>
                </View>

                {/* Botón de control */}
                <Pressable
                    onPress={handleStartSession}
                    style={[styles.startBtn, isStudying && styles.finishBtn]}
                >
                    <Text style={styles.startBtnText}>
                        {isStudying ? "FINALIZAR SESION" : "COMENZAR SESION"}
                    </Text>
                </Pressable>

                <RoomRanking roomId={room?.id} />
                {room?.teams_enabled && <TeamsSection />}
                <LeaveRoomButton roomId={room?.id} />
            </ScrollView>

            <SessionConfigModal
                visible={configVisible}
                onClose={() => setConfigVisible(false)}
                onSave={handleSaveConfig}
            />

            {room && (
                <RoomInfoModal
                    visible={infoVisible}
                    room={room}
                    onClose={() => setInfoVisible(false)}
                />
            )}
        </ScreenLayout>
    );
}

function TimerProgressRing({
    children,
    isPomodoro,
    remainingRatio,
}: {
    children: React.ReactNode;
    isPomodoro: boolean;
    remainingRatio: number;
}) {
    const ticks = Array.from({ length: 48 }, (_, index) => index);
    const safeRemaining = Math.max(0, Math.min(1, remainingRatio));

    return (
        <View style={[styles.timerCircle, !isPomodoro && styles.freeTimerCircle]}>
            {isPomodoro && (
                <View pointerEvents="none" style={styles.tickLayer}>
                    {ticks.map(index => (
                        <TimerTick
                            key={index}
                            index={index}
                            total={ticks.length}
                            remainingRatio={safeRemaining}
                        />
                    ))}
                </View>
            )}
            <View style={styles.timerInner}>{children}</View>
        </View>
    );
}

function TimerTick({
    index,
    total,
    remainingRatio,
}: {
    index: number;
    total: number;
    remainingRatio: number;
}) {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);
    const active = index / total < remainingRatio;
    const angle = (index / total) * 360;

    useEffect(() => {
        opacity.value = withTiming(active ? 1 : 0.18, { duration: 280 });
        scale.value = withTiming(active ? 1 : 0.72, { duration: 280 });
    }, [active, opacity, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { rotate: `${angle}deg` },
            { translateY: -116 },
            { scale: scale.value },
        ],
    }));

    return <Animated.View style={[styles.timerTick, animatedStyle]} />;
}
const styles = StyleSheet.create({
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#94a3b8', fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100, paddingVertical: 10 },
    infoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
    configCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: { width: 240, height: 240, borderRadius: 120, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    freeTimerCircle: { borderWidth: 8, borderColor: '#06b6d4' },
    tickLayer: { position: 'absolute', width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
    timerTick: { position: 'absolute', width: 5, height: 16, borderRadius: 999, backgroundColor: '#22c55e' },
    timerInner: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', gap: 6 },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900' },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { backgroundColor: '#22c55e', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    finishBtn: { backgroundColor: '#dc2626' },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});
