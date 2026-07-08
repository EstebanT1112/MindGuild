import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../../store/themeStore';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  const colors = useThemeStore(state => state.colors);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        statCard: {
          width: '47%',
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 24,
          alignItems: 'center',
        },
        statNumber: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '900',
          marginVertical: 5,
        },
        statLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: 'bold',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}