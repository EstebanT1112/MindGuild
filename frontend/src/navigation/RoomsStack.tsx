import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoomsScreen from "../features/rooms/screens/RoomsScreen";
import RoomDetailScreen from "../features/rooms/screens/RoomDetailScreen";

const Stack = createNativeStackNavigator();

export default function RoomsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoomsList" component={RoomsScreen} />
        <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
        </Stack.Navigator>
    );
}