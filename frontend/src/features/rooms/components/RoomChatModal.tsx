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
import { useThemeStore } from '../../../store/themeStore';
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
  const colors = useThemeStore(state => state.colors);
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
      return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  }, []);

  const loadMessages = useCallback(async (options?: { after?: string; initial?: boolean }) => {
    if (!accessToken || !roomId) return;
    if (options?.initial) setLoading(true);
    try {
      setError(null);
      const data = await fetchRoomMessages(accessToken, roomId, { limit: 50, after: options?.after });
      if (options?.initial) setMessages(data);
      else mergeMessages(data);
    } catch (loadError: any) {
      setError(loadError.message ?? 'No se pudo cargar el chat.');
    } finally {
      if (options?.initial) setLoading(false);
    }
  }, [accessToken, mergeMessages, roomId]);

  useEffect(() => {
    if (!visible) { setContent(''); setError(null); return; }
    loadMessages({ initial: true });
  }, [loadMessages, visible]);

  useEffect(() => {
    if (!visible) return;
    const intervalId = setInterval(() => {
      if (AppState.currentState === 'active') loadMessages({ after: lastCreatedAt });
    }, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [lastCreatedAt, loadMessages, visible]);

  useEffect(() => {
    if (visible && messages.length > 0) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
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

  const title = useMemo(() => roomName?.trim() ? `Chat de ${roomName.trim()}` : 'Chat de sala', [roomName]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.headerTextBox}><Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text></View>
            <Pressable style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={onClose}><X color={colors.textMuted} size={20} /></Pressable>
          </View>

          {loading ? (
            <View style={styles.stateBox}><ActivityIndicator color={accentColor} /><Text style={[styles.stateText, { color: colors.textSoft }]}>Cargando mensajes...</Text></View>
          ) : messages.length === 0 ? (
            <View style={styles.stateBox}><Inbox color={colors.textSoft} size={32} /><Text style={[styles.stateText, { color: colors.textSoft }]}>Todavia no hay mensajes.</Text></View>
          ) : (
            <FlatList ref={listRef} data={messages} keyExtractor={item => item.id} contentContainerStyle={styles.messageList} renderItem={({ item }) => (
                <View style={[styles.messageBubble, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.messageAuthor, { color: colors.accent }]}>{item.sender_username}</Text>
                  <Text style={[styles.messageText, { color: colors.text }]}>{item.content}</Text>
                </View>
              )} />
          )}

          {error && <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>{error}</Text>}

          <View style={styles.inputRow}>
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput value={content} onChangeText={setContent} placeholder="Mensaje" placeholderTextColor={colors.textSoft} maxLength={MAX_MESSAGE_LENGTH} style={[styles.input, { color: colors.text }]} returnKeyType="send" onSubmitEditing={handleSend} />
              <Text style={[styles.counter, { color: colors.textSoft }, remainingChars < 10 && { color: colors.warning }]}>{remainingChars}</Text>
            </View>
            <Pressable style={[styles.sendBtn, { backgroundColor: canSend ? accentColor : colors.surfaceElevated }]} onPress={handleSend} disabled={!canSend}>
              {sending ? <ActivityIndicator color="white" /> : <Send color="white" size={20} />}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { height: '72%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTextBox: { flex: 1, paddingRight: 12 },
  title: { fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  stateBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText: { fontWeight: '700' },
  messageList: { paddingVertical: 8, gap: 10 },
  messageBubble: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  messageAuthor: { fontSize: 12, fontWeight: '900', marginBottom: 4 },
  messageText: { fontSize: 15, lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  inputBox: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingLeft: 14, paddingRight: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 10 },
  counter: { fontSize: 12, fontWeight: '800', marginLeft: 8 },
  sendBtn: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});