import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../features/profiles/screens/ProfileScreen';
import LiveRoomScreen from '../features/rooms/screens/LiveRoomScreen';
import BattleRoyaleScreen from '../features/rooms/screens/BattleRoyaleScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import { useAuthStore } from '../store/authStore';
import { updateMyProfile } from '../features/profiles/services/profileService';
import { registerForPushNotifications } from '../features/profiles/services/notificationService';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  // RF-02: el estado de sesion decide si se muestra el stack publico o privado.
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const accessToken = useAuthStore(state => state.access_token);

  useEffect(() => {
    let cancelled = false;

    const syncPushToken = async () => {
      if (!isAuthenticated || !accessToken) {
        return;
      }

      const expoPushToken = await registerForPushNotifications();

      if (!expoPushToken || cancelled) {
        return;
      }

      await updateMyProfile(accessToken, {
        expo_push_token: expoPushToken,
      });
    };

    syncPushToken().catch(error => {
      console.warn('No se pudo sincronizar el token push', error);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Perfil" component={ProfileScreen} />
            <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
            <Stack.Screen name="BattleRoyale" component={BattleRoyaleScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
