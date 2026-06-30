import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRoute } from '@react-navigation/native';
import { Download, FileText, FolderOpen, Plus, Search, Trash2, Upload, X } from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import {
  createVaultMaterial,
  deleteVaultMaterial,
  downloadVaultMaterial,
  fetchVaultMaterials,
  type VaultMaterial,
  type VaultResourceType,
} from '../services/vaultService';
import { createRoomTopic, fetchRoomTopics, type AcademicTopic } from '../services/battleRoyaleService';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export default function RoomVaultScreen() {
  const route = useRoute<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const roomId = String(route.params?.roomId ?? '');
  const roomName = String(route.params?.roomName ?? 'Sala');
  const accentColor = route.params?.accentColor ? String(route.params.accentColor) : '#22c55e';

  const [materials, setMaterials] = useState<VaultMaterial[]>([]);
  const [topics, setTopics] = useState<AcademicTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<VaultResourceType | 'all'>('all');

  const loadVault = async (showLoading = true) => {
    if (!accessToken || !roomId) return;
    if (showLoading) setLoading(true);

    try {
      const [materialsData, topicsData] = await Promise.all([
        fetchVaultMaterials(accessToken, roomId, {
          search: search.trim() || undefined,
          type: typeFilter === 'all' ? undefined : typeFilter,
        }),
        fetchRoomTopics(accessToken, roomId),
      ]);
      setMaterials(materialsData);
      setTopics(topicsData);
    } catch (error: any) {
      Alert.alert('The Vault', error.message ?? 'No se pudo cargar The Vault');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadVault();
  }, [accessToken, roomId, typeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVault(false);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    loadVault(false);
  };

  const handleDownload = async (material: VaultMaterial) => {
    if (!accessToken) return;

    try {
      const file = await downloadVaultMaterial(accessToken, roomId, material.id);
      const safeName = file.file_name.replace(/[\\/:*?"<>|]/g, '_');
      const savedUri = await saveFileToDevice(safeName, file.mime_type, file.file_base64);

      if (savedUri) {
        Alert.alert('Material descargado', `Se guardo como ${safeName}`);
      }
    } catch (error: any) {
      Alert.alert('The Vault', error.message ?? 'No se pudo descargar el material');
    }
  };

  const handleDelete = (material: VaultMaterial) => {
    if (!accessToken) return;

    Alert.alert('Eliminar material', `¿Eliminar "${material.title}" de The Vault?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVaultMaterial(accessToken, roomId, material.id);
            setMaterials(current => current.filter(item => item.id !== material.id));
          } catch (error: any) {
            Alert.alert('The Vault', error.message ?? 'No se pudo eliminar el material');
          }
        },
      },
    ]);
  };

  return (
    <ScreenLayout title="THE VAULT" type="rooms" icon={<FolderOpen color={accentColor} size={22} />}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.roomName}>{roomName}</Text>
          <Text style={styles.subtitle}>Materiales compartidos por la sala</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color="#94a3b8" size={18} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por archivo o categoria"
              placeholderTextColor="#64748b"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <Pressable style={[styles.searchBtn, { backgroundColor: accentColor }]} onPress={handleSearch}>
            <Search color="white" size={18} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['all', 'pdf', 'image', 'text', 'other'] as const).map(type => (
            <Pressable
              key={type}
              style={[
                styles.filterChip,
                typeFilter === type && { borderColor: accentColor, backgroundColor: `${accentColor}22` },
              ]}
              onPress={() => setTypeFilter(type)}
            >
              <Text style={[styles.filterText, typeFilter === type && { color: accentColor }]}>
                {getTypeLabel(type)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={[styles.uploadBtn, { backgroundColor: accentColor }]} onPress={() => setUploadVisible(true)}>
          <Plus color="white" size={22} />
          <Text style={styles.uploadBtnText}>Agregar material</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={accentColor} />
            <Text style={styles.mutedText}>Cargando materiales...</Text>
          </View>
        ) : materials.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderOpen color="#64748b" size={36} />
            <Text style={styles.emptyTitle}>Sin materiales</Text>
            <Text style={styles.emptyText}>Los archivos que suban los miembros activos van a aparecer aca.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {materials.map(material => (
              <MaterialCard
                key={material.id}
                material={material}
                accentColor={accentColor}
                onDownload={() => handleDownload(material)}
                onDelete={() => handleDelete(material)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <UploadMaterialModal
        visible={uploadVisible}
        roomId={roomId}
        accessToken={accessToken}
        accentColor={accentColor}
        topics={topics}
        onClose={() => setUploadVisible(false)}
        onCreated={material => {
          setMaterials(current => [material, ...current]);
          setUploadVisible(false);
        }}
        onTopicCreated={topic => setTopics(current => [...current, topic])}
      />
    </ScreenLayout>
  );
}

function MaterialCard({
  material,
  accentColor,
  onDownload,
  onDelete,
}: {
  material: VaultMaterial;
  accentColor: string;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.materialCard}>
      <View style={styles.materialTop}>
        <View style={[styles.fileIcon, { backgroundColor: `${accentColor}22` }]}>
          <FileText color={accentColor} size={22} />
        </View>
        <View style={styles.materialInfo}>
          <Text style={styles.materialTitle}>{material.title}</Text>
          <Text style={styles.materialMeta}>
            {getTypeLabel(material.resource_type)} · {formatBytes(material.file_size_bytes)}
          </Text>
        </View>
      </View>

      {!!material.description && <Text style={styles.materialDescription}>{material.description}</Text>}
      <Text style={styles.fileName}>{material.file_name}</Text>

      <View style={styles.topicRow}>
        {material.topics.length === 0 ? (
          <Text style={styles.noTopicText}>Sin tema</Text>
        ) : (
          material.topics.map(topic => (
            <View key={topic.id} style={[styles.topicPill, { borderColor: topic.color ?? accentColor }]}>
              <Text style={styles.topicText}>{topic.name}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.materialFooter}>
        <Text style={styles.authorText}>Subido por {material.uploaded_by.username}</Text>
        <View style={styles.materialActions}>
          <Pressable style={styles.iconAction} onPress={onDownload}>
            <Download color="#cbd5e1" size={18} />
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onDelete}>
            <Trash2 color="#f87171" size={18} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function UploadMaterialModal({
  visible,
  roomId,
  accessToken,
  accentColor,
  topics,
  onClose,
  onCreated,
  onTopicCreated,
}: {
  visible: boolean;
  roomId: string;
  accessToken: string | null;
  accentColor: string;
  topics: AcademicTopic[];
  onClose: () => void;
  onCreated: (material: VaultMaterial) => void;
  onTopicCreated: (topic: AcademicTopic) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileBase64, setFileBase64] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => Boolean(accessToken && title.trim().length >= 2 && selectedFile && fileBase64 && !saving),
    [accessToken, title, selectedFile, fileBase64, saving]
  );

  const reset = () => {
    setTitle('');
    setDescription('');
    setSelectedTopicIds([]);
    setNewTopicName('');
    setSelectedFile(null);
    setFileBase64('');
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_FILE_SIZE_BYTES) {
      Alert.alert('Archivo demasiado grande', 'El archivo no puede superar 5 MB.');
      return;
    }

    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    setSelectedFile(asset);
    setFileBase64(base64);
    if (!title.trim()) {
      setTitle(asset.name.replace(/\.[^.]+$/, '').slice(0, 80));
    }
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopicIds(current =>
      current.includes(topicId)
        ? current.filter(id => id !== topicId)
        : current.length >= 5
          ? current
          : [...current, topicId]
    );
  };

  const handleCreateTopic = async () => {
    if (!accessToken || !newTopicName.trim()) return;

    const existingTopic = topics.find(topic => normalizeTopicName(topic.name) === normalizeTopicName(newTopicName));
    if (existingTopic) {
      setSelectedTopicIds(current => current.includes(existingTopic.id) ? current : [...current, existingTopic.id]);
      setNewTopicName('');
      Alert.alert('Tema existente', 'Ese tema ya existe y fue seleccionado.');
      return;
    }

    try {
      const topic = await createRoomTopic(accessToken, roomId, { name: newTopicName.trim() });
      onTopicCreated(topic);
      setSelectedTopicIds(current => [...current, topic.id]);
      setNewTopicName('');
    } catch (error: any) {
      Alert.alert('The Vault', error.message ?? 'No se pudo crear el tema');
    }
  };

  const handleSave = async () => {
    if (!accessToken || !selectedFile || !fileBase64) return;

    setSaving(true);
    try {
      const material = await createVaultMaterial(accessToken, roomId, {
        title: title.trim(),
        description: description.trim() || undefined,
        file_name: selectedFile.name,
        mime_type: selectedFile.mimeType ?? inferMimeType(selectedFile.name),
        file_base64: fileBase64,
        topic_ids: selectedTopicIds,
      });

      reset();
      onCreated(material);
    } catch (error: any) {
      Alert.alert('The Vault', error.message ?? 'No se pudo guardar el material');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar material</Text>
            <Pressable style={styles.closeBtn} onPress={handleClose}>
              <X color="#cbd5e1" size={20} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
            <Text style={styles.inputLabel}>Archivo</Text>
            <Pressable style={styles.filePicker} onPress={handlePickFile}>
              <Upload color={accentColor} size={22} />
              <View style={styles.filePickerTextBox}>
                <Text style={styles.filePickerTitle}>{selectedFile?.name ?? 'Seleccionar archivo'}</Text>
                <Text style={styles.filePickerSub}>PDF, imagen o texto · maximo 5 MB</Text>
              </View>
            </Pressable>

            <Text style={styles.inputLabel}>Titulo</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Resumen unidad 2"
              placeholderTextColor="#64748b"
              style={styles.input}
              maxLength={80}
            />

            <Text style={styles.inputLabel}>Descripcion</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Detalle opcional"
              placeholderTextColor="#64748b"
              style={[styles.input, styles.textArea]}
              multiline
              maxLength={300}
            />

            <Text style={styles.inputLabel}>Temas</Text>
            <View style={styles.topicSelector}>
              {topics.length === 0 ? (
                <Text style={styles.noTopicText}>Todavia no hay temas en esta sala.</Text>
              ) : (
                topics.map(topic => {
                  const selected = selectedTopicIds.includes(topic.id);
                  return (
                    <Pressable
                      key={topic.id}
                      style={[
                        styles.selectableTopic,
                        selected && { borderColor: accentColor, backgroundColor: `${accentColor}22` },
                      ]}
                      onPress={() => toggleTopic(topic.id)}
                    >
                      <Text style={[styles.topicText, selected && { color: accentColor }]}>{topic.name}</Text>
                    </Pressable>
                  );
                })
              )}
            </View>

            <View style={styles.newTopicRow}>
              <TextInput
                value={newTopicName}
                onChangeText={setNewTopicName}
                placeholder="Crear tema"
                placeholderTextColor="#64748b"
                style={[styles.input, styles.newTopicInput]}
                maxLength={50}
              />
              <Pressable style={[styles.createTopicBtn, { backgroundColor: accentColor }]} onPress={handleCreateTopic}>
                <Plus color="white" size={18} />
              </Pressable>
            </View>
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: canSave ? accentColor : '#334155' }]}
            disabled={!canSave}
            onPress={handleSave}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar en The Vault</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function inferMimeType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

async function saveFileToDevice(fileName: string, mimeType: string, base64: string): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;

  if (saf?.requestDirectoryPermissionsAsync) {
    const permissions = await saf.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      Alert.alert('Descarga cancelada', 'No se selecciono una carpeta para guardar el archivo.');
      return null;
    }

    const fileUri = await saf.createFileAsync(permissions.directoryUri, fileName, mimeType);
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  }

  const directory = FileSystem.documentDirectory;
  if (!directory) {
    throw new Error('No se encontro una carpeta local para guardar el archivo.');
  }

  const localUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(localUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return localUri;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getTypeLabel(type: VaultResourceType | 'all'): string {
  const labels = {
    all: 'Todos',
    pdf: 'PDF',
    image: 'Imagen',
    text: 'Texto',
    other: 'Otro',
  };
  return labels[type];
}

function normalizeTopicName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

const styles = StyleSheet.create({
  container: { paddingBottom: 36 },
  header: { marginBottom: 16 },
  roomName: { color: '#f8fafc', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#94a3b8', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#f8fafc', fontSize: 14 },
  searchBtn: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingBottom: 14 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  uploadBtn: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  uploadBtnText: { color: 'white', fontWeight: '900', fontSize: 14 },
  loadingState: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  mutedText: { color: '#94a3b8' },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginTop: 10 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 6 },
  list: { gap: 12 },
  materialCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
    padding: 14,
  },
  materialTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  fileIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  materialInfo: { flex: 1 },
  materialTitle: { color: '#f8fafc', fontWeight: '900', fontSize: 15 },
  materialMeta: { color: '#94a3b8', marginTop: 2, fontSize: 12 },
  materialDescription: { color: '#cbd5e1', marginTop: 12, lineHeight: 18 },
  fileName: { color: '#64748b', marginTop: 8, fontSize: 12 },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  topicPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  topicText: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  noTopicText: { color: '#64748b', fontSize: 12 },
  materialFooter: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  authorText: { color: '#94a3b8', fontSize: 12, flex: 1 },
  materialActions: { flexDirection: 'row', gap: 8 },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.78)', justifyContent: 'flex-end' },
  modalContent: {
    maxHeight: '88%',
    backgroundColor: '#020617',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingTop: 16, paddingBottom: 12 },
  inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 12 },
  filePicker: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  filePickerTextBox: { flex: 1 },
  filePickerTitle: { color: '#f8fafc', fontWeight: '800' },
  filePickerSub: { color: '#64748b', fontSize: 12, marginTop: 2 },
  input: {
    minHeight: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    paddingHorizontal: 12,
  },
  textArea: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  topicSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectableTopic: {
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  newTopicRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
  newTopicInput: { flex: 1 },
  createTopicBtn: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: 'white', fontWeight: '900' },
});
