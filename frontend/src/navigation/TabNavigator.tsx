import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import HomeScreen from "../features/home/screens/HomeScreen";
// 1. Importamos tu pantalla real
import FriendsScreen from "../features/friends/screens/FriendsScreen";

const Tab = createBottomTabNavigator();

function Placeholder({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{title}</Text>
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
      
      {/* 2. Conectamos Amigos a tu pantalla real[cite: 1] */}
      <Tab.Screen name="Amigos" component={FriendsScreen} />
    </Tab.Navigator>
  );
}