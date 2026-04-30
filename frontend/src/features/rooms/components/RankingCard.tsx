import { View, Text, StyleSheet } from "react-native";

export default function RankingCard() {
    const ranking = [
        { id: 1, name: "Ana", score: 850 },
        { id: 2, name: "Tú", score: 720 },
    ];

    return (
        <View style={styles.card}>
        <Text style={styles.title}>Ranking</Text>

        {ranking.map((user, i) => (
            <View key={user.id} style={styles.row}>
            <Text style={styles.rank}>{i + 1}</Text>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.score}>{user.score}</Text>
            </View>
        ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1a1d29",
        borderRadius: 20,
        padding: 16,
    },
    title: {
        color: "#fff",
        fontWeight: "bold",
        marginBottom: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    rank: {
        color: "#aaa",
    },
    name: {
        color: "#fff",
    },
    score: {
        color: "#22c55e",
    },
});