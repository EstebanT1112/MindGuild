import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
} from "react-native";
import React, { useState } from "react";
import RoomItem from "../components/RoomItem";
import RoomsHeader from "../components/RoomsHeader";
import CreateRoomButton from "../components/CreateRoomButton";
import CreateRoomModal from "../components/CreateRoomModal";

export default function RoomsScreen({ navigation }: any) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const rooms = [
        {
        id: 1,
        name: "Cálculo I - Final",
        code: "CALC-7X9P",
        mode: "Supervivencia",
        members: 5,
        ranking: 2,
        },
        {
        id: 2,
        name: "Física II",
        code: "FIS2-A4B1",
        mode: "Equipos",
        members: 8,
        ranking: 3,
        },
    ];

    return (
        <View style={styles.container}>
        <RoomsHeader navigation={navigation} />

        <ScrollView contentContainerStyle={styles.content}>
            <CreateRoomButton onPress={() => setShowCreateModal(true)} />

            <Text style={styles.title}>MIS SALAS</Text>

            {rooms.map((room) => (
                <RoomItem
                key={room.id}
                room={room}
                onPress={() =>
                    navigation.navigate("Salas", {
                    screen: "RoomDetail",
                    params: { room },
                    })
                }
                />
                ))}
        </ScrollView>

        {/* FAB */}
        <Pressable style={styles.fab}>
            <Text style={styles.fabText}>+</Text>
        </Pressable>

        {/* Modal */}
        <CreateRoomModal
            visible={showCreateModal}
            onClose={() => setShowCreateModal(false)}
        />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f111a",
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 16,
    },
    fab: {
        position: "absolute",
        bottom: 90,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#22c55e",
        alignItems: "center",
        justifyContent: "center",
    },
    fabText: {
        color: "#fff",
        fontSize: 22,
    },
});