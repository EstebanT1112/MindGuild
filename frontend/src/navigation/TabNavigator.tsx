import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Users, Trophy, Users2 } from 'lucide-react-native';

// Screens
import HomeScreen from "../features/home/screens/HomeScreen";
import FriendsScreen from "../features/friends/screens/FriendsScreen";
import RankingScreen from "../features/rankings/screens/RankingScreen";
import RoomsScreen from "../features/rooms/screens/RoomsScreen";

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
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      
      <Tab.Screen 
        name="Salas" 
        component={RoomsScreen} 
        options={{
          tabBarLabel: 'Salas',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      
      <Tab.Screen 
        name="Ranking" 
        component={RankingScreen} 
        options={{
          tabBarLabel: 'Ranking',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      
      <Tab.Screen 
        name="Amigos" 
        component={FriendsScreen} 
        options={{
          tabBarLabel: 'Amigos',
          tabBarIcon: ({ color, size }) => <Users2 color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}