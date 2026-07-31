import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Coins, Lock, Medal, Target, X } from 'lucide-react-native';
import type { Achievement } from '../services/achievementsService';
import { useThemeStore } from '../../../store/themeStore';

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
  const colors = useThemeStore((s) => s.colors);

  if (!achievement) return null;

  const tier = achievement.medal_tier ?? 'bronze';
  const rewardCoins = achievement.reward_coins ?? 0;
  const hasReward = rewardCoins > 0;
  const canClaim = achievement.unlocked && hasReward && !achievement.reward_claimed_at;
  const progress = Math.min(100, achievement.progress_percentage ?? 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { borderColor: tierColors[tier], backgroundColor: colors.background }]}>
              {renderIcon(achievement, 38)}
            </View>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={onClose}>
              <X color={colors.textMuted} size={18} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{achievement.name}</Text>
          <View style={[styles.tierBadge, { backgroundColor: `${tierColors[tier]}22`, borderColor: tierColors[tier] }]}>
            <Medal color={tierColors[tier]} size={14} />
            <Text style={[styles.tierText, { color: tierColors[tier] }]}>{tierLabels[tier]}</Text>
          </View>

          <Text style={[styles.description, { color: colors.textMuted }]}>{achievement.description}</Text>

          <View style={styles.infoRow}>
            <Target color={colors.cyan} size={18} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Objetivo: {achievement.target_value} {achievement.type}
            </Text>
          </View>

          <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textMuted }]}>
            Progreso: {achievement.progress_value ?? 0}/{achievement.target_value}
          </Text>

          <View style={styles.infoRow}>
            {hasReward ? <Coins color={colors.warning} size={18} /> : <Lock color={colors.textMuted} size={18} />}
            <Text style={[styles.infoText, { color: colors.text }]}>
              {hasReward
                ? `Recompensa: ${rewardCoins} monedas`
                : achievement.benefit_description || 'Sin recompensa adicional'}
            </Text>
          </View>

          {!!achievement.benefit_description && hasReward && (
            <Text style={[styles.benefit, { color: colors.textMuted }]}>{achievement.benefit_description}</Text>
          )}

          <Text style={[styles.status, achievement.unlocked ? { color: colors.accent } : styles.pending]}>
            {achievement.reward_claimed_at
              ? 'Recompensa reclamada'
              : achievement.unlocked
                ? `Desbloqueado${achievement.unlocked_at ? ` el ${formatDate(achievement.unlocked_at)}` : ''}`
                : 'Pendiente'}
          </Text>

          {canClaim && (
            <Pressable
              style={[styles.claimBtn, { backgroundColor: colors.accent }]}
              disabled={claiming}
              onPress={() => onClaim(achievement.id)}
            >
              <Text style={[styles.claimText, { color: colors.text }]}>{claiming ? 'Reclamando...' : 'Reclamar recompensa'}</Text>
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
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBox: { width: 62, height: 62, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '900', marginTop: 16 },
  tierBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  tierText: { fontSize: 12, fontWeight: '900' },
  description: { fontSize: 14, lineHeight: 20, marginTop: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  infoText: { fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '700' },
  progressBg: { height: 8, borderRadius: 999, overflow: 'hidden', marginTop: 16 },
  progressFill: { height: '100%' },
  progressText: { fontSize: 12, marginTop: 6, fontWeight: '700' },
  benefit: { fontSize: 12, lineHeight: 18, marginTop: 10 },
  status: { fontSize: 13, fontWeight: '900', marginTop: 16 },
  pending: { color: '#f97316' },
  claimBtn: { height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  claimText: { fontSize: 13, fontWeight: '900' },
});
