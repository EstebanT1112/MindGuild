import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BarChart3, BrainCircuit, CalendarClock, ChevronRight, FolderOpen, Info, MessageCircle, Settings, Swords, ThermometerSun, UserPlus, Users } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import EvidenceUploadModal from '../components/EvidenceUploadModal';
import InviteFriendsModal from '../components/InviteFriendsModal';
import LeaveRoomButton from '../components/LeaveRoomButton';
import ReviewPeerSessionsModal from '../components/ReviewPeerSessionsModal';
import RoomAdminModal from '../components/RoomAdminModal';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import RoomChatModal from '../components/RoomChatModal';
import SessionConfigModal, { type SessionConfigData } from '../components/SessionConfigModal';
import TeamsSection from '../components/TeamsSection';
import { useStudyTimer } from '../components/useStudyTimer';
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
    const invalidateAfterValidStudySession = useAppDataStore(state => state.invalidateAfterValidStudySession);
    const markRoomActivity = useAppDataStore(state => state.markRoomActivity);

    const [configVisible, setConfigVisible] = useState(false);
    const [adminVisible, setAdminVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [inviteFriendsVisible, setInviteFriendsVisible] = useState(false);
    const [evidenceVisible, setEvidenceVisible] = useState(false);
    const [reviewPeersVisible, setReviewPeersVisible] = useState(false);
    const [activeSessionMinutes, setActiveSessionMinutes] = useState(0);
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sessionType, setSessionType] = useState<'pomodoro' | 'free'>('pomodoro');
    const [durationMinutes, setDurationMinutes] = useState(30);

    const targetRoomId = route.params?.roomId ? String(route.params.roomId) : null;

    const handleSessionEnded = (result: any) => {
        if (result.status === 'invalid') {
            Alert.alert(
                'Sesion guardada',
                `Estudiaste ${result.duration_minutes} minutos. Recorda que se necesita un minimo de 30 minutos para validar la sesion.`
            );
            if (targetRoomId) {
                invalidateAfterValidStudySession(targetRoomId);
            }
            return;
        }

        if (result.status === 'pending') {
            setActiveSessionMinutes(result.duration_minutes);
            setEvidenceVisible(true);
        }

        if (result.duration_minutes >= 30 && targetRoomId) {
            markRoomActivity(targetRoomId);
            invalidateAfterValidStudySession(targetRoomId);
        }

        Alert.alert('Sesion finalizada', `Estudiaste ${result.duration_minutes} minutos.`);
    };

    const {
        status,
        setStatus,
        setSessionId,
        sessionId,
        displaySeconds,
        setDisplaySeconds,
        startSession,
        pauseSession,
        resumeSession,
        endSession,
    } = useStudyTimer({
        roomId: targetRoomId,
        initialMode: sessionType,
        initialDurationMinutes: durationMinutes,
        onSessionEnded: handleSessionEnded,
    });

    useEffect(() => {
        loadRoom();
    }, [route.params?.roomId, accessToken]);

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
    const isEnfocused = status === 'running' || status === 'paused' || status === 'starting' || status === 'finishing';

    const handleRoomUpdated = (updatedRoom: RoomDetails) => {
        setRoom(updatedRoom);
        setRoomDetails(updatedRoom);
    };

    const handleSaveConfig = (newConfig: SessionConfigData) => {
        if (status !== 'idle') {
            Alert.alert('Accion bloqueada', 'No podes cambiar la configuracion en medio de una sesion activa.');
            return;
        }

        setSessionType(newConfig.sessionType === 'libre' ? 'free' : 'pomodoro');
        setDurationMinutes(newConfig.duration);
    };

    const getDisplayTime = () => {
        const mins = Math.floor(displaySeconds / 60);
        const secs = displaySeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <ScreenLayout
            title={room?.name ?? 'BATTLE ROYALE'}
            type="rooms"
            icon={<Swords color="#a855f7" size={22} />}
            hideBackButton={isEnfocused}
            hideRightAction={isEnfocused}
            rightAction={
                room && !isEnfocused ? (
                    <View style={styles.headerActions}>
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
                scrollEnabled={!isEnfocused}
                contentContainerStyle={[styles.scrollContent, isEnfocused && styles.focusScrollContent]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        enabled={!isEnfocused}
                        tintColor="#a855f7"
                        colors={['#a855f7']}
                    />
                }
            >
                {!isEnfocused && (
                    <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                        <View style={styles.configIconBox}>
                            <Settings color="#a855f7" size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={styles.configTitle}>Configurar Sesion</Text>
                            <Text style={styles.configSub}>
                                {sessionType === 'pomodoro' ? `Pomodoro - ${durationMinutes} min` : 'Modo Libre - Sin limite'}
                            </Text>
                        </View>
                        <ChevronRight color="#4b5563" size={20} />
                    </Pressable>
                )}

                <View style={[styles.timerSection, isEnfocused && styles.focusTimerSection]}>
                    <TimerProgressRing
                        isPomodoro={sessionType === 'pomodoro'}
                        remainingRatio={durationMinutes > 0 ? displaySeconds / (durationMinutes * 60) : 0}
                    >
                        {status === 'starting' || status === 'finishing' ? (
                            <ActivityIndicator color="#a855f7" size="large" />
                        ) : (
                            <Text style={styles.timerValue}>{getDisplayTime()}</Text>
                        )}
                        <Text style={styles.timerCycles}>
                            {status === 'paused' ? 'Sesion Pausada' : sessionType === 'pomodoro' ? 'Fase de Enfoque' : 'Tiempo Acumulado'}
                        </Text>
                    </TimerProgressRing>
                </View>

                <View style={[styles.controlsContainer, isEnfocused && styles.focusControlsContainer]}>
                    {status === 'idle' && (
                        <Pressable onPress={startSession} style={styles.startBtn}>
                            <Text style={styles.startBtnText}>COMENZAR SESION</Text>
                        </Pressable>
                    )}

                    {status === 'running' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={pauseSession} style={[styles.controlBtn, styles.pauseBtn]}>
                                <Text style={styles.startBtnText}>PAUSAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn]}>
                                <Text style={styles.startBtnText}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}

                    {status === 'paused' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={resumeSession} style={[styles.controlBtn, styles.resumeBtn]}>
                                <Text style={styles.startBtnText}>REANUDAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn]}>
                                <Text style={styles.startBtnText}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {!isEnfocused && (
                    <>
                        <RoomRanking roomId={room?.id} />

                        <Pressable style={[styles.configCard, styles.reviewCard]} onPress={() => setReviewPeersVisible(true)}>
                            <View style={[styles.configIconBox, { backgroundColor: '#2e1065' }]}>
                                <Users color="#c084fc" size={24} />
                            </View>
                            <View style={styles.configInfo}>
                                <Text style={styles.configTitle}>Validar Companeros</Text>
                                <Text style={styles.configSub}>Panel de verificacion social de apuntes y evidencias</Text>
                            </View>
                            <ChevronRight color="#4b5563" size={20} />
                        </Pressable>

                        <Pressable style={styles.inviteFriendsBtn} onPress={() => setInviteFriendsVisible(true)}>
                            <UserPlus color="white" size={22} />
                            <Text style={styles.inviteFriendsBtnText}>Invitar Amigos a la Sala</Text>
                        </Pressable>

                        <Pressable
                            style={styles.vaultBtn}
                            onPress={() => room?.id && navigation.navigate('RoomVault', {
                                roomId: room.id,
                                roomName: room.name,
                                accentColor: '#14b8a6',
                            })}
                        >
                            <FolderOpen color="white" size={22} />
                            <Text style={styles.inviteFriendsBtnText}>The Vault</Text>
                        </Pressable>

                        {room?.teams_enabled && accessToken && room?.id && (
                            <TeamsSection roomId={room.id} accessToken={accessToken} mode="battle_royale" />
                        )}

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

                        <Text style={styles.sectionLabel}>ANALISIS</Text>
                        <Pressable
                            style={styles.dashboardBtn}
                            onPress={() => room?.id && navigation.navigate('SmartDashboard', { roomId: room.id, roomName: room.name, scope: 'room' })}
                        >
                            <BarChart3 color="white" size={24} />
                            <Text style={styles.quizBtnText}>Dashboard de Sala</Text>
                        </Pressable>
                        <Text style={styles.hintText}>Resumen semanal de estudio, quizzes e insights de esta sala.</Text>

                        <Pressable
                            style={styles.heatmapBtn}
                            onPress={() => room?.id && navigation.navigate('DifficultyHeatmap', { roomId: room.id, roomName: room.name, scope: 'room' })}
                        >
                            <ThermometerSun color="white" size={24} />
                            <Text style={styles.quizBtnText}>Heatmap de Dificultad</Text>
                        </Pressable>
                        <Text style={styles.hintText}>Detecta los temas con mas errores validados en la sala.</Text>

                        <LeaveRoomButton roomId={room?.id} />
                    </>
                )}
            </ScrollView>

            <SessionConfigModal visible={configVisible} onClose={() => setConfigVisible(false)} onSave={handleSaveConfig} />
            {room && (
                <RoomInfoModal
                    visible={infoVisible}
                    room={room}
                    accessToken={accessToken}
                    currentUserId={currentUserId}
                    onClose={() => setInfoVisible(false)}
                    onRoomUpdated={handleRoomUpdated}
                    canConfigure={isOwner && !isEnfocused}
                    onOpenAdmin={() => {
                        setInfoVisible(false);
                        setAdminVisible(true);
                    }}
                />
            )}
            {room && accessToken && (
                <RoomAdminModal
                    visible={adminVisible && !isEnfocused}
                    room={room}
                    accessToken={accessToken}
                    currentUserId={currentUserId}
                    onClose={() => setAdminVisible(false)}
                    onRoomUpdated={handleRoomUpdated}
                />
            )}
            {room && accessToken && (
                <InviteFriendsModal
                    visible={inviteFriendsVisible}
                    onClose={() => setInviteFriendsVisible(false)}
                    roomId={room.id}
                    accessToken={accessToken}
                />
            )}
            <EvidenceUploadModal
                visible={evidenceVisible}
                sessionId={sessionId}
                accessToken={accessToken}
                durationMinutes={activeSessionMinutes}
                onSuccess={() => {
                    setEvidenceVisible(false);
                    setDisplaySeconds(sessionType === 'pomodoro' ? durationMinutes * 60 : 0);
                    setSessionId(null);
                    setStatus('idle');
                    if (targetRoomId) {
                        invalidateAfterValidStudySession(targetRoomId);
                    }
                }}
                onCancel={() => {
                    setEvidenceVisible(false);
                    setDisplaySeconds(sessionType === 'pomodoro' ? durationMinutes * 60 : 0);
                    setSessionId(null);
                    setStatus('idle');
                    if (targetRoomId) {
                        invalidateAfterValidStudySession(targetRoomId);
                    }
                }}
            />
            <ReviewPeerSessionsModal
                visible={reviewPeersVisible}
                roomId={targetRoomId}
                accessToken={accessToken}
                onClose={() => setReviewPeersVisible(false)}
                onRefreshRanking={() => {
                    if (targetRoomId) {
                        invalidateAfterValidStudySession(targetRoomId);
                    }
                }}
            />
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
            { translateY: -136 },
            { scale: scale.value },
        ],
    }));

    return <Animated.View style={[styles.timerTick, animatedStyle]} />;
}

const styles = StyleSheet.create({
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#94a3b8', fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100, paddingVertical: 10 },
    focusScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 24, paddingVertical: 24 },
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
    configCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#0f172a', // 👈 cambiado de #1e293b a #0f172a para igualar al ranking
        padding: 15, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    reviewCard: { marginTop: 12, borderColor: '#7e22ce' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    focusTimerSection: { marginVertical: 0, marginBottom: 30 },
    timerCircle: { width: 280, height: 280, borderRadius: 140, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    freeTimerCircle: { borderWidth: 8, borderColor: '#a855f7' },
    tickLayer: { position: 'absolute', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
    timerTick: { position: 'absolute', width: 6, height: 18, borderRadius: 999, backgroundColor: '#a855f7' },
    timerInner: { width: 232, height: 232, borderRadius: 116, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', gap: 6 },
    timerValue: { color: 'white', fontSize: 64, fontWeight: '900' },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    controlsContainer: { marginBottom: 20 },
    focusControlsContainer: { marginTop: 8, marginBottom: 0, width: '100%' },
    startBtn: { height: 64, borderRadius: 24, backgroundColor: '#a855f7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
    rowControls: { flexDirection: 'row', gap: 12, width: '100%' },
    controlBtn: { flex: 1, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    pauseBtn: { backgroundColor: '#f59e0b' },
    resumeBtn: { backgroundColor: '#06b6d4' },
    finishBtn: { backgroundColor: '#dc2626' },
    inviteFriendsBtn: { backgroundColor: '#3b82f6', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, marginTop: 12 },
    vaultBtn: { backgroundColor: '#0f766e', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 },
    inviteFriendsBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    sectionLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
    quizBtn: { backgroundColor: '#a855f7', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    practiceBtn: { backgroundColor: '#22c55e', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    dashboardBtn: { backgroundColor: '#0ea5e9', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    heatmapBtn: { backgroundColor: '#f97316', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    quizBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
    hintText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10 },
});