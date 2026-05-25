import { View, Text, StyleSheet } from "react-native";
import { Flame } from 'lucide-react-native';

interface StreakCardProps {
  currentStreak: number;
  active: boolean;
  loading?: boolean;
}

export default function StreakCard({ currentStreak, active, loading = false }: StreakCardProps) {
  const accentColor = active ? '#fb923c' : '#64748b';
  const softAccentColor = active ? '#fdba74' : '#94a3b8';
  const borderColor = active ? '#fb923c33' : '#334155';
  const statusText = active ? 'Activa' : currentStreak > 0 ? 'Pendiente' : 'Inactiva';

  return (
    <View style={[styles.card, { borderColor }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.icon}>
            <Flame color={accentColor} size={46} strokeWidth={1.45} />
          </View>

          <View>
            <Text style={[styles.days, { color: accentColor }]}>
              {loading ? '--' : currentStreak} dias
            </Text>
            <Text style={styles.label}>Racha actual</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.label}>Estado</Text>
          <Text style={[styles.status, { color: softAccentColor }]}>{loading ? '...' : statusText}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1d29",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  days: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fb923c",
  },
  label: {
    fontSize: 12,
    color: "#aaa",
  },
  right: {
    alignItems: "flex-end",
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
