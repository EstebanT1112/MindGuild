import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, Coins, Target, X } from 'lucide-react-native';
import type { MissionSummary } from '../../../store/appDataStore';

interface MissionDetailModalProps {
  visible: boolean;
  mission: MissionSummary | null;
  onClose: () => void;
  onClaimMission?: (missionId: string) => void;
  claiming?: boolean;
}

export default function MissionDetailModal({
  visible,
  mission,
  onClose,
  onClaimMission,
  claiming,
}: MissionDetailModalProps) {
  if (!mission) {
    return null;
  }

  const canClaim = mission.completed && !mission.claimed && !mission.expired;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Target color="#22c55e" size={20} />
              <Text style={styles.title}>{mission.title}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#a1a1aa" size={18} />
            </Pressable>
          </View>

          {!!mission.description && <Text style={styles.description}>{mission.description}</Text>}

          <View style={styles.infoRow}>
            <CalendarClock color="#38bdf8" size={18} />
            <Text style={styles.infoText}>
              {mission.frequency === 'weekly' ? 'Mision semanal' : 'Mision diaria'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Target color="#a78bfa" size={18} />
            <Text style={styles.infoText}>
              Progreso: {mission.progress}/{mission.target} ({mission.percentage}%)
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Coins color="#facc15" size={18} />
            <Text style={styles.infoText}>Recompensa: +{mission.reward_coins} monedas</Text>
          </View>

          <Text style={styles.benefit}>
            Beneficio: suma monedas para usar en recompensas y cosmeticos futuros.
          </Text>

          {mission.expired && <Text style={styles.expiredText}>Esta mision ya expiro.</Text>}
          {mission.claimed && <Text style={styles.claimedText}>Recompensa reclamada.</Text>}

          {canClaim && (
            <Pressable
              style={styles.claimBtn}
              disabled={claiming}
              onPress={() => onClaimMission?.(mission.id)}
            >
              <Text style={styles.claimText}>{claiming ? 'Reclamando...' : 'Reclamar recompensa'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#1a1d29',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2f45',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  titleRow: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { color: '#fff', fontSize: 17, fontWeight: '900', flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#222533', alignItems: 'center', justifyContent: 'center' },
  description: { color: '#cbd5e1', fontSize: 13, lineHeight: 19, marginTop: 14, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  infoText: { color: '#e2e8f0', fontSize: 13, fontWeight: '700' },
  benefit: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 16 },
  expiredText: { color: '#f97316', fontWeight: '900', fontSize: 12, marginTop: 14 },
  claimedText: { color: '#22c55e', fontWeight: '900', fontSize: 12, marginTop: 14 },
  claimBtn: { height: 42, borderRadius: 14, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  claimText: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
