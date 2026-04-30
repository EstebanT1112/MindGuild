import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakeCard";

export default function HomeScreen() {
  const missions = [
    { id: 1, title: "Estudia 5 horas", progress: 3.5, target: 5 },
    { id: 2, title: "3 pomodoros hoy", progress: 1, target: 3 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>MINDGUILD</Text>

        <StreakCard />

        <Text style={styles.section}>RETOS ACTIVOS</Text>

        {missions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab}>
        <Text style={{ color: "white", fontSize: 22 }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f111a",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 2,
  },
  section: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});
