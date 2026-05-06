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
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { register } from '../services/authService';

export default function RegisterScreen() {
    const navigation = useNavigation<any>();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

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
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <ArrowLeft color="#94a3b8" size={20} />
                        </Pressable>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🧠</Text>
                        </View>
                        <Text style={styles.appName}>MINDGUILD</Text>
                        <Text style={styles.tagline}>Creá tu cuenta y comenzá a estudiar</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Crear cuenta</Text>

                        <Text style={styles.label}>Nombre de usuario</Text>
                        <View style={styles.inputWrapper}>
                            <User color="#64748b" size={18} />
                            <TextInput
                                style={styles.input}
                                placeholder="@tu_usuario"
                                placeholderTextColor="#4b5563"
                                autoCapitalize="none"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>

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
                                placeholder="Mínimo 8 caracteres"
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

                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                Al registrarte aceptás los Términos de uso y la Política de privacidad de MindGuild.
                            </Text>
                        </View>

                        <Pressable
                            style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
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

                    {/* Footer */}
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

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
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
    infoBox: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    infoText: {
        color: '#64748b',
        fontSize: 12,
        lineHeight: 18,
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
        marginVertical: 20,
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
