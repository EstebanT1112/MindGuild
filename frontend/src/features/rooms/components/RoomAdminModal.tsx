import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Save, Shield, Trash2, Users, X } from 'lucide-react-native';
import CreateTeamModal from './CreateTeamModal';
import type { RoomDetails } from '../services/roomsService';
import { fetchRoomAdminDetails, removeRoomMember, updateRoom } from '../services/roomsService';
import { createTeam, deleteTeam, fetchTeamsOverview, type Team } from '../services/teamsService';

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';

interface Props {
  visible: boolean;
  room: RoomDetails;
  accessToken: string;
  currentUserId?: string;
  onClose: () => void;
  onRoomUpdated: (room: RoomDetails) => void;
}

export default function RoomAdminModal({
  visible,
  room,
  accessToken,
  currentUserId,
  onClose,
  onRoomUpdated,
}: Props) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? '');
  const [adminRoom, setAdminRoom] = useState(room);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamDeletingId, setTeamDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    setName(room.name);
    setDescription(room.description ?? '');
    setAdminRoom(room);

    fetchRoomAdminDetails(accessToken, room.id)
      .then(data => {
        setAdminRoom(data);
        setName(data.name);
        setDescription(data.description ?? '');
        onRoomUpdated(data);
      })
      .catch(error => Alert.alert('Administracion de sala', error.message ?? 'No se pudo cargar la administracion.'));

    loadTeamsForAdmin();
  }, [visible, room.id, accessToken]);

  const loadTeamsForAdmin = async () => {
    if (!room.teams_enabled) {
      setTeams([]);
      return;
    }

    setLoadingTeams(true);
    try {
      const overview = await fetchTeamsOverview(accessToken, room.id);
      setTeams(overview.teams);
    } catch (error: any) {
      Alert.alert('Equipos', error.message ?? 'No se pudieron cargar los equipos');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const updatedRoom = await updateRoom(accessToken, room.id, {
        name,
        description: description.trim() ? description.trim() : null,
      });
      setAdminRoom(updatedRoom);
      onRoomUpdated(updatedRoom);
      Alert.alert('Sala actualizada', 'Los datos de la sala se guardaron correctamente.');
    } catch (error: any) {
      Alert.alert('Error al actualizar', error.message ?? 'No se pudo actualizar la sala.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (memberId: string, username: string) => {
    Alert.alert(
      'Expulsar integrante',
      `Vas a expulsar a @${username} de la sala.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Expulsar', style: 'destructive', onPress: () => handleRemove(memberId) },
      ]
    );
  };

  const handleRemove = async (memberId: string) => {
    if (removingId) return;

    setRemovingId(memberId);
    try {
      await removeRoomMember(accessToken, room.id, memberId);
      const updatedRoom = {
        ...adminRoom,
        members: adminRoom.members.filter(member => member.id !== memberId),
      };
      setAdminRoom(updatedRoom);
      onRoomUpdated(updatedRoom);
    } catch (error: any) {
      Alert.alert('Error al expulsar', error.message ?? 'No se pudo expulsar al integrante.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleCreateTeam = async (teamName: string, color: string) => {
    if (teamSaving) return;

    setTeamSaving(true);
    try {
      await createTeam(accessToken, room.id, teamName, color);
      await loadTeamsForAdmin();
      setTeamModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error al crear equipo', error.message ?? 'No se pudo crear el equipo.');
    } finally {
      setTeamSaving(false);
    }
  };

  const confirmDeleteTeam = (team: Team) => {
    Alert.alert(
      'Eliminar equipo',
      `Vas a eliminar "${team.name}". Sus integrantes saldran del equipo, pero no se borra su historial de sala.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDeleteTeam(team.id) },
      ]
    );
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (teamDeletingId) return;

    setTeamDeletingId(teamId);
    try {
      const overview = await deleteTeam(accessToken, room.id, teamId);
      setTeams(overview.teams);
    } catch (error: any) {
      Alert.alert('Error al eliminar equipo', error.message ?? 'No se pudo eliminar el equipo.');
    } finally {
      setTeamDeletingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Administrar sala</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#94a3b8" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={60}
              placeholder="Nombre de la sala"
              placeholderTextColor="#64748b"
              style={styles.input}
            />

            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              maxLength={240}
              placeholder="Descripcion de la sala"
              placeholderTextColor="#64748b"
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Pressable style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
              <Save color="white" size={18} />
              <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
            </Pressable>

            {room.teams_enabled && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Shield color="#3b82f6" size={18} />
                    <Text style={styles.sectionTitle}>Equipos</Text>
                  </View>
                  <Pressable style={styles.addTeamBtn} onPress={() => setTeamModalVisible(true)}>
                    <Plus color="#bfdbfe" size={16} />
                    <Text style={styles.addTeamText}>Crear</Text>
                  </Pressable>
                </View>

                {loadingTeams ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#3b82f6" />
                    <Text style={styles.loadingText}>Cargando equipos...</Text>
                  </View>
                ) : teams.length === 0 ? (
                  <Text style={styles.emptyText}>Todavia no hay equipos creados.</Text>
                ) : (
                  <View style={styles.teamsList}>
                    {teams.map(team => (
                      <View key={team.id} style={styles.teamRow}>
                        <View style={[styles.teamColorDot, { backgroundColor: team.color ?? '#3b82f6' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.teamName}>{team.name}</Text>
                          <View style={styles.teamMetaRow}>
                            <Users color="#64748b" size={13} />
                            <Text style={styles.teamMeta}>{team.members.length} integrantes</Text>
                          </View>
                        </View>
                        <Pressable
                          style={[styles.removeBtn, teamDeletingId === team.id && styles.disabled]}
                          onPress={() => confirmDeleteTeam(team)}
                          disabled={Boolean(teamDeletingId)}
                        >
                          {teamDeletingId === team.id ? (
                            <ActivityIndicator color="#f87171" />
                          ) : (
                            <Trash2 color="#f87171" size={18} />
                          )}
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            <Text style={styles.sectionTitle}>Integrantes activos</Text>
            <View style={styles.membersList}>
              {adminRoom.members.map(member => {
                const canRemove = member.role !== 'owner' && member.id !== currentUserId;

                return (
                  <View key={member.id} style={styles.memberRow}>
                    <Image source={{ uri: member.avatar_url || fallbackAvatar }} style={styles.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>@{member.username}</Text>
                      <Text style={styles.memberRole}>{member.role === 'owner' ? 'Owner' : 'Miembro'}</Text>
                    </View>
                    {canRemove && (
                      <Pressable
                        style={[styles.removeBtn, removingId === member.id && styles.disabled]}
                        onPress={() => confirmRemove(member.id, member.username)}
                        disabled={Boolean(removingId)}
                      >
                        <Trash2 color="#f87171" size={18} />
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      <CreateTeamModal
        visible={teamModalVisible}
        onClose={() => setTeamModalVisible(false)}
        onCreate={handleCreateTeam}
        saving={teamSaving}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#020617cc', justifyContent: 'center', padding: 20 },
  modal: { maxHeight: '86%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#334155', padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { color: 'white', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#1e293b', color: 'white', borderRadius: 14, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 82, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 16, backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
  sectionTitle: { color: '#cbd5e1', fontSize: 14, fontWeight: '900', marginTop: 22, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addTeamBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#3b82f644', backgroundColor: '#3b82f615', paddingHorizontal: 12, paddingVertical: 8 },
  addTeamText: { color: '#bfdbfe', fontWeight: '900', fontSize: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  loadingText: { color: '#94a3b8', fontSize: 13, fontWeight: '700' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '700', backgroundColor: '#1e293b', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#334155' },
  teamsList: { gap: 10 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#334155' },
  teamColorDot: { width: 12, height: 12, borderRadius: 6 },
  teamName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  teamMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  teamMeta: { color: '#64748b', fontSize: 12 },
  membersList: { gap: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1e293b', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#334155' },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  memberName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  memberRole: { color: '#64748b', fontSize: 12, marginTop: 2 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#450a0a55', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7f1d1d' },
  disabled: { opacity: 0.65 },
});
