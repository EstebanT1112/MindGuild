import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';

// Interfaz alineada a la data real que nos da el Backend
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
    missions: Mission[]; // ⚡ Ahora recibe las misiones vivas del Home
}

export default function MissionsModal({ visible, onClose, missions = [] }: MissionsModalProps) {
    
    // Clasificamos y ordenamos dinámicamente según la data de Supabase
    const active = missions
        .filter(m => !m.completed)
        .sort((a, b) => b.percentage - a.percentage);

    const completed = missions.filter(m => m.completed);

    const renderMission = (m: Mission, done: boolean) => {
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
                    <Text style={styles.rewardText}>+50 H</Text>
                </View>
                </View>
            </View>
            {done
                ? <Text style={styles.checkIcon}>✓</Text>
                : <Text style={styles.percentText}>{m.percentage}%</Text>
            }
            </View>

            <View style={styles.barBg}>
            <View
                style={[
                styles.barFill,
                done && styles.barFillDone,
                { width: `${m.percentage}%` },
                ]}
            />
            </View>
        </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>🎯 Todas las misiones</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

            {/* Misiones Activas Reales */}
            <Text style={styles.sectionLabel}>EN PROGRESO ({active.length})</Text>
            {active.length === 0 && !completed.length ? (
                <Text style={styles.emptyText}>No hay misiones disponibles.</Text>
            ) : (
                active.map(m => renderMission(m, false))
            )}

            {/* Misiones Completadas Reales */}
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: '#1a1d29', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, height: '80%', borderTopWidth: 1, borderColor: '#2a2f45' },
    handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 999, alignSelf: 'center', marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sheetTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222533', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2e3245' },
    closeBtnText: { color: '#a1a1aa', fontSize: 13 },
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
    checkIcon: { color: '#22c55e', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
    percentText: { color: '#3b82f6', fontSize: 13, fontWeight: '900', marginLeft: 8 },
    barBg: { height: 6, backgroundColor: '#2e3245', borderRadius: 6, overflow: 'hidden' },
    barFill: { height: 6, backgroundColor: '#3b82f6', borderRadius: 6 },
    barFillDone: { backgroundColor: '#22c55e' },
    emptyText: { color: '#64748b', fontSize: 13, textAlign: 'center', marginTop: 10 }
});