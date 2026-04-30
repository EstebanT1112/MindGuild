import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack"; // Necesitás esta librería
import TabNavigator from "./TabNavigator";
import ProfileScreen from "../features/profiles/screens/ProfileScreen";

// Creamos el Stack principal
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Primero cargamos el TabNavigator (Home, Salas, Ranking, Amigos) */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        {/* El Perfil queda registrado afuera para que la barra inferior no lo muestre */}
        <Stack.Screen name="Perfil" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}