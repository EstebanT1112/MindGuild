import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    Award,
    BookOpen,
    CalendarCheck,
    Compass,
    Crown,
    Castle,
    Edit2,
    Flame,
    Gem,
    Medal,
    Network,
    Settings,
    Shield,
    Star,
    Trophy,
    Users,
    Zap,
} from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import StatCard from '../components/StatCard';
import WeeklyProgress from '../components/WeeklyProgress';

import {
    fetchMyProfile,
    type FullProfile,
    updateMyProfile
} from '../services/profileService';

import {
    fetchAchievements,
    type Achievement
} from '../services/achievementsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';

const renderAchievementIcon = (achievement: Achievement) => {
    const color = achievement.unlocked ? '#22c55e' : '#64748b';
    const props = { color, size: 30 };

    switch (achievement.badge_icon) {
        case 'star':
            return <Star {...props} />;
        case 'flame':
        case 'fire':
            return <Flame {...props} />;
        case 'book':
            return <BookOpen {...props} />;
        case 'calendar-check':
            return <CalendarCheck {...props} />;
        case 'compass':
            return <Compass {...props} />;
        case 'users':
            return <Users {...props} />;
        case 'trophy':
            return <Trophy {...props} />;
        case 'zap':
            return <Zap {...props} />;
        case 'crown':
            return <Crown {...props} />;
        case 'award':
            return <Award {...props} />;
        case 'network':
            return <Network {...props} />;
        case 'shield':
            return <Shield {...props} />;
        case 'gem':
            return <Gem {...props} />;
        case 'medal':
        default:
            return <Medal {...props} />;
    }
};

export default function ProfileScreen() {
    const accessToken = useAuthStore(state => state.access_token);
    const setUser = useAuthStore(state => state.setUser);

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [profile, setProfile] = useState<FullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const unlockedAchievementsCount = achievements.filter(achievement => achievement.unlocked).length;
    
    const avatarUri = profile?.avatar_url || fallbackAvatar;

    useEffect(() => {
        loadProfile();
    }, [accessToken]);

    // RF-03: obtiene el perfil completo y sincroniza el usuario global.
    const loadProfile = async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const data = await fetchMyProfile(accessToken);
            setProfile(data);
            setUser({ id: data.id, email: data.email, username: data.username });

            try {
                const achievementData = await fetchAchievements(accessToken);
                setAchievements(achievementData);
            } catch (achievementError) {
                console.warn('No se pudieron cargar los logros', achievementError);
                setAchievements([]);
            }
        } catch (error: any) {
            Alert.alert('Error de perfil', error.message ?? 'No se pudo cargar el perfil.');
        } finally {
            setLoading(false);
        }
    };

    // RF-03: envia cambios editables y refresca la respuesta completa del perfil.
    const handleSaveProfile = async (data: { username: string; bio: string; avatar_url: string }) => {
        if (!accessToken) return;

        setSaving(true);
        try {
            const updatedProfile = await updateMyProfile(accessToken, {
                username: data.username,
                bio: data.bio,
                avatar_url: data.avatar_url || null,
            });

            setProfile(updatedProfile);
            setUser({
                id: updatedProfile.id,
                email: updatedProfile.email,
                username: updatedProfile.username,
            });
            setEditModalVisible(false);
        } catch (error: any) {
            Alert.alert('Error al guardar', error.message ?? 'No se pudo actualizar el perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ScreenLayout title="MI PERFIL" type="profiles">
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#22c55e" />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="MI PERFIL" type="profiles">
            {/* El ScrollView envuelve todo, incluidos los botones superiores */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* Botones de acción contenidos en el flujo del scroll */}
                <View style={styles.actionButtons}>
                    <Pressable
                        style={[styles.iconBtn, styles.editBtnActive]}
                        onPress={() => setEditModalVisible(true)}
                    >
                        <Edit2 color="#3b82f6" size={18} />
                    </Pressable>

                    <Pressable
                        style={styles.iconBtn}
                        onPress={() => setSettingsVisible(true)}
                    >
                        <Settings color="#94a3b8" size={18} />
                    </Pressable>
                </View>

                {/* Información Principal del Perfil */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        </View>
                        <View style={styles.levelBadge}>
                            <Text style={styles.levelText}>{profile?.village.village_level ?? 1}</Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{profile?.username ?? 'Usuario'}</Text>
                    <Text style={styles.userTag}>@{profile?.username ?? 'usuario'}</Text>
                    {!!profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
                    <View style={styles.ratingRow}>
                        <Star color="#facc15" fill="#facc15" size={16} />
                        <Text style={styles.ratingText}>{profile?.email}</Text>
                    </View>
                </View>

                {/* Grid de Estadísticas */}
                <View style={styles.statsGrid}>
                    <StatCard icon={<Trophy color="#22c55e" size={24} />} value={`${profile?.total_study_minutes ?? 0}m`} label="Total Estudio" />
                    <StatCard icon={<Flame color="#fb923c" size={24} />} value={`${profile?.streak_days ?? 0} dias`} label="Racha Actual" />
                    <StatCard icon={<Medal color="#22c55e" size={24} />} value={`${unlockedAchievementsCount}`} label="Logros" />
                    <StatCard icon={<Castle color="#22c55e" size={24} />} value={`${profile?.village.village_level ?? 1}`} label="Nivel Aldea" />
                </View>

                {/* Progreso Semanal */}
                <WeeklyProgress
                    data={[0, 0, 0, 0, 0, 0, profile?.weekly_stats.total_minutes ?? 0]}
                    totalMinutes={profile?.weekly_stats.total_minutes ?? 0}
                />

                {/* Sección de Medallas / Logros Unificada */}
                <View style={styles.medalsSection}>
                    <View style={styles.sectionHeaderRow}>
                        <Medal color="#facc15" size={20} />
                        <Text style={styles.sectionTitle}>Logros y medallas</Text>
                    </View>
                    <View style={styles.medalsGrid}>
                        {achievements.length === 0 ? (
                            <Text style={styles.emptyAchievementsText}>Todavia no hay logros disponibles.</Text>
                        ) : achievements.map((m) => (
                            <View key={m.id} style={[styles.medalCard, !m.unlocked && styles.lockedMedalCard]}>
                                {renderAchievementIcon(m)}
                                <Text style={styles.medalName}>{m.name}</Text>
                                <Text style={[styles.medalStatus, m.unlocked && styles.medalStatusUnlocked]}>
                                    {m.unlocked ? 'Desbloqueado' : 'Pendiente'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Tarjeta de la Aldea */}
                <View style={styles.villageCard}>
                    <Text style={styles.villageTitle}>Tu Aldea en Evolucion</Text>
                    <View style={styles.villageMainRow}>
                        <View style={styles.villageIconBox}>
                            <Castle color="#22c55e" size={46} />
                        </View>
                        <View style={styles.villageInfo}>
                            <View style={styles.levelRow}>
                                <Text style={styles.levelLabelText}>Nivel {profile?.village.village_level ?? 1}</Text>
                                <Text style={styles.percentageText}>{profile?.weekly_stats.total_minutes ?? 0}m</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: '40%' }]} />
                            </View>
                            <Text style={styles.nextLevelText}>Tiempo semanal registrado</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Modales */}
            <EditProfileModal
                visible={isEditModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveProfile}
                loading={saving}
                currentData={{
                    username: profile?.username ?? '',
                    bio: profile?.bio ?? '',
                    avatar_url: profile?.avatar_url ?? null,
                }}
            />

            <SettingsModal
                visible={isSettingsVisible}
                onClose={() => setSettingsVisible(false)}
            />
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        paddingHorizontal: 4,
        marginBottom: 10,
    },
    iconBtn: {
        width: 40, 
        height: 40, 
        borderRadius: 12,
        backgroundColor: '#1e293b', 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#94a3b8', fontWeight: 'bold' },
    editBtnActive: { borderColor: '#3b82f6', borderWidth: 1 },
    profileSection: { alignItems: 'center', marginBottom: 20 },
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
    bioText: { color: '#cbd5e1', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 },
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
    lockedMedalCard: { opacity: 0.55 },
    medalName: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
    medalStatus: { color: '#94a3b8', fontSize: 9, textAlign: 'center', fontWeight: '700' },
    medalStatusUnlocked: { color: '#22c55e' },
    emptyAchievementsText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', width: '100%' },
    villageCard: {
        backgroundColor: '#1e293b', borderRadius: 28,
        padding: 20, marginBottom: 40, borderWidth: 1, borderColor: '#334155'
    },
    villageTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    villageMainRow: { flexDirection: 'row', gap: 15, alignItems: 'center' },
    villageIconBox: { width: 100, height: 100, borderRadius: 20, borderWidth: 2, borderColor: '#22c55e', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
    villageInfo: { flex: 1 },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    levelLabelText: { color: 'white', fontWeight: 'bold' },
    percentageText: { color: '#22c55e', fontWeight: 'bold' },
    progressBarBg: { height: 10, backgroundColor: '#334155', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#22c55e' },
    nextLevelText: { color: '#64748b', fontSize: 12, marginTop: 8 },
});
