import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ChevronRight, Star, Trophy, Users } from 'lucide-react-native';

export type RoomCardData = {
  id: string;
  name: string;
  code: string;
  members: number;
  mode: string;
  rawMode?: string;
  ranking: number;
  teamsEnabled?: boolean;
  isFavorite?: boolean;
};

export default function RoomCard({
  room,
  onPress,
  onToggleFavorite,
}: {
  room: RoomCardData;
  onPress: () => void;
  onToggleFavorite?: () => void;
}) {
  const isBR = room.mode === 'Battle Royale';
  const accent = isBR ? '#a855f7' : '#22c55e';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{room.name}</Text>
          <View style={styles.codeBox}>
            <Text style={[styles.code, { color: accent }]}>{room.code}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {onToggleFavorite && (
            <Pressable
              style={styles.favoriteButton}
              onPress={event => {
                event.stopPropagation();
                onToggleFavorite();
              }}
              hitSlop={8}
            >
              <Star
                color={room.isFavorite ? '#facc15' : '#64748b'}
                fill={room.isFavorite ? '#facc15' : 'transparent'}
                size={19}
              />
            </Pressable>
          )}
          <ChevronRight color="#64748b" size={18} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.left}>
          <View style={styles.metaIconRow}>
            <Users color="#94a3b8" size={13} />
            <Text style={styles.meta}>{room.members} miembros</Text>
          </View>
          <Text style={[styles.meta, isBR && { color: accent, fontWeight: 'bold' }]}>{room.mode}</Text>
          {room.teamsEnabled && <Text style={styles.teamsMeta}>Teams</Text>}
        </View>

        <View style={[styles.ranking, { backgroundColor: isBR ? '#a855f722' : '#22c55e22' }]}>
          <Trophy color={accent} size={13} />
          <Text style={[styles.rankText, { color: accent }]}>#{room.ranking}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1d29',
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2f45',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  codeBox: {
    backgroundColor: '#111',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  code: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: {
    color: '#aaa',
    fontSize: 12,
  },
  teamsMeta: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ranking: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
