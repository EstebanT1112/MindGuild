import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Brain, Users, Crown, Users2, UserCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  children: React.ReactNode;
  title: string;
  type?: 'home' | 'rooms' | 'rankings' | 'friends' | 'profiles' | 'auth' ;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export default function ScreenLayout({ children, title, type = 'rooms', icon, rightAction }: Props) {
  const navigation = useNavigation<any>();

  // Configuración del botón izquierdo (Avatar o Volver)
  const renderLeftButton = () => {
    if (type === 'home') {
      return (
        <Pressable 
          style={styles.profileBtn} 
          onPress={() => navigation.navigate('Perfil')}
        >
          <Text style={styles.profileBtnText}>P</Text>
        </Pressable>
      );
    }

    if (type === 'profiles') {
      return (
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          }}
        >
          <ArrowLeft color="#94a3b8" size={20} />
        </Pressable>
      );
    }
    return (
      <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft color="#94a3b8" size={20} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.container}>
        
        {/* HEADER UNIFICADO (MindGuild Style) */}
        <View style={styles.headerContainer}>
          {renderLeftButton()}

          <View style={[styles.titleGroup, type === 'home' && styles.homeTitleGroup]}>
            {icon ? icon : (
              type === 'rooms' ? <Users color="#22c55e" size={22} /> :
              type === 'rankings' ? <Crown color="#facc15" size={22} /> :
              type === 'friends' ? <Users2 color="#22c55e" size={22} /> :
              type === 'profiles' ? <UserCircle color="#22c55e" size={22} /> :
              type === 'auth' ? <Users color="#22c55e" size={22} /> : null
            )}
            <Text style={[styles.headerText, type === 'home' && styles.headerText]}>{title}</Text>
          </View>

          {rightAction ?? (
            <View style={styles.coinBadge}>
              <View style={styles.hCoin}><Brain color="#0f172a" size={20} strokeWidth={2.2} /></View>
              <Text style={styles.coinAmount}>1,250</Text>
            </View>
          )}
        </View>

        {/* CONTENIDO (Con el padding que te gusta) */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, paddingHorizontal: 20 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#1e293b", alignItems: "center",
    justifyContent: "center", borderWidth: 1, borderColor: "#334155",
  },
  profileBtnText: { color: "#94a3b8", fontWeight: "bold" },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center'
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeTitleGroup: { position: 'absolute', left: 0, right: 0, justifyContent: 'center' },
  headerText: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: '900'
  },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#facc15', borderRadius: 25,
    padding: 5, paddingRight: 15
  },
  hCoin: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center'
  },
  hText: { fontWeight: '900', fontSize: 14, color: '#0f172a' },
  coinAmount: { color: '#0f172a', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
  content: { flex: 1 },
});
