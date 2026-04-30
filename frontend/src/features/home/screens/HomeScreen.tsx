import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, SafeAreaView } from "react-native";
// Importamos el hook necesario para movernos de pantalla
import { useNavigation } from "@react-navigation/native";
import MissionCard from "../components/MissionCard";
import StreakCard from "../components/StreakeCard";

export default function HomeScreen() {
  // Inicializamos la navegación
  const navigation = useNavigation<any>();

  const missions = [
    { id: 1, title: "Estudia 5 horas", progress: 3.5, target: 5 },
    { id: 2, title: "3 pomodoros hoy", progress: 1, target: 3 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER: Aquí está el truco para que no falle */}
      <View style={styles.headerContainer}>
        <Pressable 
          style={styles.profileBtn} 
          onPress={() => navigation.navigate('Perfil')} // Esto te lleva a la pestaña Perfil
        >
          {/* Usamos un texto en vez de icono para evitar errores de librerías */}
          <Text style={{ color: "#94a3b8", fontWeight: "bold" }}>P</Text>
        </Pressable>
        
        <Text style={styles.title}>MINDGUILD</Text>
        
        {/* Espacio invisible a la derecha para que el título quede centrado */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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
    marginBottom: 5,
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
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 2,
  },
  section: {
    color: "#888",
    fontSize: 12,
    marginBottom: 10,
    marginTop: 20,
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