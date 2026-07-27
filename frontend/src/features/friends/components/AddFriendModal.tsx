import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from 'react-native';
import { X, Search, UserPlus, Flame, Check, Clock } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { authenticatedFetch } from '../../../services/authenticatedFetch';
import Constants from 'expo-constants';

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
  streak_days: number;
  total_study_minutes: number;
  are_friends: boolean;
  request_pending: boolean;
}

const getApiUrl = (): string => {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGoLaunchContext?.debuggerHost;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

export default function AddFriendModal({ visible, onClose }: AddFriendModalProps) {
  const colors = useThemeStore((s) => s.colors);
  const auth = useAuthStore() as any;
  const token = auth?.access_token || auth?.token;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await authenticatedFetch(
          `${getApiUrl()}/friends/search?q=${encodeURIComponent(searchQuery)}`,
          {},
          token
        );
        const json = (await res.json()) as { success: boolean; data?: SearchResult[] };
        if (json.success && json.data) {
          setResults(json.data);
        } else {
          setResults([]);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchUsers(query.trim());
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchUsers]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSendingId(null);
      setSentIds(new Set());
      setFeedback(null);
    }
  }, [visible]);

  const handleSendRequest = async (item: SearchResult) => {
    if (!token) return;
    setSendingId(item.id);
    setFeedback(null);
    try {
      const res = await authenticatedFetch(
        `${getApiUrl()}/friends/requests`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: item.username }),
        },
        token
      );
      const json = (await res.json()) as { success: boolean; error?: string };
      if (json.success) {
        setSentIds((prev) => new Set(prev).add(item.id));
        setFeedback({ type: 'success', message: `Solicitud enviada a ${item.username}` });
        setResults((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, request_pending: true } : r
          )
        );
      } else {
        setFeedback({ type: 'error', message: json.error || 'No se pudo enviar la solicitud.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error de conexión.' });
    } finally {
      setSendingId(null);
    }
  };

  const renderItem = ({ item }: { item: SearchResult }) => {
    const isSending = sendingId === item.id;
    const isFriend = item.are_friends;
    const isPending = item.request_pending || sentIds.has(item.id);

    let buttonContent: React.ReactNode;
    let buttonDisabled = true;
    let buttonStyle: any = {};

    if (isFriend) {
      buttonContent = <Text style={[styles.statusText, { color: colors.accent }]}>Amigo</Text>;
    } else if (isPending) {
      buttonContent = <Clock color={colors.textMuted} size={16} />;
      buttonStyle = { backgroundColor: colors.surface };
    } else {
      buttonDisabled = isSending;
      buttonContent = isSending ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <UserPlus color="#ffffff" size={16} />
      );
      buttonStyle = { backgroundColor: colors.accent };
    }

    return (
      <View style={[styles.resultCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.avatarAccent, borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.avatarText }]}>
              {item.username ? item.username[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.resultInfo}>
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {item.username}
            </Text>
            <View style={styles.statsRow}>
              <View style={[styles.streakBadge, { backgroundColor: colors.warningSoft }]}>
                <Flame size={11} color={colors.warning} />
                <Text style={[styles.streakText, { color: colors.warning }]}>
                  {item.streak_days}d
                </Text>
              </View>
              <Text style={[styles.minutesText, { color: colors.textMuted }]}>
                {item.total_study_minutes} min
              </Text>
            </View>
          </View>
          {!isFriend && (
            <Pressable
              style={[styles.addBtn, buttonStyle]}
              onPress={() => handleSendRequest(item)}
              disabled={buttonDisabled}
            >
              {buttonContent}
            </Pressable>
          )}
          {isFriend && (
            <View style={[styles.addBtn, { backgroundColor: colors.surface }]}>
              {buttonContent}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (query.trim().length < 2) {
      return (
        <View style={styles.hintContainer}>
          <Search color={colors.textSoft} size={28} style={{ opacity: 0.4 }} />
          <Text style={[styles.hintText, { color: colors.textSoft }]}>
            Escribí al menos 2 caracteres
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.hintContainer}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.hintContainer}>
          <Text style={[styles.hintText, { color: colors.textSoft }]}>
            No se encontraron usuarios
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.resultsList}
      />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={Keyboard.dismiss}>
        <View style={[styles.modalCard, { backgroundColor: colors.surfaceElevated }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Buscar Amigos</Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.border }]}
            >
              <X color={colors.text} size={20} />
            </Pressable>
          </View>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.input, borderColor: colors.inputBorder },
            ]}
          >
            <Search color={colors.textSoft} size={18} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Buscar por username..."
              placeholderTextColor={colors.textSoft}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <X color={colors.textSoft} size={16} />
              </Pressable>
            )}
          </View>

          {feedback && (
            <View
              style={[
                styles.feedback,
                {
                  backgroundColor:
                    feedback.type === 'success' ? colors.accentSoft || '#1a3a2a' : colors.dangerSoft || '#3a1a1a',
                },
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? colors.accent : colors.danger },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {renderContent()}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    gap: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    flex: 1,
  },
  hintContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  hintText: {
    fontSize: 14,
  },
  resultsList: {
    maxHeight: 320,
  },
  resultCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  resultInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  minutesText: {
    fontSize: 11,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  feedback: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
