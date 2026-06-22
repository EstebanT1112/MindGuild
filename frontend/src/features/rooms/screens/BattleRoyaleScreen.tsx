import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BrainCircuit, CalendarClock, ChevronRight, Info, MessageCircle, PlayCircle, Settings, Swords } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import LeaveRoomButton from '../components/LeaveRoomButton';
import RoomAdminModal from '../components/RoomAdminModal';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import RoomChatModal from '../components/RoomChatModal';
import SessionConfigModal from '../components/SessionConfigModal';
import { type RoomDetails } from '../services/roomsService';

export default function BattleRoyaleScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const accessToken = useAuthStore(state => state.access_token);
    const currentUser = useAuthStore(state => state.user);
    const currentProfile = useAppDataStore(state => state.profile.data);
    const loadRoomDetails = useAppDataStore(state => state.loadRoomDetails);
    const loadRoomRanking = useAppDataStore(state => state.loadRoomRanking);
    const setRoomDetails = useAppDataStore(state => state.setRoomDetails);

    const [configVisible, setConfigVisible] = useState(false);
    const [adminVisible, setAdminVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const targetRoomId = route.params?.roomId ? String(route.params.roomId) : null;

    useEffect(() => {
        loadRoom();
    }, [route.params?.roomId, accessToken]);

    // RF-06: carga datos de sala e integrantes activos para la visualizacion.
    const loadRoom = async (options?: { force?: boolean; showLoading?: boolean }) => {
        if (!accessToken || !targetRoomId) return;

        const shouldShowLoading = options?.showLoading ?? true;
        if (shouldShowLoading) setLoading(true);
        try {
            const data = await loadRoomDetails(accessToken, targetRoomId, { force: options?.force });
            if (data) {
                setRoom(data);
                setRoomDetails(data);
            }

            if (options?.force) {
                try {
                    await loadRoomRanking(accessToken, targetRoomId, { force: true });
                } catch (rankingError) {
                    console.error('No se pudo actualizar el ranking de sala:', rankingError);
                }
            }
        } catch (error: any) {
            Alert.alert('Error de sala', error.message ?? 'No se pudo cargar la sala.');
        } finally {
            if (shouldShowLoading) setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadRoom({ force: true, showLoading: false });
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <ScreenLayout title="BATTLE ROYALE" type="rooms" icon={<Swords color="#a855f7" size={22} />}>
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#a855f7" />
                    <Text style={styles.loadingText}>Cargando sala...</Text>
                </View>
            </ScreenLayout>
        );
    }

    const currentUserId = currentUser?.id ?? currentProfile?.id;
    const isOwner = Boolean(room && currentUserId === room.owner_id);

    const handleRoomUpdated = (updatedRoom: RoomDetails) => {
        setRoom(updatedRoom);
        setRoomDetails(updatedRoom);
    };

    return (
        <ScreenLayout
            title={room?.name ?? 'BATTLE ROYALE'}
            type="rooms"
            icon={<Swords color="#a855f7" size={22} />}
            rightAction={
                room ? (
                    <View style={styles.headerActions}>
                        {isOwner && (
                            <Pressable style={styles.infoBtn} onPress={() => setAdminVisible(true)}>
                                <Settings color="#a855f7" size={20} />
                            </Pressable>
                        )}
                        <Pressable style={styles.infoBtn} onPress={() => setChatVisible(true)}>
                            <MessageCircle color="#a855f7" size={20} />
                        </Pressable>
                        <Pressable style={styles.infoBtn} onPress={() => setInfoVisible(true)}>
                            <Info color="#a855f7" size={20} />
                        </Pressable>
                    </View>
                ) : undefined
            }
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#a855f7"
                        colors={['#a855f7']}
                    />
                }
            >
                <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                    <View style={styles.configIconBox}>
                        <Settings color="#a855f7" size={24} />
                    </View>
                    <View style={styles.configInfo}>
                        <Text style={styles.configTitle}>Configurar Sesion</Text>
                        <Text style={styles.configSub}>Pomodoro - 25min - 4 ciclos</Text>
                    </View>
                    <ChevronRight color="#4b5563" size={20} />
                </Pressable>

                <View style={styles.timerSection}>
                    <View style={styles.timerCircle}>
                        <PlayCircle color="#a855f7" size={32} />
                        <Text style={styles.timerValue}>25:00</Text>
                        <Text style={styles.timerCycles}>4 ciclos</Text>
                    </View>
                </View>

                <Pressable style={styles.startBtn}>
                    <Text style={styles.startBtnText}>COMENZAR SESION</Text>
                </Pressable>

                <RoomRanking roomId={room?.id} />

                <Text style={styles.sectionLabel}>QUIZ SEMANAL</Text>
                <Pressable
                    style={styles.quizBtn}
                    onPress={() => room?.id && navigation.navigate('WeeklyQuiz', { roomId: room.id, roomName: room.name })}
                >
                    <CalendarClock color="white" size={24} />
                    <Text style={styles.quizBtnText}>Quiz Semanal</Text>
                </Pressable>
                <Text style={styles.hintText}>Configuracion, carga de preguntas y estado del cuestionario.</Text>

                <Text style={styles.sectionLabel}>PRACTICA</Text>
                <Pressable
                    style={styles.practiceBtn}
                    onPress={() => room?.id && navigation.navigate('PracticeQuiz', { roomId: room.id, roomName: room.name })}
                >
                    <BrainCircuit color="white" size={24} />
                    <Text style={styles.quizBtnText}>Quiz Atemporal</Text>
                </Pressable>
                <Text style={styles.hintText}>Practica atemporal. No guarda resultados ni afecta rankings.</Text>

                <LeaveRoomButton roomId={room?.id} />
            </ScrollView>

            <SessionConfigModal visible={configVisible} onClose={() => setConfigVisible(false)} />
            {room && (
                <RoomInfoModal
                    visible={infoVisible}
                    room={room}
                    accessToken={accessToken}
                    currentUserId={currentUserId}
                    onClose={() => setInfoVisible(false)}
                    onRoomUpdated={handleRoomUpdated}
                />
            )}
            {room && accessToken && (
                <RoomAdminModal
                    visible={adminVisible}
                    room={room}
                    accessToken={accessToken}
                    currentUserId={currentUserId}
                    onClose={() => setAdminVisible(false)}
                    onRoomUpdated={handleRoomUpdated}
                />
            )}
            {room && (
                <RoomChatModal
                    visible={chatVisible}
                    roomId={room.id}
                    roomName={room.name}
                    accentColor="#a855f7"
                    onClose={() => setChatVisible(false)}
                />
            )}
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#94a3b8', fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100, paddingVertical: 10 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    configCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: { width: 240, height: 240, borderRadius: 120, borderWidth: 8, borderColor: '#a855f7', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900' },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { height: 64, borderRadius: 24, backgroundColor: '#a855f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
    sectionLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
    quizBtn: { backgroundColor: '#a855f7', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    practiceBtn: { backgroundColor: '#22c55e', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    quizBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
    hintText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10 },
});
