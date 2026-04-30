import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';

interface WeeklyProgressProps {
  data: number[];
}

export default function WeeklyProgress({ data }: WeeklyProgressProps) {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const maxVal = 100; // Altura máxima de la barra

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Zap color="#22c55e" size={20} />
        <Text style={styles.title}>Progreso Semanal</Text>
      </View>

      <View style={styles.chartContainer}>
        {days.map((day, i) => (
          <View key={day} style={styles.barColumn}>
            {/* Contenedor gris de la barra */}
            <View style={[styles.barBg, { height: maxVal }]}>
              {/* Relleno verde según el progreso */}
              <View style={[styles.barFill, { height: data[i] || 0 }]} />
            </View>
            <Text style={styles.barLabel}>{day}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.summary}>
        <Text style={styles.highlight}>18 Pomodoros</Text> esta semana
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 28,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    color: 'white',
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
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 12,
  },
  barLabel: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 12,
  },
  summary: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
  },
  highlight: {
    color: '#22c55e',
  }
});