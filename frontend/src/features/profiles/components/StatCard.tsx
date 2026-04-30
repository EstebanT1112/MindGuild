import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      {icon}
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: { width: '47%', backgroundColor: '#1e293b', padding: 20, borderRadius: 24, alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 22, fontWeight: '900', marginVertical: 5 },
  statLabel: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
});