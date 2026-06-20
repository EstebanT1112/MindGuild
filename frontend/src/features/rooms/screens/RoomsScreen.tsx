import React, { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Inbox, LogIn, Plus, Users, Mail } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { SessionExpiredError } from '../../../services/authenticatedFetch';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import RoomCard, { type RoomCardData } from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import { createRoom, joinRoom, type CreatedRoom, type RoomMode, type UserRoom } from '../services/roomsService';

// --- IMPORTS DEL REQUERIMIENTO RF-05 ---
import RoomInvitationsModal from '../components/RoomInvitationsModal';
import { roomInvitationsService } from '../services/roomInvitationsService';

export default function RoomsScreen() {
    const navigation = useNavigation<any>();
    const accessToken = useAuthStore(state => state.access_token);
    const getCurrentAccessToken = () => useAuthStore.getState().access_token;
    const rooms = useAppDataStore(state => state.rooms.data ?? []);
    const loadRoomsFromStore = useAppDataStore(state => state.loadRooms);
    const addOrReplaceRoom = useAppDataStore(state => state.addOrReplaceRoom);
    const invalidateAfterRoomParticipation = useAppDataStore(state => state.invalidateAfterRoomParticipation);

    const [createVisible, setCreateVisible] = useState(false);
    const [joinVisible, setJoinVisible] = useState(false);
    
    // --- ESTADOS DE CONTROL PARA LAS INVITACIONES RECIBIDAS ---
    const [invitationsVisible, setInvitationsVisible] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const myRooms = rooms.map(mapUserRoomToCard);

    useFocusEffect(useCallback(() => {
        loadInitialRooms(true);
        checkPendingInvitations();
    }, [accessToken]));

    const loadInitialRooms = async (force = false) => {
        if (!accessToken) return;
        try {
            await loadRoomsFromStore(accessToken, { force });
        } catch (error: any) {
            Alert.alert('Error al cargar salas', error.message ?? 'No se pudieron cargar tus salas.');
        }
    };

    // Consulta el contador de invitaciones activas en segundo plano
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
            Alert.alert('Error al cargar salas', error.message ?? 'No se pudieron cargar tus salas.');
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
            Alert.alert('Sala creada', `Codigo de invitacion: ${room.invite_code}`);
        } catch (error: any) {
            Alert.alert('Error al crear sala', error.message ?? 'No se pudo crear la sala.');
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
            Alert.alert('Te uniste a la sala', room.name);
        } catch (error: any) {
            Alert.alert('Error al unirse', error.message ?? 'No se pudo unir a la sala.');
        } finally {
            setJoining(false);
        }
    };

    return (
        <ScreenLayout
            title="MIS SALAS"
            type="rooms"
            icon={<Users color="#22c55e" size={22} />}
        >
            {/* --- BOTÓN DE INVITACIONES PENDIENTES CON NOTIFICADOR DINÁMICO --- */}
            <Pressable 
                style={[styles.invitationsMainBtn, pendingCount > 0 && styles.invitationsMainBtnActive]} 
                onPress={() => setInvitationsVisible(true)}
            >
                <Mail color={pendingCount > 0 ? '#ffffff' : '#94a3b8'} size={20} />
                <Text style={[styles.invitationsBtnText, pendingCount > 0 && styles.invitationsBtnTextActive]}>
                    {pendingCount > 0 ? `Invitaciones Pendientes (${pendingCount})` : 'Ver Invitaciones de Salas'}
                </Text>
            </Pressable>

            <Pressable style={styles.createMainBtn} onPress={() => setCreateVisible(true)}>
                <Plus color="white" size={24} />
                <Text style={styles.createBtnText}>Crear Nueva Sala</Text>
            </Pressable>

            <Pressable style={styles.joinMainBtn} onPress={() => setJoinVisible(true)}>
                <LogIn color="#3b82f6" size={22} />
                <Text style={styles.joinBtnText}>Unirse con Codigo</Text>
            </Pressable>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#22c55e"
                        colors={['#22c55e']}
                    />
                }
            >
                <Text style={styles.sectionTitle}>MIS SALAS ({myRooms.length})</Text>

                {myRooms.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Inbox color="#64748b" size={28} />
                        <Text style={styles.emptyText}>Todavia no tenes salas.</Text>
                    </View>
                ) : (
                    myRooms.map(room => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onPress={() => {
                                if (room.mode === 'Battle Royale') {
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

            {/* --- MODAL PARA LA GESTIÓN DE LAS INVITACIONES DEL RF-05 --- */}
            {accessToken && (
                <RoomInvitationsModal
                    visible={invitationsVisible}
                    onClose={() => setInvitationsVisible(false)}
                    accessToken={accessToken}
                    onInvitationProcessed={handleRefresh}
                />
            )}
        </ScreenLayout>
    );
}

function mapCreatedRoomToCard(room: CreatedRoom): RoomCardData {
    return {
        id: room.id,
        name: room.name,
        code: room.invite_code,
        members: 1,
        mode: room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia',
        ranking: 1,
        teamsEnabled: room.teams_enabled,
    };
}

function mapUserRoomToCard(room: UserRoom): RoomCardData {
    return {
        id: room.id,
        name: room.name,
        code: room.invite_code,
        members: room.members_count,
        mode: room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia',
        ranking: 1,
        teamsEnabled: room.teams_enabled,
    };
}

const styles = StyleSheet.create({
    // Estilos del botón de invitaciones del RF-05
    invitationsMainBtn: {
        backgroundColor: '#1e293b',
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
        marginTop: 5
    },
    invitationsMainBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#3b82f6',
    },
    invitationsBtnText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 15 },
    invitationsBtnTextActive: { color: '#ffffff' },

    createMainBtn: {
        backgroundColor: '#22c55e',
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
        backgroundColor: '#1e293b',
        height: 48,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
    },
    joinBtnText: { color: '#3b82f6', fontWeight: 'bold', fontSize: 15 },
    scroll: { flex: 1 },
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '900',
        marginVertical: 15,
        letterSpacing: 1,
    },
    emptyState: { alignItems: 'center', gap: 8, paddingVertical: 28 },
    emptyText: { color: '#64748b', fontSize: 13, fontWeight: 'bold' },
});
