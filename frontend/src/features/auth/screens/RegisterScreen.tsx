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
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react-native'; // Reemplazamos el emoji por ShieldCheck
import { loginWithGoogle, register } from '../services/authService';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(state => state.setSession);
    const colors = useThemeStore(state => state.colors);
    const themeMode = useThemeStore(state => state.themeMode);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleRegister = async () => {
        if (!username.trim() || !email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Completá todos los campos para continuar.');
            return;
        }
        if (password.length < 8) {
            Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setLoading(true);
        try {
            await register(email.trim(), password, username.trim());
            Alert.alert(
                'Cuenta creada',
                'Tu cuenta fue creada correctamente. Inicia sesion para continuar.',
                [{ text: 'Iniciar sesion', onPress: () => navigation.replace('Login') }]
            );
        } catch (error: any) {
            Alert.alert('Error al registrarse', error.message ?? 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle();
            setSession(result.auth_user_id, result.email, result.access_token, result.profile);
        } catch (error: any) {
            if (error.code !== 'auth_cancelled') {
                Alert.alert('Error con Google', error.message ?? 'Ocurrió un error inesperado.');
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
                    paddingTop: 20,
                    paddingBottom: 40,
                },
                header: {
                    alignItems: 'center',
                    marginBottom: 32, // Ajustado para igualar el espacio de LoginScreen
                    marginTop: 20,
                },
                backBtn: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                logoCircle: {
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.surface, // Mismo que en Login
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                },
                appName: {
                    color: colors.text,
                    fontSize: 30,
                    fontWeight: '900',
                    letterSpacing: 4,
                },
                // Se eliminó el tagline
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
                infoBox: {
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                },
                infoText: {
                    color: colors.textMuted,
                    fontSize: 12,
                    lineHeight: 18,
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
                    marginVertical: 20,
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
                    {/* Header ahora idéntico al de LoginScreen, solo con botón atrás adicional */}
                    <View style={styles.header}>
                        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <ArrowLeft color={colors.textMuted} size={20} />
                        </Pressable>
                        <View style={styles.logoCircle}>
                            <ShieldCheck color={colors.accent} size={40} />
                        </View>
                        <Text style={styles.appName}>MINDGUILD</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Crear cuenta</Text>

                        <Text style={styles.label}>Nombre de usuario</Text>
                        <View style={styles.inputWrapper}>
                            <User color={colors.textMuted} size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="@tu_usuario"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>

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
                                placeholder="Mínimo 8 caracteres"
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

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Al registrarte aceptás los Términos de uso y la Política de privacidad de MindGuild.
                            </Text>
                        </View>

                        <Pressable
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading || googleLoading}
                        >
                            {loading
                                ? <ActivityIndicator color={colors.text} />
                                : <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
                            }
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>o</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable
                            style={[styles.btnGoogle, googleLoading && { opacity: 0.7 }]}
                            onPress={handleGoogleRegister}
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
                        <Text style={styles.footerText}>¿Ya tenés cuenta? </Text>
                        <Pressable onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.footerLink}>Iniciá sesión</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}