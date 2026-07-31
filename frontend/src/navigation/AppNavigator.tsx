import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import TabNavigator from './TabNavigator';
import ProfileScreen from '../features/profiles/screens/ProfileScreen';
import LiveRoomScreen from '../features/rooms/screens/LiveRoomScreen';
import BattleRoyaleScreen from '../features/rooms/screens/BattleRoyaleScreen';
import WeeklyQuizScreen from '../features/rooms/screens/WeeklyQuizScreen';
import DifficultyHeatmapScreen from '../features/analytics/screens/DifficultyHeatmapScreen';
import SmartDashboardScreen from '../features/analytics/screens/SmartDashboardScreen';
import RoomVaultScreen from '../features/rooms/screens/RoomVaultScreen';
import WalletScreen from '../features/wallet/screens/WalletScreen';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import RegisterScreen from '../features/auth/screens/RegisterScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import { useAuthStore } from '../store/authStore';
import { useAppDataStore } from '../store/appDataStore';
import { useThemeStore } from '../store/themeStore';
import { fetchMyProfile, updateMyProfile } from '../features/profiles/services/profileService';
import { registerForPushNotifications } from '../features/profiles/services/notificationService';
import { SessionExpiredError } from '../services/authenticatedFetch';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const accessToken = useAuthStore(state => state.access_token);
  const clearSession = useAuthStore(state => state.clearSession);
  const setUser = useAuthStore(state => state.setUser);
  const setProfile = useAppDataStore(state => state.setProfile);
  const clearAppData = useAppDataStore(state => state.clearAll);
  const colors = useThemeStore(state => state.colors);
  const [validatingSession, setValidatingSession] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem('mindguild_onboarding_complete');
      setShowOnboarding(value !== 'true');
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAppData();
    }
  }, [isAuthenticated, clearAppData]);

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
    return () => { cancelled = true; };
  }, [isAuthenticated, accessToken, clearSession, clearAppData, setProfile, setUser]);

  useEffect(() => {
    let cancelled = false;
    const syncPushToken = async () => {
      if (!isAuthenticated || !accessToken || validatingSession) return;
      const expoPushToken = await registerForPushNotifications();
      if (!expoPushToken || cancelled) return;
      await updateMyProfile(accessToken, { expo_push_token: expoPushToken });
    };
    syncPushToken().catch(error => { console.warn('No se pudo sincronizar el token push', error); });
    return () => { cancelled = true; };
  }, [isAuthenticated, accessToken, validatingSession]);

  if (isAuthenticated && validatingSession) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isAuthenticated && showOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          showOnboarding ? (
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
              {() => (
                <OnboardingScreen
                  onComplete={() => {
                    setShowOnboarding(false);
                    AsyncStorage.setItem('mindguild_onboarding_complete', 'true');
                  }}
                />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen name="Perfil" component={ProfileScreen} />
              <Stack.Screen name="LiveRoom" component={LiveRoomScreen} />
              <Stack.Screen name="BattleRoyale" component={BattleRoyaleScreen} />
              <Stack.Screen name="WeeklyQuiz" component={WeeklyQuizScreen} />
              <Stack.Screen name="SmartDashboard" component={SmartDashboardScreen} />
              <Stack.Screen name="DifficultyHeatmap" component={DifficultyHeatmapScreen} />
              <Stack.Screen name="RoomVault" component={RoomVaultScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            </>
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function isInvalidSessionError(error: any) {
  if (error instanceof SessionExpiredError) return true;
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