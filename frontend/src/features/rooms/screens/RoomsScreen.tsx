import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Users, Plus } from 'lucide-react-native';
import RoomCard from '../components/RoomCard';
import CreateRoomModal from '../components/CreateRoomModal';
import JoinRoomModal from '../components/JoinRoomModal';

export default function RoomsScreen() {
    // Usamos el hook de navegación para movernos a LiveRoom
    const navigation = useNavigation<any>();
    const [createVisible, setCreateVisible] = useState(false);
    const [joinVisible, setJoinVisible] = useState(false);

    const myRooms = [
        { id: 1, name: "Cálculo I - Final", code: "CALC-7X9P", members: 5, mode: "Supervivencia", rank: 2 },
        { id: 2, name: "Física II", code: "FIS2-A4B1", members: 8, mode: "Supervivencia", rank: 3 },
        { id: 3, name: "Battle Royale - Cálculo I", code: "BR-CALC", members: 12, mode: "Battle Royale", rank: 5 },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#94a3b8" size={20} />
                    </Pressable>
                    <View style={styles.headerTitle}>
                        <Users color="#22c55e" size={22} />
                        <Text style={styles.headerText}>MIS SALAS</Text>
                    </View>
                    <View style={styles.coinBadge}>
                        <View style={styles.hCoin}><Text style={styles.hText}>H</Text></View>
                        <Text style={styles.coinAmount}>1,250</Text>
                    </View>
                </View>

                <Pressable 
                    style={styles.createMainBtn} 
                    onPress={() => setCreateVisible(true)}
                >
                    <Plus color="white" size={24} />
                    <Text style={styles.createBtnText}>Crear Nueva Sala</Text>
                </Pressable>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                    <Text style={styles.sectionTitle}>MIS SALAS ({myRooms.length})</Text>
                    
                    {myRooms.map(room => (
                        <RoomCard 
                            key={room.id}
                            name={room.name}
                            code={room.code}
                            members={room.members}
                            mode={room.mode}
                            rank={room.rank}
                            // NAVEGACIÓN: Al tocar la tarjeta, vamos al Lobby
                            onPress={() => navigation.navigate('LiveRoom', { roomId: room.id, roomName: room.name })}
                        />
                    ))}
                </ScrollView>

                <Pressable style={styles.fab} onPress={() => setJoinVisible(true)}>
                    <Plus color="white" size={30} />
                </Pressable>

                <CreateRoomModal visible={createVisible} onClose={() => setCreateVisible(false)} />
                <JoinRoomModal visible={joinVisible} onClose={() => setJoinVisible(false)} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    coinBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 25, padding: 5, paddingRight: 15 },
    hCoin: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center' },
    hText: { fontWeight: '900', fontSize: 14, color: '#0f172a' },
    coinAmount: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
    createMainBtn: { backgroundColor: '#22c55e', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 10 },
    createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    scroll: { flex: 1 },
    sectionTitle: { color: '#64748b', fontSize: 12, fontWeight: '900', marginVertical: 15, letterSpacing: 1 },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 10 }
});