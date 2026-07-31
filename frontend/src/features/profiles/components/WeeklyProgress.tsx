import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

interface WeeklyProgressProps {
  data: number[];
  totalMinutes: number;
}

export default function WeeklyProgress({ data, totalMinutes }: WeeklyProgressProps) {
  const colors = useThemeStore((s) => s.colors);
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const maxVal = 100;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Zap color={colors.accent} size={20} />
        <Text style={[styles.title, { color: colors.text }]}>Progreso Semanal</Text>
      </View>

      <View style={styles.chartContainer}>
        {days.map((day, i) => (
          <View key={day} style={styles.barColumn}>
            <View style={[styles.barBg, { height: maxVal, backgroundColor: colors.border }]}>
              <View style={[styles.barFill, { height: data[i] || 0, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.textSoft }]}>{day}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.summary, { color: colors.text }]}>
        <Text style={{ color: colors.accent }}>{totalMinutes}m</Text> esta semana
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  barColumn: {
    alignItems: 'center',
    gap: 10,
  },
  barBg: {
    width: 30,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  summary: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
  },
});
