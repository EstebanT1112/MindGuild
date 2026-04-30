import { View, Text, StyleSheet, Pressable } from "react-native";

export default function RoomHeader({ navigation, room }: any) {
    return (
        <View style={styles.container}>
        <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
        </Pressable>

        <View style={styles.center}>
            <Text style={styles.title}>{room.name}</Text>
            <Text style={styles.subtitle}>{room.mode}</Text>
        </View>

        <View style={styles.members}>
            <Text style={styles.membersText}>{room.members} 👥</Text>
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        paddingTop: 50,
        justifyContent: "space-between",
    },
    back: {
        color: "#aaa",
        fontSize: 20,
    },
    center: {
        flex: 1,
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontWeight: "bold",
    },
    subtitle: {
        color: "#666",
        fontSize: 12,
    },
    members: {
        backgroundColor: "#1a1d29",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    membersText: {
        color: "#fff",
        fontSize: 12,
    },
});