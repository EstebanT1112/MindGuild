import { View, Text, StyleSheet, Pressable } from "react-native";

type Room = {
  id: number;
  name: string;
  code: string;
  members: number;
  mode: string;
  ranking: number;
};

export default function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  // Verificamos si es Battle Royale para el color
  const isBR = room.mode === "Battle Royale";

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{room.name}</Text>
          <View style={styles.codeBox}>
            <Text style={[styles.code, isBR && { color: '#a855f7' }]}>{room.code}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.left}>
          <Text style={styles.meta}>{room.members} 👥</Text>
          <Text style={[styles.meta, isBR && { color: '#a855f7', fontWeight: 'bold' }]}>{room.mode}</Text>
        </View>
        <View style={[
            styles.ranking, 
            isBR ? { backgroundColor: '#a855f722' } : { backgroundColor: "#22c55e22" }
        ]}>
          <Text style={[
              styles.rankText, 
              isBR ? { color: '#a855f7' } : { color: "#22c55e" }
          ]}>
            #{room.ranking}
          </Text>
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
  arrow: {
    color: "#666",
    fontSize: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    gap: 10,
  },
  meta: {
    color: "#aaa",
    fontSize: 12,
  },
  ranking: {
    backgroundColor: "#22c55e22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rankText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "bold",
  },
});