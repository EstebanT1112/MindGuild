import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

interface RankingItemProps {
  rank: number;
  name: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'equal';
  movement?: number;
  isUser?: boolean;
}

export default function RankingItem({ rank, name, value, subtitle, trend, movement = 0, isUser }: RankingItemProps) {
  const trendScale = useSharedValue(1);

  React.useEffect(() => {
    if (trend === 'equal') return;

    trendScale.value = withSequence(
      withTiming(1.12, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
    );
  }, [trend, trendScale]);

  const animatedTrendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: trendScale.value }],
  }));

  const renderTrend = () => {
    if (trend === 'up') {
      return (
        <>
          <TrendingUp size={14} color="#22c55e" />
          <Text style={styles.trendUp}>Subio {movement}</Text>
        </>
      );
    }

    if (trend === 'down') {
      return (
        <>
          <TrendingDown size={14} color="#ef4444" />
          <Text style={styles.trendDown}>Bajo {movement}</Text>
        </>
      );
    }

    return (
      <>
        <Minus size={14} color="#94a3b8" />
        <Text style={styles.trendEqual}>Igual</Text>
      </>
    );
  };

  return (
    <View style={[styles.card, isUser && styles.userCard]}>
      <View style={[styles.rankBadge, getRankBadgeStyle(rank)]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{isUser ? `Tu (${name})` : name}</Text>
        <Animated.View style={[styles.trendRow, animatedTrendStyle]}>{renderTrend()}</Animated.View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>
      </View>
    </View>
  );
}

function getRankBadgeStyle(rank: number) {
  if (rank === 1) return styles.gold;
  if (rank === 2) return styles.silver;
  if (rank === 3) return styles.bronze;
  return styles.normal;
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 15, borderRadius: 20, marginBottom: 12 },
  userCard: { borderWidth: 2, borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  rankBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gold: { backgroundColor: '#facc15' },
  silver: { backgroundColor: '#cbd5e1' },
  bronze: { backgroundColor: '#b45309' },
  normal: { backgroundColor: '#334155' },
  rankText: { color: '#0f172a', fontWeight: 'bold' },
  avatarPlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  infoContainer: { flex: 1 },
  nameText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  trendRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: 4 },
  trendUp: { color: '#22c55e', fontSize: 12, fontWeight: 'bold' },
  trendDown: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  trendEqual: { color: '#94a3b8', fontSize: 12 },
  valueContainer: { alignItems: 'flex-end' },
  valueText: { color: '#22c55e', fontSize: 18, fontWeight: '900' },
  subtitleText: { color: '#64748b', fontSize: 10 },
});
