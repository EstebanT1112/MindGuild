import React, { useState } from 'react';
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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { loginWithAuth0 } from '../services/authService';
import { useAuthStore } from '../../../store/authStore';

export default function LoginScreen() {
    const navigation = useNavigation<any>();
    const setSession = useAuthStore(state => state.setSession);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos incompletos', 'Completá todos los campos para continuar.');
            return;
        }

        setLoading(true);
        try {
            const result = await loginWithAuth0(email.trim(), password);
            setSession(result.auth_user_id, result.email, result.access_token);
            navigation.replace('MainTabs');
        } catch (error: any) {
            Alert.alert('Error al iniciar sesión', error.message ?? 'Ocurrió un error inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* LOGO */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🧠</Text>
                        </View>
                        <Text style={styles.appName}>MINDGUILD</Text>
                        <Text style={styles.tagline}>Estudiá más. Competí mejor.</Text>
                    </View>

                    {/* CARD FORMULARIO */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Iniciar sesión</Text>

                        <Text style={styles.label}>Correo electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color="#64748b" size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="tu@email.com"
                                placeholderTextColor="#4b5563"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color="#64748b" size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#4b5563"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                {showPassword
                                    ? <EyeOff color="#22c55e" size={20} />
                                    : <Eye color="#22c55e" size={20} />
                                }
                            </Pressable>
                        </View>

                        <Pressable style={styles.forgotRow}>
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.btnPrimaryText}>Ingresar</Text>
                            }
                        </Pressable>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>o</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable style={styles.btnGoogle}>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.btnGoogleText}>Continuar con Google</Text>
                        </Pressable>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tenés cuenta? </Text>
                        <Pressable onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.footerLink}>Registrate</Text>
                        </Pressable>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    logoEmoji: {
        fontSize: 38,
    },
    appName: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 4,
    },
    tagline: {
        color: '#64748b',
        fontSize: 14,
        marginTop: 6,
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: '#334155',
    },
    cardTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    label: {
        color: '#94a3b8',
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 15,
    },
    forgotRow: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
    },
    btnPrimary: {
        backgroundColor: '#22c55e',
        height: 56,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: '#ffffff',
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
        backgroundColor: '#334155',
    },
    dividerText: {
        color: '#64748b',
        fontSize: 14,
    },
    btnGoogle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#334155',
        height: 56,
        borderRadius: 18,
        gap: 12,
    },
    googleIcon: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '900',
    },
    btnGoogleText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#64748b',
        fontSize: 15,
    },
    footerLink: {
        color: '#22c55e',
        fontSize: 15,
        fontWeight: 'bold',
    },
});