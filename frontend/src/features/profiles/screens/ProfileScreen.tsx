import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Pressable, 
  SafeAreaView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  Star, 
  Target, 
  Medal, 
  Zap, 
  Crown, 
  Edit2, 
  Settings 
} from 'lucide-react-native';

// Componentes propios
import StatCard from '../components/StatCard';
import WeeklyProgress from '../components/WeeklyProgress';
import EditProfileModal from '../components/EditProfileModal'; 
import SettingsModal from '../components/SettingsModal'; // <--- IMPORTACIÓN DEL NUEVO MODAL

export default function ProfileScreen() {
    const navigation = useNavigation<any>();
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false); // <--- ESTADO PARA SETTINGS

    // URL temporal para el avatar
    const avatarUri = 'https://i.pinimg.com/736x/8b/16/7a/8b167afad95886616441a1a7f0e9f697.jpg';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.leftHeader}>
                        <Pressable
                            style={styles.iconBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <ArrowLeft color="#94a3b8" size={20} />
                        </Pressable>
                    </View>

                    <Text style={styles.headerTitle}>MI PERFIL</Text>

                    <View style={styles.rightButtons}>
                        {/* Botón Editar */}
                        <Pressable 
                            style={[styles.iconBtn, styles.editBtnActive]} 
                            onPress={() => setEditModalVisible(true)}
                        >
                            <Edit2 color="#3b82f6" size={18} />
                        </Pressable>
                        
                        {/* Botón Configuración CONECTADO */}
                        <Pressable 
                            style={styles.iconBtn}
                            onPress={() => setSettingsVisible(true)} // <--- ABRE EL MODAL
                        >
                            <Settings color="#94a3b8" size={18} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* SECCIÓN PERFIL PRINCIPAL */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarBorder}>
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatarImage}
                                />
                            </View>
                            <View style={styles.levelBadge}>
                                <Text style={styles.levelText}>5</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>Samurai Sensei</Text>
                        <Text style={styles.userTag}>@samurai_warrior</Text>
                        <View style={styles.ratingRow}>
                            <Star color="#facc15" fill="#facc15" size={16} />
                            <Text style={styles.ratingText}>Rating: 4.8/5.0</Text>
                        </View>
                    </View>

                    {/* ESTADÍSTICAS EN GRID */}
                    <View style={styles.statsGrid}>
                        <StatCard icon={<Trophy color="#22c55e" size={24} />} value="142" label="Pomodoros" />
                        <StatCard icon={<Flame color="#fb923c" size={24} />} value="3 días" label="Racha Actual" />
                        <StatCard icon={<Target color="#22c55e" size={24} />} value="#7" label="Ranking" />
                        <StatCard icon={<Star color="#22c55e" size={24} />} value="5" label="Nivel Aldea" />
                    </View>

                    <WeeklyProgress data={[80, 50, 100, 85, 40, 5, 5]} />

                    {/* SECCIÓN MEDALLAS */}
                    <View style={styles.medalsSection}>
                        <View style={styles.sectionHeaderRow}>
                            <Medal color="#facc15" size={20} />
                            <Text style={styles.sectionTitle}>Medallas Desbloqueadas</Text>
                        </View>
                        <View style={styles.medalsGrid}>
                            {[
                                { name: '3 Días Consecutivos', icon: Flame, color: '#fb923c', unlocked: true },
                                { name: 'Auditor Implacable', icon: Target, color: '#3b82f6', unlocked: true },
                                { name: 'Estudiante Dedicado', icon: Medal, color: '#22c55e', unlocked: true },
                                { name: 'Maestro del Focus', icon: Target, color: '#4b5563', unlocked: false },
                                { name: 'Racha de 7 días', icon: Zap, color: '#4b5563', unlocked: false },
                                { name: 'Top 3 Ranking', icon: Crown, color: '#4b5563', unlocked: false },
                            ].map((m, i) => (
                                <View key={i} style={[styles.medalCard, !m.unlocked && { opacity: 0.4 }]}>
                                    <m.icon color={m.color} size={30} />
                                    <Text style={styles.medalName}>{m.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* SECCIÓN ALDEA */}
                    <View style={styles.villageCard}>
                        <Text style={styles.villageTitle}>Tu Aldea en Evolución</Text>
                        <View style={styles.villageMainRow}>
                            <Image
                                source={{ uri: 'https://i.pinimg.com/736x/f6/8b/3a/f68b3af68b3af68b3af68b3af68b3af68b3af68b3a.jpg' }}
                                style={styles.villageImage}
                            />
                            <View style={styles.villageInfo}>
                                <View style={styles.levelRow}>
                                    <Text style={styles.levelLabelText}>Nivel 5</Text>
                                    <Text style={styles.percentageText}>40%</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: '40%' }]} />
                                </View>
                                <Text style={styles.nextLevelText}>2 Pomodoros más para nivel 6</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>

            {/* MODAL EDITAR PERFIL */}
            <EditProfileModal 
                visible={isEditModalVisible} 
                onClose={() => setEditModalVisible(false)}
                currentData={{
                    name: "Samurai Sensei",
                    username: "samurai_warrior",
                    photo: { uri: avatarUri }
                }}
            />

            {/* MODAL CONFIGURACIÓN (Settings) */}
            <SettingsModal 
                visible={isSettingsVisible} 
                onClose={() => setSettingsVisible(false)} 
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // (Mismos estilos que ya tenías)
    safeArea: { flex: 1, backgroundColor: '#0f172a' },
    container: { flex: 1, paddingHorizontal: 20 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingVertical: 15 
    },
    leftHeader: { flex: 1, alignItems: 'flex-start' },
    headerTitle: { 
        flex: 2, 
        color: 'white', 
        fontSize: 18, 
        fontWeight: '900', 
        textAlign: 'center', 
        letterSpacing: 1 
    },
    rightButtons: { 
        flex: 1, 
        flexDirection: 'row', 
        gap: 10, 
        justifyContent: 'flex-end' 
    },
    iconBtn: { 
        width: 40, height: 40, borderRadius: 12, 
        backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' 
    },
    editBtnActive: { borderColor: '#3b82f6', borderWidth: 1 },
    profileSection: { alignItems: 'center', marginVertical: 20 },
    avatarContainer: { position: 'relative' },
    avatarBorder: { 
        width: 150, height: 150, borderRadius: 75, 
        borderWidth: 4, borderColor: '#facc15', padding: 5 
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 70 },
    levelBadge: { 
        position: 'absolute', bottom: 5, right: 5, 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: '#22c55e', borderWidth: 3, 
        borderColor: '#0f172a', alignItems: 'center', justifyContent: 'center' 
    },
    levelText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    userName: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 15 },
    userTag: { color: '#94a3b8', fontSize: 16 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    ratingText: { color: '#facc15', fontWeight: 'bold' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, justifyContent: 'center' },
    medalsSection: { 
        backgroundColor: '#1e293b', borderRadius: 28, 
        padding: 20, marginBottom: 30, marginTop: 20 
    },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    medalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    medalCard: { 
        width: '30%', backgroundColor: '#0f172a', 
        padding: 15, borderRadius: 20, alignItems: 'center', 
        gap: 8, borderWidth: 1, borderColor: '#334155' 
    },
    medalName: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
    villageCard: { 
        backgroundColor: '#1e293b', borderRadius: 28, 
        padding: 20, marginBottom: 40, borderWidth: 1, borderColor: '#334155' 
    },
    villageTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    villageMainRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
    villageImage: { width: 100, height: 100, borderRadius: 20, borderWidth: 2, borderColor: '#22c55e' },
    villageInfo: { flex: 1 },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    levelLabelText: { color: 'white', fontWeight: 'bold' },
    percentageText: { color: '#22c55e', fontWeight: 'bold' },
    progressBarBg: { height: 10, backgroundColor: '#334155', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#22c55e' },
    nextLevelText: { color: '#64748b', fontSize: 12, marginTop: 8 },
});