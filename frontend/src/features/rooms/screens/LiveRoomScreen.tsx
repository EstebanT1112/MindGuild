import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Settings, PlayCircle, ChevronRight, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';

// Componentes del proyecto
import SessionConfigModal from '../components/SessionConfigModal';
import RoomRanking from '../components/RoomRanking';
import TeamsSection from '../components/TeamsSection';

export default function LiveRoomScreen() {
    const [configVisible, setConfigVisible] = useState(false);

    return (
        <ScreenLayout 
            title="SALA EN VIVO" 
            type="rooms" 
            icon={<Users color="#22c55e" size={22} />}
        >
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
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

                {/* TIMER SECCIÓN */}
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

                {/* RANKING Y EQUIPOS */}
                <RoomRanking />
                <TeamsSection />
                
            </ScrollView>

            <SessionConfigModal 
                visible={configVisible} 
                onClose={() => setConfigVisible(false)} 
            />
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    scrollContent: { 
        paddingBottom: 100,
        paddingVertical: 10 
    },
    configCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#1e293b', 
        padding: 15, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    configIconBox: { 
        width: 48, 
        height: 48, 
        borderRadius: 12, 
        backgroundColor: '#0f172a', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13, marginTop: 2 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: { 
        width: 240, 
        height: 240, 
        borderRadius: 120, 
        borderWidth: 8, 
        borderColor: '#22c55e', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#0f172a'
    },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900', marginVertical: 5 },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { 
        backgroundColor: '#22c55e', 
        height: 64, 
        borderRadius: 24, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 12, 
        marginBottom: 20 
    },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});