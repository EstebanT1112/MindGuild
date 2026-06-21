import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    RefreshControl,
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
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import StatCard from '../components/StatCard';
import WeeklyProgress from '../components/WeeklyProgress';
import AchievementDetailModal from '../components/AchievementDetailModal';

import { updateMyProfile } from '../services/profileService';

import {
    claimAchievementReward,
    type Achievement
} from '../services/achievementsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';
const DEFAULT_ACHIEVEMENT_REWARD_COINS = 3;

const getAchievementRewardCoins = (achievement: Achievement) => {
    const rewardCoins = achievement.reward_coins ?? 0;
    return rewardCoins > 0 ? rewardCoins : DEFAULT_ACHIEVEMENT_REWARD_COINS;
};

const medalTierColors = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#facc15',
};

const renderAchievementIcon = (achievement: Achievement, size = 30) => {
    const color = achievement.unlocked ? '#22c55e' : '#64748b';
    const props = { color, size };

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
    const profile = useAppDataStore(state => state.profile.data);
    const profileLoading = useAppDataStore(state => state.profile.isLoading);
    const achievements = useAppDataStore(state => state.achievements.data ?? []);
    const loadProfileFromStore = useAppDataStore(state => state.loadProfile);
    const setProfileInStore = useAppDataStore(state => state.setProfile);
    const loadAchievementsFromStore = useAppDataStore(state => state.loadAchievements);

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const unlockedAchievementsCount = achievements.filter(achievement => achievement.unlocked).length;
    
    const avatarUri = profile?.avatar_url || fallbackAvatar;

    useEffect(() => {
        loadProfile();
    }, [accessToken]);

    // RF-03: obtiene el perfil completo y sincroniza el usuario global.
    const loadProfile = async () => {
        if (!accessToken) return;

        try {
            const data = await loadProfileFromStore(accessToken);
            if (data) {
                setUser({ id: data.id, email: data.email, username: data.username });
            }

            try {
                await loadAchievementsFromStore(accessToken);
            } catch (achievementError) {
                console.warn('No se pudieron cargar los logros', achievementError);
            }
        } catch (error: any) {
            Alert.alert('Error de perfil', error.message ?? 'No se pudo cargar el perfil.');
        }
    };

    const handleRefresh = async () => {
        if (!accessToken) return;

        setRefreshing(true);
        try {
            const data = await loadProfileFromStore(accessToken, { force: true });
            if (data) {
                setUser({ id: data.id, email: data.email, username: data.username });
            }
            await loadAchievementsFromStore(accessToken, { force: true });
        } catch (error: any) {
            Alert.alert('Error de perfil', error.message ?? 'No se pudo cargar el perfil.');
        } finally {
            setRefreshing(false);
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

            setProfileInStore(updatedProfile);
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

    const handleClaimAchievement = async (achievementId: string) => {
        if (!accessToken || claimingAchievementId) return;

        setClaimingAchievementId(achievementId);
        try {
            const result = await claimAchievementReward(accessToken, achievementId);
            if (profile && typeof result?.coins_balance === 'number') {
                setProfileInStore({ ...profile, coins_balance: result.coins_balance });
            }
            await Promise.all([
                loadProfileFromStore(accessToken, { force: true }),
                loadAchievementsFromStore(accessToken, { force: true }),
            ]);
            setSelectedAchievement(current =>
                current?.id === achievementId
                    ? { ...current, reward_claimed_at: new Date().toISOString() }
                    : current
            );
        } catch (error: any) {
            Alert.alert('Error al reclamar', error.message ?? 'No se pudo reclamar la recompensa.');
        } finally {
            setClaimingAchievementId(null);
        }
    };

    if (profileLoading && !profile) {
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
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#22c55e"
                        colors={['#22c55e']}
                    />
                }
            >
                
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

                {/* IMPLEMENTAR EN LA E2 */}
                {/* Progreso Semanal
                <WeeklyProgress
                    data={[0, 0, 0, 0, 0, 0, profile?.weekly_stats.total_minutes ?? 0]}
                    totalMinutes={profile?.weekly_stats.total_minutes ?? 0}
                /> */}

                {/* Sección de Medallas / Logros Unificada */}
                <View style={styles.medalsSection}>
                    <View style={styles.sectionHeaderRow}>
                        <Medal color="#facc15" size={20} />
                        <Text style={styles.sectionTitle}>Logros y medallas</Text>
                    </View>
                    <View style={styles.medalsGrid}>
                        {achievements.length === 0 ? (
                            <Text style={styles.emptyAchievementsText}>Todavia no hay logros disponibles.</Text>
                        ) : achievements.map((m) => {
                            const rewardCoins = getAchievementRewardCoins(m);

                            return (
                                <Pressable
                                    key={m.id}
                                    style={[styles.medalCard, !m.unlocked && styles.lockedMedalCard]}
                                    onPress={() => setSelectedAchievement(m)}
                                >
                                    <View
                                        style={[
                                            styles.medalTierDot,
                                            { backgroundColor: medalTierColors[m.medal_tier ?? 'bronze'] },
                                        ]}
                                    />
                                    {renderAchievementIcon(m)}
                                    <Text style={styles.medalName}>{m.name}</Text>
                                    <Text style={styles.medalReward}>+{rewardCoins}</Text>
                                    <Text style={styles.medalProgress}>
                                        {m.progress_value ?? 0}/{m.target_value}
                                    </Text>
                                    <Text style={[styles.medalStatus, m.unlocked && styles.medalStatusUnlocked]}>
                                        {m.reward_claimed_at ? 'Reclamado' : m.unlocked ? 'Desbloqueado' : 'Pendiente'}
                                    </Text>
                                    {m.unlocked && !m.reward_claimed_at && rewardCoins > 0 && (
                                        <Pressable
                                            style={styles.claimAchievementBtn}
                                            onPress={() => handleClaimAchievement(m.id)}
                                            disabled={claimingAchievementId === m.id}
                                        >
                                            <Text style={styles.claimAchievementText}>
                                                {claimingAchievementId === m.id ? '...' : 'Reclamar'}
                                            </Text>
                                        </Pressable>
                                    )}
                                </Pressable>
                            );
                        })}
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
                email={profile?.email}
                authProviders={profile?.auth_providers ?? []}
                onAuthProvidersChanged={(authProviders) => {
                    if (profile) {
                        setProfileInStore({ ...profile, auth_providers: authProviders });
                    }
                }}
            />

            <AchievementDetailModal
                visible={Boolean(selectedAchievement)}
                achievement={selectedAchievement}
                onClose={() => setSelectedAchievement(null)}
                onClaim={handleClaimAchievement}
                claiming={selectedAchievement ? claimingAchievementId === selectedAchievement.id : false}
                renderIcon={renderAchievementIcon}
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
    medalTierDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    lockedMedalCard: { opacity: 0.55 },
    medalName: { color: 'white', fontSize: 10, textAlign: 'center', fontWeight: 'bold' },
    medalReward: { color: '#facc15', fontSize: 11, textAlign: 'center', fontWeight: '900' },
    medalProgress: { color: '#94a3b8', fontSize: 10, textAlign: 'center', fontWeight: '700' },
    medalStatus: { color: '#94a3b8', fontSize: 9, textAlign: 'center', fontWeight: '700' },
    medalStatusUnlocked: { color: '#22c55e' },
    claimAchievementBtn: { backgroundColor: '#22c55e', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6, marginTop: 2 },
    claimAchievementText: { color: 'white', fontSize: 10, fontWeight: '900' },
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
