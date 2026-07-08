import { View, Text, StyleSheet, Pressable } from "react-native";
import { Check, Target } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useThemeStore } from '../../../store/themeStore';

type Mission = {
  title: string;
  progress: number;
  target: number;
  reward_coins?: number;
  claimed?: boolean;
  frequency?: 'daily' | 'weekly';
  expired?: boolean;
};

export default function MissionCard({ mission, onPress }: { mission: Mission; onPress?: () => void }) {
  const colors = useThemeStore(state => state.colors);
  const progressRatio = mission.progress / mission.target;
  const progressPercent = Math.min(progressRatio * 100, 100);
  const isCompleted = mission.progress >= mission.target;
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progressPercent, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedProgress, progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <Pressable 
      style={[
        styles.card, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        isCompleted && { borderColor: colors.accent, backgroundColor: colors.accentSoft }, 
        mission.expired && styles.expired
      ]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
          <Target color={isCompleted ? colors.accent : '#3b82f6'} size={18} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{mission.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.frequency}>
              {mission.frequency === 'weekly' ? 'Semanal' : 'Diaria'}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {mission.progress}/{mission.target}
            </Text>
            <View style={[styles.reward, { backgroundColor: `${colors.warning}22` }]}>
              <Text style={[styles.rewardText, { color: colors.warning }]}>+{mission.reward_coins ?? 0}</Text>
            </View>
            {mission.expired && <Text style={styles.expiredText}>Expirada</Text>}
            {mission.claimed && <Text style={styles.claimedText}>Reclamada</Text>}
          </View>
        </View>

        {isCompleted && (
          <View style={[styles.checkBadge, { backgroundColor: `${colors.accent}22` }]}>
            <Check color={colors.accent} size={18} />
          </View>
        )}
      </View>

      <View style={[styles.bar, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progress,
            isCompleted && styles.progressCompleted,
            progressStyle,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  expired: {
    opacity: 0.65,
  },
  header: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    fontSize: 12,
  },
  frequency: { color: '#38bdf8', fontSize: 11, fontWeight: '900' },
  reward: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  claimedText: { color: '#22c55e', fontSize: 11, fontWeight: '900' },
  expiredText: { color: '#f97316', fontSize: 11, fontWeight: '900' },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    height: 6,
    borderRadius: 6,
    overflow: "hidden",
  },
  progress: {
    height: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  progressCompleted: {
    backgroundColor: "#22c55e",
  },
});