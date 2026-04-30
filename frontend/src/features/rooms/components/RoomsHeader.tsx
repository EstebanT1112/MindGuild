import { View, Text, StyleSheet, Pressable } from "react-native";

export default function RoomsHeader({ navigation }: any) {
    return (
        <View style={styles.container}>
        {/* Back */}
        <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
        >
            <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Title */}
        <View style={styles.center}>
            <Text style={styles.title}>MIS SALAS</Text>
        </View>

        {/* Points */}
        <View style={styles.points}>
            <Text style={styles.pointsText}>1,250 H</Text>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 12,
    },

    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#1a1d29",
        alignItems: "center",
        justifyContent: "center",
    },

    backText: {
        color: "#aaa",
        fontSize: 18,
    },

    center: {
        flex: 1,
        alignItems: "center",
    },

    title: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    points: {
        backgroundColor: "#1a1d29",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },

    pointsText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },
});