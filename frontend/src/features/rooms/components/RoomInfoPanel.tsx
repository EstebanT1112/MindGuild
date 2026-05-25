import { Image, StyleSheet, Text, View } from 'react-native';
import { Hash, Users } from 'lucide-react-native';
import type { RoomDetails } from '../services/roomsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';

export default function RoomInfoPanel({ room }: { room: RoomDetails }) {
  // RF-06: renderiza datos basicos y miembros activos de la sala.
  const modeLabel = room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{room.name}</Text>
          <Text style={styles.mode}>{modeLabel}</Text>
        </View>
        <View style={styles.codeBox}>
          <Hash color="#22c55e" size={14} />
          <Text style={styles.code}>{room.invite_code}</Text>
        </View>
      </View>

      <View style={styles.membersHeader}>
        <Users color="#94a3b8" size={18} />
        <Text style={styles.membersTitle}>Integrantes activos ({room.members.length})</Text>
      </View>

      <View style={styles.membersList}>
        {room.members.map(member => (
          <View key={member.id} style={styles.memberRow}>
            <Image source={{ uri: member.avatar_url || fallbackAvatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>@{member.username}</Text>
              <Text style={styles.memberRole}>{member.role === 'owner' ? 'Owner' : 'Miembro'}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  title: { color: 'white', fontSize: 20, fontWeight: '900' },
  mode: { color: '#94a3b8', fontSize: 13, marginTop: 4, fontWeight: 'bold' },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  code: { color: '#22c55e', fontSize: 12, fontWeight: '900' },
  membersHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  membersTitle: { color: '#cbd5e1', fontSize: 14, fontWeight: 'bold' },
  membersList: { gap: 10 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  memberName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  memberRole: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
