import { View, Text, StyleSheet, Pressable } from "react-native";

export default function RoomItem({
    room,
    onPress,
    }: {
    room: any;
    onPress: () => void;
    }) {
    return (
        <Pressable style={styles.card} onPress={onPress}>
        <Text style={styles.name}>{room.name}</Text>

        <Text style={styles.code}>{room.code}</Text>

        <View style={styles.row}>
            <Text style={styles.meta}>{room.members} 👥</Text>
            <Text style={styles.meta}>{room.mode}</Text>

            <View style={styles.rank}>
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
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#2a2f45",
    },
    name: {
        color: "#fff",
        fontWeight: "bold",
        marginBottom: 4,
    },
    code: {
        color: "#22c55e",
        fontSize: 12,
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    meta: {
        color: "#aaa",
        fontSize: 12,
    },
    rank: {
        backgroundColor: "#22c55e22",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
    },
    rankText: {
        color: "#22c55e",
        fontSize: 12,
        fontWeight: "bold",
    },
});