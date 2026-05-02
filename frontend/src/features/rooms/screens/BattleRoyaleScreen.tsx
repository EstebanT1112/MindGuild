import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Users, Settings, PlayCircle, ChevronRight, Plus, Trash2 } from 'lucide-react-native';

// Importamos los componentes que ya tenés
import SessionConfigModal from '../components/SessionConfigModal';
import RoomRanking from '../components/RoomRanking';
// Nuevos componentes que crearemos abajo
import NewQuestionModal from '../components/NewQuestionModal';
import WeeklyQuizModal from '../components/WeeklyQuizModal';

export default function BattleRoyaleScreen() {
    const navigation = useNavigation();
    const [configVisible, setConfigVisible] = useState(false);
    const [questionVisible, setQuestionVisible] = useState(false);
    const [quizVisible, setQuizVisible] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* HEADER BATTLE ROYALE */}
                <View style={styles.header}>
                    <Pressable style={styles.iconBtn} onPress={() => navigation.goBack()}>
                        <ArrowLeft color="#94a3b8" size={20} />
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.roomName}>Battle Royale - Cálculo I</Text>
                        <Text style={styles.roomMode}>Battle Royale</Text>
                    </View>
                    <View style={styles.memberBadge}>
                        <Users color="#a855f7" size={16} />
                        <Text style={styles.memberText}>12</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* CONFIGURACIÓN VIOLETA */}
                    <Pressable style={styles.configCard} onPress={() => setConfigVisible(true)}>
                        <View style={styles.configIconBox}>
                            <Settings color="#a855f7" size={24} />
                        </View>
                        <View style={styles.configInfo}>
                            <Text style={styles.configTitle}>Configurar Sesión</Text>
                            <Text style={styles.configSub}>Pomodoro · 25min · 4 ciclos</Text>
                        </View>
                        <ChevronRight color="#4b5563" size={20} />
                    </Pressable>

                    {/* TIMER VIOLETA */}
                    <View style={styles.timerSection}>
                        <View style={[styles.timerCircle, { borderColor: '#a855f7' }]}>
                            <PlayCircle color="#a855f7" size={32} />
                            <Text style={styles.timerValue}>25:00</Text>
                            <Text style={styles.timerCycles}>4 ciclos</Text>
                        </View>
                    </View>

                    {/* BOTÓN COMENZAR VIOLETA */}
                    <Pressable style={[styles.startBtn, { backgroundColor: '#a855f7' }]}>
                        <PlayCircle color="white" size={24} fill="white" />
                        <Text style={styles.startBtnText}>COMENZAR SESIÓN</Text>
                    </Pressable>

                    {/* RANKING REUTILIZADO */}
                    <RoomRanking />

                    {/* SECCIÓN QUIZ SEMANAL */}
                    <Text style={styles.sectionLabel}>QUIZ SEMANAL</Text>
                    <Pressable style={styles.quizBtn} onPress={() => setQuizVisible(true)}>
                        <PlayCircle color="white" size={24} />
                        <Text style={styles.quizBtnText}>Comenzar Quiz Semanal</Text>
                    </Pressable>
                    <Text style={styles.hintText}>2 preguntas · Después podrás validar las respuestas</Text>

                    {/* AGREGAR PREGUNTAS */}
                    <Text style={styles.sectionLabel}>AGREGAR PREGUNTAS</Text>
                    <Pressable style={styles.newQuestionBtn} onPress={() => setQuestionVisible(true)}>
                        <Plus color="white" size={24} />
                        <Text style={styles.newQuestionText}>Nueva Pregunta</Text>
                    </Pressable>
                    <Text style={styles.hintText}>Las preguntas serán votadas por el grupo</Text>

                    {/* PREGUNTAS PROPUESTAS */}
                    <Text style={styles.sectionLabel}>MIS PREGUNTAS PROPUESTAS</Text>
                    <View style={styles.proposedCard}>
                        <View style={styles.proposedHeader}>
                            <Text style={styles.proposedText}>¿Qué es un límite en cálculo?</Text>
                            <Trash2 color="#ef4444" size={20} />
                        </View>
                        <View style={styles.proposedFooter}>
                            <View style={styles.statusBadge}><Text style={styles.statusText}>Pendiente</Text></View>
                            <Text style={styles.votesText}>3 votos</Text>
                        </View>
                    </View>
                </ScrollView>

                <SessionConfigModal visible={configVisible} onClose={() => setConfigVisible(false)} />
                <NewQuestionModal visible={questionVisible} onClose={() => setQuestionVisible(false)} />
                <WeeklyQuizModal visible={quizVisible} onClose={() => setQuizVisible(false)} />
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
    memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#a855f715', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#a855f744' },
    memberText: { color: '#a855f7', fontWeight: 'bold' },
    configCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, marginTop: 10, borderWidth: 1, borderColor: '#334155' },
    configIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    configInfo: { flex: 1, marginLeft: 15 },
    configTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    configSub: { color: '#64748b', fontSize: 13 },
    timerSection: { alignItems: 'center', marginVertical: 30 },
    timerCircle: { width: 240, height: 240, borderRadius: 120, borderWidth: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
    timerValue: { color: 'white', fontSize: 56, fontWeight: '900' },
    timerCycles: { color: '#64748b', fontSize: 16, fontWeight: 'bold' },
    startBtn: { height: 64, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 },
    startBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
    sectionLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
    quizBtn: { backgroundColor: '#a855f7', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    quizBtnText: { color: 'white', fontWeight: '900', fontSize: 18 },
    newQuestionBtn: { backgroundColor: '#22c55e', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    newQuestionText: { color: 'white', fontWeight: '900', fontSize: 18 },
    hintText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 10 },
    proposedCard: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#334155' },
    proposedHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    proposedText: { color: 'white', fontWeight: 'bold', fontSize: 16, flex: 1 },
    proposedFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: { backgroundColor: '#facc1515', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#facc1544' },
    statusText: { color: '#facc15', fontSize: 12, fontWeight: 'bold' },
    votesText: { color: '#64748b', fontSize: 12 }
});