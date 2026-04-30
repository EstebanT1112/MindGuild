import { View, ScrollView, StyleSheet } from "react-native";
import RoomHeader from "../components/RoomHeader";
import TimerCard from "../components/TimerCard";
import RankingCard from "../components/RankingCard";
import SessionConfigModal from "../components/SessionConfigModal";
import React, { useState } from "react";

export default function RoomDetailScreen({ navigation, route }: any) {
    const { room } = route.params;
    const [showConfig, setShowConfig] = useState(false);

    return (
        <View style={styles.container}>
            <RoomHeader navigation={navigation} room={room} />

            <ScrollView contentContainerStyle={styles.content}>
                <TimerCard />
                <RankingCard />
            </ScrollView>
                <SessionConfigModal
                    visible={showConfig}
                    onClose={() => setShowConfig(false)}
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
});