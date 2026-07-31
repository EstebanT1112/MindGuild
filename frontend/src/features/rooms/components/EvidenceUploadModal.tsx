import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '../../../features/supabase';
import { endStudySession, cancelStudySession } from '../services/sessionsService';
import { useThemeStore } from '../../../store/themeStore';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';

interface EvidenceUploadModalProps {
  visible: boolean;
  sessionId: string | null;
  accessToken: string | null;
  durationMinutes: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EvidenceUploadModal({
  visible,
  sessionId,
  accessToken,
  durationMinutes,
  onSuccess,
  onCancel,
}: EvidenceUploadModalProps) {
  const colors = useThemeStore(state => state.colors);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const isProcessing = isUploading || isCanceling;

  // ✅ Estado para AppAlert
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
    showCancel?: boolean;
    cancelText?: string;
    onCancel?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  // ✅ Función para mostrar alertas personalizadas
  const showAlert = (
    title: string,
    message: string,
    type: AlertType = 'info',
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean,
    cancelText?: string,
    onCancel?: () => void
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText: confirmText || 'Aceptar',
      showCancel: showCancel || false,
      cancelText: cancelText || 'Cancelar',
      onCancel,
    });
  };

  const pickImageFromGallery = async () => {
    if (isProcessing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tu galería.', 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const takePhotoWithCamera = async () => {
    if (isProcessing) return;
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a la cámara.', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadImageToSupabase = async (uri: string, filename: string): Promise<string> => {
    const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    const base64Data = await FileSystem.readAsStringAsync(cleanUri, { encoding: 'base64' });
    const byteArray = toByteArray(base64Data);
    const { error } = await supabase.storage.from('evidences').upload(`${filename}.jpg`, byteArray, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('evidences').getPublicUrl(`${filename}.jpg`);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!accessToken || !sessionId) return;
    if (!imageUri || !summary.trim()) {
      showAlert('Atención', 'Por favor, sube una foto y escribe un resumen.', 'warning');
      return;
    }
    setIsUploading(true);
    try {
      const realStorageUrl = await uploadImageToSupabase(imageUri, `session-${sessionId}`);
      await endStudySession(accessToken, sessionId, {
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        paused_seconds: 0,
        evidence_photo_url: realStorageUrl,
        summary_text: summary.trim(),
      });
      onSuccess();
    } catch (error: any) {
      showAlert('Error', error.message ?? 'No se pudo procesar la subida.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>¡Gran Sesión de Estudio! 🎉</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Estudiaste {durationMinutes} min. Adjunta una foto y resumen para validar.</Text>

            <View style={styles.mediaContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={[styles.placeholderBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={{ color: colors.textSoft }}>Sin evidencia</Text>
                </View>
              )}

              <View style={styles.rowButtons}>
                <Pressable style={[styles.mediaBtn, { backgroundColor: colors.background, borderColor: colors.border }, isProcessing && styles.disabled]} onPress={takePhotoWithCamera} disabled={isProcessing}>
                  <Camera color={colors.accent} size={20} />
                  <Text style={[styles.mediaBtnText, { color: colors.text }]}>Cámara</Text>
                </Pressable>
                <Pressable style={[styles.mediaBtn, { backgroundColor: colors.background, borderColor: colors.border }, isProcessing && styles.disabled]} onPress={pickImageFromGallery} disabled={isProcessing}>
                  <ImageIcon color={colors.warning} size={20} />
                  <Text style={[styles.mediaBtnText, { color: colors.text }]}>Galería</Text>
                </Pressable>
              </View>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }, isProcessing && styles.disabled]}
              placeholder="¿Qué estudiaste?..."
              placeholderTextColor={colors.textSoft}
              multiline
              value={summary}
              onChangeText={setSummary}
              editable={!isProcessing}
            />

            <View style={styles.actionRow}>
              <Pressable style={[styles.cancelBtn, isProcessing && styles.disabled]} onPress={onCancel} disabled={isProcessing}>
                {isCanceling ? <ActivityIndicator size="small" /> : <Text style={[styles.cancelText, { color: colors.textMuted }]}>Descartar</Text>}
              </Pressable>
              <Pressable style={[styles.submitBtn, { backgroundColor: colors.accent }, isProcessing && styles.disabled]} onPress={handleSubmit} disabled={isProcessing}>
                {isUploading ? <ActivityIndicator color="white" /> : <Text style={styles.submitText}>Subir Evidencia</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ AppAlert personalizado */}
      <AppAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert(prev => ({ ...prev, visible: false }))}
        onConfirm={() => {
          if (alert.onConfirm) {
            alert.onConfirm();
          } else {
            setAlert(prev => ({ ...prev, visible: false }));
          }
        }}
        onCancel={() => {
          if (alert.onCancel) alert.onCancel();
          setAlert(prev => ({ ...prev, visible: false }));
        }}
        confirmText={alert.confirmText || 'Aceptar'}
        cancelText={alert.cancelText || 'Cancelar'}
        showCancel={alert.showCancel || false}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContainer: { borderRadius: 24, padding: 24, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  mediaContainer: { alignItems: 'center', gap: 12, marginBottom: 16 },
  placeholderBox: { width: '100%', height: 140, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  previewImage: { width: '100%', height: 140, borderRadius: 16, resizeMode: 'cover' },
  rowButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  mediaBtn: { flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1 },
  mediaBtnText: { fontWeight: 'bold', fontSize: 14 },
  input: { borderRadius: 16, padding: 14, fontSize: 15, height: 80, textAlignVertical: 'top', borderWidth: 1, marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', alignItems: 'center' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  cancelText: { fontWeight: 'bold' },
  submitBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  submitText: { color: 'white', fontWeight: 'bold' },
  disabled: { opacity: 0.5 },
});