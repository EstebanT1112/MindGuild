import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoomDetailScreen from "../screens/RoomDetailScreen";
import RoomsScreen from "../screens/RoomsScreen";

const Stack = createNativeStackNavigator();

export default function RoomsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Cambiamos RoomsList por RoomsScreen para que coincida con el componente */}
            <Stack.Screen name="RoomsScreen" component={RoomsScreen} /> 
            <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
        </Stack.Navigator>
    );
}