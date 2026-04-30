import { View, Text, StyleSheet } from "react-native";

export default function StreakCard() {
  const streakData = {
    currentStreak: 7,
    bestStreak: 12,
    todayCompleted: true,
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Izquierda */}
        <View style={styles.left}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>🔥</Text>
          </View>

          <View>
            <Text style={styles.days}>
              {streakData.currentStreak} días
            </Text>
            <Text style={styles.label}>Racha actual</Text>
          </View>
        </View>

        {/* Derecha */}
        <View style={styles.right}>
          <Text style={styles.label}>Mejor</Text>
          <Text style={styles.best}>
            {streakData.bestStreak} días
          </Text>
        </View>
      </View>

      {/* Estado */}
      {streakData.todayCompleted && (
        <View style={styles.success}>
          <Text style={styles.successText}>
            Racha completada hoy
          </Text>
        </View>
      )}
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
    borderRadius: 24,
    backgroundColor: "#fb923c",
    alignItems: "center",
    justifyContent: "center",
  },

  iconText: {
    fontSize: 22,
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

  success: {
    marginTop: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#22c55e22",
  },

  successText: {
    fontSize: 12,
    color: "#4ade80",
  },
});
