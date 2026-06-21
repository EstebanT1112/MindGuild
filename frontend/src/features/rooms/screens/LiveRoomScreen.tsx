import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { ChevronRight, Info, Settings, UserPlus, Users } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import InviteFriendsModal from '../components/InviteFriendsModal';
import LeaveRoomButton from '../components/LeaveRoomButton';
import RoomAdminModal from '../components/RoomAdminModal';
import RoomInfoModal from '../components/RoomInfoModal';
import RoomRanking from '../components/RoomRanking';
import SessionConfigModal, { type SessionConfigData } from '../components/SessionConfigModal';
import TeamsSection from '../components/TeamsSection';
import { useStudyTimer } from '../components/useStudyTimer';
import { type RoomDetails } from '../services/roomsService';

import EvidenceUploadModal from '../components/EvidenceUploadModal';
import ReviewPeerSessionsModal from '../components/ReviewPeerSessionsModal';

export default function LiveRoomScreen() {
    const route = useRoute<any>();
    const accessToken = useAuthStore(state => state.access_token);
    const currentUser = useAuthStore(state => state.user);
    const currentProfile = useAppDataStore(state => state.profile.data);
    const invalidateAfterValidStudySession = useAppDataStore(state => state.invalidateAfterValidStudySession);
    const loadRoomDetails = useAppDataStore(state => state.loadRoomDetails);
    const loadRoomRanking = useAppDataStore(state => state.loadRoomRanking);
    const setRoomDetails = useAppDataStore(state => state.setRoomDetails);
    const markRoomActivity = useAppDataStore(state => state.markRoomActivity);

    const targetRoomId = route.params?.roomId ? String(route.params.roomId) : null;

    const [configVisible, setConfigVisible] = useState(false);
    const [adminVisible, setAdminVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [inviteFriendsVisible, setInviteFriendsVisible] = useState(false);
    
    const [evidenceVisible, setEvidenceVisible] = useState(false);
    const [reviewPeersVisible, setReviewPeersVisible] = useState(false);
    const [activeSessionMinutes, setActiveSessionMinutes] = useState(0);
    
    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [sessionType, setSessionType] = useState<'pomodoro' | 'free'>('pomodoro');
    const [durationMinutes, setDurationMinutes] = useState(30);

    const handleSessionEnded = (result: any) => {
        if (result.status === 'invalid') {
            Alert.alert(
                'Sesión Guardada',
                `Estudiaste ${result.duration_minutes} minutos. Recordá que se necesita un mínimo de tiempo enfocado para acumular puntos en el ranking de la sala.`
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
        if ((result.valid || result.duration_minutes >= 30) && targetRoomId) {
            if (result.duration_minutes >= 30) {
                markRoomActivity(targetRoomId);
            }
            invalidateAfterValidStudySession(targetRoomId);
        }

        Alert.alert(
            'Sesion Finalizada',
            result.valid
                ? `Se acreditaron ${result.duration_minutes} minutos.`
                : `Estudiaste ${result.duration_minutes} minutos. Para sumar al ranking necesitas al menos 30 minutos.`
        );
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
        if (targetRoomId) {
            loadRoom();
        }
    }, [targetRoomId, accessToken]);

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
            console.error('Error critico al cargar detalles de la sala:', error);
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

    const isEnfocused = status === 'running' || status === 'paused' || status === 'starting' || status === 'finishing';
    const currentUserId = currentUser?.id ?? currentProfile?.id;
    const isOwner = Boolean(room && currentUserId === room.owner_id);

    const handleRoomUpdated = (updatedRoom: RoomDetails) => {
        setRoom(updatedRoom);
        setRoomDetails(updatedRoom);
    };

    return (
        <ScreenLayout
            title={room?.name ?? 'SALA EN VIVO'}
            type="rooms"
            icon={<Users color="#22c55e" size={22} />}
            rightAction={
                room && !isEnfocused ? (
                    <View style={styles.headerActions}>
                        {isOwner && (
                            <Pressable style={styles.infoBtn} onPress={() => setAdminVisible(true)}>
                                <Settings color="#22c55e" size={20} />
                            </Pressable>
                        )}
                        <Pressable style={styles.infoBtn} onPress={() => setInfoVisible(true)}>
                            <Info color="#22c55e" size={20} />
                        </Pressable>
                    </View>
                ) : undefined
            }
        >
            {/* ⚡ CORRECCIÓN: Un único ScrollView principal unificado */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        enabled={!isEnfocused}
                        tintColor="#22c55e"
                        colors={['#22c55e']}
                    />
                }
            >
                {!isEnfocused && (
                    <Pressable style={styles.inviteFriendsMainBtn} onPress={() => setInviteFriendsVisible(true)}>
                        <UserPlus color="white" size={22} />
                        <Text style={styles.inviteFriendsBtnText}>Invitar Amigos a la Sala</Text>
                    </Pressable>
                )}

                {!isEnfocused && (
                    <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                        <View style={styles.configIconBox}>
                            <Settings color="#22c55e" size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={styles.configTitle}>Configurar Sesión</Text>
                            <Text style={styles.configSub}>
                                {sessionType === 'pomodoro' ? `Pomodoro - ${durationMinutes} min` : 'Modo Libre - Sin limite'}
                            </Text>
                        </View>
                        <ChevronRight color="#4b5563" size={20} />
                    </Pressable>
                )}

                {!isEnfocused && (
                    <Pressable style={[styles.configCard, { marginTop: 12, borderColor: '#16a34a' }]} onPress={() => setReviewPeersVisible(true)}>
                        <View style={[styles.configIconBox, { backgroundColor: '#14532d' }]}>
                            <Users color="#22c55e" size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={styles.configTitle}>Validar Compañeros</Text>
                            <Text style={styles.configSub}>Panel de verificación social de apuntes y evidencias</Text>
                        </View>
                        <ChevronRight color="#4b5563" size={20} />
                    </Pressable>
                )}

                <View style={styles.timerSection}>
                    <TimerProgressRing
                        isPomodoro={sessionType === 'pomodoro'}
                        remainingRatio={durationMinutes > 0 ? displaySeconds / (durationMinutes * 60) : 0}
                    >
                        {status === 'starting' || status === 'finishing' ? (
                            <ActivityIndicator color="#22c55e" size="large" />
                        ) : (
                            <Text style={styles.timerValue}>{getDisplayTime()}</Text>
                        )}
                        <Text style={styles.timerCycles}>
                            {status === 'paused' ? 'Sesion Pausada' : sessionType === 'pomodoro' ? 'Fase de Enfoque' : 'Tiempo Acumulado'}
                        </Text>
                    </TimerProgressRing>
                </View>

                <View style={styles.controlsContainer}>
                    {status === 'idle' && (
                        <Pressable onPress={startSession} style={styles.startBtn}>
                            <Text style={styles.btnText}>COMENZAR SESION</Text>
                        </Pressable>
                    )}

                    {status === 'running' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={pauseSession} style={[styles.controlBtn, styles.pauseBtn]}>
                                <Text style={styles.btnText}>PAUSAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn]}>
                                <Text style={styles.btnText}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}

                    {status === 'paused' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={resumeSession} style={[styles.controlBtn, styles.resumeBtn]}>
                                <Text style={styles.btnText}>REANUDAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn]}>
                                <Text style={styles.btnText}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {!isEnfocused && (
                    <>
                        <RoomRanking roomId={room?.id} />
                        {room?.teams_enabled && <TeamsSection />}
                        <LeaveRoomButton roomId={room?.id} />
                    </>
                )}
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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
    inviteFriendsMainBtn: { backgroundColor: '#3b82f6', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, marginTop: 5 },
    inviteFriendsBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
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
    controlsContainer: { marginBottom: 20 },
    startBtn: { backgroundColor: '#22c55e', height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    rowControls: { flexDirection: 'row', gap: 12, width: '100%' },
    controlBtn: { flex: 1, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    pauseBtn: { backgroundColor: '#f59e0b' },
    resumeBtn: { backgroundColor: '#06b6d4' },
    finishBtn: { backgroundColor: '#dc2626' },
    btnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});
