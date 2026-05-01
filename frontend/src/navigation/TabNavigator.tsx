import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../features/home/screens/HomeScreen";
import FriendsScreen from "../features/friends/screens/FriendsScreen";
import RankingScreen from "../features/rankings/screens/RankingScreen";
import RoomsStack from "./RoomsStack";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111",
          borderTopColor: "#222",
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#22c55e",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Salas" component={RoomsStack} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Amigos" component={FriendsScreen} />
    </Tab.Navigator>
  );
}