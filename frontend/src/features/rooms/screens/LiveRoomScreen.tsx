import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Users, Settings, PlayCircle, ChevronRight } from 'lucide-react-native';

// IMPORTANTE: Estos componentes deben existir en tu carpeta components
import SessionConfigModal from '../components/SessionConfigModal';
import RoomRanking from '../components/RoomRanking';
import TeamsSection from '../components/TeamsSection'; // <--- ESTE ES EL QUE TE FALTABA

export default function LiveRoomScreen() {
    const navigation = useNavigation();
    const [configVisible, setConfigVisible] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#94a3b8" size={20} />
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.roomName}>Cálculo I - Final</Text>
                        <Text style={styles.roomMode}>Supervivencia</Text>
                    </View>
                    <View style={styles.memberBadge}>
                        <Users color="#22c55e" size={16} />
                        <Text style={styles.memberText}>5</Text>
                    </View>
                </View>

                {/* El ScrollView envuelve todo el contenido dinámico */}
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ paddingBottom: 100 }} // Espacio para que no lo tape la barra inferior
                >
                    {/* CONFIGURACIÓN */}
                    <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                        <View style={styles.configIconBox}>
                            <Settings color="#22c55e" size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={styles.configTitle}>Configurar Sesión</Text>
                            <Text style={styles.configSub}>Pomodoro · 25min · 4 ciclos</Text>
                        </View>
                        <ChevronRight color="#4b5563" size={20} />
                    </Pressable>

                    {/* TIMER */}
                    <View style={styles.timerSection}>
                        <View style={styles.timerCircle}>
                            <PlayCircle color="#22c55e" size={32} />
                            <Text style={styles.timerValue}>25:00</Text>
                            <Text style={styles.timerCycles}>4 ciclos</Text>
                        </View>
                    </View>

                    {/* BOTÓN COMENZAR */}
                    <Pressable style={styles.startBtn}>
                        <PlayCircle color="white" size={24} fill="white" />
                        <Text style={styles.startBtnText}>COMENZAR SESIÓN</Text>
                    </Pressable>

                    {/* 1. RANKING (Aparece primero) */}
                    <RoomRanking />

                    {/* 2. EQUIPOS (Aparece justo debajo del ranking) */}
                    <TeamsSection />
                    
                </ScrollView>

                {/* MODAL DE CONFIGURACIÓN */}
                <SessionConfigModal 
                    visible={configVisible} 
                    onClose={() => setConfigVisible(false)} 
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
    iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
    headerTitleContainer: { alignItems: 'center' },
    roomName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    roomMode: { color: '#64748b', fontSize: 14 },
    memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#14532d', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    memberText: { color: '#22c55e', fontWeight: 'bold' },
    configCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: '#334155' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: { 
        width: 240, height: 240, borderRadius: 120, 
        borderWidth: 8, borderColor: '#22c55e', 
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0f172a'
    },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900', marginVertical: 5 },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { backgroundColor: '#22c55e', height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});