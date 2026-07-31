import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { requestPasswordReset } from '../services/authService';
import { useThemeStore } from '../../../store/themeStore';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeStore(state => state.colors);
  const themeMode = useThemeStore(state => state.themeMode);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const styles = createStyles(colors, themeMode);

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setFeedback({ type: 'error', message: 'Ingresá tu correo para continuar.' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      await requestPasswordReset(normalizedEmail);
      setFeedback({
        type: 'success',
        message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña.',
      });
      setEmail('');
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.message ?? 'No se pudo enviar el correo. Intentá nuevamente en unos minutos.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={20} />
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.title}>Recuperar contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresá el correo con el que registraste tu cuenta y te enviaremos instrucciones.
            </Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Mail color={colors.textSoft} size={18} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor={colors.textSoft}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={value => {
                  setEmail(value);
                  if (feedback) setFeedback(null);
                }}
              />
            </View>

            {feedback && (
              <Text style={[styles.feedback, feedback.type === 'success' ? styles.success : styles.error]}>
                {feedback.message}
              </Text>
            )}

            <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Enviar instrucciones</Text>}
            </Pressable>

            <Pressable style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Volver al inicio de sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, themeMode: 'dark' | 'light') => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
    backgroundColor: colors.input,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  feedback: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  success: {
    color: colors.accentStrong,
  },
  error: {
    color: '#fda4af',
  },
  submitButton: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
