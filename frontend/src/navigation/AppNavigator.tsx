import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import ProfileScreen from "../features/profiles/screens/ProfileScreen";
import RoomsScreen from '../features/rooms/screens/RoomsScreen';
// Importamos la nueva pantalla del lobby de la sala
import LiveRoomScreen from '../features/rooms/screens/LiveRoomScreen'; 

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Navegación principal con Tabs (Home, Salas, Ranking, Amigos) */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* Pantallas fuera de los Tabs para que no muestren la barra inferior */}
        <Stack.Screen name="Perfil" component={ProfileScreen} />
        
        {/* Registro de Salas para navegación directa si fuera necesario */}
        <Stack.Screen name="Salas" component={RoomsScreen} />
        
        {/* PANTALLA CLAVE: Registramos LiveRoom para que funcione el navigate desde las cards */}
        <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}