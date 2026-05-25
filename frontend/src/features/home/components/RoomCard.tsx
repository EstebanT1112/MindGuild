import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronRight, Trophy, Users } from 'lucide-react-native';

type Room = {
  id: number;
  name: string;
  code: string;
  members: number;
  mode: string;
  ranking: number;
};

export default function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{room.name}</Text>

          <View style={styles.codeBox}>
            <Text style={styles.code}>{room.code}</Text>
          </View>
        </View>

        <ChevronRight color="#64748b" size={18} />
      </View>

      <View style={styles.footer}>
        <View style={styles.left}>
          <View style={styles.metaIconRow}>
            <Users color="#94a3b8" size={13} />
            <Text style={styles.meta}>{room.members}</Text>
          </View>
          <Text style={styles.meta}>{room.mode}</Text>
        </View>

        <View style={styles.ranking}>
          <Trophy color="#22c55e" size={13} />
          <Text style={styles.rankText}>#{room.ranking}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1d29",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2f45",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  codeBox: {
    backgroundColor: "#111",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  code: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
  },
  metaIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: {
    color: "#aaa",
    fontSize: 12,
  },
  ranking: {
    backgroundColor: "#22c55e22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "bold",
  },
});
