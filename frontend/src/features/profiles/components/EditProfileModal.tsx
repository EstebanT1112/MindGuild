import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { X, Camera } from 'lucide-react-native';

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
  // RF-03: mantiene un formulario local para editar solo datos permitidos del perfil.
  const [username, setUsername] = useState(currentData.username);
  const [bio, setBio] = useState(currentData.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatar_url ?? '');

  useEffect(() => {
    if (visible) {
      setUsername(currentData.username);
      setBio(currentData.bio);
      setAvatarUrl(currentData.avatar_url ?? '');
    }
  }, [currentData, visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Perfil</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <X color="white" size={20} />
            </Pressable>
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoWrapper}>
              <Image source={{ uri: avatarUrl || fallbackAvatar }} style={styles.photo} />
              <View style={styles.cameraIconBadge}>
                <Camera color="white" size={16} />
              </View>
            </View>
            <Text style={styles.photoHint}>Pegá una URL de imagen para cambiar tu foto</Text>
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
                placeholderTextColor="#64748b"
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
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Avatar URL</Text>
            <TextInput
              style={styles.input}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://..."
              placeholderTextColor="#64748b"
            />
          </View>

          <Pressable
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            onPress={() => onSave({ username, bio, avatar_url: avatarUrl })}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Guardar Cambios</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 28, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  photoSection: { alignItems: 'center', marginBottom: 25 },
  photoWrapper: { position: 'relative' },
  photo: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#facc15' },
  cameraIconBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3b82f6', width: 36, height: 36,
    borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#1e293b'
  },
  photoHint: { color: '#94a3b8', fontSize: 13, marginTop: 12 },
  form: { marginBottom: 25, gap: 8 },
  label: { color: '#94a3b8', fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: '#0f172a', color: 'white', borderRadius: 12,
    padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#334155'
  },
  bioInput: { minHeight: 84, textAlignVertical: 'top' },
  usernameInputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
    borderRadius: 12, borderWidth: 1, borderColor: '#334155', paddingLeft: 14
  },
  atSymbol: { color: '#64748b', fontSize: 16 },
  inputUsername: { flex: 1, color: 'white', padding: 14, fontSize: 16 },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 16, padding: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
