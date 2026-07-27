import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react-native';
import { login, loginWithGoogle } from '../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import AppAlert from '../../../components/ui/AppAlert';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(state => state.setSession);
    const colors = useThemeStore(state => state.colors);
    const themeMode = useThemeStore(state => state.themeMode);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState<'error' | 'warning' | 'info'>('error');

    const showAlert = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            showAlert('Campos incompletos', 'Completá todos los campos para continuar.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email.trim(), password);
            setSession(result.auth_user_id, result.email, result.access_token, result.profile);
        } catch (error: any) {
            showAlert('Error al iniciar sesión', error.message ?? 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle();
            setSession(result.auth_user_id, result.email, result.access_token, result.profile);
        } catch (error: any) {
            if (error.code !== 'auth_cancelled') {
                showAlert('Error con Google', error.message ?? 'Ocurrió un error inesperado.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // Estilos dinámicos basados en el tema
    const styles = useMemo(
        () =>
            StyleSheet.create({
                safeArea: {
                    flex: 1,
                    backgroundColor: colors.background,
                },
                scroll: {
                    flexGrow: 1,
                    paddingHorizontal: 24,
                    paddingTop: 60,
                    paddingBottom: 40,
                },
                logoContainer: {
                    alignItems: 'center',
                    marginBottom: 40,
                },
                logoCircle: {
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    shadowColor: colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                },
                appName: {
                    color: colors.text,
                    fontSize: 32,
                    fontWeight: '900',
                    letterSpacing: 5,
                },
                appSubtitle: {
                    color: colors.textMuted,
                    fontSize: 14,
                    fontWeight: '500',
                    marginTop: 6,
                    letterSpacing: 1,
                },
                card: {
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: 28,
                    padding: 24,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                cardTitle: {
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: 'bold',
                    marginBottom: 24,
                },
                label: {
                    color: colors.textMuted,
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginBottom: 8,
                },
                inputWrapper: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                    height: 56,
                    marginBottom: 16,
                    gap: 12,
                },
                input: {
                    flex: 1,
                    color: colors.text,
                    fontSize: 15,
                },
                forgotRow: {
                    alignItems: 'flex-end',
                    marginBottom: 24,
                },
                forgotText: {
                    color: colors.accent,
                    fontSize: 14,
                    fontWeight: '600',
                },
                btnPrimary: {
                    backgroundColor: colors.accent,
                    height: 56,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                btnPrimaryText: {
                    color: colors.text,
                    fontWeight: '900',
                    fontSize: 16,
                },
                divider: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 24,
                    gap: 12,
                },
                dividerLine: {
                    flex: 1,
                    height: 1,
                    backgroundColor: colors.border,
                },
                dividerText: {
                    color: colors.textMuted,
                    fontSize: 14,
                },
                btnGoogle: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    height: 56,
                    borderRadius: 18,
                    gap: 12,
                },
                googleIcon: {
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: '900',
                },
                btnGoogleText: {
                    color: colors.text,
                    fontSize: 15,
                    fontWeight: 'bold',
                },
                footer: {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    marginTop: 32,
                },
                footerText: {
                    color: colors.textMuted,
                    fontSize: 15,
                },
                footerLink: {
                    color: colors.accent,
                    fontSize: 15,
                    fontWeight: 'bold',
                },
            }),
        [colors]
    );

    // Color para el StatusBar según el tema
    const statusBarStyle = themeMode === 'dark' ? 'light-content' : 'dark-content';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <GraduationCap color={colors.text} size={48} />
                        </View>
                        <Text style={styles.appName}>MINDGUILD</Text>
                        <Text style={styles.appSubtitle}>Plataforma de Estudio Gamificada</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Iniciar sesión</Text>

                        <Text style={styles.label}>Correo electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color={colors.textMuted} size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="tu@email.com"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color={colors.textMuted} size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                {showPassword
                                    ? <EyeOff color={colors.accent} size={20} />
                                    : <Eye color={colors.accent} size={20} />
                                }
                            </Pressable>
                        </View>

                        <Pressable
                            style={styles.forgotRow}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={loading || googleLoading}
                        >
                            {loading
                                ? <ActivityIndicator color={colors.text} />
                                : <Text style={styles.btnPrimaryText}>Ingresar</Text>
                            }
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>o</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable
                            style={[styles.btnGoogle, googleLoading && { opacity: 0.7 }]}
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                        >
                            {googleLoading
                                ? <ActivityIndicator color={colors.text} />
                                : (
                                    <>
                                        <Text style={styles.googleIcon}>G</Text>
                                        <Text style={styles.btnGoogleText}>Continuar con Google</Text>
                                    </>
                                )
                            }
                        </Pressable>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tenés cuenta? </Text>
                        <Pressable onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}>Registrate</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <AppAlert
                visible={alertVisible}
                onClose={() => setAlertVisible(false)}
                title={alertTitle}
                message={alertMessage}
                type={alertType}
            />
        </SafeAreaView>
    );
}