import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react-native';

const tabs = ['Team', 'Tiempo', 'Respuestas', 'Jefes', 'Individual'];

export default function RoomRanking() {
  const [activeTab, setActiveTab] = useState('Team');
  const [isExpanded, setIsExpanded] = useState(true);

  // Data mockeada para las diferentes pestañas
  const rankingData: any = {
    Team: [
      { id: 1, name: "Los Matemáticos", color: '#3b82f6', mainStat: "1530", subStat: "25.7h · 69 resp", members: 2 },
      { id: 2, name: "Calculadores Pro", color: '#a855f7', mainStat: "1340", subStat: "21.2h · 53 resp", members: 2 },
    ],
    Tiempo: [
      { id: 1, name: "Los Matemáticos", color: '#3b82f6', mainStat: "25.7h", users: [{ name: "Ana García", val: "15.5h" }, { name: "Carlos Ruiz", val: "10.2h" }] },
      { id: 2, name: "Calculadores Pro", color: '#a855f7', mainStat: "21.2h", users: [{ name: "Tú (Samurai Sensei)", val: "12.5h", isMe: true }, { name: "María López", val: "8.7h" }] },
    ],
    Respuestas: [
      { id: 1, name: "Los Matemáticos", color: '#3b82f6', mainStat: "69", users: [{ name: "Ana García", val: "38 (95%)" }, { name: "Carlos Ruiz", val: "31 (88.6%)" }] },
      { id: 2, name: "Calculadores Pro", color: '#a855f7', mainStat: "53", users: [{ name: "Tú (Samurai Sensei)", val: "28 (90.3%)" }, { name: "María López", val: "25 (86.2%)" }] },
    ],
    Jefes: [
      { id: 1, name: "Los Matemáticos", color: '#3b82f6', mainStat: "14x", users: [{ name: "Ana García", val: "8x" }, { name: "Carlos Ruiz", val: "6x" }] },
      { id: 2, name: "Calculadores Pro", color: '#a855f7', mainStat: "8x", users: [{ name: "Tú (Samurai Sensei)", val: "5x" }, { name: "María López", val: "3x" }] },
    ],
    Individual: [
      { id: 1, name: "Ana García", team: "Los Matemáticos", color: '#3b82f6', mainStat: "850", sub: "15.5h · 38 resp" },
      { id: 2, name: "Tú (Samurai Sensei)", team: "Calculadores Pro", color: '#a855f7', mainStat: "720", sub: "12.5h · 28 resp", isMe: true },
      { id: 3, name: "Carlos Ruiz", team: "Los Matemáticos", color: '#3b82f6', mainStat: "680", sub: "10.2h · 31 resp" },
      { id: 4, name: "María López", team: "Calculadores Pro", color: '#a855f7', mainStat: "620", sub: "8.7h · 25 resp" },
      { id: 5, name: "Pedro Sánchez", team: "Independiente", color: '#94a3b8', mainStat: "550", sub: "6.3h · 19 resp" },
    ]
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.titleRow}>
          <Trophy color="#facc15" size={20} />
          <Text style={styles.title}>Ranking de la Sala</Text>
        </View>
        {isExpanded ? <ChevronUp color="#64748b" size={20} /> : <ChevronDown color="#64748b" size={20} />}
      </Pressable>

      {isExpanded && (
        <>
          <View style={styles.tabBar}>
            {tabs.map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            ))}
          </View>

          {rankingData[activeTab].map((item: any, index: number) => (
            <View key={item.id} style={styles.groupContainer}>
              {/* Team/User Row */}
              <View style={[styles.rankItem, item.isMe && styles.meItem]}>
                <View style={[styles.rankBadge, index === 0 ? styles.gold : index === 1 ? styles.silver : styles.bronze]}>
                  <Text style={styles.rankNum}>{index + 1}</Text>
                </View>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: activeTab === 'Individual' ? 'white' : item.color }]}>{item.name}</Text>
                  <Text style={styles.sub}>{activeTab === 'Individual' ? item.team : `${item.members || item.users?.length || 0} miembros`}</Text>
                </View>
                <View style={styles.stats}>
                  <Text style={[styles.mainStat, { color: activeTab === 'Individual' ? '#a855f7' : item.color }]}>{item.mainStat}</Text>
                  {item.subStat && <Text style={styles.subStat}>{item.subStat}</Text>}
                  {item.sub && <Text style={styles.subStat}>{item.sub}</Text>}
                </View>
              </View>

              {/* User Breakdown (Para Tiempo, Respuestas, Jefes) */}
              {activeTab !== 'Team' && activeTab !== 'Individual' && item.users?.map((u: any, i: number) => (
                <View key={i} style={[styles.userRow, u.isMe && styles.meRow]}>
                   <Text style={styles.userRank}>{i + 1}°</Text>
                   <View style={[styles.userAvatar, { backgroundColor: item.color }]}><Text style={styles.avatarText}>{u.name[0]}</Text></View>
                   <Text style={styles.userName}>{u.name}</Text>
                   <Text style={styles.userVal}>{u.val}</Text>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 28, padding: 15, marginTop: 25, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 15, padding: 4, marginBottom: 15, justifyContent: 'space-between' },
  tab: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  activeTab: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#3b82f644' },
  tabText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  activeTabText: { color: '#22c55e' },
  
  groupContainer: { marginBottom: 10 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 20 },
  meItem: { borderColor: '#22c55e', borderWidth: 1 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  gold: { backgroundColor: '#facc15' }, silver: { backgroundColor: '#94a3b8' }, bronze: { backgroundColor: '#b45309' },
  rankNum: { fontWeight: 'bold', fontSize: 12, color: '#0f172a' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  info: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 15 },
  sub: { color: '#64748b', fontSize: 11 },
  stats: { alignItems: 'flex-end' },
  mainStat: { fontWeight: '900', fontSize: 18 },
  subStat: { color: '#64748b', fontSize: 10 },

  userRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 35, marginTop: 8, paddingVertical: 5 },
  meRow: { backgroundColor: '#14532d44', borderRadius: 12, marginLeft: 15, paddingHorizontal: 10 },
  userRank: { color: '#64748b', fontSize: 11, width: 25 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  userName: { color: 'white', flex: 1, fontSize: 14 },
  userVal: { color: '#22c55e', fontWeight: 'bold', fontSize: 14 }
});