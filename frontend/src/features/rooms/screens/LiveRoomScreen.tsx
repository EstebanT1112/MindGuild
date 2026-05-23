import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ChevronRight, Info, PlayCircle, Settings, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import SessionConfigModal from '../components/SessionConfigModal';
import TeamsSection from '../components/TeamsSection';
import { fetchRoomDetails, type RoomDetails } from '../services/roomsService';

export default function LiveRoomScreen() {
    const route = useRoute<any>();
    const accessToken = useAuthStore(state => state.access_token);

    const [configVisible, setConfigVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRoom();
    }, [route.params?.roomId, accessToken]);

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
                <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                    <View style={styles.configIconBox}>
                        <Settings color="#22c55e" size={24} />
                    </View>
                    <View style={styles.configInfo}>
                        <Text style={styles.configTitle}>Configurar Sesion</Text>
                        <Text style={styles.configSub}>Pomodoro - 25min - 4 ciclos</Text>
                    </View>
                    <ChevronRight color="#4b5563" size={20} />
                </Pressable>

                <View style={styles.timerSection}>
                    <View style={styles.timerCircle}>
                        <PlayCircle color="#22c55e" size={32} />
                        <Text style={styles.timerValue}>25:00</Text>
                        <Text style={styles.timerCycles}>4 ciclos</Text>
                    </View>
                </View>

                <Pressable style={styles.startBtn}>
                    <PlayCircle color="white" size={24} fill="white" />
                    <Text style={styles.startBtnText}>COMENZAR SESION</Text>
                </Pressable>

                <RoomRanking />
                {room?.teams_enabled && <TeamsSection />}
            </ScrollView>

            <SessionConfigModal visible={configVisible} onClose={() => setConfigVisible(false)} />
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
    infoBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },
    configCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    configIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 8,
        borderColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
    },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900', marginVertical: 5 },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: {
        backgroundColor: '#22c55e',
        height: 64,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 20,
    },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});
