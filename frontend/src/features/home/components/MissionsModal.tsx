import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';

type Mission = {
    id: number;
    title: string;
    progress: number;
    target: number;
    reward: number;
};

interface MissionsModalProps {
    visible: boolean;
    onClose: () => void;
}

const allMissions: Mission[] = [
    { id: 1, title: "Estudia 5 horas", progress: 3.5, target: 5, reward: 100 },
    { id: 2, title: "3 pomodoros hoy", progress: 1, target: 3, reward: 50 },
    { id: 3, title: "Estudia 2 días seguidos", progress: 1, target: 2, reward: 75 },
    { id: 4, title: "Completa una sesión libre", progress: 0, target: 1, reward: 40 },
    { id: 5, title: "Sube al top 3 del ranking", progress: 0, target: 1, reward: 200 },
    { id: 6, title: "Estudia 1 hora", progress: 1, target: 1, reward: 30 },
    { id: 7, title: "Completa 5 pomodoros", progress: 5, target: 5, reward: 80 },
];

export default function MissionsModal({ visible, onClose }: MissionsModalProps) {
    const isCompleted = (m: Mission) => m.progress >= m.target;
    const getPercent = (m: Mission) => Math.min((m.progress / m.target) * 100, 100);

    const active = allMissions
        .filter(m => !isCompleted(m))
        .sort((a, b) => getPercent(b) - getPercent(a));

    const completed = allMissions.filter(m => isCompleted(m));

    const renderMission = (m: Mission, done: boolean) => {
        const percent = getPercent(m);
        return (
        <View key={m.id} style={[styles.card, done && styles.cardDone]}>
            <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, done && styles.cardTitleDone]}>
                {m.title}
                </Text>
                <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                    {m.progress}/{m.target}
                </Text>
                <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>+{m.reward} H</Text>
                </View>
                </View>
            </View>
            {done
                ? <Text style={styles.checkIcon}>✓</Text>
                : <Text style={styles.percentText}>{Math.round(percent)}%</Text>
            }
            </View>

            <View style={styles.barBg}>
            <View
                style={[
                styles.barFill,
                done && styles.barFillDone,
                { width: `${percent}%` },
                ]}
            />
            </View>
        </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={onClose} />

        <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>🎯 Todos las misiones</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

            {/* Activos */}
            <Text style={styles.sectionLabel}>EN PROGRESO ({active.length})</Text>
            {active.map(m => renderMission(m, false))}

            {/* Completados */}
            {completed.length > 0 && (
                <>
                <Text style={[styles.sectionLabel, styles.sectionLabelDone]}>
                    COMPLETADOS ({completed.length})
                </Text>
                {completed.map(m => renderMission(m, true))}
                </>
            )}

            <View style={{ height: 40 }} />
            </ScrollView>
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        backgroundColor: '#1a1d29',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
        height: '80%',
        borderTopWidth: 1,
        borderColor: '#2a2f45',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#334155',
        borderRadius: 999,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '900',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#222533',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2e3245',
    },
    closeBtnText: {
        color: '#a1a1aa',
        fontSize: 13,
    },
    scroll: {
        flex: 1,
        flexGrow: 1,
    },
    sectionLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 4,
    },
    sectionLabelDone: {
        marginTop: 24,
        color: '#22c55e99',
    },

    // Cards
    card: {
        backgroundColor: '#222533',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#2e3245',
    },
    cardDone: {
        borderColor: '#22c55e33',
        backgroundColor: '#22c55e0a',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 6,
    },
    cardTitleDone: {
        color: '#a1a1aa',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metaText: {
        color: '#71717a',
        fontSize: 12,
    },
    rewardBadge: {
        backgroundColor: '#facc1520',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    rewardText: {
        color: '#facc15',
        fontSize: 11,
        fontWeight: 'bold',
    },
    checkIcon: {
        color: '#22c55e',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    percentText: {
        color: '#3b82f6',
        fontSize: 13,
        fontWeight: '900',
        marginLeft: 8,
    },

    // Barra
    barBg: {
        height: 6,
        backgroundColor: '#2e3245',
        borderRadius: 6,
        overflow: 'hidden',
    },
    barFill: {
        height: 6,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
    },
    barFillDone: {
        backgroundColor: '#22c55e',
    },
});