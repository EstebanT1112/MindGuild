import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakCard";
import RoomCard from "../components/RoomCard";

export default function HomeScreen({ navigation }: any) {
  const missions = [
    { id: 1, title: "Estudia 5 horas", progress: 3.5, target: 5 },
    { id: 2, title: "3 pomodoros hoy", progress: 1, target: 3 },
  ];
  const rooms = [
    {
      id: 1,
      name: "Cálculo I",
      code: "CALC-7X9P",
      members: 5,
      mode: "Supervivencia",
      ranking: 2,
    },
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
        <Text style={styles.section}>SALAS FRECUENTES</Text>

        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onPress={() => navigation.navigate("RoomDetail")}
          />
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("Rooms")}
      >
        <Text style={styles.fabText}>+</Text>
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
    bottom: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 22,
  },
});