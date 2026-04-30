import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    TextInput,
} from "react-native";
import { useState } from "react";

export default function CreateRoomModal({
    visible,
    onClose,
    }: {
    visible: boolean;
    onClose: () => void;
    }) {
    const [name, setName] = useState("");

    const handleCreate = () => {
        console.log("Crear sala:", name);
        onClose();
    };

    const [mode, setMode] = useState("Supervivencia");
    const modes = ["Supervivencia", "Battle Royale"];

    const [hasTeams, setHasTeams] = useState(false);

    return (
        <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Crear Sala</Text>

                <Pressable onPress={onClose}>
                <Text style={styles.close}>✕</Text>
                </Pressable>
            </View>

            {/* Input */}
            <Text style={styles.label}>Nombre de la sala</Text>

            <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej: Cálculo I"
                placeholderTextColor="#666"
                style={styles.input}
            />

            <Text style={styles.label}>Modo de sala</Text>

            <View style={styles.modeContainer}>
            {modes.map((m) => {
                const selected = mode === m;

                return (
                <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                    styles.modeButton,
                    selected && styles.modeSelected,
                    ]}
                >
                    <Text
                    style={[
                        styles.modeText,
                        selected && styles.modeTextSelected,
                    ]}
                    >
                    {m}
                    </Text>
                </Pressable>
                );
            })}
            </View>
                <Pressable
                style={styles.checkboxRow}
                onPress={() => setHasTeams(!hasTeams)}
                >
                <View style={[styles.checkbox, hasTeams && styles.checkboxActive]}>
                    {hasTeams && <Text style={styles.checkMark}>✓</Text>}
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.checkboxLabel}>
                    Habilitar equipos (Teams)
                    </Text>
                    <Text style={styles.checkboxHint}>
                    Los miembros podrán unirse a diferentes equipos
                    </Text>
                </View>
                </Pressable>

            {/* Button */}
            <Pressable style={styles.button} onPress={handleCreate}>
                <Text style={styles.buttonText}>Crear Sala</Text>
            </Pressable>
            </View>
        </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },

    container: {
        width: "85%",
        backgroundColor: "#1a1d29",
        borderRadius: 20,
        padding: 20,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },

    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },

    close: {
        color: "#aaa",
        fontSize: 18,
    },

    label: {
        color: "#aaa",
        fontSize: 12,
        marginBottom: 6,
    },

    input: {
        backgroundColor: "#111",
        borderRadius: 10,
        padding: 10,
        color: "#fff",
        marginBottom: 16,
    },

    button: {
        backgroundColor: "#22c55e",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "bold",
    },

    modeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    },

    modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    },

    modeSelected: {
    backgroundColor: "#22c55e",
    },

    modeText: {
    color: "#aaa",
    fontSize: 12,
    },

    modeTextSelected: {
    color: "#fff",
    fontWeight: "bold",
    },

    checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 16,
    },

    checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#555",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    },

    checkboxActive: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
    },

    checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    },

    checkboxLabel: {
    color: "#ddd",
    fontSize: 13,
    },

    checkboxHint: {
    color: "#666",
    fontSize: 11,
    marginTop: 2,
    },
});