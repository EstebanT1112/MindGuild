import React, { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronRight, Inbox, Users } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakCard";
import MissionsModal from "../components/MissionsModal";
import { useAuthStore } from '../../../store/authStore'; 
import { API_BASE_URL } from '../../../services/apiConfig';

const recentRooms = [
  { id: 1, name: "Cálculo I - Final", code: "CALC-7X9P", mode: "Supervivencia", members: 5, ranking: 2 },
  { id: 2, name: "Física II", code: "FIS2-A4B1", mode: "Supervivencia", members: 8, ranking: 3 },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token); 
  const [missionsVisible, setMissionsVisible] = useState(false);
  
  // Estado dinámico para guardar las misiones reales de Supabase
  const [activeMissions, setActiveMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect unificado: pegándole a /missions porque API_BASE_URL ya incluye /api
  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    fetch(`${API_BASE_URL}/missions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}` 
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Mapeamos los datos de las misiones reales de Supabase con el porcentaje calculado
          const mappedMissions = data.data.map((m: any) => {
            const currentProgress = m.progress ?? 0;
            const goalValue = m.target_value ?? 1; // Evitamos división por cero
            const calculatedPercentage = Math.min(100, Math.floor((currentProgress / goalValue) * 100));

            return {
              id: m.id || m.user_mission_id,
              title: m.title || m.missions?.title || "Misión Diaria",
              progress: currentProgress,
              target: goalValue,
              percentage: calculatedPercentage, 
              completed: m.completed ?? false
            };
          });
          setActiveMissions(mappedMissions);
        }
      })
      .catch(err => {
        console.error("❌ Error conectando con el backend de misiones:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [accessToken]);

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
                <View style={styles.membersMeta}>
                  <Users color="#94a3b8" size={13} />
                  <Text style={styles.roomMembers}>{room.members}</Text>
                </View>
                <Text style={styles.roomMode}>{room.mode}</Text>
              </View>
            </View>
            <View style={styles.roomRight}>
              <View style={styles.rankBadge}><Text style={styles.rankText}>#{room.ranking}</Text></View>
              <ChevronRight color="#64748b" size={18} />
            </View>
          </Pressable>
        ))}

        <Text style={styles.section}>MISIONES ACTIVAS</Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#22c55e" style={{ marginTop: 10 }} />
        ) : activeMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Inbox color="#64748b" size={24} />
            <Text style={styles.emptyText}>No hay misiones asignadas para hoy.</Text>
          </View>
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
          missions={activeMissions} 
        />
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 10, paddingBottom: 120 },
  section: { color: "#64748b", fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12, marginTop: 20 },
  roomCard: { backgroundColor: "#1a1d29", borderRadius: 18, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2a2f45", flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roomLeft: { flex: 1 },
  roomName: { color: "#fff", fontWeight: "bold", fontSize: 15, marginBottom: 8 },
  roomMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  membersMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeBox: { backgroundColor: "#111", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  codeText: { color: "#22c55e", fontSize: 11, fontWeight: "bold" },
  roomMembers: { color: "#aaa", fontSize: 12 },
  roomMode: { color: "#aaa", fontSize: 12 },
  roomRight: { alignItems: 'center', gap: 6 },
  rankBadge: { backgroundColor: "#22c55e22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  rankText: { color: "#22c55e", fontSize: 12, fontWeight: "bold" },
  emptyState: { alignItems: 'center', gap: 8, marginTop: 12 },
  emptyText: { color: "#64748b", fontSize: 13, textAlign: 'center', marginTop: 10 },
});
