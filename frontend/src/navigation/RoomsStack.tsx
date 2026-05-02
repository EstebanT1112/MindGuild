import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoomsScreen from "../features/rooms/screens/RoomsScreen";
import LiveRoomScreen from "../features/rooms/screens/LiveRoomScreen";

const Stack = createNativeStackNavigator();

export default function RoomsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoomsList" component={RoomsScreen} />
            <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
        </Stack.Navigator>
    );
}