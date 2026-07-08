import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Coins, Lock, Medal, Target, X } from 'lucide-react-native';
import type { Achievement } from '../services/achievementsService';

interface AchievementDetailModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
  onClaim: (achievementId: string) => void;
  claiming?: boolean;
  renderIcon: (achievement: Achievement, size?: number) => React.ReactNode;
}

const tierLabels = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold: 'Oro',
};

const tierColors = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#facc15',
};

export default function AchievementDetailModal({
  visible,
  achievement,
  onClose,
  onClaim,
  claiming,
  renderIcon,
}: AchievementDetailModalProps) {
  if (!achievement) return null;

  const tier = achievement.medal_tier ?? 'bronze';
  const rewardCoins = achievement.reward_coins ?? 0;
  const hasReward = rewardCoins > 0;
  const canClaim = achievement.unlocked && hasReward && !achievement.reward_claimed_at;
  const progress = Math.min(100, achievement.progress_percentage ?? 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { borderColor: tierColors[tier] }]}>
              {renderIcon(achievement, 38)}
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#a1a1aa" size={18} />
            </Pressable>
          </View>

          <Text style={styles.title}>{achievement.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${tierColors[tier]}22`, borderColor: tierColors[tier] }]}>
            <Medal color={tierColors[tier]} size={14} />
            <Text style={[styles.tierText, { color: tierColors[tier] }]}>{tierLabels[tier]}</Text>
          </View>

          <Text style={styles.description}>{achievement.description}</Text>

          <View style={styles.infoRow}>
            <Target color="#38bdf8" size={18} />
            <Text style={styles.infoText}>
              Objetivo: {achievement.target_value} {achievement.type}
            </Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Progreso: {achievement.progress_value ?? 0}/{achievement.target_value}
          </Text>

          <View style={styles.infoRow}>
            {hasReward ? <Coins color="#facc15" size={18} /> : <Lock color="#94a3b8" size={18} />}
            <Text style={styles.infoText}>
              {hasReward
                ? `Recompensa: ${rewardCoins} monedas`
                : achievement.benefit_description || 'Sin recompensa adicional'}
            </Text>
          </View>

          {!!achievement.benefit_description && hasReward && (
            <Text style={styles.benefit}>{achievement.benefit_description}</Text>
          )}

          <Text style={[styles.status, achievement.unlocked ? styles.unlocked : styles.pending]}>
            {achievement.reward_claimed_at
              ? 'Recompensa reclamada'
              : achievement.unlocked
                ? `Desbloqueado${achievement.unlocked_at ? ` el ${formatDate(achievement.unlocked_at)}` : ''}`
                : 'Pendiente'}
          </Text>

          {canClaim && (
            <Pressable
              style={styles.claimBtn}
              disabled={claiming}
              onPress={() => onClaim(achievement.id)}
            >
              <Text style={styles.claimText}>{claiming ? 'Reclamando...' : 'Reclamar recompensa'}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-AR');
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', backgroundColor: '#1e293b', borderRadius: 24, borderWidth: 1, borderColor: '#334155', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 62, height: 62, borderRadius: 18, borderWidth: 2, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 16 },
  tierBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  tierText: { fontSize: 12, fontWeight: '900' },
  description: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginTop: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  infoText: { color: '#e2e8f0', fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: '#334155', borderRadius: 999, overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%', backgroundColor: '#22c55e' },
  progressText: { color: '#94a3b8', fontSize: 12, marginTop: 6, fontWeight: '700' },
  benefit: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 10 },
  status: { fontSize: 13, fontWeight: '900', marginTop: 16 },
  unlocked: { color: '#22c55e' },
  pending: { color: '#f97316' },
  claimBtn: { height: 44, borderRadius: 14, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  claimText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});