import React, { useEffect, useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { X, Camera, Upload } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { supabase } from '../../../features/supabase';

interface EditProfileModalProps {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onSave: (data: { username: string; bio: string; avatar_url: string }) => void;
  currentData: {
    username: string;
    bio: string;
    avatar_url: string | null;
  };
}

const fallbackAvatar = 'https://ui-avatars.com/api/?background=1e293b&color=ffffff&name=MG';

export default function EditProfileModal({
  visible,
  loading = false,
  onClose,
  onSave,
  currentData,
}: EditProfileModalProps) {
  const colors = useThemeStore(state => state.colors);

  const [username, setUsername] = useState(currentData.username);
  const [bio, setBio] = useState(currentData.bio);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  // ✅ Estado para almacenar la nueva URL después de subir
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

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

  // ✅ Reseteamos el estado cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setUsername(currentData.username);
      setBio(currentData.bio);
      setImageUri(null);
      setNewAvatarUrl(null);
    }
  }, [currentData, visible]);

  // ✅ Función para subir imagen a Supabase con nombre único (timestamp)
  const uploadImageToSupabase = async (uri: string, filename: string): Promise<string> => {
  // 1. Leemos el archivo y lo convertimos a base64
  const base64Data = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 2. Convertimos el base64 a un formato binario "Blob" que React Native entiende
  // Esto es lo único que garantiza que la imagen no llegue corrupta (gris/negra)
  const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const timestamp = Date.now();
  const uniqueFilename = `${filename}-${timestamp}.jpg`;

  // 3. Subimos el archivo usando el SDK
  const { error } = await supabase.storage
    .from('avatars')
    .upload(uniqueFilename, binaryData, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('❌ Error:', error);
    throw error;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(uniqueFilename);

  return data.publicUrl;
};

  // ✅ Función para seleccionar imagen de la galería
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a tu galería.', 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.7
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewAvatarUrl(null);
      setShowImageOptions(false);
    }
  };

  // ✅ Función para tomar foto con la cámara
  const takePhotoWithCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      showAlert('Permiso requerido', 'Necesitamos acceso a la cámara.', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setNewAvatarUrl(null);
      setShowImageOptions(false);
    }
  };

  // ✅ Abrir selector de imagen
  const openImageOptions = () => {
    setShowImageOptions(true);
  };

  // ✅ Guardar perfil con subida de imagen incluida
  const handleSave = async () => {
    let finalAvatarUrl = currentData.avatar_url || '';

    if (imageUri) {
      setIsUploading(true);
      try {
        const baseFilename = `avatar-${currentData.username || 'user'}`;
        finalAvatarUrl = await uploadImageToSupabase(imageUri, baseFilename);
        console.log('✅ Imagen subida:', finalAvatarUrl);
        // ✅ Guardar la nueva URL para mostrarla en el modal
        setNewAvatarUrl(finalAvatarUrl);
      } catch (error: any) {
        showAlert('Error', error.message ?? 'No se pudo subir la imagen.', 'error');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // ✅ Llamar a onSave con la nueva URL (si se subió) o la existente
    onSave({ username, bio, avatar_url: finalAvatarUrl });
  };

  // Estilos dinámicos basados en el tema
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          padding: 20,
        },
        modalContent: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 28,
          padding: 24,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: 'bold',
        },
        closeBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoSection: {
          alignItems: 'center',
          marginBottom: 25,
        },
        photoWrapper: {
          position: 'relative',
        },
        photo: {
          width: 120,
          height: 120,
          borderRadius: 60,
          borderWidth: 4,
          borderColor: colors.warning,
        },
        cameraIconBadge: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: colors.info,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.surfaceElevated,
        },
        photoHint: {
          color: colors.textMuted,
          fontSize: 13,
          marginTop: 12,
        },
        form: {
          marginBottom: 25,
          gap: 8,
        },
        label: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginTop: 8,
        },
        input: {
          backgroundColor: colors.surface,
          color: colors.text,
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        bioInput: {
          minHeight: 84,
          textAlignVertical: 'top',
        },
        usernameInputWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          paddingLeft: 14,
        },
        atSymbol: {
          color: colors.textMuted,
          fontSize: 16,
        },
        inputUsername: {
          flex: 1,
          color: colors.text,
          padding: 14,
          fontSize: 16,
        },
        saveBtn: {
          backgroundColor: colors.info,
          borderRadius: 16,
          padding: 16,
          alignItems: 'center',
          opacity: loading || isUploading ? 0.7 : 1,
        },
        saveBtnText: {
          color: colors.text,
          fontWeight: 'bold',
          fontSize: 16,
        },
        // Estilos para el modal de selección de imagen
        imageOptionsOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        imageOptionsModal: {
          backgroundColor: colors.surfaceElevated,
          borderRadius: 24,
          padding: 24,
          width: '100%',
          maxWidth: 340,
          borderWidth: 1,
          borderColor: colors.border,
        },
        imageOptionsTitle: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: 8,
        },
        imageOptionsSubtitle: {
          color: colors.textMuted,
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 24,
          lineHeight: 20,
        },
        imageOptionBtn: {
          height: 52,
          borderRadius: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 10,
          borderWidth: 1,
        },
        imageOptionBtnPrimary: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        imageOptionBtnSecondary: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        imageOptionBtnCancel: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginTop: 4,
        },
        imageOptionText: {
          fontWeight: 'bold',
          fontSize: 16,
        },
        imageOptionTextPrimary: {
          color: '#ffffff',
        },
        imageOptionTextSecondary: {
          color: colors.text,
        },
      }),
    [colors, loading, isUploading]
  );

  // ✅ Mostrar: nueva URL (si se subió) > imagen seleccionada > URL actual > fallback
  const displayImage = newAvatarUrl || imageUri || currentData.avatar_url || fallbackAvatar;

  return (
    <>
      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Editar Perfil</Text>
              <Pressable onPress={onClose} style={styles.closeBtn} disabled={loading || isUploading}>
                <X color={colors.text} size={20} />
              </Pressable>
            </View>

            <View style={styles.photoSection}>
              <Pressable style={styles.photoWrapper} onPress={openImageOptions} disabled={loading || isUploading}>
                <Image source={{ uri: displayImage }} style={styles.photo} />
                <View style={styles.cameraIconBadge}>
                  <Camera color={colors.text} size={16} />
                </View>
              </Pressable>
              <Text style={styles.photoHint}>Tocá la foto para cambiarla</Text>
              {imageUri && !newAvatarUrl && (
                <Text style={{ color: colors.accent, fontSize: 12, marginTop: 4 }}>
                  Nueva imagen seleccionada
                </Text>
              )}
              {newAvatarUrl && (
                <Text style={{ color: colors.accent, fontSize: 12, marginTop: 4 }}>
                  ✅ Imagen subida correctamente
                </Text>
              )}
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Usuario</Text>
              <View style={styles.usernameInputWrapper}>
                <Text style={styles.atSymbol}>@</Text>
                <TextInput
                  style={styles.inputUsername}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={160}
                placeholder="Contá algo sobre vos"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Pressable
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading || isUploading}
            >
              {loading || isUploading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isUploading ? 'Subiendo imagen...' : 'Guardar Cambios'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ✅ Modal de selección de imagen con consistencia visual */}
      <Modal visible={showImageOptions} transparent animationType="fade">
        <View style={styles.imageOptionsOverlay}>
          <View style={styles.imageOptionsModal}>
            <Text style={styles.imageOptionsTitle}>Cambiar foto de perfil</Text>
            <Text style={styles.imageOptionsSubtitle}>Seleccioná una opción</Text>

            <Pressable
              style={[styles.imageOptionBtn, styles.imageOptionBtnPrimary]}
              onPress={() => {
                setShowImageOptions(false);
                takePhotoWithCamera();
              }}
            >
              <Camera color="#ffffff" size={20} />
              <Text style={[styles.imageOptionText, styles.imageOptionTextPrimary]}>Cámara</Text>
            </Pressable>

            <Pressable
              style={[styles.imageOptionBtn, styles.imageOptionBtnSecondary]}
              onPress={() => {
                setShowImageOptions(false);
                pickImageFromGallery();
              }}
            >
              <Upload color={colors.text} size={20} />
              <Text style={[styles.imageOptionText, styles.imageOptionTextSecondary]}>Galería</Text>
            </Pressable>

            <Pressable
              style={[styles.imageOptionBtn, styles.imageOptionBtnCancel]}
              onPress={() => setShowImageOptions(false)}
            >
              <Text style={[styles.imageOptionText, styles.imageOptionTextSecondary]}>Cancelar</Text>
            </Pressable>
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