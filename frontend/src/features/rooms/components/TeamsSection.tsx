import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Shield, Plus, ChevronUp, ChevronDown, Users } from 'lucide-react-native';
import CreateTeamModal from './CreateTeamModal';
export default function TeamsSection() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const teams = [
    { id: 1, name: "Los Matemáticos", members: ["Ana García", "Carlos Ruiz"], color: '#3b82f6' },
    { id: 2, name: "Calculadores Pro", members: ["María López", "Samurai Sensei"], color: '#a855f7' },
  ];

  return (
    <View style={styles.container}>
      {/* Header con el escudo y botón Crear */}
      <View style={styles.header}>
        <Pressable style={styles.titleRow} onPress={() => setIsExpanded(!isExpanded)}>
          <Shield color="#3b82f6" size={20} />
          <Text style={styles.title}>Equipos (Teams)</Text>
          {isExpanded ? <ChevronUp color="#64748b" size={20} /> : <ChevronDown color="#64748b" size={20} />}
        </Pressable>
        
        <Pressable style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#3b82f6" size={16} />
          <Text style={styles.createBtnText}>Crear</Text>
        </Pressable>
      </View>

      {isExpanded && (
        <>
          {teams.map(team => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.teamTitleRow}>
                  <View style={[styles.colorDot, { backgroundColor: team.color }]} />
                  <Text style={styles.teamName}>{team.name}</Text>
                </View>
                <View style={styles.memberCount}>
                  <Users color="#64748b" size={14} />
                  <Text style={styles.countText}>{team.members.length}</Text>
                </View>
              </View>
              
              <View style={styles.memberChips}>
                {team.members.map((member, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipText}>{member}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* Sección FIJA de "TU EQUIPO" */}
          <View style={styles.myTeamCard}>
            <View style={styles.myTeamHeader}>
              <Text style={styles.myTeamLabel}>TU EQUIPO</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>No puedes cambiar</Text>
              </View>
            </View>
            <View style={styles.myTeamRow}>
              <View style={[styles.colorDot, { backgroundColor: '#a855f7' }]} />
              <Text style={styles.myTeamName}>Calculadores Pro</Text>
            </View>
          </View>
        </>
      )}

      <CreateTeamModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#1e293b', borderRadius: 28, padding: 20, marginTop: 20, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3b82f615', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f644' },
  createBtnText: { color: '#3b82f6', fontWeight: 'bold' },
  
  teamCard: { backgroundColor: '#0f172a', borderRadius: 24, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  teamTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  teamName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  memberCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  countText: { color: '#64748b', fontSize: 12, fontWeight: 'bold' },
  memberChips: { flexDirection: 'row', gap: 10 },
  chip: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  chipText: { color: '#94a3b8', fontSize: 13 },

  myTeamCard: { marginTop: 10, padding: 20, backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#334155' },
  myTeamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  myTeamLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  statusBadge: { backgroundColor: '#facc1515', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#facc1544' },
  statusText: { color: '#facc15', fontSize: 10, fontWeight: 'bold' },
  myTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myTeamName: { color: '#a855f7', fontWeight: 'bold', fontSize: 18 }
});