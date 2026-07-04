import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronRight, Trophy, Users } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';

// Exportamos la interfaz para que RoomsScreen la pueda usar sin error
export interface RoomCardData {
  id: string; // Cambié a string porque en RoomsScreen.tsx el map usa string
  name: string;
  code: string;
  members: number;
  mode: string;
  rawMode: string;
  ranking: number;
  isFavorite: boolean;
  teamsEnabled: boolean;
}

interface Props {
  room: RoomCardData;
  onPress: () => void;
  onToggleFavorite: () => void; // ⚡ Agregamos esto
}

export default function RoomCard({ room, onPress, onToggleFavorite }: Props) {
  const colors = useThemeStore(state => state.colors);

  return (
    <Pressable 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{room.name}</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.code, { color: colors.accent }]}>{room.code}</Text>
          </View>
        </View>
        <ChevronRight color={colors.textSoft} size={18} />
      </View>

      <View style={styles.footer}>
        <View style={styles.left}>
          <View style={styles.metaIconRow}>
            <Users color={colors.textMuted} size={13} />
            <Text style={[styles.meta, { color: colors.textMuted }]}>{room.members}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.textMuted }]}>{room.mode}</Text>
        </View>

        <View style={[styles.ranking, { backgroundColor: `${colors.accent}22` }]}>
          <Trophy color={colors.accent} size={13} />
          <Text style={[styles.rankText, { color: colors.accent }]}>#{room.ranking}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center', marginBottom: 10 },
  name: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  codeBox: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  code: { fontSize: 12, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  left: { flexDirection: "row", alignItems: 'center', gap: 10 },
  metaIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12 },
  ranking: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 4 },
  rankText: { fontSize: 12, fontWeight: 'bold' },
});