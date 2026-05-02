import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Switch, ScrollView } from 'react-native';
import { X, ChevronRight, LogOut, Lock, Globe } from 'lucide-react-native';

export default function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);

  const SettingSwitch = ({ title, sub, value, onValueChange }: any) => (
    <View style={styles.settingCard}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Switch
        trackColor={{ false: '#334155', true: '#14532d' }}
        thumbColor={value ? '#22c55e' : '#94a3b8'}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const AccountOption = ({ title, sub, icon: Icon, isDestructive = false }: any) => (
    <Pressable style={[styles.settingCard, isDestructive && styles.destructiveCard]}>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>{title}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Icon color={isDestructive ? '#ef4444' : '#64748b'} size={20} />
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* PREFERENCIAS */}
            <SettingSwitch 
              title="Notificaciones" 
              sub="Recibe alertas de retos y salas" 
              value={notifications} 
              onValueChange={setNotifications} 
            />
            <SettingSwitch 
              title="Sonidos" 
              sub="Efectos de sonido en la app" 
              value={sounds} 
              onValueChange={setSounds} 
            />
            <SettingSwitch 
              title="Modo Oscuro" 
              sub="Tema oscuro activado" 
              value={darkMode} 
              onValueChange={setDarkMode} 
            />
            <SettingSwitch 
              title="Perfil Público" 
              sub="Otros usuarios pueden ver tu perfil" 
              value={publicProfile} 
              onValueChange={setPublicProfile} 
            />

            {/* CUENTA */}
            <Text style={styles.sectionLabel}>CUENTA</Text>
            
            <AccountOption 
              title="Cambiar Contraseña" 
              sub="Actualiza tu contraseña de acceso" 
              icon={Lock} 
            />
            <AccountOption 
              title="Idioma" 
              sub="Español" 
              icon={Globe} 
            />
            <AccountOption 
              title="Cerrar Sesión" 
              sub="Salir de tu cuenta" 
              icon={LogOut} 
              isDestructive={true} 
            />

            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  content: { 
    backgroundColor: '#1e293b', 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    padding: 25, 
    height: '85%' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25 
  },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  closeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#334155', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sectionLabel: { 
    color: '#64748b', 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginTop: 25, 
    marginBottom: 15, 
    letterSpacing: 1 
  },
  settingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0f172a', 
    padding: 20, 
    borderRadius: 24, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155'
  },
  destructiveCard: { borderColor: '#ef444433' },
  settingInfo: { flex: 1 },
  settingTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  settingSub: { color: '#64748b', fontSize: 13 },
  destructiveText: { color: '#ef4444' },
  versionText: { 
    color: '#4b5563', 
    textAlign: 'center', 
    marginTop: 30, 
    fontSize: 12, 
    fontWeight: 'bold' 
  }
});