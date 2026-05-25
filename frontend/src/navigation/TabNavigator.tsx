import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Trophy, Users, UsersRound } from 'lucide-react-native';
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Salas"
        component={RoomsStack}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Amigos"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
