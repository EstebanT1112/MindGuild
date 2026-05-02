import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakeCard";

const recentRooms = [
  { id: 1, name: "Cálculo I - Final", code: "CALC-7X9P", mode: "Supervivencia", members: 5, ranking: 2 },
  { id: 2, name: "Física II", code: "FIS2-A4B1", mode: "Supervivencia", members: 8, ranking: 3 },
];

const missions = [
  { id: 1, title: "Estudia 5 horas", progress: 3.5, target: 5 },
  { id: 2, title: "3 pomodoros hoy", progress: 1, target: 3 },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  const handleRoomPress = (room: any) => {
    navigation.navigate('Salas', {
      screen: 'LiveRoom',
      params: { roomId: room.id, roomName: room.name },
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Pressable
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Text style={styles.profileBtnText}>P</Text>
        </Pressable>

        <Text style={styles.title}>BRAIMIND</Text>

        <View style={styles.coinBadge}>
          <View style={styles.hCoin}>
            <Text style={styles.hText}>H</Text>
          </View>
          <Text style={styles.coinAmount}>1,250</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <StreakCard />

        {/* SALAS FRECUENTES */}
        <Text style={styles.section}>SALAS FRECUENTES</Text>

        {recentRooms.map((room) => (
          <Pressable key={room.id} style={styles.roomCard} onPress={() => handleRoomPress(room)}>
            <View style={styles.roomLeft}>
              <Text style={styles.roomName}>{room.name}</Text>
              <View style={styles.roomMeta}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{room.code}</Text>
                </View>
                <Text style={styles.roomMembers}>{room.members} 👥</Text>
                <Text style={styles.roomMode}>{room.mode}</Text>
              </View>
            </View>
            <View style={styles.roomRight}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{room.ranking}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </Pressable>
        ))}

        {/* RETOS ACTIVOS */}
        <Text style={styles.section}>RETOS ACTIVOS</Text>

        {missions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f111a",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  profileBtnText: {
    color: "#94a3b8",
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 3,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 12,
  },
  hCoin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hText: {
    fontWeight: '900',
    fontSize: 13,
    color: '#0f172a',
  },
  coinAmount: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 20,
  },

  // Room card
  roomCard: {
    backgroundColor: "#1a1d29",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2f45",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomLeft: {
    flex: 1,
  },
  roomName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
  },
  roomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codeBox: {
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    color: "#22c55e",
    fontSize: 11,
    fontWeight: "bold",
  },
  roomMembers: {
    color: "#aaa",
    fontSize: 12,
  },
  roomMode: {
    color: "#aaa",
    fontSize: 12,
  },
  roomRight: {
    alignItems: 'center',
    gap: 6,
  },
  rankBadge: {
    backgroundColor: "#22c55e22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rankText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "bold",
  },
  arrow: {
    color: "#666",
    fontSize: 20,
  },
});