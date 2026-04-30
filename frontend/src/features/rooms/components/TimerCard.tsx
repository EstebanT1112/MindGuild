import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";

const [showConfig, setShowConfig] = useState(false);

export default function TimerCard() {
    return (
        <View style={styles.card}>
        <View style={styles.timer}>
            <Text style={styles.time}>25:00</Text>
            <Text style={styles.subtitle}>4 ciclos</Text>
        </View>

        <Pressable onPress={() => setShowConfig(true)}>
        <Text>Configurar</Text>
        </Pressable>

        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>COMENZAR SESIÓN</Text>
        </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1a1d29",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    timer: {
        alignItems: "center",
        marginBottom: 20,
    },
    time: {
        fontSize: 40,
        color: "#4ade80",
        fontWeight: "bold",
    },
    subtitle: {
        color: "#666",
    },
    button: {
        backgroundColor: "#22c55e",
        padding: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});