import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Check, Inbox, Target, X } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '../../../store/themeStore';
import MissionDetailModal from './MissionDetailModal';

type Mission = {
    id: string | number;
    title: string;
    progress: number;
    target: number;
    percentage: number;
    completed: boolean;
    claimed?: boolean;
    reward_coins?: number;
    description?: string | null;
    frequency?: 'daily' | 'weekly';
    expires_at?: string | null;
    expired?: boolean;
    expiredMoreThan24h?: boolean;
};

interface MissionsModalProps {
    visible: boolean;
    onClose: () => void;
    missions: Mission[];
    onClaimMission?: (missionId: string) => void;
    claimingMissionId?: string | null;
}

export default function MissionsModal({ visible, onClose, missions = [], onClaimMission, claimingMissionId }: MissionsModalProps) {
    const colors = useThemeStore(state => state.colors);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const active = missions.filter(m => !m.completed && !m.expired && !m.expiredMoreThan24h).sort((a, b) => b.percentage - a.percentage);
    const daily = active.filter(m => m.frequency !== 'weekly');
    const weekly = active.filter(m => m.frequency === 'weekly');
    const completed = missions.filter(m => m.completed && !m.expired && !m.expiredMoreThan24h);
    const expired = missions.filter(m => m.expired || m.expiredMoreThan24h);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose} />
            <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
                <View style={styles.sheetHeader}>
                    <View style={styles.titleRow}>
                        <Target color={colors.accent} size={20} />
                        <Text style={[styles.sheetTitle, { color: colors.text }]}>Todas las misiones</Text>
                    </View>
                    <Pressable style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={onClose}>
                        <X color={colors.textSoft} size={18} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                    <Text style={[styles.sectionLabel, { color: colors.textSoft }]}>DIARIAS ({daily.length})</Text>
                    {daily.length === 0 && weekly.length === 0 && !completed.length && !expired.length ? (
                        <View style={styles.emptyState}>
                            <Inbox color={colors.textSoft} size={28} />
                            <Text style={[styles.emptyText, { color: colors.textSoft }]}>No hay misiones disponibles.</Text>
                        </View>
                    ) : (
                        daily.map(m => <MissionRow key={m.id} mission={m} done={false} onPress={() => setSelectedMission(m)} />)
                    )}

                    {weekly.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, styles.sectionLabelWeekly, { color: colors.accent }]}>SEMANALES ({weekly.length})</Text>
                            {weekly.map(m => <MissionRow key={m.id} mission={m} done={false} onPress={() => setSelectedMission(m)} />)}
                        </>
                    )}

                    {completed.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, styles.sectionLabelDone, { color: colors.accent }]}>COMPLETADOS ({completed.length})</Text>
                            {completed.map(m => (
                                <MissionRow key={m.id} mission={m} done={true} onClaimMission={onClaimMission} claiming={claimingMissionId === String(m.id)} onPress={() => setSelectedMission(m)} />
                            ))}
                        </>
                    )}

                    {expired.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, styles.sectionLabelExpired, { color: colors.danger }]}>EXPIRADAS ({expired.length})</Text>
                            {expired.map(m => <MissionRow key={m.id} mission={m} done={m.completed} expired onPress={() => setSelectedMission(m)} />)}
                        </>
                    )}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
            <MissionDetailModal visible={Boolean(selectedMission)} mission={selectedMission as any} onClose={() => setSelectedMission(null)} onClaimMission={onClaimMission} claiming={selectedMission ? claimingMissionId === String(selectedMission.id) : false} />
        </Modal>
    );
}

function MissionRow({ mission, done, onClaimMission, claiming, onPress, expired }: any) {
    const colors = useThemeStore(state => state.colors);
    const animatedProgress = useSharedValue(0);

    useEffect(() => { animatedProgress.value = withTiming(mission.percentage, { duration: 650, easing: Easing.out(Easing.cubic) }); }, [animatedProgress, mission.percentage]);
    const progressStyle = useAnimatedStyle(() => ({ width: `${animatedProgress.value}%` }));

    return (
        <Pressable style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }, done && { borderColor: `${colors.accent}33`, backgroundColor: `${colors.accent}0a` }, expired && { opacity: 0.65 }]} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }, done && { color: colors.textMuted }]}>{mission.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={[styles.frequencyText, { color: colors.accent }]}>{mission.frequency === 'weekly' ? 'Semanal' : 'Diaria'}</Text>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{mission.progress}/{mission.target}</Text>
                        <View style={[styles.rewardBadge, { backgroundColor: `${colors.warning}22` }]}><Text style={[styles.rewardText, { color: colors.warning }]}>+{mission.reward_coins ?? 0}</Text></View>
                    </View>
                </View>
                {done ? <View style={[styles.checkBadge, { backgroundColor: `${colors.accent}22` }]}><Check color={colors.accent} size={18} /></View> : <Text style={[styles.percentText, { color: colors.accent }]}>{mission.percentage}%</Text>}
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}><Animated.View style={[styles.barFill, { backgroundColor: colors.info }, done && { backgroundColor: colors.accent }, progressStyle]} /></View>
            {done && (
                <Pressable style={[styles.claimBtn, { backgroundColor: colors.accent }, mission.claimed && { backgroundColor: colors.border }]} disabled={mission.claimed || claiming} onPress={() => onClaimMission?.(String(mission.id))}>
                    <Text style={styles.claimText}>{mission.claimed ? 'Reclamada' : claiming ? 'Reclamando...' : 'Reclamar'}</Text>
                </Pressable>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, height: '80%', borderTopWidth: 1 },
    handle: { width: 40, height: 4, borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sheetTitle: { fontSize: 18, fontWeight: '900' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    scroll: { flex: 1 },
    sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
    sectionLabelWeekly: { marginTop: 20 },
    sectionLabelDone: { marginTop: 24 },
    sectionLabelExpired: { marginTop: 24 },
    card: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: 12 },
    frequencyText: { fontSize: 11, fontWeight: '900' },
    rewardBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    rewardText: { fontSize: 11, fontWeight: 'bold' },
    checkBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    percentText: { fontSize: 13, fontWeight: '900', marginLeft: 8 },
    barBg: { height: 6, borderRadius: 6, overflow: 'hidden' },
    barFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 6 },
    claimBtn: { height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    claimText: { color: 'white', fontSize: 13, fontWeight: '900' },
    emptyState: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    emptyText: { fontSize: 13, textAlign: 'center', marginTop: 10 },
});