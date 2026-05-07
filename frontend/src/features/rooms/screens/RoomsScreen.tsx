import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import RoomCard, { type RoomCardData } from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import { createRoom, type CreatedRoom, type RoomMode } from '../services/roomsService';

export default function RoomsScreen() {
    const navigation = useNavigation<any>();
    const accessToken = useAuthStore(state => state.access_token);

    const [createVisible, setCreateVisible] = useState(false);
    const [creating, setCreating] = useState(false);
    const [myRooms, setMyRooms] = useState<RoomCardData[]>([]);

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

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                <Text style={styles.sectionTitle}>MIS SALAS ({myRooms.length})</Text>

                {myRooms.map(room => (
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
                ))}
            </ScrollView>

            <CreateRoomModal
                visible={createVisible}
                onClose={() => setCreateVisible(false)}
                onCreate={handleCreateRoom}
                loading={creating}
            />
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
    scroll: { flex: 1 },
    sectionTitle: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '900',
        marginVertical: 15,
        letterSpacing: 1,
    },
});
