import { View, Text, StyleSheet } from "react-native";
import { Flame } from 'lucide-react-native';

export default function StreakCard() {
  const streakData = {
    currentStreak: 7,
    bestStreak: 12,
    todayCompleted: true,
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={styles.icon}>
            <Flame color="#fb923c" size={46} strokeWidth={1.45} />
          </View>

          <View>
            <Text style={styles.days}>{streakData.currentStreak} dias</Text>
            <Text style={styles.label}>Racha actual</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.label}>Mejor</Text>
          <Text style={styles.best}>{streakData.bestStreak} dias</Text>
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
    borderColor: "#fb923c33",
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
  best: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fdba74",
  },
});
