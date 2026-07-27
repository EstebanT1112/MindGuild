import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
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
  const accessToken = useAuthStore((state) => state.access_token);
  const roomId = String(route.params?.roomId ?? '');
  const roomName = String(route.params?.roomName ?? 'Sala');
  const accentColor = route.params?.accentColor ? String(route.params.accentColor) : '#22c55e';

  const { colors } = useThemeStore();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [materials, setMaterials] = useState<VaultMaterial[]>([]);
  const [topics, setTopics] = useState<AcademicTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<VaultResourceType | 'all'>('all');

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
      showAlert('The Vault', error.message ?? 'No se pudo cargar The Vault', 'error');
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
        showAlert('Material descargado', `Se guardó como ${safeName}`, 'success');
      }
    } catch (error: any) {
      showAlert('The Vault', error.message ?? 'No se pudo descargar el material', 'error');
    }
  };

  const handleDelete = (material: VaultMaterial) => {
    if (!accessToken) return;

    showAlert(
      'Eliminar material',
      `¿Eliminar "${material.title}" de The Vault?`,
      'warning',
      async () => {
        try {
          await deleteVaultMaterial(accessToken, roomId, material.id);
          setMaterials((current) => current.filter((item) => item.id !== material.id));
          showAlert('The Vault', 'Material eliminado correctamente.', 'success');
        } catch (error: any) {
          showAlert('The Vault', error.message ?? 'No se pudo eliminar el material', 'error');
        }
      },
      'Eliminar',
      true,
      'Cancelar'
    );
  };

  return (
    <>
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
              <Search color={colors.textMuted} size={18} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar por archivo o categoría"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
            </View>
            <Pressable style={[styles.searchBtn, { backgroundColor: accentColor }]} onPress={handleSearch}>
              <Search color="#ffffff" size={18} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {(['all', 'pdf', 'image', 'text', 'other'] as const).map((type) => (
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
            <Plus color="#ffffff" size={22} />
            <Text style={styles.uploadBtnText}>Agregar material</Text>
          </Pressable>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.mutedText}>Cargando materiales...</Text>
            </View>
          ) : materials.length === 0 ? (
            <View style={styles.emptyState}>
              <FolderOpen color={colors.textMuted} size={36} />
              <Text style={styles.emptyTitle}>Sin materiales</Text>
              <Text style={styles.emptyText}>Los archivos que suban los miembros activos van a aparecer acá.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {materials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  accentColor={accentColor}
                  onDownload={() => handleDownload(material)}
                  onDelete={() => handleDelete(material)}
                  colors={colors}
                  styles={styles}
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
          onCreated={(material) => {
            setMaterials((current) => [material, ...current]);
            setUploadVisible(false);
          }}
          onTopicCreated={(topic) => setTopics((current) => [...current, topic])}
          colors={colors}
          styles={styles}
        />
      </ScreenLayout>

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

function MaterialCard({
  material,
  accentColor,
  onDownload,
  onDelete,
  colors,
  styles,
}: {
  material: VaultMaterial;
  accentColor: string;
  onDownload: () => void;
  onDelete: () => void;
  colors: any;
  styles: any;
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
          material.topics.map((topic) => (
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
            <Download color={colors.textMuted} size={18} />
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onDelete}>
            <Trash2 color={colors.danger} size={18} />
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
  colors,
  styles,
}: {
  visible: boolean;
  roomId: string;
  accessToken: string | null;
  accentColor: string;
  topics: AcademicTopic[];
  onClose: () => void;
  onCreated: (material: VaultMaterial) => void;
  onTopicCreated: (topic: AcademicTopic) => void;
  colors: any;
  styles: any;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fileBase64, setFileBase64] = useState('');
  const [saving, setSaving] = useState(false);

  // ✅ Estado para AppAlert interno
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

  const showAlertInternal = (
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
      showAlertInternal('Archivo demasiado grande', 'El archivo no puede superar 5 MB.', 'warning');
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
    setSelectedTopicIds((current) =>
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : current.length >= 5
        ? current
        : [...current, topicId]
    );
  };

  const handleCreateTopic = async () => {
    if (!accessToken || !newTopicName.trim()) return;

    const existingTopic = topics.find(
      (topic) => normalizeTopicName(topic.name) === normalizeTopicName(newTopicName)
    );
    if (existingTopic) {
      setSelectedTopicIds((current) =>
        current.includes(existingTopic.id) ? current : [...current, existingTopic.id]
      );
      setNewTopicName('');
      showAlertInternal('Tema existente', 'Ese tema ya existe y fue seleccionado.', 'info');
      return;
    }

    try {
      const topic = await createRoomTopic(accessToken, roomId, { name: newTopicName.trim() });
      onTopicCreated(topic);
      setSelectedTopicIds((current) => [...current, topic.id]);
      setNewTopicName('');
    } catch (error: any) {
      showAlertInternal('The Vault', error.message ?? 'No se pudo crear el tema', 'error');
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
      showAlertInternal('The Vault', error.message ?? 'No se pudo guardar el material', 'error');
      setSaving(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar material</Text>
              <Pressable style={styles.closeBtn} onPress={handleClose}>
                <X color={colors.textMuted} size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              <Text style={styles.inputLabel}>Archivo</Text>
              <Pressable style={styles.filePicker} onPress={handlePickFile}>
                <Upload color={accentColor} size={22} />
                <View style={styles.filePickerTextBox}>
                  <Text style={styles.filePickerTitle}>{selectedFile?.name ?? 'Seleccionar archivo'}</Text>
                  <Text style={styles.filePickerSub}>PDF, imagen o texto · máximo 5 MB</Text>
                </View>
              </Pressable>

              <Text style={styles.inputLabel}>Título</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Resumen unidad 2"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                maxLength={80}
              />

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Detalle opcional"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textArea]}
                multiline
                maxLength={300}
              />

              <Text style={styles.inputLabel}>Temas</Text>
              <View style={styles.topicSelector}>
                {topics.length === 0 ? (
                  <Text style={styles.noTopicText}>Todavía no hay temas en esta sala.</Text>
                ) : (
                  topics.map((topic) => {
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
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.newTopicInput]}
                  maxLength={50}
                />
                <Pressable style={[styles.createTopicBtn, { backgroundColor: accentColor }]} onPress={handleCreateTopic}>
                  <Plus color="#ffffff" size={18} />
                </Pressable>
              </View>
            </ScrollView>

            <Pressable
              style={[styles.saveBtn, { backgroundColor: canSave ? accentColor : colors.border }]}
              disabled={!canSave}
              onPress={handleSave}
            >
              {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Guardar en The Vault</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ✅ AppAlert interno para el modal */}
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

function inferMimeType(fileName: string): string {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) return 'application/pdf';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  if (lowerName.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

// ✅ Función auxiliar que usa Alert del sistema (no puede usar el estado de React)
async function saveFileToDevice(fileName: string, mimeType: string, base64: string): Promise<string | null> {
  const saf = FileSystem.StorageAccessFramework;

  if (saf?.requestDirectoryPermissionsAsync) {
    const permissions = await saf.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
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
    throw new Error('No se encontró una carpeta local para guardar el archivo.');
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

// ------------------------------------------------------------
// Estilos dinámicos con tokens del tema
// ------------------------------------------------------------
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { paddingBottom: 36 },
    header: { marginBottom: 16 },
    roomName: { color: colors.text, fontSize: 20, fontWeight: '900' },
    subtitle: { color: colors.textMuted, marginTop: 4 },
    searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    searchBox: {
      flex: 1,
      minHeight: 48,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: { flex: 1, color: colors.text, fontSize: 14 },
    searchBtn: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    filters: { gap: 8, paddingBottom: 14 },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
    },
    filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
    uploadBtn: {
      minHeight: 52,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    uploadBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
    loadingState: { alignItems: 'center', gap: 10, paddingVertical: 30 },
    mutedText: { color: colors.textMuted },
    emptyState: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      padding: 24,
    },
    emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 10 },
    emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 6 },
    list: { gap: 12 },
    materialCard: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
    },
    materialTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    fileIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    materialInfo: { flex: 1 },
    materialTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
    materialMeta: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
    materialDescription: { color: colors.text, marginTop: 12, lineHeight: 18 },
    fileName: { color: colors.textMuted, marginTop: 8, fontSize: 12 },
    topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    topicPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
    topicText: { color: colors.text, fontSize: 12, fontWeight: '700' },
    noTopicText: { color: colors.textMuted, fontSize: 12 },
    materialFooter: {
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    authorText: { color: colors.textMuted, fontSize: 12, flex: 1 },
    materialActions: { flexDirection: 'row', gap: 8 },
    iconAction: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContent: {
      maxHeight: '88%',
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 18,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: { paddingTop: 16, paddingBottom: 12 },
    inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900', marginBottom: 8, marginTop: 12 },
    filePicker: {
      minHeight: 58,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
    },
    filePickerTextBox: { flex: 1 },
    filePickerTitle: { color: colors.text, fontWeight: '800' },
    filePickerSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
    input: {
      minHeight: 46,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      paddingHorizontal: 12,
    },
    textArea: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
    topicSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectableTopic: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    newTopicRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10 },
    newTopicInput: { flex: 1 },
    createTopicBtn: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    saveBtn: { minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#ffffff', fontWeight: '900' },
  });