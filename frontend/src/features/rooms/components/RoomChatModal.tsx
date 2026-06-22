import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Inbox, Send, X } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { fetchRoomMessages, sendRoomMessage, type RoomMessage } from '../services/chatService';

const POLLING_INTERVAL_MS = 60000;
const MAX_MESSAGE_LENGTH = 50;

interface RoomChatModalProps {
  visible: boolean;
  roomId: string;
  roomName?: string | null;
  accentColor?: string;
  onClose: () => void;
}

export default function RoomChatModal({
  visible,
  roomId,
  roomName,
  accentColor = '#22c55e',
  onClose,
}: RoomChatModalProps) {
  const accessToken = useAuthStore(state => state.access_token);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<RoomMessage>>(null);

  const lastCreatedAt = messages.length > 0 ? messages[messages.length - 1].created_at : undefined;
  const remainingChars = MAX_MESSAGE_LENGTH - content.length;
  const canSend = content.trim().length > 0 && content.length <= MAX_MESSAGE_LENGTH && !sending;

  const mergeMessages = useCallback((incoming: RoomMessage[]) => {
    if (incoming.length === 0) return;

    setMessages(current => {
      const map = new Map(current.map(item => [item.id, item]));
      incoming.forEach(item => map.set(item.id, item));

      return Array.from(map.values()).sort((a, b) => (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
    });
  }, []);

  const loadMessages = useCallback(async (options?: { after?: string; initial?: boolean }) => {
    if (!accessToken || !roomId) return;

    if (options?.initial) setLoading(true);
    try {
      setError(null);
      const data = await fetchRoomMessages(accessToken, roomId, {
        limit: 50,
        after: options?.after,
      });

      if (options?.initial) {
        setMessages(data);
      } else {
        mergeMessages(data);
      }
    } catch (loadError: any) {
      setError(loadError.message ?? 'No se pudo cargar el chat.');
    } finally {
      if (options?.initial) setLoading(false);
    }
  }, [accessToken, mergeMessages, roomId]);

  useEffect(() => {
    if (!visible) {
      setContent('');
      setError(null);
      return;
    }

    loadMessages({ initial: true });
  }, [loadMessages, visible]);

  useEffect(() => {
    if (!visible) return;

    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') {
        loadMessages({ after: lastCreatedAt });
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [lastCreatedAt, loadMessages, visible]);

  useEffect(() => {
    if (visible && messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length, visible]);

  const handleSend = async () => {
    if (!accessToken || !canSend) return;

    try {
      setSending(true);
      setError(null);
      const created = await sendRoomMessage(accessToken, roomId, content.trim());
      mergeMessages([created]);
      setContent('');
    } catch (sendError: any) {
      setError(sendError.message ?? 'No se pudo enviar el mensaje.');
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(() => {
    if (roomName?.trim()) return `Chat de ${roomName.trim()}`;
    return 'Chat de sala';
  }, [roomName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerTextBox}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X color="#cbd5e1" size={20} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.stateText}>Cargando mensajes...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.stateBox}>
              <Inbox color="#64748b" size={32} />
              <Text style={styles.stateText}>Todavia no hay mensajes.</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => (
                <View style={styles.messageBubble}>
                  <Text style={styles.messageAuthor}>{item.sender_username}</Text>
                  <Text style={styles.messageText}>{item.content}</Text>
                </View>
              )}
            />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.inputRow}>
            <View style={styles.inputBox}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Mensaje"
                placeholderTextColor="#64748b"
                maxLength={MAX_MESSAGE_LENGTH}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Text style={[styles.counter, remainingChars < 10 && styles.counterWarning]}>
                {remainingChars}
              </Text>
            </View>
            <Pressable
              style={[styles.sendBtn, { backgroundColor: canSend ? accentColor : '#334155' }]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {sending ? <ActivityIndicator color="white" /> : <Send color="white" size={20} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
  },
  modalCard: {
    height: '72%',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextBox: { flex: 1, paddingRight: 12 },
  title: { color: 'white', fontSize: 20, fontWeight: '900' },
  subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { color: '#94a3b8', fontWeight: '700' },
  messageList: { paddingVertical: 8, gap: 10 },
  messageBubble: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageAuthor: { color: '#cbd5e1', fontSize: 12, fontWeight: '900', marginBottom: 4 },
  messageText: { color: 'white', fontSize: 15, lineHeight: 20 },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  inputBox: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingLeft: 14,
    paddingRight: 10,
  },
  input: { flex: 1, color: 'white', fontSize: 15, paddingVertical: 10 },
  counter: { color: '#64748b', fontSize: 12, fontWeight: '800', marginLeft: 8 },
  counterWarning: { color: '#f59e0b' },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
