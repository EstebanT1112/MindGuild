import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import ProfileScreen from "../features/profiles/screens/ProfileScreen";
import LiveRoomScreen from '../features/rooms/screens/LiveRoomScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* App */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Perfil" component={ProfileScreen} />
        <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}