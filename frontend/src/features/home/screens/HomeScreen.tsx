import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from 'axios';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakCard";
import MissionsModal from "../components/MissionsModal";

// 🌐 CONFIGURACIÓN DEL BACKEND (Modificar acá según tu entorno local)
const API_BASE_URL = 'http://192.168.100.201:3000'; 

const recentRooms = [
  { id: 1, name: "Cálculo I - Final", code: "CALC-7X9P", mode: "Supervivencia", members: 5, ranking: 2 },
  { id: 2, name: "Física II", code: "FIS2-A4B1", mode: "Supervivencia", members: 8, ranking: 3 },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [missionsVisible, setMissionsVisible] = useState(false);
  
  // Estado dinámico para guardar las misiones que devuelva tu Backend
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect para pegarle a tu API apenas se abra el Home
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/missions`)
      .then(response => {
        if (response.data.success) {
          // Adaptamos la respuesta del backend para que coincida con las propiedades que espera tu MissionCard
          const mappedMissions = response.data.data.map((m: any) => ({
            id: m.user_mission_id,
            title: m.title,
            progress: m.progress,
            target: m.target_value,
            completed: m.completed
          }));
          setActiveMissions(mappedMissions);
        }
      })
      .catch(err => {
        console.error("❌ Error conectando con el backend de misiones:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleRoomPress = (room: any) => {
    navigation.navigate('Salas', {
      screen: 'LiveRoom',
      params: { roomId: room.id, roomName: room.name },
    });
  };

  return (
    <ScreenLayout title="MINDGUILD" type="home">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <StreakCard />

        <Text style={styles.section}>SALAS FRECUENTES</Text>
        {recentRooms.map((room) => (
          <Pressable key={room.id} style={styles.roomCard} onPress={() => handleRoomPress(room)}>
            <View style={styles.roomLeft}>
              <Text style={styles.roomName}>{room.name}</Text>
              <View style={styles.roomMeta}>
                <View style={styles.codeBox}><Text style={styles.codeText}>{room.code}</Text></View>
                <Text style={styles.roomMembers}>{room.members} 👥</Text>
                <Text style={styles.roomMode}>{room.mode}</Text>
              </View>
            </View>
            <View style={styles.roomRight}>
              <View style={styles.rankBadge}><Text style={styles.rankText}>#{room.ranking}</Text></View>
              <Text style={styles.arrow}>›</Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.section}>MISIONES ACTIVAS</Text>
        
        {/* Renderizado Condicional: Mientras carga o si muestra los datos reales */}
        {loading ? (
          <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 10 }} />
        ) : activeMissions.length === 0 ? (
          <Text style={styles.emptyText}>No hay misiones asignadas para hoy.</Text>
        ) : (
          activeMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              onPress={() => setMissionsVisible(true)}
            />
          ))
        )}

        <MissionsModal
          visible={missionsVisible}
          onClose={() => setMissionsVisible(false)}
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 10,
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
  roomLeft: { flex: 1 },
  roomName: { color: "#fff", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  codeBox: { backgroundColor: "#111", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { color: "#22c55e", fontSize: 11, fontWeight: "bold" },
  roomMembers: { color: "#aaa", fontSize: 12 },
  roomMode: { color: "#aaa", fontSize: 12 },
  roomRight: { alignItems: 'center', gap: 6 },
  rankBadge: { backgroundColor: "#22c55e22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  rankText: { color: "#22c55e", fontSize: 12, fontWeight: "bold" },
  arrow: { color: "#666", fontSize: 20 },
  emptyText: { color: "#64748b", fontSize: 13, textAlign: 'center', marginTop: 10 },
});