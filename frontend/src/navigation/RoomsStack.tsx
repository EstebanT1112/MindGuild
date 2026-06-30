import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoomsScreen from "../features/rooms/screens/RoomsScreen";
import LiveRoomScreen from "../features/rooms/screens/LiveRoomScreen";
import BattleRoyaleScreen from "../features/rooms/screens/BattleRoyaleScreen"; // <--- NUEVA IMPORTACIÓN
import WeeklyQuizScreen from "../features/rooms/screens/WeeklyQuizScreen";
import PracticeQuizScreen from "../features/rooms/screens/PracticeQuizScreen";
import DifficultyHeatmapScreen from "../features/analytics/screens/DifficultyHeatmapScreen";

const Stack = createNativeStackNavigator();

export default function RoomsStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="RoomsList" component={RoomsScreen} />
            <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
            <Stack.Screen name="BattleRoyale" component={BattleRoyaleScreen} /> 
            <Stack.Screen name="WeeklyQuiz" component={WeeklyQuizScreen} />
            <Stack.Screen name="PracticeQuiz" component={PracticeQuizScreen} />
            <Stack.Screen name="DifficultyHeatmap" component={DifficultyHeatmapScreen} />
        </Stack.Navigator>
    );
}
