import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoomsScreen from "../features/rooms/screens/RoomsScreen";
import LiveRoomScreen from "../features/rooms/screens/LiveRoomScreen";
import BattleRoyaleScreen from "../features/rooms/screens/BattleRoyaleScreen"; // <--- NUEVA IMPORTACIÓN

const Stack = createNativeStackNavigator();

export default function RoomsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoomsList" component={RoomsScreen} />
            <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
            <Stack.Screen name="BattleRoyale" component={BattleRoyaleScreen} /> 
        </Stack.Navigator>
    );
}