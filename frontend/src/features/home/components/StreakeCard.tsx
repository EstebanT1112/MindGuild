import { StyleSheet, Text, View } from "react-native";
//este archivo hay que borrarlo, se refacotizo en  streakcard

export default function StreakCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.days}>7 días</Text>
          <Text style={styles.label}>Racha actual</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.label}>Mejor</Text>
          <Text style={styles.best}>12 días</Text>
        </View>
      </View>

      <View style={styles.success}>
        <Text style={{ color: "#4ade80", fontSize: 12 }}>
          ✔ Racha completada hoy
        </Text>
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
    borderColor: "#ff880033",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  days: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fb923c",
  },
  label: {
    color: "#aaa",
    fontSize: 12,
  },
  best: {
    color: "#fdba74",
    fontWeight: "bold",
  },
  success: {
    marginTop: 10,
    padding: 6,
    backgroundColor: "#22c55e22",
    borderRadius: 8,
  },
});
