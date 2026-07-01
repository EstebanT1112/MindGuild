import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Crown, Hash, Shield, Tag, Users, X } from 'lucide-react-native';
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
  // RF-06: renderiza datos basicos y miembros activos de la sala.
  const modeLabel = room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia';
  const [members, setMembers] = useState<RoomMember[]>(room.members);
  const [selectedMember, setSelectedMember] = useState<RoomMember | null>(null);
  const [roleLabel, setRoleLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const teams = room.teams ?? [];
  const currentUserIsBoss = members.some(member => member.id === currentUserId && member.is_boss);

  useEffect(() => {
    setMembers(room.members);
  }, [room.members]);

  useEffect(() => {
    if (!accessToken) return;

    fetchRoomRoles(accessToken, room.id)
      .then(response => {
        setMembers(response.members);
        onRoomUpdated?.({ ...room, members: response.members });
      })
      .catch(error => {
        console.error('No se pudieron cargar los roles de sala', error);
      });
  }, [accessToken, room.id]);

  const openAssignModal = (member: RoomMember) => {
    setSelectedMember(member);
    setRoleLabel('');
  };

  const handleAssignRole = async () => {
    if (!accessToken || !selectedMember || saving) return;

    const trimmedRole = roleLabel.trim();
    if (!trimmedRole) {
      Alert.alert('Rol requerido', 'Ingresa un apodo para asignar.');
      return;
    }

    setSaving(true);
    try {
      const response = await assignTemporaryRoomRole(accessToken, room.id, {
        target_user_id: selectedMember.id,
        temporary_role: trimmedRole,
      });
      setMembers(response.members);
      onRoomUpdated?.({ ...room, members: response.members });
      setSelectedMember(null);
      setRoleLabel('');
    } catch (error: any) {
      Alert.alert('No se pudo asignar', error.message ?? 'No se pudo asignar el rol.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{room.name}</Text>
          <Text style={styles.mode}>{modeLabel}</Text>
          {room.description ? <Text style={styles.description}>{room.description}</Text> : null}
        </View>
        <View style={styles.codeBox}>
          <Hash color="#22c55e" size={14} />
          <Text style={styles.code}>{room.invite_code}</Text>
        </View>
      </View>

      <View style={styles.membersHeader}>
        <Users color="#94a3b8" size={18} />
        <Text style={styles.membersTitle}>Integrantes activos ({members.length})</Text>
      </View>

      <View style={styles.membersList}>
        {members.map(member => {
          const canAssignRole = Boolean(currentUserIsBoss && !member.temporary_role);

          return (
          <View key={member.id} style={styles.memberRow}>
            <Image source={{ uri: member.avatar_url || fallbackAvatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>@{member.username}</Text>
              <View style={styles.memberMetaRow}>
                <Text style={styles.memberRole}>{member.role === 'owner' ? 'Owner' : 'Miembro'}</Text>
                {member.is_boss && (
                  <View style={styles.bossPill}>
                    <Crown color="#facc15" size={11} />
                    <Text style={styles.bossPillText}>Jefe</Text>
                  </View>
                )}
              </View>
              {member.temporary_role ? (
                <Text style={styles.temporaryRole}>{member.temporary_role}</Text>
              ) : null}
            </View>
            {canAssignRole && (
              <Pressable style={styles.assignBtn} onPress={() => openAssignModal(member)}>
                <Tag color="#22c55e" size={16} />
              </Pressable>
            )}
          </View>
          );
        })}
      </View>

      {room.teams_enabled && teams.length > 0 && (
        <View style={styles.teamsReadOnlyBlock}>
          <View style={styles.membersHeader}>
            <Shield color="#94a3b8" size={18} />
            <Text style={styles.membersTitle}>Equipos ({teams.length})</Text>
          </View>

          <View style={styles.teamsList}>
            {teams.map((team, index) => {
              const teamColor = team.color ?? teamFallbackColors[index % teamFallbackColors.length];

              return (
                <View key={team.id} style={styles.teamRow}>
                  <View style={[styles.teamAvatar, { borderColor: teamColor }]}>
                    <View style={[styles.teamColorDot, { backgroundColor: teamColor }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{team.name}</Text>
                    <Text style={styles.teamMeta}>{team.members_count} integrantes</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <Modal visible={Boolean(selectedMember)} transparent animationType="fade" onRequestClose={() => setSelectedMember(null)}>
        <View style={styles.roleBackdrop}>
          <View style={styles.roleModal}>
            <View style={styles.roleHeader}>
              <Text style={styles.roleTitle}>Asignar apodo</Text>
              <Pressable style={styles.roleCloseBtn} onPress={() => setSelectedMember(null)}>
                <X color="#94a3b8" size={18} />
              </Pressable>
            </View>

            <Text style={styles.roleTarget}>@{selectedMember?.username}</Text>
            <TextInput
              value={roleLabel}
              onChangeText={setRoleLabel}
              maxLength={10}
              placeholder="Apodo"
              placeholderTextColor="#64748b"
              style={styles.roleInput}
            />
            <Text style={styles.roleCounter}>{Array.from(roleLabel).length}/10</Text>

            <Pressable style={[styles.saveRoleBtn, saving && styles.disabled]} onPress={handleAssignRole} disabled={saving}>
              <Text style={styles.saveRoleText}>{saving ? 'Guardando...' : 'Guardar apodo'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
  description: { color: '#cbd5e1', fontSize: 13, marginTop: 8, lineHeight: 18 },
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
  memberMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  bossPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#422006', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  bossPillText: { color: '#fef3c7', fontSize: 10, fontWeight: '900' },
  temporaryRole: { color: '#22c55e', fontSize: 12, fontWeight: '900', marginTop: 4 },
  assignBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#052e16', borderWidth: 1, borderColor: '#166534' },
  teamsReadOnlyBlock: { marginTop: 18 },
  teamsList: { gap: 10 },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
  },
  teamAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: '#020617' },
  teamColorDot: { width: 16, height: 16, borderRadius: 8 },
  teamName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  teamMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  roleBackdrop: { flex: 1, backgroundColor: '#020617cc', justifyContent: 'center', padding: 24 },
  roleModal: { backgroundColor: '#0f172a', borderRadius: 22, borderWidth: 1, borderColor: '#334155', padding: 16 },
  roleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  roleTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  roleCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  roleTarget: { color: '#cbd5e1', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  roleInput: { backgroundColor: '#1e293b', color: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  roleCounter: { color: '#64748b', fontSize: 12, textAlign: 'right', marginTop: 6 },
  saveRoleBtn: { height: 48, borderRadius: 16, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveRoleText: { color: 'white', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.65 },
});
