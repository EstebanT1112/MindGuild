import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Crown, Hash, Shield, Tag, Users, X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { RoomDetails } from '../services/roomsService';
import { assignTemporaryRoomRole, fetchRoomRoles, type RoomMember } from '../services/roomsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';
const teamFallbackColors = ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

interface Props {
  room: RoomDetails;
  accessToken?: string | null;
  currentUserId?: string;
  onRoomUpdated?: (room: RoomDetails) => void;
}

export default function RoomInfoPanel({ room, accessToken, currentUserId, onRoomUpdated }: Props) {
  const colors = useThemeStore(state => state.colors);
  const modeLabel = room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia';
  const [members, setMembers] = useState(room.members);
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [roleLabel, setRoleLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const teams = room.teams ?? [];
  const currentUserIsBoss = members.some(m => m.id === currentUserId && m.is_boss);

  useEffect(() => { setMembers(room.members); }, [room.members]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>{room.name}</Text>
          <Text style={[styles.mode, { color: colors.textMuted }]}>{modeLabel}</Text>
        </View>
        <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Hash color={colors.accent} size={14} />
          <Text style={[styles.code, { color: colors.accent }]}>{room.invite_code}</Text>
        </View>
      </View>

      <View style={styles.membersHeader}>
        <Users color={colors.textMuted} size={18} />
        <Text style={[styles.membersTitle, { color: colors.text }]}>Integrantes ({members.length})</Text>
      </View>

      <View style={styles.membersList}>
        {members.map(member => (
          <View key={member.id} style={[styles.memberRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Image source={{ uri: member.avatar_url || fallbackAvatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.memberName, { color: colors.text }]}>@{member.username}</Text>
              <Text style={[styles.memberRole, { color: colors.textMuted }]}>{member.role === 'owner' ? 'Owner' : 'Miembro'}</Text>
            </View>
          </View>
        ))}
      </View>

      {room.teams_enabled && (
        <View style={styles.teamsSection}>
          <View style={styles.membersHeader}>
            <Shield color={colors.textMuted} size={18} />
            <Text style={[styles.membersTitle, { color: colors.text }]}>Equipos ({teams.length})</Text>
          </View>

          {teams.length > 0 ? (
            <View style={styles.membersList}>
              {teams.map((team, index) => {
                const teamColor = team.color || teamFallbackColors[index % teamFallbackColors.length];
                const membersLabel = team.members_count === 1 ? '1 integrante' : `${team.members_count} integrantes`;

                return (
                  <View
                    key={team.id}
                    style={[
                      styles.teamRow,
                      { backgroundColor: colors.background, borderColor: teamColor },
                    ]}
                  >
                    <View style={[styles.teamColor, { backgroundColor: teamColor }]} />
                    <View style={styles.teamInfo}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{team.name}</Text>
                      <Text style={[styles.memberRole, { color: colors.textMuted }]}>{membersLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyTeams, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.emptyTeamsText, { color: colors.textMuted }]}>Todavía no hay equipos creados.</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 18, borderWidth: 1, marginBottom: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900' },
  mode: { fontSize: 13, marginTop: 4, fontWeight: 'bold' },
  codeBox: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  code: { fontSize: 12, fontWeight: '900' },
  membersHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  membersTitle: { fontSize: 14, fontWeight: 'bold' },
  membersList: { gap: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, borderWidth: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  memberName: { fontWeight: 'bold', fontSize: 14 },
  memberRole: { fontSize: 12, marginTop: 2 },
  teamsSection: { marginTop: 20 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, borderWidth: 1 },
  teamColor: { width: 12, height: 38, borderRadius: 6 },
  teamInfo: { flex: 1 },
  emptyTeams: { borderRadius: 16, padding: 14, borderWidth: 1 },
  emptyTeamsText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
