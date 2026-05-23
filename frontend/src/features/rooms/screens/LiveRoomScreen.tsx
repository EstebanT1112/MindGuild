import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ChevronRight, Info, PlayCircle, Settings, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import SessionConfigModal, { type SessionConfigData } from '../components/SessionConfigModal';
import TeamsSection from '../components/TeamsSection';
import { fetchRoomDetails, type RoomDetails } from '../services/roomsService';

export default function LiveRoomScreen() {
    const route = useRoute<any>();
    const accessToken = useAuthStore(state => state.access_token);

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
    const timerRef = useRef<any>(null);

    useEffect(() => {
        loadRoom();
    }, [route.params?.roomId, accessToken]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadRoom = async () => {
        if (!accessToken || !route.params?.roomId) return;

        setLoading(true);
        try {
            const data = await fetchRoomDetails(accessToken, String(route.params.roomId));
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

    const handleStartSession = () => {
        if (isStudying) {
            clearInterval(timerRef.current);
            setIsStudying(false);

            const totalMinutesStudied = sessionType === 'pomodoro'
                ? Math.floor(((durationMinutes * 60) - secondsLeft) / 60)
                : Math.floor(secondsElapsed / 60);

            Alert.alert(
                "Sesión Finalizada",
                `Estudiaste durante ${totalMinutesStudied} minutos en modo ${sessionType === 'pomodoro' ? 'Pomodoro' : 'Libre'}.`
            );
        } else {
            setIsStudying(true);

            if (sessionType === 'pomodoro') {
                timerRef.current = setInterval(() => {
                    setSecondsLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current);
                            setIsStudying(false);
                            Alert.alert("¡Tiempo cumplido!", "Terminó tu ciclo de Pomodoro.");
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
                    <View style={[styles.timerCircle, sessionType === 'libre' && { borderColor: '#06b6d4' }]}>
                        <PlayCircle color={sessionType === 'libre' ? '#06b6d4' : '#22c55e'} size={32} />
                        <Text style={styles.timerValue}>{getDisplayTime()}</Text>
                        <Text style={styles.timerCycles}>
                            {sessionType === 'pomodoro' ? 'Fase de Enfoque' : 'Tiempo Acumulado'}
                        </Text>
                    </View>
                </View>

                {/* Botón de control */}
                <Pressable onPress={handleStartSession} style={styles.startBtn}>
                    <PlayCircle color="white" size={24} fill="white" />
                    <Text style={styles.startBtnText}>
                        {isStudying ? "FINALIZAR SESION" : "COMENZAR SESION"}
                    </Text>
                </Pressable>

                <RoomRanking roomId={room?.id} />
                {room?.teams_enabled && <TeamsSection />}
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
    timerCircle: { width: 240, height: 240, borderRadius: 120, borderWidth: 8, borderColor: '#22c55e', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900', marginVertical: 5 },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { backgroundColor: '#22c55e', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});