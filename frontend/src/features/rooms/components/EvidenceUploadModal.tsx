import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, View, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import * as FileSystem from 'expo-file-system/legacy';

import { toByteArray } from 'base64-js';

import { Camera, Image as ImageIcon } from 'lucide-react-native';

import { supabase } from '../../../features/supabase';

import { endStudySession, cancelStudySession } from '../services/sessionsService';

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
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  
  // ⚡ SEPARACIÓN DE ESTADOS DE CARGA INTELIGENTES:
  const [isUploading, setIsUploading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Un flag global para simplificar el bloqueo de interacciones
  const isProcessing = isUploading || isCanceling;

  const pickImageFromGallery = async () => {
    if (isProcessing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir la evidencia.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    if (isProcessing) return;
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar la foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageToSupabase = async (uri: string, filename: string): Promise<string> => {
    // Limpiamos y formateamos el prefijo nativo de Android/iOS para evitar fallas ENOENT
    const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;

    const base64Data = await FileSystem.readAsStringAsync(cleanUri, {
      encoding: 'base64', 
    });

    const byteArray = toByteArray(base64Data);

    const { data, error } = await supabase.storage
      .from('evidences')
      .upload(`${filename}.jpg`, byteArray, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('evidences')
      .getPublicUrl(`${filename}.jpg`);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!accessToken || !sessionId) {
      Alert.alert('Error', 'Falta el identificador de la sesión activa.');
      return;
    }
    if (!imageUri) {
      Alert.alert('Falta Evidencia', 'Por favor, saca una foto o selecciona una de la galería.');
      return;
    }
    if (!summary.trim()) {
      Alert.alert('Falta Resumen', 'Escribe un breve resumen de lo que estuviste estudiando.');
      return;
    }

    setIsUploading(true); // ⚡ Spinner exclusivo para la subida
    try {
      const realStorageUrl = await uploadImageToSupabase(imageUri, `session-${sessionId}`);

      await endStudySession(accessToken, sessionId, {
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
        paused_seconds: 0,
        evidence_photo_url: realStorageUrl,
        summary_text: summary.trim(),
      });

      Alert.alert('Sincronizado', 'Tu sesión quedó guardada y en revisión por tus compañeros.');
      setImageUri(null);
      setSummary('');
      onSuccess();
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message ?? 'No se pudo procesar el guardado de la evidencia.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDiscard = async () => {
    if (!accessToken || !sessionId) {
      onCancel();
      return;
    }

    setIsCanceling(true); // ⚡ Spinner exclusivo para el descarte
    try {
      await cancelStudySession(accessToken, sessionId);
      setImageUri(null);
      setSummary('');
      onCancel();
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cancelar la sesión en el servidor.');
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>¡Gran Sesión de Estudio! 🎉</Text>
          <Text style={styles.subtitle}>Estudiaste {durationMinutes} min. Para validar tus minutos en el ranking, por favor adjunta una foto de tus apuntes y un breve resumen.</Text>

          <View style={styles.mediaContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={styles.placeholderText}>Sin evidencia seleccionada</Text>
              </View>
            )}

            <View style={styles.rowButtons}>
              <Pressable 
                style={[styles.mediaBtn, isProcessing && styles.disabledOpacity]} 
                onPress={takePhotoWithCamera}
                disabled={isProcessing}
              >
                <Camera color="#22c55e" size={20} />
                <Text style={styles.mediaBtnText}>Cámara</Text>
              </Pressable>
              <Pressable 
                style={[styles.mediaBtn, isProcessing && styles.disabledOpacity]} 
                onPress={pickImageFromGallery}
                disabled={isProcessing}
              >
                <ImageIcon color="#06b6d4" size={20} />
                <Text style={styles.mediaBtnText}>Galería</Text>
              </Pressable>
            </View>
          </View>

          <TextInput
            style={[styles.input, isProcessing && styles.disabledOpacity]}
            placeholder="¿Qué temas estuviste estudiando o resolviendo?..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
            value={summary}
            onChangeText={setSummary}
            editable={!isProcessing} // Previene que editen texto mientras procesa
          />

          <View style={styles.actionRow}>
            {/* Botón Descartar con spinner propio */}
            <Pressable 
              style={[styles.cancelBtn, isProcessing && styles.disabledOpacity]} 
              onPress={handleDiscard} 
              disabled={isProcessing}
            >
              {isCanceling ? (
                <ActivityIndicator color="#94a3b8" size="small" />
              ) : (
                <Text style={styles.cancelText}>Descartar</Text>
              )}
            </Pressable>

            {/* Botón Subir Evidencia con spinner propio */}
            <Pressable 
              style={[styles.submitBtn, isProcessing && styles.disabledOpacity]} 
              onPress={handleSubmit} 
              disabled={isProcessing}
            >
              {isUploading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitText}>Subir Evidencia</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#1e293b', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#334155' },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#94a3b8', fontSize: 14, marginTop: 8, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  mediaContainer: { alignItems: 'center', gap: 12, marginBottom: 16 },
  placeholderBox: { width: '100%', height: 140, backgroundColor: '#0f172a', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#475569' },
  placeholderText: { color: '#64748b', fontWeight: '500' },
  previewImage: { width: '100%', height: 140, borderRadius: 16, resizeMode: 'cover' },
  rowButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  mediaBtn: { flex: 1, height: 44, backgroundColor: '#0f172a', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  mediaBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  input: { backgroundColor: '#0f172a', color: 'white', borderRadius: 16, padding: 14, fontSize: 15, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', alignItems: 'center' },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, minWidth: 100, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#94a3b8', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#22c55e', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, minWidth: 140, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: 'white', fontWeight: 'bold' },
  disabledOpacity: { opacity: 0.5 }, // Estilo genérico para deshabilitar vistas visualmente
});