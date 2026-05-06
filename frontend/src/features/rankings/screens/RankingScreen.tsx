import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Clock, Flame, BookOpen, Crown } from 'lucide-react-native';
import ScreenLayout from '../../.././components/ui/ScreenLayout';
import RankingItem from '../components/RankingItem';
// IMPORTANTE: Importamos la API que creaste
import { fetchRanking, RankingEntry } from '../../../services/apiConfig';

export default function RankingScreen() {
  const [activeTab, setActiveTab] = useState('Semanal');
  const [data, setData] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Mapeo de nombres de pestañas a los tipos que entiende tu Backend
  const tabTypeMap: any = {
    'Semanal': 'semanal',
    'Racha': 'racha',
    'Académico': 'academico',
    'Jefes': 'jefes'
  };

  useEffect(() => {
    const loadRanking = async () => {
      setLoading(true);
      try {
        const type = tabTypeMap[activeTab];
        const result = await fetchRanking(type);
        setData(result);
      } catch (error) {
        console.error("Error al cargar ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRanking();
  }, [activeTab]); // Se dispara cada vez que tocas una pestaña

  const tabs = [
    { name: 'Semanal', icon: Clock },
    { name: 'Racha', icon: Flame },
    { name: 'Académico', icon: BookOpen },
    { name: 'Jefes', icon: Crown },
  ];

  return (
    <ScreenLayout title="RANKING" type="rankings">
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable 
            key={tab.name} 
            onPress={() => setActiveTab(tab.name)}
            style={[styles.tabButton, activeTab === tab.name && styles.activeTab]}
          >
            <tab.icon color={activeTab === tab.name ? '#22c55e' : '#64748b'} size={20} />
            <Text style={[styles.tabText, activeTab === tab.name && styles.activeTabText]}>{tab.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.descriptionText}>
        {activeTab === 'Semanal' && 'Ranking basado en horas de estudio esta semana'}
        {activeTab === 'Racha' && 'Días consecutivos estudiando sin romper la racha'}
        {activeTab === 'Académico' && 'Promedio de calificaciones en quizzes y simulacros'}
        {activeTab === 'Jefes' && 'Usuarios que más veces fueron jefe de la semana'}
      </Text>

      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {data.map((item, index) => (
            <RankingItem 
              key={item.user_id} 
              rank={index + 1} 
              name={item.username} 
              value={item.value.toString()} 
              subtitle={activeTab === 'Racha' ? 'días' : activeTab === 'Semanal' ? 'minutos' : ''}
              trend="up" // Podés dinamizar esto después
            />
          ))}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

// ... (los mismos estilos que ya tenías)

const styles = StyleSheet.create({
  tabsContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#1e293b', 
    borderRadius: 25, 
    padding: 6, 
    marginVertical: 10 // Reducido para que respire mejor con el Layout
  },
  tabButton: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderRadius: 20, 
    gap: 4 
  },
  activeTab: { 
    backgroundColor: 'rgba(34, 197, 94, 0.1)', 
    borderWidth: 1, 
    borderColor: '#22c55e' 
  },
  tabText: { 
    color: '#64748b', 
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  activeTabText: { 
    color: '#22c55e' 
  },
  descriptionText: { 
    color: '#94a3b8', 
    textAlign: 'center', 
    marginBottom: 20, 
    fontSize: 13 
  },
});