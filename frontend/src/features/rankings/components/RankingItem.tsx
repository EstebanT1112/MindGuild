import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '../../../store/themeStore'; // 👈 Importamos el theme

interface RankingItemProps {
  rank: number;
  name: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'equal';
  movement?: number;
  isUser?: boolean;
}

export default function RankingItem({
  rank,
  name,
  value,
  subtitle,
  trend,
  movement = 0,
  isUser = false,
}: RankingItemProps) {
  // 👇 Obtenemos los colores del tema actual
  const { colors } = useThemeStore();

  // 👇 Estilos dinámicos que se reconstruyen al cambiar el tema
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  // 👇 Función para obtener el estilo del badge según el puesto
  const getBadgeStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: colors.rankGold };
    if (rank === 2) return { backgroundColor: colors.rankSilver };
    if (rank === 3) return { backgroundColor: colors.rankBronze };
    return { backgroundColor: colors.surfaceElevated };
  };

  // 👇 Render del indicador de tendencia
  const renderTrend = () => {
    if (trend === 'up') {
      return (
        <>
          <TrendingUp size={14} color={colors.accent} />
          <Text style={[styles.trendText, styles.trendUp]}>Subió {movement}</Text>
        </>
      );
    }

    if (trend === 'down') {
      return (
        <>
          <TrendingDown size={14} color={colors.danger} />
          <Text style={[styles.trendText, styles.trendDown]}>Bajó {movement}</Text>
        </>
      );
    }

    return (
      <>
        <Minus size={14} color={colors.textMuted} />
        <Text style={[styles.trendText, styles.trendEqual]}>Igual</Text>
      </>
    );
  };

  return (
    <View
      style={[
        styles.card,
        isUser && {
          borderColor: colors.accent,
          backgroundColor: colors.highlight,
        },
      ]}
    >
      <View style={[styles.rankBadge, getBadgeStyle(rank)]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>

      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.avatarAccent }]}>
        <Text style={[styles.avatarText, { color: colors.avatarText }]}>
          {name.charAt(0)}
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.nameText}>{isUser ? `Tú (${name})` : name}</Text>
        <Animated.View style={[styles.trendRow, animatedTrendStyle]}>
          {renderTrend()}
        </Animated.View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>
      </View>
    </View>
  );
}

// 👇 Función que construye los estilos dinámicamente a partir de los colores del tema
const createStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceElevated,
      padding: 15,
      borderRadius: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rankBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rankText: {
      color: colors.rankBadgeText,
      fontWeight: 'bold',
    },
    avatarPlaceholder: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontWeight: 'bold',
      fontSize: 18,
    },
    infoContainer: {
      flex: 1,
    },
    nameText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    trendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      marginTop: 4,
    },
    trendText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    trendUp: {
      color: colors.accent,
    },
    trendDown: {
      color: colors.danger,
    },
    trendEqual: {
      color: colors.textMuted,
    },
    valueContainer: {
      alignItems: 'flex-end',
    },
    valueText: {
      color: colors.accent,
      fontSize: 18,
      fontWeight: '900',
    },
    subtitleText: {
      color: colors.textMuted,
      fontSize: 10,
    },
  });