import React from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Home, Trophy, Users, UsersRound } from 'lucide-react-native';
import AppAlert, { type AlertType } from '../components/ui/AppAlert';
import HomeScreen from "../features/home/screens/HomeScreen";
import FriendsScreen from "../features/friends/screens/FriendsScreen";
import RankingScreen from "../features/rankings/screens/RankingScreen";
import RoomsStack from "./RoomsStack";
import { useAppDataStore } from '../store/appDataStore';
import { useThemeStore } from '../store/themeStore';

const Tab = createMaterialTopTabNavigator();

export default function TabNavigator() {
  const activeStudySession = useAppDataStore(state => state.activeStudySession);
  const colors = useThemeStore(state => state.colors);

  // ✅ Estado para AppAlert (aunque no se usa directamente, lo dejamos para consistencia)
  const [alert, setAlert] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  return (
    <>
      <Tab.Navigator
        tabBarPosition="bottom"
        initialRouteName="Home"
        screenListeners={{
          tabPress: (event: any) => {
            if (!activeStudySession) return;
            event.preventDefault();
            showAlert('Sesión activa', 'Finaliza la sesión antes de moverte por la app.', 'warning');
          },
        }}
        screenOptions={{
          swipeEnabled: !activeStudySession,
          tabBarIndicatorStyle: { opacity: 0 },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 65,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: 4,
            paddingTop: 4,
          },
          tabBarShowIcon: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                <Home color={color} size={26} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Salas"
          component={RoomsStack}
          options={{
            tabBarLabel: 'Salas',
            tabBarIcon: ({ color }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                <Users color={color} size={26} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Ranking"
          component={RankingScreen}
          options={{
            tabBarLabel: 'Ranking',
            tabBarIcon: ({ color }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                <Trophy color={color} size={26} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Amigos"
          component={FriendsScreen}
          options={{
            tabBarLabel: 'Amigos',
            tabBarIcon: ({ color }) => (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                <UsersRound color={color} size={26} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>

      {/* ✅ AppAlert personalizado */}
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
        onConfirm={() => setAlert(prev => ({ ...prev, visible: false }))}
        confirmText="Entendido"
      />
    </>
  );
}