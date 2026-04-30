import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import HomeScreen from "../features/home/screens/HomeScreen";
import FriendsScreen from "../features/friends/screens/FriendsScreen";

const Tab = createBottomTabNavigator();

function Placeholder({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "white" }}>{title}</Text>
    </View>
  );
}

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
      <Tab.Screen name="Salas">
        {() => <Placeholder title="Salas" />}
      </Tab.Screen>
      <Tab.Screen name="Ranking">
        {() => <Placeholder title="Ranking" />}
      </Tab.Screen>
      <Tab.Screen name="Amigos" component={FriendsScreen} />
    </Tab.Navigator>
  );
}