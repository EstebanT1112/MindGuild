import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Inbox, LogIn, Plus, Users, Mail } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { SessionExpiredError } from '../../../services/authenticatedFetch';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import RoomCard, { type RoomCardData } from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import {
    createRoom,
    joinRoom,
    markRoomFavorite,
    unmarkRoomFavorite,
    type RoomMode,
    type UserRoom,
} from '../services/roomsService';

import RoomInvitationsModal from '../components/RoomInvitationsModal';
import { roomInvitationsService } from '../services/roomInvitationsService';

export default function RoomsScreen() {
    const navigation = useNavigation<any>();
    const colors = useThemeStore(state => state.colors);
    const accessToken = useAuthStore(state => state.access_token);
    const getCurrentAccessToken = () => useAuthStore.getState().access_token;
    const rooms = useAppDataStore(state => state.rooms.data ?? []);
    const loadRoomsFromStore = useAppDataStore(state => state.loadRooms);
    const addOrReplaceRoom = useAppDataStore(state => state.addOrReplaceRoom);
    const setRoomFavorite = useAppDataStore(state => state.setRoomFavorite);
    const invalidateAfterRoomParticipation = useAppDataStore(state => state.invalidateAfterRoomParticipation);

    const [createVisible, setCreateVisible] = useState(false);
    const [joinVisible, setJoinVisible] = useState(false);

    const [invitationsVisible, setInvitationsVisible] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

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

    const myRooms = rooms.map(mapUserRoomToCard);

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

    useFocusEffect(useCallback(() => {
        loadInitialRooms(true);
        checkPendingInvitations();
    }, [accessToken]));

    const loadInitialRooms = async (force = false) => {
        if (!accessToken) return;
        try {
            await loadRoomsFromStore(accessToken, { force });
        } catch (error: any) {
            showAlert('Error al cargar salas', error.message ?? 'No se pudieron cargar tus salas.', 'error');
        }
    };

    const checkPendingInvitations = async () => {
        const currentAccessToken = getCurrentAccessToken();
        if (!currentAccessToken) return;
        try {
            const data = await roomInvitationsService.fetchReceivedRoomInvitations(currentAccessToken);
            setPendingCount(data?.length || 0);
        } catch (error: any) {
            if (
                !(error instanceof SessionExpiredError) &&
                !String(error?.message ?? '').toLowerCase().includes('token invalido')
            ) {
                console.error('Error al chequear invitaciones pendientes:', error);
            }
        }
    };

    const handleRefresh = async () => {
        if (!accessToken) return;

        setRefreshing(true);
        try {
            await loadRoomsFromStore(accessToken, { force: true });
            await checkPendingInvitations();
        } catch (error: any) {
            showAlert('Error al cargar salas', error.message ?? 'No se pudieron cargar tus salas.', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateRoom = async (input: { name: string; mode: RoomMode; teams_enabled: boolean }) => {
        if (!accessToken) return;

        setCreating(true);
        try {
            const room = await createRoom(accessToken, input);
            addOrReplaceRoom(room);
            invalidateAfterRoomParticipation();
            setCreateVisible(false);
            showAlert('Sala creada', `Código de invitación: ${room.invite_code}`, 'success');
        } catch (error: any) {
            showAlert('Error al crear sala', error.message ?? 'No se pudo crear la sala.', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleJoinRoom = async (inviteCode: string) => {
        if (!accessToken) return;

        setJoining(true);
        try {
            const room = await joinRoom(accessToken, inviteCode);
            addOrReplaceRoom(room);
            invalidateAfterRoomParticipation();
            setJoinVisible(false);
            showAlert('Te uniste a la sala', room.name, 'success');
        } catch (error: any) {
            showAlert('Error al unirse', error.message ?? 'No se pudo unir a la sala.', 'error');
        } finally {
            setJoining(false);
        }
    };

    const handleToggleFavorite = async (room: RoomCardData) => {
        if (!accessToken || favoriteLoadingId) return;

        const nextFavorite = !room.isFavorite;
        setFavoriteLoadingId(room.id);
        setRoomFavorite(room.id, nextFavorite);

        try {
            const updatedRoom = room.isFavorite
                ? await unmarkRoomFavorite(accessToken, room.id)
                : await markRoomFavorite(accessToken, room.id);

            addOrReplaceRoom(updatedRoom);
        } catch (error: any) {
            setRoomFavorite(room.id, Boolean(room.isFavorite));
            showAlert('Error de favorita', error.message ?? 'No se pudo actualizar la sala favorita.', 'error');
        } finally {
            setFavoriteLoadingId(null);
        }
    };

    return (
        <ScreenLayout
            title="MIS SALAS"
            type="rooms"
            icon={<Users color={colors.accent} size={22} />}
            hideBackButton={true}
        >
            <Pressable style={[styles.createMainBtn, { backgroundColor: colors.accent }]} onPress={() => setCreateVisible(true)}>
                <Plus color="white" size={24} />
                <Text style={styles.createBtnText}>Crear Nueva Sala</Text>
            </Pressable>

            <Pressable style={[styles.joinMainBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => setJoinVisible(true)}>
                <LogIn color="#3b82f6" size={22} />
                <Text style={styles.joinBtnText}>Unirse con Código</Text>
            </Pressable>

            <Pressable
                style={[
                    styles.invitationsMainBtn,
                    pendingCount > 0 && styles.invitationsMainBtnActive
                ]}
                onPress={() => setInvitationsVisible(true)}
            >
                <View style={styles.mailContainer}>
                    <Mail color="#ffffff" size={20} />
                    {pendingCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingCount}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.invitationsBtnText}>
                    {pendingCount > 0 ? 'Ver invitaciones' : 'Ver Invitaciones de Salas'}
                </Text>
            </Pressable>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={[styles.scroll, { backgroundColor: colors.background }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                    />
                }
            >
                <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>MIS SALAS ({myRooms.length})</Text>

                {myRooms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Inbox color={colors.textSoft} size={28} />
                        <Text style={[styles.emptyText, { color: colors.textSoft }]}>Todavía no tenés salas.</Text>
                    </View>
                ) : (
                    myRooms.map(room => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onToggleFavorite={() => handleToggleFavorite(room)}
                            onPress={() => {
                                if (room.rawMode === 'battle_royale') {
                                    navigation.navigate('BattleRoyale', { roomId: room.id, roomName: room.name });
                                } else {
                                    navigation.navigate('LiveRoom', { roomId: room.id, roomName: room.name });
                                }
                            }}
                        />
                    ))
                )}
            </ScrollView>

            <CreateRoomModal
                visible={createVisible}
                onClose={() => setCreateVisible(false)}
                onCreate={handleCreateRoom}
                loading={creating}
            />
            <JoinRoomModal
                visible={joinVisible}
                onClose={() => setJoinVisible(false)}
                onJoin={handleJoinRoom}
                loading={joining}
            />

            {accessToken && (
                <RoomInvitationsModal
                    visible={invitationsVisible}
                    onClose={() => setInvitationsVisible(false)}
                    accessToken={accessToken}
                    onInvitationProcessed={handleRefresh}
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

function mapUserRoomToCard(room: UserRoom): RoomCardData {
    return {
        id: room.id,
        name: room.name,
        code: room.invite_code,
        members: room.members_count,
        mode: room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia',
        rawMode: room.mode,
        ranking: 1,
        teamsEnabled: room.teams_enabled,
        isFavorite: room.is_favorite,
    };
}

const styles = StyleSheet.create({
    invitationsMainBtn: {
        backgroundColor: '#4f46e5',
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#6366f1',
        marginBottom: 10,
    },
    invitationsMainBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#60a5fa',
    },
    invitationsBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
    createMainBtn: {
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 10,
    },
    createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    joinMainBtn: {
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    joinBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 15 },
    scroll: { flex: 1 },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        marginVertical: 15,
        letterSpacing: 1,
    },
    emptyState: { alignItems: 'center', gap: 8, paddingVertical: 28 },
    emptyText: { fontSize: 13, fontWeight: 'bold' },
    mailContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -10,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        paddingHorizontal: 5,
        height: 18,
        justifyContent: 'center',
        zIndex: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});