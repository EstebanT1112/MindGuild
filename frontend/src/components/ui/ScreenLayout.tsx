import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Brain, Users, Crown, Users2, UserCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDataStore } from '../../store/appDataStore';
import { useThemeStore } from '../../store/themeStore'; // Importamos el store de tema

interface Props {
  children: React.ReactNode;
  title: string;
  type?: 'home' | 'rooms' | 'rankings' | 'friends' | 'profiles' | 'auth';
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  hideBackButton?: boolean;
  hideRightAction?: boolean;
}

export default function ScreenLayout({ children, title, type = 'rooms', icon, rightAction, hideBackButton, hideRightAction }: Props) {
  const navigation = useNavigation<any>();
  const coinsBalance = useAppDataStore(state => state.profile.data?.coins_balance ?? 0);
  const colors = useThemeStore(state => state.colors); // Usamos los colores dinámicos
  const themeMode = useThemeStore(state => state.themeMode);

  const renderLeftButton = () => {
    if (hideBackButton) return <View style={styles.headerSpacer} />;
    if (type === 'home') {
      return (
        <Pressable style={[styles.profileBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={() => navigation.navigate('Perfil')}>
          <Text style={[styles.profileBtnText, { color: colors.textMuted }]}>P</Text>
        </Pressable>
      );
    }
    return (
      <Pressable style={[styles.backBtn, { backgroundColor: colors.surfaceElevated }]} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs', { screen: 'Home' })}>
        <ArrowLeft color={colors.textSoft} size={20} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          {renderLeftButton()}
          <View style={[styles.titleGroup, type === 'home' && styles.homeTitleGroup]}>
            {icon ? icon : (
              <View>{/* Ajuste de iconos según el tipo de pantalla */}</View>
            )}
            <Text style={[styles.headerText, { color: colors.text }]}>{title}</Text>
          </View>
          {hideRightAction ? <View style={styles.headerSpacer} /> : rightAction ?? (
            <Pressable style={[styles.coinBadge, { backgroundColor: colors.warning }]} onPress={() => navigation.navigate('Wallet')}>
              <View style={[styles.hCoin, { backgroundColor: colors.warning }]}><Brain color="#0f172a" size={20} strokeWidth={2.2} /></View>
              <Text style={styles.coinAmount}>{coinsBalance}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  profileBtnText: { fontWeight: "bold" },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40, height: 40 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeTitleGroup: { position: 'absolute', left: 0, right: 0, justifyContent: 'center' },
  headerText: { fontSize: 20, fontWeight: '900' },
  coinBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, padding: 5, paddingRight: 15 },
  hCoin: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  coinAmount: { color: '#0f172a', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  content: { flex: 1 },
});