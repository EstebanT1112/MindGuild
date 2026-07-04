import React, { useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { X, LogOut, Lock, Globe } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { useAppDataStore } from '../../../store/appDataStore';
import { useThemeStore } from '../../../store/themeStore';
import { linkGoogleAccount, requestPasswordReset } from '../../auth/services/authService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  authProviders?: string[];
  onAuthProvidersChanged?: (authProviders: string[]) => void;
}

export default function SettingsModal({
  visible,
  onClose,
  email,
  authProviders = [],
  onAuthProvidersChanged,
}: SettingsModalProps) {
  const accessToken = useAuthStore(state => state.access_token);
  const clearAppData = useAppDataStore(state => state.clearAll);
  const logout = useAuthStore(state => state.clearSession);

  const themeMode = useThemeStore(state => state.themeMode);
  const toggleThemeMode = useThemeStore(state => state.toggleThemeMode);
  const colors = useThemeStore(state => state.colors);

  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(true);
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [linkGoogleLoading, setLinkGoogleLoading] = useState(false);

  const canResetPassword = authProviders.includes('auth0');
  const hasGoogleLinked = authProviders.includes('google-oauth2');
  const canLinkGoogle = canResetPassword && !hasGoogleLinked;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', 'Vas a salir de tu cuenta.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          onClose();
          clearAppData();
          logout();
        },
      },
    ]);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Email no disponible', 'No pudimos identificar el email de tu cuenta.');
      return;
    }
    setPasswordResetLoading(true);
    try {
      await requestPasswordReset(email);
      Alert.alert('Revisá tu correo', 'Si tu cuenta usa contraseña, recibirás instrucciones para cambiarla.');
    } catch (error: any) {
      Alert.alert('No se pudo enviar el correo', error.message ?? 'Intentá nuevamente en unos minutos.');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    if (!accessToken) {
      Alert.alert('Sesión no disponible', 'Inicia sesión nuevamente para vincular Google.');
      return;
    }
    setLinkGoogleLoading(true);
    try {
      const result = await linkGoogleAccount(accessToken);
      Alert.alert('Google vinculado', 'Ahora también podes iniciar sesión con Google.');
      onAuthProvidersChanged?.(result.auth_providers);
    } catch (error: any) {
      if (error.code !== 'auth_cancelled') {
        Alert.alert('No se pudo vincular Google', error.message ?? 'Intentá nuevamente en unos minutos.');
      }
    } finally {
      setLinkGoogleLoading(false);
    }
  };

  // Estilos dinámicos basados en el tema
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        content: {
          backgroundColor: colors.surfaceElevated,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          padding: 25,
          height: '85%',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 25,
        },
        headerTitle: {
          color: colors.text,
          fontSize: 24,
          fontWeight: 'bold',
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: 'bold',
          marginTop: 25,
          marginBottom: 15,
          letterSpacing: 1,
        },
        settingCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 24,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        destructiveCard: {
          borderColor: colors.danger + '44', // semitransparente
        },
        settingInfo: {
          flex: 1,
        },
        settingTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        settingSub: {
          color: colors.textMuted,
          fontSize: 13,
        },
        destructiveText: {
          color: colors.danger,
        },
        versionText: {
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: 30,
          fontSize: 12,
          fontWeight: 'bold',
        },
      }),
    [colors]
  );

  // Componentes internos con estilos dinámicos
  const SettingSwitch = ({ title, sub, value, onValueChange }: any) => (
    <View style={styles.settingCard}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Switch
        trackColor={{ false: colors.border, true: colors.accentSoft }}
        thumbColor={value ? colors.accent : colors.textMuted}
        onValueChange={onValueChange}
        value={value}
      />
    </View>
  );

  const AccountOption = ({ title, sub, icon: Icon, isDestructive = false, onPress }: any) => (
    <Pressable
      style={[styles.settingCard, isDestructive && styles.destructiveCard]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, isDestructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.settingSub}>{sub}</Text>
      </View>
      <Icon color={isDestructive ? colors.danger : colors.textMuted} size={20} />
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color={colors.text} size={20} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text style={styles.sectionLabel}>APARIENCIA</Text>
            <SettingSwitch
              title="Modo Claro"
              sub={themeMode === 'light' ? 'Activado' : 'Desactivado'}
              value={themeMode === 'light'}
              onValueChange={toggleThemeMode}
            />

            <Text style={styles.sectionLabel}>PREFERENCIAS</Text>
            <SettingSwitch
              title="Notificaciones"
              sub="Recibe alertas de retos y salas"
              value={notifications}
              onValueChange={setNotifications}
            />
            <SettingSwitch
              title="Perfil Público"
              sub="Otros usuarios pueden ver tu perfil"
              value={publicProfile}
              onValueChange={setPublicProfile}
            />

            <Text style={styles.sectionLabel}>CUENTA</Text>

            {canResetPassword ? (
              <AccountOption
                title={passwordResetLoading ? 'Enviando...' : 'Cambiar Contraseña'}
                sub="Recibirás un correo para actualizar tu acceso"
                icon={Lock}
                onPress={passwordResetLoading ? undefined : handlePasswordReset}
              />
            ) : (
              <View style={styles.settingCard}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Acceso con Google</Text>
                  <Text style={styles.settingSub}>Tu contraseña se gestiona desde Google</Text>
                </View>
                <Lock color={colors.textMuted} size={20} />
              </View>
            )}

            {canLinkGoogle && (
              <AccountOption
                title={linkGoogleLoading ? 'Vinculando...' : 'Vincular Google'}
                sub="Usa el mismo email para iniciar sesión con Google"
                icon={Globe}
                onPress={linkGoogleLoading ? undefined : handleLinkGoogle}
              />
            )}

            <AccountOption title="Idioma" sub="Español" icon={Globe} />

            <AccountOption
              title="Cerrar Sesión"
              sub="Salir de tu cuenta"
              icon={LogOut}
              isDestructive={true}
              onPress={handleLogout}
            />

            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}