import { View, Text, StyleSheet, Pressable } from "react-native";

type Mission = {
  title: string;
  progress: number;
  target: number;
};

export default function MissionCard({ mission, onPress }: { mission: Mission; onPress?: () => void }) {
  const progressRatio = mission.progress / mission.target;
  const progressPercent = Math.min(progressRatio * 100, 100);
  const isCompleted = mission.progress >= mission.target;

  return (
    <Pressable style={[styles.card, isCompleted && styles.completed]} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mission.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {mission.progress}/{mission.target}
            </Text>
            <View style={styles.reward}>
              <Text style={styles.rewardText}>+50 H</Text>
            </View>
          </View>
        </View>
        {isCompleted && <Text style={styles.check}>✓</Text>}
      </View>

      <View style={styles.bar}>
        <View
          style={[
            styles.progress,
            isCompleted && styles.progressCompleted,
            { width: `${progressPercent}%` },
          ]}
        />
      </View>
    </Pressable>
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
  completed: {
    borderColor: "#22c55e",
    backgroundColor: "#22c55e11",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  meta: {
    color: "#aaa",
    fontSize: 12,
  },
  reward: {
    backgroundColor: "#facc1522",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rewardText: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "bold",
  },
  check: {
    color: "#22c55e",
    fontSize: 18,
    fontWeight: "bold",
  },
  bar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 6,
    overflow: "hidden",
  },
  progress: {
    height: 6,
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  progressCompleted: {
    backgroundColor: "#22c55e",
  },
});