import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { Check, Inbox, Target, X } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type Mission = {
    id: string | number;
    title: string;
    progress: number;
    target: number;
    percentage: number;
    completed: boolean;
};

interface MissionsModalProps {
    visible: boolean;
    onClose: () => void;
    missions: Mission[];
}

export default function MissionsModal({ visible, onClose, missions = [] }: MissionsModalProps) {
    const active = missions
        .filter(m => !m.completed)
        .sort((a, b) => b.percentage - a.percentage);

    const completed = missions.filter(m => m.completed);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />

            <View style={styles.sheet}>
                <View style={styles.handle} />

                <View style={styles.sheetHeader}>
                    <View style={styles.titleRow}>
                        <Target color="#22c55e" size={20} />
                        <Text style={styles.sheetTitle}>Todas las misiones</Text>
                    </View>
                    <Pressable style={styles.closeBtn} onPress={onClose}>
                        <X color="#a1a1aa" size={18} />
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                    <Text style={styles.sectionLabel}>EN PROGRESO ({active.length})</Text>
                    {active.length === 0 && !completed.length ? (
                        <View style={styles.emptyState}>
                            <Inbox color="#64748b" size={28} />
                            <Text style={styles.emptyText}>No hay misiones disponibles.</Text>
                        </View>
                    ) : (
                        active.map(m => <MissionRow key={m.id} mission={m} done={false} />)
                    )}

                    {completed.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, styles.sectionLabelDone]}>
                                COMPLETADOS ({completed.length})
                            </Text>
                            {completed.map(m => <MissionRow key={m.id} mission={m} done />)}
                        </>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </Modal>
    );
}

function MissionRow({ mission, done }: { mission: Mission; done: boolean }) {
    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withTiming(mission.percentage, {
            duration: 650,
            easing: Easing.out(Easing.cubic),
        });
    }, [animatedProgress, mission.percentage]);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${animatedProgress.value}%`,
    }));

    return (
        <View style={[styles.card, done && styles.cardDone]}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>{mission.title}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{mission.progress}/{mission.target}</Text>
                        <View style={styles.rewardBadge}>
                            <Text style={styles.rewardText}>+50 H</Text>
                        </View>
                    </View>
                </View>

                {done ? (
                    <View style={styles.checkBadge}>
                        <Check color="#22c55e" size={18} />
                    </View>
                ) : (
                    <Text style={styles.percentText}>{mission.percentage}%</Text>
                )}
            </View>

            <View style={styles.barBg}>
                <Animated.View
                    style={[
                        styles.barFill,
                        done && styles.barFillDone,
                        progressStyle,
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: '#1a1d29', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, height: '80%', borderTopWidth: 1, borderColor: '#2a2f45' },
    handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sheetTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222533', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2e3245' },
    scroll: { flex: 1 },
    sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
    sectionLabelDone: { marginTop: 24, color: '#22c55e99' },
    card: { backgroundColor: '#222533', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#2e3245' },
    cardDone: { borderColor: '#22c55e33', backgroundColor: '#22c55e0a' },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
    cardTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 14, marginBottom: 6 },
    cardTitleDone: { color: '#a1a1aa' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { color: '#71717a', fontSize: 12 },
    rewardBadge: { backgroundColor: '#facc1520', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
    rewardText: { color: '#facc15', fontSize: 11, fontWeight: 'bold' },
    checkBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#22c55e22', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    percentText: { color: '#3b82f6', fontSize: 13, fontWeight: '900', marginLeft: 8 },
    barBg: { height: 6, backgroundColor: '#2e3245', borderRadius: 6, overflow: 'hidden' },
    barFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 6 },
    barFillDone: { backgroundColor: '#22c55e' },
    emptyState: { alignItems: 'center', gap: 8, paddingVertical: 24 },
    emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
