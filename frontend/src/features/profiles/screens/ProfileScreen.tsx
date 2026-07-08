import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
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
    Bell,
    BookOpen,
    CalendarCheck,
    Compass,
    Crown,
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
import { useFocusEffect } from '@react-navigation/native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useAppDataStore } from '../../../store/appDataStore';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import EditProfileModal from '../components/EditProfileModal';
import SettingsModal from '../components/SettingsModal';
import StatCard from '../components/StatCard';
import AchievementDetailModal from '../components/AchievementDetailModal';

import { updateMyProfile } from '../services/profileService';
import { fetchUnreadNotificationsCount } from '../../notifications/services/notificationsService';

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

export default function ProfileScreen({ navigation }: any) {
    const accessToken = useAuthStore(state => state.access_token);
    const setUser = useAuthStore(state => state.setUser);
    const profile = useAppDataStore(state => state.profile.data);
    const profileLoading = useAppDataStore(state => state.profile.isLoading);
    const achievements = useAppDataStore(state => state.achievements.data ?? []);
    const loadProfileFromStore = useAppDataStore(state => state.loadProfile);
    const setProfileInStore = useAppDataStore(state => state.setProfile);
    const loadAchievementsFromStore = useAppDataStore(state => state.loadAchievements);

    const colors = useThemeStore(state => state.colors);

    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isSettingsVisible, setSettingsVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [claimingAchievementId, setClaimingAchievementId] = useState<string | null>(null);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
    const unlockedAchievementsCount = achievements.filter(achievement => achievement.unlocked).length;

    // ✅ Estado para AppAlert
    const [alert, setAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
        confirmText?: string;
        showCancel?: boolean;
        cancelText?: string;
        onCancel?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
    });

    // ✅ Función para mostrar alertas personalizadas
    const showAlert = (
        title: string,
        message: string,
        type: AlertType = 'info',
        onConfirm?: () => void,
        confirmText?: string,
        showCancel?: boolean,
        cancelText?: string,
        onCancel?: () => void
    ) => {
        setAlert({
            visible: true,
            title,
            message,
            type,
            onConfirm,
            confirmText: confirmText || 'Aceptar',
            showCancel: showCancel || false,
            cancelText: cancelText || 'Cancelar',
            onCancel,
        });
    };

    const avatarUri = profile?.avatar_url || fallbackAvatar;

    useEffect(() => { loadProfile(); }, [accessToken]);

    useFocusEffect(useCallback(() => { loadUnreadNotificationsCount(); }, [accessToken]));

    const loadProfile = async () => {
        if (!accessToken) return;
        try {
            const data = await loadProfileFromStore(accessToken);
            if (data) setUser({ id: data.id, email: data.email, username: data.username });
            await loadAchievementsFromStore(accessToken).catch(console.warn);
            loadUnreadNotificationsCount();
        } catch (error: any) {
            showAlert('Error de perfil', error.message ?? 'No se pudo cargar el perfil.', 'error');
        }
    };

    const loadUnreadNotificationsCount = async () => {
        if (!accessToken) return;
        try {
            const count = await fetchUnreadNotificationsCount(accessToken);
            setUnreadNotificationsCount(count);
        } catch (error) { console.warn('No se pudo cargar notificaciones', error); }
    };

    const handleRefresh = async () => {
        if (!accessToken) return;
        setRefreshing(true);
        try {
            const data = await loadProfileFromStore(accessToken, { force: true });
            if (data) setUser({ id: data.id, email: data.email, username: data.username });
            await loadAchievementsFromStore(accessToken, { force: true });
            await loadUnreadNotificationsCount();
        } catch (error: any) {
            showAlert('Error de perfil', error.message ?? 'No se pudo cargar el perfil.', 'error');
        } finally { setRefreshing(false); }
    };

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
            setUser({ id: updatedProfile.id, email: updatedProfile.email, username: updatedProfile.username });
            setEditModalVisible(false);
        } catch (error: any) {
            showAlert('Error al guardar', error.message ?? 'No se pudo actualizar.', 'error');
        } finally { setSaving(false); }
    };

    const handleClaimAchievement = async (achievementId: string) => {
        if (!accessToken || claimingAchievementId) return;
        setClaimingAchievementId(achievementId);
        try {
            const result = await claimAchievementReward(accessToken, achievementId);
            if (profile && typeof result?.coins_balance === 'number') setProfileInStore({ ...profile, coins_balance: result.coins_balance });
            await Promise.all([loadProfileFromStore(accessToken, { force: true }), loadAchievementsFromStore(accessToken, { force: true })]);
            setSelectedAchievement(current => current?.id === achievementId ? { ...current, reward_claimed_at: new Date().toISOString() } : current);
        } catch (error: any) {
            showAlert('Error al reclamar', error.message ?? 'No se pudo reclamar.', 'error');
        } finally { setClaimingAchievementId(null); }
    };

    // Colores para las medallas según el tier (usando tokens del tema)
    const getMedalTierColor = (tier: string = 'bronze') => {
        switch (tier) {
            case 'gold': return colors.rankGold;
            case 'silver': return colors.rankSilver;
            case 'bronze': return colors.rankBronze;
            default: return colors.rankBronze;
        }
    };

    // Función para renderizar el icono del logro con colores dinámicos
    const renderAchievementIcon = (achievement: Achievement, size = 30) => {
        const color = achievement.unlocked ? colors.accent : colors.textMuted;
        const props = { color, size };

        switch (achievement.badge_icon) {
            case 'star': return <Star {...props} />;
            case 'flame': case 'fire': return <Flame {...props} />;
            case 'book': return <BookOpen {...props} />;
            case 'calendar-check': return <CalendarCheck {...props} />;
            case 'compass': return <Compass {...props} />;
            case 'users': return <Users {...props} />;
            case 'trophy': return <Trophy {...props} />;
            case 'zap': return <Zap {...props} />;
            case 'crown': return <Crown {...props} />;
            case 'award': return <Award {...props} />;
            case 'network': return <Network {...props} />;
            case 'shield': return <Shield {...props} />;
            case 'gem': return <Gem {...props} />;
            case 'medal': default: return <Medal {...props} />;
        }
    };

    // Estilos dinámicos basados en el tema
    const styles = useMemo(() => StyleSheet.create({
        actionButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 4,
            marginBottom: 10,
        },
        rightActionButtons: {
            flexDirection: 'row',
            gap: 10,
        },
        iconBtn: {
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
        },
        notificationBtn: {
            borderColor: colors.warning + '44',
            borderWidth: 1,
            marginTop: 3,
        },
        notificationBadge: {
            position: 'absolute',
            top: -2,
            right: -5,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            borderWidth: 2,
            borderColor: colors.background,
        },
        notificationBadgeText: {
            color: colors.text,
            fontSize: 10,
            fontWeight: '900',
        },
        loadingState: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
        },
        loadingText: {
            color: colors.textMuted,
            fontWeight: 'bold',
        },
        editBtnActive: {
            borderColor: colors.info,
            borderWidth: 1,
        },
        profileSection: {
            alignItems: 'center',
            marginBottom: 20,
        },
        avatarContainer: {
            position: 'relative',
        },
        avatarBorder: {
            width: 150,
            height: 150,
            borderRadius: 75,
            borderWidth: 4,
            borderColor: colors.warning,
            padding: 5,
        },
        avatarImage: {
            width: '100%',
            height: '100%',
            borderRadius: 70,
        },
        userName: {
            color: colors.text,
            fontSize: 24,
            fontWeight: '900',
            marginTop: 15,
        },
        userTag: {
            color: colors.textMuted,
            fontSize: 16,
        },
        bioText: {
            color: colors.textSoft,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 8,
            paddingHorizontal: 24,
        },
        ratingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
        },
        ratingText: {
            color: colors.warning,
            fontWeight: 'bold',
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 15,
            justifyContent: 'center',
        },
        medalsSection: {
            backgroundColor: colors.surfaceElevated,
            borderRadius: 28,
            padding: 20,
            marginBottom: 30,
            marginTop: 20,
        },
        sectionHeaderRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 15,
        },
        sectionTitle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: 'bold',
        },
        medalsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
        },
        medalCard: {
            width: '30%',
            backgroundColor: colors.surface,
            padding: 15,
            borderRadius: 20,
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        medalTierDot: {
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: 4,
        },
        lockedMedalCard: {
            opacity: 0.55,
        },
        medalName: {
            color: colors.text,
            fontSize: 10,
            textAlign: 'center',
            fontWeight: 'bold',
        },
        medalReward: {
            color: colors.warning,
            fontSize: 11,
            textAlign: 'center',
            fontWeight: '900',
        },
        medalProgress: {
            color: colors.textMuted,
            fontSize: 10,
            textAlign: 'center',
            fontWeight: '700',
        },
        medalStatus: {
            color: colors.textMuted,
            fontSize: 9,
            textAlign: 'center',
            fontWeight: '700',
        },
        medalStatusUnlocked: {
            color: colors.accent,
        },
        emptyAchievementsText: {
            color: colors.textMuted,
            fontSize: 13,
            textAlign: 'center',
            width: '100%',
        },
    }), [colors]);

    if (profileLoading && !profile) {
        return (
            <ScreenLayout title="MI PERFIL" type="profiles">
                <View style={styles.loadingState}>
                    <ActivityIndicator color={colors.accent} />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </ScreenLayout>
        );
    }

    return (
        <ScreenLayout title="MI PERFIL" type="profiles">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                    />
                }
            >
                <View style={styles.actionButtons}>
                    <Pressable style={[styles.iconBtn, styles.notificationBtn]} onPress={() => navigation.navigate('Notifications')}>
                        <Bell color={colors.warning} size={18} />
                        {unreadNotificationsCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                                </Text>
                            </View>
                        )}
                    </Pressable>
                    <View style={styles.rightActionButtons}>
                        <Pressable style={[styles.iconBtn, styles.editBtnActive]} onPress={() => setEditModalVisible(true)}>
                            <Edit2 color={colors.info} size={18} />
                        </Pressable>
                        <Pressable style={styles.iconBtn} onPress={() => setSettingsVisible(true)}>
                            <Settings color={colors.textMuted} size={18} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarBorder}>
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        </View>
                    </View>
                    <Text style={styles.userName}>{profile?.username ?? 'Usuario'}</Text>
                    <Text style={styles.userTag}>@{profile?.username ?? 'usuario'}</Text>
                    {!!profile?.bio && <Text style={styles.bioText}>{profile.bio}</Text>}
                    <View style={styles.ratingRow}>
                        <Star color={colors.warning} fill={colors.warning} size={16} />
                        <Text style={styles.ratingText}>{profile?.email}</Text>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Trophy color={colors.accent} size={24} />}
                        value={`${profile?.total_study_minutes ?? 0}m`}
                        label="Total Estudio"
                    />
                    <StatCard
                        icon={<Flame color={colors.warning} size={24} />}
                        value={`${profile?.streak_days ?? 0} dias`}
                        label="Racha Actual"
                    />
                    <StatCard
                        icon={<Medal color={colors.accent} size={24} />}
                        value={`${unlockedAchievementsCount}`}
                        label="Logros"
                    />
                </View>

                <View style={styles.medalsSection}>
                    <View style={styles.sectionHeaderRow}>
                        <Medal color={colors.warning} size={20} />
                        <Text style={styles.sectionTitle}>Logros y medallas</Text>
                    </View>
                    <View style={styles.medalsGrid}>
                        {achievements.length === 0 ? (
                            <Text style={styles.emptyAchievementsText}>Todavía no hay logros disponibles.</Text>
                        ) : (
                            achievements.map((m) => {
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
                                                { backgroundColor: getMedalTierColor(m.medal_tier) },
                                            ]}
                                        />
                                        {renderAchievementIcon(m)}
                                        <Text style={styles.medalName}>{m.name}</Text>
                                        <Text style={styles.medalReward}>+{rewardCoins}</Text>
                                        <Text style={styles.medalProgress}>
                                            {m.progress_value ?? 0}/{m.target_value}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.medalStatus,
                                                m.unlocked && styles.medalStatusUnlocked,
                                            ]}
                                        >
                                            {m.reward_claimed_at ? 'Reclamado' : m.unlocked ? 'Desbloqueado' : 'Pendiente'}
                                        </Text>
                                    </Pressable>
                                );
                            })
                        )}
                    </View>
                </View>
            </ScrollView>

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
                    if (profile) setProfileInStore({ ...profile, auth_providers: authProviders });
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

            {/* ✅ AppAlert personalizado */}
            <AppAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
                onConfirm={() => {
                    if (alert.onConfirm) {
                        alert.onConfirm();
                    } else {
                        setAlert(prev => ({ ...prev, visible: false }));
                    }
                }}
                onCancel={() => {
                    if (alert.onCancel) alert.onCancel();
                    setAlert(prev => ({ ...prev, visible: false }));
                }}
                confirmText={alert.confirmText || 'Aceptar'}
                cancelText={alert.cancelText || 'Cancelar'}
                showCancel={alert.showCancel || false}
            />
        </ScreenLayout>
    );
}