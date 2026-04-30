import { StyleSheet, Text, View } from "react-native";

export default function MissionCard({ mission }: any) {
  const progress = mission.progress / mission.target;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{mission.title}</Text>

      <View style={styles.row}>
        <Text style={styles.meta}>
          {mission.progress}/{mission.target}
        </Text>
        <Text style={styles.reward}>+50 H</Text>
      </View>

      <View style={styles.bar}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1d29",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2f45",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  meta: {
    color: "#aaa",
    fontSize: 12,
  },
  reward: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "bold",
  },
  bar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 6,
  },
  progress: {
    height: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
});
