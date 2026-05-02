import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';

export default function RoomsScreen() {
    const navigation = useNavigation<any>();
    const [createVisible, setCreateVisible] = useState(false);

    const myRooms = [
        { id: 1, name: "Cálculo I - Final", code: "CALC-7X9P", members: 5, mode: "Supervivencia", ranking: 2 },
        { id: 2, name: "Física II", code: "FIS2-A4B1", members: 8, mode: "Supervivencia", ranking: 3 },
        { id: 3, name: "Battle Royale - Cálculo I", code: "BR-CALC", members: 12, mode: "Battle Royale", ranking: 5 },
    ];

    return (
        <ScreenLayout 
            title="MIS SALAS" 
            type="rooms" 
            icon={<Users color="#22c55e" size={22} />}
        >
            {/* Botón crear - Ahora respira mejor bajo el header unificado */}
            <Pressable style={styles.createMainBtn} onPress={() => setCreateVisible(true)}>
                <Plus color="white" size={24} />
                <Text style={styles.createBtnText}>Crear Nueva Sala</Text>
            </Pressable>

            {/* Lista de salas */}
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

            <CreateRoomModal visible={createVisible} onClose={() => setCreateVisible(false)} />
        </ScreenLayout>
    );
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
        marginTop: 5 // Pequeño margen para separar del header
    },
    createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    scroll: { flex: 1 },
    sectionTitle: { 
        color: '#64748b', 
        fontSize: 12, 
        fontWeight: '900', 
        marginVertical: 15, 
        letterSpacing: 1 
    },
});