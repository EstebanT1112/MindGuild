import { Pressable, Text, StyleSheet } from "react-native";

export default function CreateRoomButton({
    onPress,
    }: {
    onPress: () => void;
    }) {
    return (
        <Pressable style={styles.button} onPress={onPress}>
        <Text style={styles.text}>+ Crear Nueva Sala</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#22c55e",
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
        marginBottom: 16,
    },

    text: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
    },
});