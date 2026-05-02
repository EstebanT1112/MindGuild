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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export default function RegisterScreen() {
    const navigation = useNavigation<any>();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
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
                <Text style={styles.backArrow}>←</Text>
                </Pressable>
                <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🧠</Text>
                </View>
                <Text style={styles.appName}>BRAIMIND</Text>
                <Text style={styles.tagline}>Creá tu cuenta y comenzá a estudiar</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Crear cuenta</Text>

                <Text style={styles.label}>Nombre de usuario</Text>
                <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                    style={styles.input}
                    placeholder="@tu_usuario"
                    placeholderTextColor="#52525b"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />
                </View>

                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    placeholderTextColor="#52525b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                </View>

                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.toggleText}>
                    {showPassword ? 'Ocultar' : 'Ver'}
                    </Text>
                </Pressable>
                </View>

                <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    Al registrarte aceptás los Términos de uso y la Política de privacidad de Braimind.
                </Text>
                </View>

                <Pressable
                style={styles.btnPrimary}
                onPress={() => navigation.replace('MainTabs')}
                >
                <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
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
        backgroundColor: '#1a1d29',
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    backBtn: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222533',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2e3245',
    },
    backArrow: {
        color: '#a1a1aa',
        fontSize: 18,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#222533',
        borderWidth: 2,
        borderColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    logoEmoji: {
        fontSize: 38,
    },
    appName: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
    },
    tagline: {
        color: '#71717a',
        fontSize: 13,
        marginTop: 6,
    },
    card: {
        backgroundColor: '#222533',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2e3245',
    },
    cardTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 24,
    },
    label: {
        color: '#a1a1aa',
        fontSize: 13,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1d29',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2e3245',
        paddingHorizontal: 14,
        height: 50,
        marginBottom: 16,
        gap: 10,
    },
    inputIcon: {
        fontSize: 16,
    },
    input: {
        flex: 1,
        color: '#ffffff',
        fontSize: 14,
    },
    toggleText: {
        color: '#22c55e',
        fontSize: 13,
        fontWeight: '600',
    },
    infoBox: {
        backgroundColor: '#1a1d29',
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#2e3245',
    },
    infoText: {
        color: '#71717a',
        fontSize: 12,
        lineHeight: 18,
    },
    btnPrimary: {
        backgroundColor: '#22c55e',
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnPrimaryText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#2e3245',
    },
    dividerText: {
        color: '#71717a',
        fontSize: 13,
    },
    btnGoogle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1d29',
        borderWidth: 1,
        borderColor: '#2e3245',
        height: 52,
        borderRadius: 16,
        gap: 10,
    },
    googleIcon: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '900',
    },
    btnGoogleText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 28,
    },
    footerText: {
        color: '#71717a',
        fontSize: 14,
    },
    footerLink: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '700',
    },
});