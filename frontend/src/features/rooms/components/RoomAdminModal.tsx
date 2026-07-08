import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Save, Shield, Trash2, Users, X } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
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
  const colors = useThemeStore(state => state.colors);
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

  // ✅ Estado para AppAlert
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ✅ Función para mostrar alertas personalizadas
  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean,
    cancelText?: string,
    onCancel?: () => void
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText: confirmText || 'Aceptar',
      showCancel: showCancel || false,
      cancelText: cancelText || 'Cancelar',
      onCancel,
    });
  };

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
      .catch(error => showAlert('Administración de sala', error.message ?? 'No se pudo cargar la administración.', 'error'));

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
      showAlert('Equipos', error.message ?? 'No se pudieron cargar los equipos.', 'error');
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
      showAlert('Sala actualizada', 'Los datos de la sala se guardaron correctamente.', 'success');
    } catch (error: any) {
      showAlert('Error al actualizar', error.message ?? 'No se pudo actualizar la sala.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (memberId: string, username: string) => {
    showAlert(
      'Expulsar integrante',
      `Vas a expulsar a @${username} de la sala.`,
      'warning',
      () => handleRemove(memberId),
      'Expulsar',
      true,
      'Cancelar'
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
      showAlert('Error al expulsar', error.message ?? 'No se pudo expulsar al integrante.', 'error');
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
      showAlert('Error al crear equipo', error.message ?? 'No se pudo crear el equipo.', 'error');
    } finally {
      setTeamSaving(false);
    }
  };

  const confirmDeleteTeam = (team: Team) => {
    showAlert(
      'Eliminar equipo',
      `Vas a eliminar "${team.name}". Sus integrantes saldrán del equipo, pero no se borra su historial de sala.`,
      'warning',
      () => handleDeleteTeam(team.id),
      'Eliminar',
      true,
      'Cancelar'
    );
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (teamDeletingId) return;

    setTeamDeletingId(teamId);
    try {
      const overview = await deleteTeam(accessToken, room.id, teamId);
      setTeams(overview.teams);
    } catch (error: any) {
      showAlert('Error al eliminar equipo', error.message ?? 'No se pudo eliminar el equipo.', 'error');
    } finally {
      setTeamDeletingId(null);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Administrar sala</Text>
              <Pressable style={[styles.closeBtn, { backgroundColor: colors.background }]} onPress={onClose}>
                <X color={colors.textMuted} size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Nombre</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={60}
                placeholder="Nombre de la sala"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              />

              <Text style={[styles.label, { color: colors.textMuted }]}>Descripción</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={240}
                placeholder="Descripción de la sala"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                multiline
              />

              <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
                <Save color={colors.background} size={18} />
                <Text style={[styles.saveText, { color: colors.background }]}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
              </Pressable>

              {room.teams_enabled && (
                <>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Shield color={colors.accent} size={18} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>Equipos</Text>
                    </View>
                    <Pressable style={[styles.addTeamBtn, { borderColor: `${colors.accent}44`, backgroundColor: `${colors.accent}15` }]} onPress={() => setTeamModalVisible(true)}>
                      <Plus color={colors.accent} size={16} />
                      <Text style={[styles.addTeamText, { color: colors.accent }]}>Crear</Text>
                    </Pressable>
                  </View>

                  {loadingTeams ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color={colors.accent} />
                      <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando equipos...</Text>
                    </View>
                  ) : teams.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted, backgroundColor: colors.background, borderColor: colors.border }]}>Todavía no hay equipos creados.</Text>
                  ) : (
                    <View style={styles.teamsList}>
                      {teams.map(team => (
                        <View key={team.id} style={[styles.teamRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <View style={[styles.teamColorDot, { backgroundColor: team.color ?? colors.accent }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
                            <View style={styles.teamMetaRow}>
                              <Users color={colors.textMuted} size={13} />
                              <Text style={[styles.teamMeta, { color: colors.textMuted }]}>{team.members.length} integrantes</Text>
                            </View>
                          </View>
                          <Pressable
                            style={[styles.removeBtn, { backgroundColor: `${colors.warning}20`, borderColor: colors.warning }, teamDeletingId === team.id && styles.disabled]}
                            onPress={() => confirmDeleteTeam(team)}
                            disabled={Boolean(teamDeletingId)}
                          >
                            {teamDeletingId === team.id ? (
                              <ActivityIndicator color={colors.warning} />
                            ) : (
                              <Trash2 color={colors.warning} size={18} />
                            )}
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

              <Text style={[styles.sectionTitle, { color: colors.text }]}>Integrantes activos</Text>
              <View style={styles.membersList}>
                {adminRoom.members.map(member => {
                  const canRemove = member.role !== 'owner' && member.id !== currentUserId;

                  return (
                    <View key={member.id} style={[styles.memberRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Image source={{ uri: member.avatar_url || fallbackAvatar }} style={styles.avatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.memberName, { color: colors.text }]}>@{member.username}</Text>
                        <Text style={[styles.memberRole, { color: colors.textMuted }]}>{member.role === 'owner' ? 'Owner' : 'Miembro'}</Text>
                      </View>
                      {canRemove && (
                        <Pressable
                          style={[styles.removeBtn, { backgroundColor: `${colors.warning}20`, borderColor: colors.warning }, removingId === member.id && styles.disabled]}
                          onPress={() => confirmRemove(member.id, member.username)}
                          disabled={Boolean(removingId)}
                        >
                          <Trash2 color={colors.warning} size={18} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CreateTeamModal
        visible={teamModalVisible}
        onClose={() => setTeamModalVisible(false)}
        onCreate={handleCreateTeam}
        saving={teamSaving}
      />

      {/* ✅ AppAlert personalizado */}
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
        onConfirm={() => {
          if (alert.onConfirm) {
            alert.onConfirm();
          } else {
            setAlert(prev => ({ ...prev, visible: false }));
          }
        }}
        onCancel={() => {
          if (alert.onCancel) alert.onCancel();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        confirmText={alert.confirmText || 'Aceptar'}
        cancelText={alert.cancelText || 'Cancelar'}
        showCancel={alert.showCancel || false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  modal: { maxHeight: '86%', borderRadius: 24, borderWidth: 1, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 10 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea: { minHeight: 82, textAlignVertical: 'top' },
  saveBtn: { height: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  saveText: { fontWeight: '900', fontSize: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '900', marginTop: 22, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addTeamBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  addTeamText: { fontWeight: '900', fontSize: 12 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  loadingText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontSize: 13, fontWeight: '700', borderRadius: 14, padding: 12, borderWidth: 1 },
  teamsList: { gap: 10 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, borderWidth: 1 },
  teamColorDot: { width: 12, height: 12, borderRadius: 6 },
  teamName: { fontWeight: 'bold', fontSize: 14 },
  teamMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  teamMeta: { fontSize: 12 },
  membersList: { gap: 10 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 12, borderWidth: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  memberName: { fontWeight: 'bold', fontSize: 14 },
  memberRole: { fontSize: 12, marginTop: 2 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  disabled: { opacity: 0.65 },
});