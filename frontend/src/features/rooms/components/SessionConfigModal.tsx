import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
} from "react-native";

import React, { useState } from "react";

type SessionType = "pomodoro" | "libre";

export default function SessionConfigModal({
    visible,
    onClose,
    }: {
    visible: boolean;
    onClose: () => void;
    }) {
    const [sessionType, setSessionType] = useState<SessionType>("pomodoro");
    const [minutes, setMinutes] = useState(25);
    const [cycles, setCycles] = useState(4);

    return (
        <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Configurar sesión</Text>

                <Pressable onPress={onClose}>
                <Text style={styles.close}>✕</Text>
                </Pressable>
            </View>

            {/* Tipo de sesión */}
            <View style={styles.row}>
                <Pressable
                style={[
                    styles.typeButton,
                    sessionType === "pomodoro" && styles.active,
                ]}
                onPress={() => setSessionType("pomodoro")}
                >
                <Text style={styles.typeText}>Pomodoro</Text>
                </Pressable>

                <Pressable
                style={[
                    styles.typeButton,
                    sessionType === "libre" && styles.activeBlue,
                ]}
                onPress={() => setSessionType("libre")}
                >
                <Text style={styles.typeText}>Libre</Text>
                </Pressable>
            </View>

            {/* Config pomodoro */}
            {sessionType === "pomodoro" && (
                <>
                <View style={styles.configRow}>
                    <Text style={styles.label}>Minutos</Text>

                    <View style={styles.counter}>
                    <Pressable onPress={() => setMinutes(Math.max(5, minutes - 5))}>
                        <Text style={styles.btn}>-</Text>
                    </Pressable>

                    <Text style={styles.value}>{minutes}</Text>

                    <Pressable onPress={() => setMinutes(Math.min(120, minutes + 5))}>
                        <Text style={styles.btn}>+</Text>
                    </Pressable>
                    </View>
                </View>

                <View style={styles.configRow}>
                    <Text style={styles.label}>Ciclos</Text>

                    <View style={styles.counter}>
                    <Pressable onPress={() => setCycles(Math.max(1, cycles - 1))}>
                        <Text style={styles.btn}>-</Text>
                    </Pressable>

                    <Text style={styles.value}>{cycles}</Text>

                    <Pressable onPress={() => setCycles(Math.min(10, cycles + 1))}>
                        <Text style={styles.btn}>+</Text>
                    </Pressable>
                    </View>
                </View>
                </>
            )}

            {/* Guardar */}
            <Pressable style={styles.save} onPress={onClose}>
                <Text style={styles.saveText}>Guardar</Text>
            </Pressable>
            </View>
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.8)",
        justifyContent: "flex-end",
    },

    container: {
        backgroundColor: "#1a1d29",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    title: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },

    close: {
        color: "#aaa",
        fontSize: 18,
    },

    row: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },

    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#111",
        alignItems: "center",
    },

    active: {
        backgroundColor: "#22c55e",
    },

    activeBlue: {
        backgroundColor: "#3b82f6",
    },

    typeText: {
        color: "#fff",
        fontWeight: "bold",
    },

    configRow: {
        marginBottom: 16,
    },

    label: {
        color: "#aaa",
        marginBottom: 6,
    },

    counter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#111",
        padding: 10,
        borderRadius: 10,
    },

    btn: {
        color: "#fff",
        fontSize: 18,
        paddingHorizontal: 10,
    },

    value: {
        color: "#4ade80",
        fontSize: 20,
        fontWeight: "bold",
    },

    save: {
        marginTop: 20,
        backgroundColor: "#22c55e",
        padding: 14,
        borderRadius: 16,
        alignItems: "center",
    },

    saveText: {
        color: "#fff",
        fontWeight: "bold",
    },
});