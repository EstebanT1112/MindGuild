import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BarChart3, ChevronRight, FolderOpen, Info, MessageCircle, Settings, UserPlus, Users } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
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
import RoomChatModal from '../components/RoomChatModal';
import { fetchPendingSessionReviews } from '../services/sessionsService';
import { fetchRoomMessages, sendRoomMessage, type RoomMessage } from '../services/chatService';

const POLLING_INTERVAL_MS = 60000; // 60 segundos

export default function LiveRoomScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const accessToken = useAuthStore(state => state.access_token);
    const currentUser = useAuthStore(state => state.user);
    const currentProfile = useAppDataStore(state => state.profile.data);
    const invalidateAfterValidStudySession = useAppDataStore(state => state.invalidateAfterValidStudySession);
    const loadRoomDetails = useAppDataStore(state => state.loadRoomDetails);
    const loadRoomRanking = useAppDataStore(state => state.loadRoomRanking);
    const setRoomDetails = useAppDataStore(state => state.setRoomDetails);
    const markRoomActivity = useAppDataStore(state => state.markRoomActivity);
    const colors = useThemeStore(state => state.colors);

    const targetRoomId = route.params?.roomId ? String(route.params.roomId) : null;

    const [configVisible, setConfigVisible] = useState(false);
    const [adminVisible, setAdminVisible] = useState(false);
    const [infoVisible, setInfoVisible] = useState(false);
    const [chatVisible, setChatVisible] = useState(false);
    const [inviteFriendsVisible, setInviteFriendsVisible] = useState(false);

    const [evidenceVisible, setEvidenceVisible] = useState(false);
    const [reviewPeersVisible, setReviewPeersVisible] = useState(false);
    const [activeSessionMinutes, setActiveSessionMinutes] = useState(0);

    const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

    // ✅ Estado para mensajes del chat y badge
    const [messages, setMessages] = useState<RoomMessage[]>([]);
    const [lastMessageCreatedAt, setLastMessageCreatedAt] = useState<string | undefined>(undefined);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const [room, setRoom] = useState<RoomDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [sessionType, setSessionType] = useState<'pomodoro' | 'free'>('pomodoro');
    const [durationMinutes, setDurationMinutes] = useState(30);

    // ✅ Estado para AppAlert
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

    // ✅ Función para mostrar alertas personalizadas
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

    // ── Funciones de polling ──
    const fetchNewMessages = async () => {
        if (!accessToken || !targetRoomId) return;
        try {
            const newMessages = await fetchRoomMessages(accessToken, targetRoomId, {
                after: lastMessageCreatedAt,
                limit: 50
            });
            if (newMessages.length === 0) return;

            // Actualizar la lista de mensajes (acumulando)
            setMessages(prev => {
                const map = new Map(prev.map(m => [m.id, m]));
                newMessages.forEach(m => map.set(m.id, m));
                return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });

            // Actualizar el timestamp del último mensaje
            const latest = newMessages.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
            if (latest) {
                setLastMessageCreatedAt(latest.created_at);
            }

            // Si el chat está cerrado, incrementar el contador de no leídos con los mensajes nuevos
            if (!chatVisible) {
                setUnreadChatCount(prev => prev + newMessages.length);
            }
        } catch (error) {
            console.warn('Error en polling de chat:', error);
        }
    };

    // ── Efecto de polling ──
    useEffect(() => {
        if (!accessToken || !targetRoomId) return;

        // Carga inicial: obtener los últimos mensajes
        const loadInitialMessages = async () => {
            try {
                const initialMessages = await fetchRoomMessages(accessToken, targetRoomId, { limit: 50 });
                if (initialMessages.length > 0) {
                    setMessages(initialMessages);
                    const latest = initialMessages.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
                    setLastMessageCreatedAt(latest.created_at);
                }
            } catch (error) {
                console.warn('Error al cargar mensajes iniciales:', error);
            }
        };
        loadInitialMessages();

        // Polling periódico
        const intervalId = setInterval(fetchNewMessages, POLLING_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [accessToken, targetRoomId]);

    // ── Envío de mensaje ──
    const handleSendMessage = async (content: string) => {
        if (!accessToken || !targetRoomId || !content.trim()) return;
        try {
            const newMsg = await sendRoomMessage(accessToken, targetRoomId, content.trim());
            // Agregar el mensaje a la lista local
            setMessages(prev => [...prev, newMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
            setLastMessageCreatedAt(newMsg.created_at);
        } catch (error: any) {
            showAlert('Error', error.message ?? 'No se pudo enviar el mensaje.', 'error');
        }
    };

    // ── Manejo de sesión ──
    const handleSessionEnded = (result: any) => {
        if (result.status === 'invalid') {
            showAlert(
                'Sesión Guardada',
                `Estudiaste ${result.duration_minutes} minutos. Recordá que se necesita un mínimo de tiempo enfocado para acumular puntos en el ranking de la sala.`,
                'info'
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

        showAlert(
            'Sesión Finalizada',
            result.valid
                ? `Se acreditaron ${result.duration_minutes} minutos.`
                : `Estudiaste ${result.duration_minutes} minutos. Para sumar al ranking necesitas al menos 30 minutos.`,
            result.valid ? 'success' : 'warning'
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

    useEffect(() => {
        const loadPendingCount = async () => {
            if (!accessToken || !targetRoomId) return;
            try {
                const data = await fetchPendingSessionReviews(accessToken, targetRoomId);
                setPendingReviewsCount(data.length);
            } catch (error) {
                console.warn('Error al cargar revisiones pendientes:', error);
            }
        };
        loadPendingCount();
    }, [accessToken, targetRoomId]);

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
            showAlert('Error de sala', error.message ?? 'No se pudo cargar la sala.', 'error');
        } finally {
            if (shouldShowLoading) setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await loadRoom({ force: true, showLoading: false });
            if (accessToken && targetRoomId) {
                const data = await fetchPendingSessionReviews(accessToken, targetRoomId);
                setPendingReviewsCount(data.length);
                // Recargar mensajes
                const freshMessages = await fetchRoomMessages(accessToken, targetRoomId, { limit: 50 });
                if (freshMessages.length > 0) {
                    setMessages(freshMessages);
                    const latest = freshMessages.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
                    setLastMessageCreatedAt(latest.created_at);
                    setUnreadChatCount(0); // Al refrescar, reseteamos el badge
                }
            }
        } catch (error) {
            console.warn('Error al refrescar:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSaveConfig = (newConfig: SessionConfigData) => {
        if (status !== 'idle') {
            showAlert('Acción bloqueada', 'No podes cambiar la configuración en medio de una sesión activa.', 'warning');
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
            <ScreenLayout title="SALA EN VIVO" type="rooms" icon={<Users color={colors.accent} size={22} />}>
                <View style={styles.loadingState}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando sala...</Text>
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
            icon={<Users color={colors.accent} size={22} />}
            hideBackButton={isEnfocused}
            hideRightAction={isEnfocused}
            rightAction={
                room && !isEnfocused ? (
                    <View style={styles.headerActions}>
                        <Pressable
                            style={[styles.infoBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                            onPress={() => {
                                setChatVisible(true);
                                setUnreadChatCount(0); // Resetear badge al abrir
                            }}
                        >
                            <View style={styles.chatIconWrapper}>
                                <MessageCircle color={colors.accent} size={20} />
                                {unreadChatCount > 0 && (
                                    <View style={[styles.chatBadge, { backgroundColor: colors.danger }]}>
                                        <Text style={[styles.badgeText, { color: colors.text }]}>{unreadChatCount}</Text>
                                    </View>
                                )}
                            </View>
                        </Pressable>
                        <Pressable style={[styles.infoBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => setInfoVisible(true)}>
                            <Info color={colors.accent} size={20} />
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
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                    />
                }
            >
                {!isEnfocused && (
                    <Pressable style={[styles.configCard, { backgroundColor: colors.input, borderColor: colors.border }]} onPress={() => setConfigVisible(true)}>
                        <View style={[styles.configIconBox, { backgroundColor: colors.input }]}>
                            <Settings color={colors.accent} size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={[styles.configTitle, { color: colors.text }]}>Configurar Sesión</Text>
                            <Text style={[styles.configSub, { color: colors.textSoft }]}>
                                {sessionType === 'pomodoro' ? `Pomodoro - ${durationMinutes} min` : 'Modo Libre'}
                            </Text>
                        </View>
                        <ChevronRight color={colors.textMuted} size={20} />
                    </Pressable>
                )}

                <View style={[styles.timerSection, isEnfocused && styles.focusTimerSection]}>
                    <TimerProgressRing
                        isPomodoro={sessionType === 'pomodoro'}
                        remainingRatio={durationMinutes > 0 ? displaySeconds / (durationMinutes * 60) : 0}
                    >
                        {status === 'starting' || status === 'finishing' ? (
                            <ActivityIndicator color={colors.accent} size="large" />
                        ) : (
                            <Text style={[styles.timerValue, { color: colors.text }]}>{getDisplayTime()}</Text>
                        )}
                        <Text style={[styles.timerCycles, { color: colors.textSoft }]}>
                            {status === 'paused' ? 'Sesion Pausada' : sessionType === 'pomodoro' ? 'Fase de Enfoque' : 'Tiempo Acumulado'}
                        </Text>
                    </TimerProgressRing>
                </View>

                <View style={[styles.controlsContainer, isEnfocused && styles.focusControlsContainer]}>
                    {status === 'idle' && (
                        <Pressable onPress={startSession} style={[styles.startBtn, { backgroundColor: colors.accent }]}>
                            <Text style={[styles.btnText, { color: colors.text }]}>COMENZAR SESION</Text>
                        </Pressable>
                    )}

                    {status === 'running' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={pauseSession} style={[styles.controlBtn, styles.pauseBtn, { backgroundColor: colors.warning }]}>
                                <Text style={[styles.btnText, { color: colors.text }]}>PAUSAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn, { backgroundColor: colors.danger }]}>
                                <Text style={[styles.btnText, { color: colors.text }]}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}

                    {status === 'paused' && (
                        <View style={styles.rowControls}>
                            <Pressable onPress={resumeSession} style={[styles.controlBtn, styles.resumeBtn, { backgroundColor: colors.cyan }]}>
                                <Text style={[styles.btnText, { color: colors.text }]}>REANUDAR</Text>
                            </Pressable>
                            <Pressable onPress={endSession} style={[styles.controlBtn, styles.finishBtn, { backgroundColor: colors.danger }]}>
                                <Text style={[styles.btnText, { color: colors.text }]}>FINALIZAR</Text>
                            </Pressable>
                        </View>
                    )}
                </View>

                {!isEnfocused && (
                    <>
                        <RoomRanking roomId={room?.id} roomType="survival"  />

                        <Pressable
                            style={[styles.dashboardBtn, { backgroundColor: colors.cyan }]}
                            onPress={() => room?.id && navigation.navigate('SmartDashboard', {
                                roomId: room.id,
                                roomName: room.name,
                                scope: 'room',
                                mode: 'survival',
                            })}
                        >
                            <BarChart3 color={colors.text} size={22} />
                            <Text style={[styles.inviteFriendsBtnText, { color: colors.text }]}>Dashboard de Sala</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.configCard, styles.reviewCard, styles.relativeContainer, { backgroundColor: colors.input, borderColor: colors.accent }]}
                            onPress={() => setReviewPeersVisible(true)}
                        >
                            <View style={[styles.configIconBox, { backgroundColor: colors.accentSoft }]}>
                                <Users color={colors.accent} size={24} />
                            </View>
                            <View style={styles.configInfo}>
                                <Text style={[styles.configTitle, { color: colors.text }]}>Validar Compañeros</Text>
                                <Text style={[styles.configSub, { color: colors.textSoft }]}>Panel de verificación social de apuntes y evidencias</Text>
                            </View>
                            <ChevronRight color={colors.textMuted} size={20} />

                            {pendingReviewsCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                                    <Text style={[styles.badgeText, { color: colors.text }]}>{pendingReviewsCount}</Text>
                                </View>
                            )}
                        </Pressable>

                        <Pressable style={[styles.inviteFriendsMainBtn, { backgroundColor: colors.info }]} onPress={() => setInviteFriendsVisible(true)}>
                            <UserPlus color={colors.text} size={22} />
                            <Text style={[styles.inviteFriendsBtnText, { color: colors.text }]}>Invitar Amigos a la Sala</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.vaultBtn, { backgroundColor: colors.cyan }]}
                            onPress={() => room?.id && navigation.navigate('RoomVault', {
                                roomId: room.id,
                                roomName: room.name,
                                accentColor: colors.accent,
                            })}
                        >
                            <FolderOpen color={colors.text} size={22} />
                            <Text style={[styles.inviteFriendsBtnText, { color: colors.text }]}>The Vault</Text>
                        </Pressable>

                        {room?.teams_enabled && accessToken && room?.id && (
                            <TeamsSection roomId={room.id} accessToken={accessToken} mode="survival" />
                        )}
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
                onReviewProcessed={(count) => setPendingReviewsCount(count)}
            />

            {room && (
                <RoomChatModal
                    visible={chatVisible}
                    roomId={room.id}
                    roomName={room.name}
                    accentColor={colors.accent}
                    onClose={() => {
                        setChatVisible(false);
                    }}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    sending={false}
                />
            )}

            {/* ✅ AppAlert personalizado */}
            <AppAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    if (alert.onConfirm) alert.onConfirm();
                    setAlert(prev => ({ ...prev, visible: false }));
                }}
                onCancel={() => {
                    if (alert.onCancel) alert.onCancel();
                    setAlert(prev => ({ ...prev, visible: false }));
                }}
                confirmText={alert.confirmText || 'Aceptar'}
                cancelText={alert.cancelText || 'Cancelar'}
                showCancel={alert.showCancel || false}
            />
        </ScreenLayout>
    );
}

// ... (TimerProgressRing y TimerTick sin cambios)
function TimerProgressRing({
    children,
    isPomodoro,
    remainingRatio,
}: {
    children: React.ReactNode;
    isPomodoro: boolean;
    remainingRatio: number;
}) {
    const colors = useThemeStore(state => state.colors);
    const ticks = Array.from({ length: 48 }, (_, index) => index);
    const safeRemaining = Math.max(0, Math.min(1, remainingRatio));

    return (
        <View style={[styles.timerCircle, !isPomodoro && styles.freeTimerCircle, { backgroundColor: colors.input }, !isPomodoro && { borderColor: colors.cyan }]}>
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
            <View style={[styles.timerInner, { backgroundColor: colors.input, borderColor: colors.surfaceElevated }]}>{children}</View>
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
    const colors = useThemeStore(state => state.colors);
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

    return <Animated.View style={[styles.timerTick, { backgroundColor: colors.accent }, animatedStyle]} />;
}

const styles = StyleSheet.create({
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#94a3b8', fontWeight: 'bold' },
    scrollContent: { paddingBottom: 100, paddingVertical: 10 },
    focusScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 24, paddingVertical: 24 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
    chatIconWrapper: { position: 'relative', width: 20, height: 20 },
    chatBadge: {
        position: 'absolute',
        top: -8,
        right: -10,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 5,
    },
    inviteFriendsMainBtn: { backgroundColor: '#3b82f6', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, marginTop: 12 },
    dashboardBtn: { backgroundColor: '#0ea5e9', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14, marginTop: 12 },
    vaultBtn: { backgroundColor: '#0f766e', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 },
    inviteFriendsBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    configCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    reviewCard: { marginTop: 12, borderColor: '#16a34a' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    focusTimerSection: { marginVertical: 0, marginBottom: 30 },
    timerCircle: {
        width: 280,
        height: 280,
        borderRadius: 140,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a'
    },
    timerInner: {
        width: 232,
        height: 232,
        borderRadius: 116,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#1e293b',
        gap: 6
    },
    freeTimerCircle: { borderWidth: 8, borderColor: '#06b6d4' },
    tickLayer: { position: 'absolute', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
    timerTick: { position: 'absolute', width: 6, height: 18, borderRadius: 999, backgroundColor: '#22c55e' },
    timerValue: { color: 'white', fontSize: 64, fontWeight: '900' },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    controlsContainer: { marginBottom: 20 },
    focusControlsContainer: { marginTop: 8, marginBottom: 0, width: '100%' },
    startBtn: { backgroundColor: '#22c55e', height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    rowControls: { flexDirection: 'row', gap: 12, width: '100%' },
    controlBtn: { flex: 1, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    pauseBtn: { backgroundColor: '#f59e0b' },
    resumeBtn: { backgroundColor: '#06b6d4' },
    finishBtn: { backgroundColor: '#dc2626' },
    btnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    relativeContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -10,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingHorizontal: 5,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
