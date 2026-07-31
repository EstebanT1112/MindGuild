import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BrainCircuit, ChevronDown, ChevronUp, Clock, Crown, GraduationCap, Pencil, Shield, Users, X } from 'lucide-react-native';
import {
  fetchTeamsOverview,
  joinTeam,
  leaveTeam,
  renameTeam,
  type Team,
  type TeamRankingEntry,
  type TeamsOverview,
} from '../services/teamsService';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useThemeStore, type ThemeColors } from '../../../store/themeStore';

interface TeamsSectionProps {
  roomId: string;
  accessToken: string;
  mode: 'survival' | 'battle_royale';
}

const teamColors = ['#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
type TeamRankingType = 'time' | 'qa' | 'academic' | 'boss';

const teamRankingTabs: Array<{
  type: TeamRankingType;
  label: string;
  title: string;
  subtitle: string;
  itemLabel: string;
  icon: typeof Clock;
}> = [
  {
    type: 'time',
    label: 'Tiempo',
    title: 'Ranking de tiempo',
    subtitle: 'Minutos totales del equipo',
    itemLabel: 'Tiempo acumulado',
    icon: Clock,
  },
  {
    type: 'qa',
    label: 'Q&A',
    title: 'Ranking Q&A',
    subtitle: 'Puntos Q&A del equipo',
    itemLabel: 'Puntos Q&A',
    icon: BrainCircuit,
  },
  {
    type: 'academic',
    label: 'Academico',
    title: 'Ranking academico',
    subtitle: 'Tiempo y rendimiento combinados',
    itemLabel: 'Score academico',
    icon: GraduationCap,
  },
  {
    type: 'boss',
    label: 'Jefes',
    title: 'Ranking de jefes',
    subtitle: 'Jefaturas ganadas por el equipo',
    itemLabel: 'Jefaturas acumuladas',
    icon: Crown,
  },
];

export default function TeamsSection({ roomId, accessToken }: TeamsSectionProps) {
  const colors = useThemeStore(state => state.colors);
  const styles = makeStyles(colors);
  const [isExpanded, setIsExpanded] = useState(false);
  const [overview, setOverview] = useState<TeamsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionTeamId, setActionTeamId] = useState<string | null>(null);
  const [activeRankingType, setActiveRankingType] = useState<TeamRankingType>('time');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isRenamingTeam, setIsRenamingTeam] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await fetchTeamsOverview(accessToken, roomId);
      setOverview(data);
    } catch (error: any) {
      showAlert('Equipos', error.message ?? 'No se pudieron cargar los equipos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [accessToken, roomId]);

  const handleJoinTeam = async (teamId: string): Promise<boolean> => {
    setActionTeamId(teamId);
    try {
      const data = await joinTeam(accessToken, roomId, teamId);
      setOverview(data);
      return true;
    } catch (error: any) {
      showAlert('Equipos', error.message ?? 'No se pudo unir al equipo', 'error');
      return false;
    } finally {
      setActionTeamId(null);
    }
  };

  const handleLeaveTeam = async (teamId: string): Promise<boolean> => {
    setActionTeamId(teamId);
    try {
      const data = await leaveTeam(accessToken, roomId, teamId);
      setOverview(data);
      return true;
    } catch (error: any) {
      showAlert('Equipos', error.message ?? 'No se pudo salir del equipo', 'error');
      return false;
    } finally {
      setActionTeamId(null);
    }
  };

  const openTeamDetail = (team: Team) => {
    setSelectedTeam(team);
    setRenameValue(team.name);
    setIsRenamingTeam(false);
  };

  const closeTeamDetail = () => {
    setSelectedTeam(null);
    setRenameValue('');
    setIsRenamingTeam(false);
  };

  const handleRenameTeam = async () => {
    if (!selectedTeam || saving) return;

    const trimmedName = renameValue.trim();
    if (!trimmedName) {
      showAlert('Nombre requerido', 'Ingresa un nombre para el equipo.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const data = await renameTeam(accessToken, roomId, selectedTeam.id, trimmedName);
      const updatedTeam = data.teams.find(team => team.id === selectedTeam.id) ?? null;
      setOverview(data);
      setSelectedTeam(updatedTeam);
      setRenameValue(updatedTeam?.name ?? '');
      setIsRenamingTeam(false);
      showAlert('Equipo renombrado', `El equipo ahora se llama "${trimmedName}"`, 'success');
    } catch (error: any) {
      showAlert('Equipos', error.message ?? 'No se pudo cambiar el nombre del equipo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const teams = overview?.teams ?? [];
  const ranking = overview?.ranking ?? [];
  const myTeamId = overview?.my_team?.team_id ?? null;
  const selectedTeamColor = selectedTeam?.color ?? colors.info;
  const selectedTeamIsMine = Boolean(selectedTeam && myTeamId === selectedTeam.id);
  const canJoinSelectedTeam = Boolean(selectedTeam && !myTeamId);
  const canRenameTeams = Boolean(overview?.rename_permission?.can_rename_all);

  return (
    <>
      <View style={[styles.container, !isExpanded && styles.containerCollapsed]}>
        <Pressable style={[styles.header, !isExpanded && styles.headerCollapsed]} onPress={() => setIsExpanded(!isExpanded)}>
          <View style={styles.titleRow}>
            <Shield color={colors.info} size={20} />
            <Text style={styles.title}>Equipos</Text>
          </View>
          {isExpanded ? <ChevronUp color={colors.textSoft} size={20} /> : <ChevronDown color={colors.textSoft} size={20} />}
        </Pressable>

        {isExpanded && (
          <>
            <TeamRanking ranking={ranking} activeType={activeRankingType} onChangeType={setActiveRankingType} />

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={colors.info} />
                <Text style={styles.mutedText}>Cargando equipos...</Text>
              </View>
            ) : teams.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Todavía no hay equipos</Text>
                <Text style={styles.mutedText}>El owner todavía no creó equipos.</Text>
              </View>
            ) : (
              teams.map((team, index) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  color={team.color ?? teamColors[index % teamColors.length]}
                  myTeamId={myTeamId}
                  onPress={() => openTeamDetail(team)}
                />
              ))
            )}
          </>
        )}

        <Modal visible={Boolean(selectedTeam)} animationType="fade" transparent onRequestClose={closeTeamDetail}>
          <View style={styles.modalOverlay}>
            <View style={[styles.teamDetailModal, { borderColor: selectedTeamColor }]}>
              <View style={styles.teamDetailHeader}>
                <View style={styles.teamTitleRow}>
                  <View style={[styles.colorDot, { backgroundColor: selectedTeamColor }]} />
                  <Text style={styles.teamDetailTitle}>{selectedTeam?.name}</Text>
                </View>
                <View style={styles.headerActions}>
                  {canRenameTeams && selectedTeam && (
                    <Pressable
                      style={styles.editTeamBtn}
                      onPress={() => {
                        setRenameValue(selectedTeam.name);
                        setIsRenamingTeam(true);
                      }}
                    >
                      <Pencil color={colors.warning} size={16} />
                    </Pressable>
                  )}
                  <Pressable style={styles.closeBtn} onPress={closeTeamDetail}>
                    <X color={colors.textMuted} size={18} />
                  </Pressable>
                </View>
              </View>

              {isRenamingTeam && (
                <View style={styles.renameBox}>
                  <TextInput
                    value={renameValue}
                    onChangeText={setRenameValue}
                    maxLength={40}
                    placeholder="Nombre del equipo"
                    placeholderTextColor={colors.textSoft}
                    style={styles.renameInput}
                  />
                  <View style={styles.renameActions}>
                    <Pressable
                      style={styles.cancelRenameBtn}
                      onPress={() => {
                        setRenameValue(selectedTeam?.name ?? '');
                        setIsRenamingTeam(false);
                      }}
                      disabled={saving}
                    >
                      <Text style={styles.cancelRenameText}>Cancelar</Text>
                    </Pressable>
                    <Pressable style={[styles.confirmRenameBtn, saving && styles.disabled]} onPress={handleRenameTeam} disabled={saving}>
                      {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.confirmRenameText}>Guardar</Text>}
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.memberCountDetail}>
                <Users color={colors.textSoft} size={14} />
                <Text style={styles.countText}>{selectedTeam?.members.length ?? 0} integrantes</Text>
              </View>

              <View style={styles.memberChips}>
                {!selectedTeam || selectedTeam.members.length === 0 ? (
                  <Text style={styles.mutedText}>Sin integrantes activos.</Text>
                ) : (
                  selectedTeam.members.map(member => (
                    <View key={member.id} style={styles.chip}>
                      <Text style={styles.chipText}>{member.username}</Text>
                    </View>
                  ))
                )}
              </View>

              {(selectedTeamIsMine || canJoinSelectedTeam) && (
                <View style={styles.teamActions}>
                  {canJoinSelectedTeam && selectedTeam && (
                    <Pressable
                      style={styles.teamActionBtn}
                      onPress={() => handleJoinTeam(selectedTeam.id).then(success => success && closeTeamDetail())}
                      disabled={actionTeamId === selectedTeam.id}
                    >
                      {actionTeamId === selectedTeam.id ? <ActivityIndicator color={colors.text} /> : <Text style={styles.teamActionText}>Unirme</Text>}
                    </Pressable>
                  )}
                  {selectedTeamIsMine && selectedTeam && (
                    <Pressable
                      style={[styles.teamActionBtn, styles.leaveBtn]}
                      onPress={() => handleLeaveTeam(selectedTeam.id).then(success => success && closeTeamDetail())}
                      disabled={actionTeamId === selectedTeam.id}
                    >
                      {actionTeamId === selectedTeam.id ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.leaveBtnText}>Salir del equipo</Text>}
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>

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

function TeamCard({
  team,
  color,
  myTeamId,
  onPress,
}: {
  team: Team;
  color: string;
  myTeamId: string | null;
  onPress: () => void;
}) {
  const colors = useThemeStore(state => state.colors);
  const styles = makeStyles(colors);
  const isMyTeam = myTeamId === team.id;

  return (
    <Pressable style={[styles.teamCard, isMyTeam && styles.myActiveTeamCard, isMyTeam && { borderColor: color }]} onPress={onPress}>
      <View style={styles.teamHeader}>
        <View style={styles.teamTitleRow}>
          <View style={[styles.colorDot, { backgroundColor: color }]} />
          <Text style={styles.teamName}>{team.name}</Text>
        </View>
        <View style={styles.memberCount}>
          <Users color={colors.textSoft} size={14} />
          <Text style={styles.countText}>{team.members.length}</Text>
        </View>
      </View>

      <Text style={styles.teamHint}>{isMyTeam ? 'Tu equipo' : 'Tocar para ver integrantes'}</Text>
    </Pressable>
  );
}

function TeamRanking({
  ranking,
  activeType,
  onChangeType,
}: {
  ranking: TeamRankingEntry[];
  activeType: TeamRankingType;
  onChangeType: (type: TeamRankingType) => void;
}) {
  const colors = useThemeStore(state => state.colors);
  const styles = makeStyles(colors);
  const activeTab = teamRankingTabs.find(tab => tab.type === activeType) ?? teamRankingTabs[0];
  const HeaderIcon = activeTab.icon;
  const sortedRanking = sortTeamRanking(ranking, activeType);

  return (
    <View style={styles.rankingCard}>
      <View style={styles.rankingHeader}>
        <HeaderIcon color={colors.warning} size={18} />
        <View style={styles.rankingHeaderText}>
          <Text style={styles.rankingTitle}>{activeTab.title}</Text>
          <Text style={styles.rankingSubtitle}>{activeTab.subtitle}</Text>
        </View>
      </View>

      <View style={styles.rankingTabs}>
        {teamRankingTabs.map(tab => {
          const isActive = activeType === tab.type;
          return (
            <Pressable
              key={tab.type}
              style={[styles.rankingTabButton, isActive && styles.rankingTabButtonActive]}
              onPress={() => onChangeType(tab.type)}
            >
              <Text style={[styles.rankingTabText, isActive && styles.rankingTabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {sortedRanking.length === 0 ? (
        <Text style={styles.mutedText}>Sin datos de ranking todavía.</Text>
      ) : (
        sortedRanking.map((entry, index) => (
          <View key={entry.team_id} style={styles.rankingRow}>
            <Text style={styles.positionText}>#{index + 1}</Text>
            <View style={styles.rankingInfo}>
              <View style={styles.rankingTeamTitleRow}>
                <View style={[styles.rankingColorDot, { backgroundColor: entry.color ?? teamColors[index % teamColors.length] }]} />
                <Text style={styles.rankingTeamName}>{entry.team_name}</Text>
              </View>
              <Text style={styles.rankingSub}>{entry.members_count} integrantes - {activeTab.itemLabel}</Text>
            </View>
            <View style={styles.rankingStats}>
              <Text style={styles.scoreText}>{formatTeamRankingValue(entry, activeType)}</Text>
              <Text style={styles.rankingSub}>{formatTeamRankingSubtitle(entry, activeType)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function sortTeamRanking(ranking: TeamRankingEntry[], type: TeamRankingType): TeamRankingEntry[] {
  return [...ranking].sort((a, b) => {
    const primary = getTeamRankingNumber(b, type) - getTeamRankingNumber(a, type);
    if (primary !== 0) return primary;

    const secondary = b.total_minutes - a.total_minutes;
    if (secondary !== 0) return secondary;

    return a.team_name.localeCompare(b.team_name);
  });
}

function getTeamRankingNumber(entry: TeamRankingEntry, type: TeamRankingType): number {
  if (type === 'time') return Number(entry.total_minutes) || 0;
  if (type === 'qa') return Number(entry.quiz_score) || 0;
  if (type === 'academic') return Number(entry.academic_score) || 0;
  return Number(entry.bosses_count) || 0;
}

function formatTeamRankingValue(entry: TeamRankingEntry, type: TeamRankingType): string {
  if (type === 'time') return `${entry.total_minutes}m`;
  if (type === 'academic') return Number(entry.academic_score).toFixed(1);
  if (type === 'boss') return String(entry.bosses_count);
  return String(entry.quiz_score);
}

function formatTeamRankingSubtitle(entry: TeamRankingEntry, type: TeamRankingType): string {
  if (type === 'time') return formatHours(entry.total_minutes);
  if (type === 'academic') return 'pts';
  if (type === 'boss') return 'jefaturas';
  return 'puntos';
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  return `${hours}h ${remainingMinutes}m`;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { backgroundColor: colors.surfaceElevated, borderRadius: 22, padding: 16, marginTop: 20, borderWidth: 1, borderColor: colors.border },
    containerCollapsed: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerCollapsed: { marginBottom: 0 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
    loadingState: { alignItems: 'center', gap: 8, paddingVertical: 18 },
    emptyCard: { backgroundColor: colors.input, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { color: colors.text, fontWeight: '900', marginBottom: 4 },
    mutedText: { color: colors.textMuted, fontSize: 13 },
    teamCard: { backgroundColor: colors.input, borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    myActiveTeamCard: { borderWidth: 2 },
    teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teamTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    teamName: { color: colors.text, fontWeight: 'bold', fontSize: 16, flex: 1 },
    memberCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    memberCountDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceElevated, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 12 },
    countText: { color: colors.textSoft, fontSize: 12, fontWeight: 'bold' },
    teamHint: { color: colors.textSoft, fontSize: 12, marginTop: 8, fontWeight: '700' },
    memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: { backgroundColor: colors.surfaceElevated, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    chipText: { color: colors.textMuted, fontSize: 13 },
    teamActions: { gap: 10, marginTop: 14 },
    teamActionBtn: { backgroundColor: colors.info, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, marginTop: 14 },
    teamActionText: { color: colors.text, fontWeight: '900' },
    leaveBtn: { backgroundColor: colors.dangerBorder, marginTop: 0 },
    leaveBtnText: { color: colors.danger, fontWeight: '900' },
    rankingCard: { backgroundColor: colors.input, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 4, marginBottom: 15 },
    rankingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    rankingHeaderText: { flex: 1 },
    rankingTitle: { color: colors.text, fontWeight: '900' },
    rankingSubtitle: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
    rankingTabs: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    rankingTabButton: {
      flex: 1,
      minHeight: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 4,
    },
    rankingTabButtonActive: {
      borderColor: colors.warning,
      backgroundColor: colors.warningSoft,
    },
    rankingTabText: { color: colors.textMuted, fontSize: 10, fontWeight: '900', textAlign: 'center' },
    rankingTabTextActive: { color: colors.warningStrong },
    rankingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.surfaceElevated },
    positionText: { color: colors.warning, fontWeight: '900', width: 34 },
    rankingInfo: { flex: 1 },
    rankingTeamTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rankingColorDot: { width: 10, height: 10, borderRadius: 5 },
    rankingTeamName: { color: colors.text, fontWeight: '800' },
    rankingSub: { color: colors.textSoft, fontSize: 12, marginTop: 2 },
    rankingStats: { alignItems: 'flex-end' },
    scoreText: { color: colors.accent, fontWeight: '900' },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 20 },
    teamDetailModal: { width: '100%', backgroundColor: colors.input, borderRadius: 24, padding: 20, borderWidth: 2 },
    teamDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    teamDetailTitle: { color: colors.text, fontSize: 20, fontWeight: '900', flex: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    editTeamBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning, alignItems: 'center', justifyContent: 'center' },
    closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
    renameBox: { backgroundColor: colors.input, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 14 },
    renameInput: { backgroundColor: colors.surfaceElevated, color: colors.text, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontWeight: '800' },
    renameActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    cancelRenameBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
    cancelRenameText: { color: colors.text, fontWeight: '900' },
    confirmRenameBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    confirmRenameText: { color: colors.text, fontWeight: '900' },
    disabled: { opacity: 0.65 },
  });
}
