import { View, Text, StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { useThemeStore } from '../../../store/themeStore';

export default function TimerCard() {
    const [showConfig, setShowConfig] = useState(false);
    const colors = useThemeStore(state => state.colors);

    return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.timer}>
                <Text style={[styles.time, { color: colors.accent }]}>25:00</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>4 ciclos</Text>
            </View>

            <Pressable onPress={() => setShowConfig(true)}>
                <Text style={[styles.configText, { color: colors.textMuted }]}>Configurar</Text>
            </Pressable>

            <Pressable style={[styles.button, { backgroundColor: colors.accent }]}>
                <Text style={styles.buttonText}>COMENZAR SESIÓN</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
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
        fontWeight: "bold",
    },
    subtitle: {},
    configText: {
        textAlign: "center",
        marginBottom: 12,
    },
    button: {
        padding: 14,
        borderRadius: 16,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },
});
