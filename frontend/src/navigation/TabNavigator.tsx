import React from 'react';
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
          backgroundColor: "#111", // Mantenemos tu estilo oscuro
          borderTopColor: "#222",
          height: 70, // Un poquito más de altura para que respiren los iconos
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#22c55e", // El verde de MindGuild
        tabBarInactiveTintColor: "#888",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Salas" component={RoomsStack} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Amigos" component={FriendsScreen} />
    </Tab.Navigator>
  );
}