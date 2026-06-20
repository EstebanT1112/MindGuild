import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../features/profiles/screens/ProfileScreen';
import LiveRoomScreen from '../features/rooms/screens/LiveRoomScreen';
import BattleRoyaleScreen from '../features/rooms/screens/BattleRoyaleScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import { useAuthStore } from '../store/authStore';
import { useAppDataStore } from '../store/appDataStore';
import { fetchMyProfile, updateMyProfile } from '../features/profiles/services/profileService';
import { registerForPushNotifications } from '../features/profiles/services/notificationService';
import { clearRefreshToken, refreshAccessToken } from '../features/auth/services/tokenStorage';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  // RF-02: el estado de sesion decide si se muestra el stack publico o privado.
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const accessToken = useAuthStore(state => state.access_token);
  const setSession = useAuthStore(state => state.setSession);
  const clearSession = useAuthStore(state => state.clearSession);
  const setUser = useAuthStore(state => state.setUser);
  const updateAccessToken = useAuthStore(state => state.updateAccessToken);
  const setProfile = useAppDataStore(state => state.setProfile);
  const clearAppData = useAppDataStore(state => state.clearAll);
  const [restoringSession, setRestoringSession] = useState(true);
  const [validatingSession, setValidatingSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (isAuthenticated) {
        setRestoringSession(false);
        return;
      }

      try {
        const renewedAccessToken = await refreshAccessToken();

        if (!renewedAccessToken || cancelled) {
          return;
        }

        const profile = await fetchMyProfile(renewedAccessToken);

        if (cancelled) return;

        setProfile(profile);
        setSession(profile.id, profile.email, renewedAccessToken, {
          id: profile.id,
          email: profile.email,
          username: profile.username,
        });
      } catch (error) {
        await clearRefreshToken();
        if (!cancelled) {
          clearAppData();
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setRestoringSession(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setSession, setProfile, clearAppData, clearSession]);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (!isAuthenticated || !accessToken) {
        setValidatingSession(false);
        return;
      }

      setValidatingSession(true);

      try {
        const profile = await fetchMyProfile(accessToken);

        if (cancelled) return;

        setProfile(profile);
        setUser({ id: profile.id, email: profile.email, username: profile.username });
      } catch (error: any) {
        if (cancelled) return;

        if (isInvalidSessionError(error)) {
          const renewedAccessToken = await refreshAccessToken();

          if (renewedAccessToken) {
            try {
              const profile = await fetchMyProfile(renewedAccessToken);

              if (cancelled) return;

              updateAccessToken(renewedAccessToken);
              setProfile(profile);
              setUser({ id: profile.id, email: profile.email, username: profile.username });
              return;
            } catch (retryError) {
              console.warn('No se pudo validar la sesion renovada', retryError);
            }
          }

          await clearRefreshToken();
          clearAppData();
          clearSession();
          return;
        }

        console.warn('No se pudo validar la sesion actual', error);
      } finally {
        if (!cancelled) {
          setValidatingSession(false);
        }
      }
    };

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, clearSession, clearAppData, setProfile, setUser, updateAccessToken]);

  useEffect(() => {
    let cancelled = false;

    const syncPushToken = async () => {
      if (!isAuthenticated || !accessToken || validatingSession) {
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
  }, [isAuthenticated, accessToken, validatingSession]);

  if (restoringSession || (isAuthenticated && validatingSession)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator color="#22c55e" />
      </View>
    );
  }

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

function isInvalidSessionError(error: any) {
  const message = String(error?.message ?? error ?? '').toLowerCase();

  return (
    message.includes('token invalido') ||
    message.includes('token inválido') ||
    message.includes('sesion invalida') ||
    message.includes('sesión inválida') ||
    message.includes('session invalid') ||
    message.includes('unauthorized')
  );
}
