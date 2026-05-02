import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Clock, Flame, BookOpen, Crown } from 'lucide-react-native';
import ScreenLayout from '../../.././components/ui/ScreenLayout';
import RankingItem from '../components/RankingItem';

export default function RankingScreen() {
  const [activeTab, setActiveTab] = useState('Semanal');

  const rankingData: any = {
    Semanal: [
      { id: 1, name: 'Kenji Tanaka', value: '25.5h', subtitle: 'esta semana', trend: 'up' },
      { id: 2, name: 'Yuki Yamamoto', value: '22.3h', subtitle: 'esta semana', trend: 'equal' },
      { id: 3, name: 'Samurai Sensei', value: '18.7h', subtitle: 'esta semana', trend: 'up', isUser: true },
      { id: 4, name: 'Akira Sato', value: '16.2h', subtitle: 'esta semana', trend: 'down' },
    ],
    Racha: [
      { id: 1, name: 'Ana García', value: '45', subtitle: 'días', trend: 'up' },
      { id: 2, name: 'Kenji Tanaka', value: '32', subtitle: 'días', trend: 'equal' },
      { id: 3, name: 'Samurai Sensei', value: '7', subtitle: 'días', trend: 'up', isUser: true },
    ],
    Académico: [
      { id: 1, name: 'Yuki Yamamoto', value: '98.5%', subtitle: '45 quizzes', trend: 'up' },
      { id: 4, name: 'Samurai Sensei', value: '89.3%', subtitle: '28 quizzes', trend: 'up', isUser: true },
    ],
    Jefes: [
      { id: 1, name: 'Kenji Tanaka', value: '12x', subtitle: '8 victorias', trend: 'up' },
      { id: 5, name: 'Samurai Sensei', value: '5x', subtitle: '3 victorias', trend: 'up', isUser: true },
    ]
  };

  const tabs = [
    { name: 'Semanal', icon: Clock },
    { name: 'Racha', icon: Flame },
    { name: 'Académico', icon: BookOpen },
    { name: 'Jefes', icon: Crown },
  ];

  return (
    <ScreenLayout 
      title="RANKING" 
      type="rankings"
    >
      {/* Tabs con el estilo oscuro de MindGuild */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {rankingData[activeTab].map((item: any, index: number) => (
          <RankingItem key={item.id} rank={index + 1} {...item} />
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}

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