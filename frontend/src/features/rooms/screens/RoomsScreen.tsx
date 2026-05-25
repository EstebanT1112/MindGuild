import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Inbox, LogIn, Plus, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import RoomCard, { type RoomCardData } from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';
import { createRoom, fetchMyRooms, joinRoom, type CreatedRoom, type RoomMode, type UserRoom } from '../services/roomsService';

export default function RoomsScreen() {
    const navigation = useNavigation<any>();
    const accessToken = useAuthStore(state => state.access_token);

    const [createVisible, setCreateVisible] = useState(false);
    const [joinVisible, setJoinVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [myRooms, setMyRooms] = useState<RoomCardData[]>([]);

    useEffect(() => {
        loadRooms();
    }, [accessToken]);

    const loadRooms = async () => {
        if (!accessToken) return;

        try {
            const rooms = await fetchMyRooms(accessToken);
            setMyRooms(rooms.map(mapUserRoomToCard));
        } catch (error: any) {
            Alert.alert('Error al cargar salas', error.message ?? 'No se pudieron cargar tus salas.');
        }
    };

    // RF-04: crea la sala en backend, muestra el invite_code y actualiza el listado local.
    const handleCreateRoom = async (input: { name: string; mode: RoomMode; teams_enabled: boolean }) => {
        if (!accessToken) return;

        setCreating(true);
        try {
            const room = await createRoom(accessToken, input);
            setMyRooms(currentRooms => [mapCreatedRoomToCard(room), ...currentRooms]);
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
            setMyRooms(currentRooms => [mapCreatedRoomToCard(room), ...currentRooms]);
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
            <Pressable style={styles.createMainBtn} onPress={() => setCreateVisible(true)}>
                <Plus color="white" size={24} />
                <Text style={styles.createBtnText}>Crear Nueva Sala</Text>
            </Pressable>

            <Pressable style={styles.joinMainBtn} onPress={() => setJoinVisible(true)}>
                <LogIn color="#3b82f6" size={22} />
                <Text style={styles.joinBtnText}>Unirse con Codigo</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
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
        </ScreenLayout>
    );
}

function mapCreatedRoomToCard(room: CreatedRoom): RoomCardData {
    // Adapta la respuesta de creacion al formato visual usado por RoomCard.
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
    createMainBtn: {
        backgroundColor: '#22c55e',
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 10,
        marginTop: 5,
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
