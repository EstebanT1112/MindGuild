import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Check, X, Users, Image as ImageIcon } from 'lucide-react-native';
import { useThemeStore } from '../../../store/themeStore';
import { fetchPendingSessionReviews, reviewStudySession, type PendingReviewSession } from '../services/sessionsService';

interface ReviewPeerSessionsModalProps {
  visible: boolean;
  roomId: string | null;
  accessToken: string | null;
  onClose: () => void;
  onRefreshRanking: () => void;
}

export default function ReviewPeerSessionsModal({
  visible,
  roomId,
  accessToken,
  onClose,
  onRefreshRanking,
}: ReviewPeerSessionsModalProps) {
  const colors = useThemeStore(state => state.colors);
  const [reviews, setReviews] = useState<PendingReviewSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [votingSessionId, setVotingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && roomId && accessToken) {
      loadPendingReviews();
    }
  }, [visible, roomId, accessToken]);

  const loadPendingReviews = async () => {
    if (!accessToken || !roomId) return;
    setLoading(true);
    try {
      const data = await fetchPendingSessionReviews(accessToken, roomId);
      setReviews(data);
      setImageErrors({});
    } catch (error: any) {
      console.error('[ReviewPeerSessionsModal] Error al cargar revisiones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (sessionId: string, vote: 'accept' | 'reject') => {
    if (!accessToken || votingSessionId) return;

    setVotingSessionId(sessionId);
    try {
      await reviewStudySession(accessToken, sessionId, { vote, comment: 'Resolución cruzada de sala' });
      Alert.alert(
        vote === 'accept' ? 'Sesión Aprobada' : 'Sesión Rechazada',
        vote === 'accept' ? 'Validaste los minutos de tu compañero.' : 'Rechazaste la sesión por considerarla inválida.'
      );
      setReviews((prev) => prev.filter((r) => r.id !== sessionId));
      onRefreshRanking();
    } catch (error: any) {
      Alert.alert('Error', error.message ?? 'No se pudo procesar tu votación.');
    } finally {
      setVotingSessionId(null);
    }
  };

  const handleImageError = (sessionId: string) => {
    setImageErrors((prev) => ({ ...prev, [sessionId]: true }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <Users color={colors.accent} size={22} />
            <Text style={[styles.title, { color: colors.text }]}>Tribunal de Sala</Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.accent} size="large" style={{ marginVertical: 40 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No hay sesiones pendientes</Text>
              <Text style={[styles.emptySub, { color: colors.textSoft }]}>¡Tus compañeros están al día con sus apuntes!</Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {reviews.map((item) => {
                const hasImageError = imageErrors[item.id];
                const isThisLoading = votingSessionId === item.id;
                const isAnyLoading = votingSessionId !== null;

                return (
                  <View key={item.id} style={[styles.reviewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.userName, { color: colors.accent }]}>@{item.username}</Text>
                    <Text style={[styles.duration, { color: colors.textMuted }]}>Estudió: {item.duration_minutes} minutos</Text>
                    
                    <View style={[styles.imageWrapper, { backgroundColor: colors.surfaceElevated }]}>
                      {!hasImageError && item.evidence_photo_url ? (
                        <Image 
                          source={{ uri: item.evidence_photo_url }} 
                          style={styles.evidenceImg} 
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <View style={[styles.imageFallbackBox, { borderColor: colors.border }]}>
                          <ImageIcon color={colors.textSoft} size={32} />
                          <Text style={[styles.imageFallbackText, { color: colors.textSoft }]}>Evidencia fotográfica en revisión</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.summary, { color: colors.text }]}>&ldquo;{item.summary_text}&rdquo;</Text>

                    <View style={styles.btnRow}>
                      <Pressable 
                        style={[styles.voteBtn, { backgroundColor: colors.danger }, isAnyLoading && styles.disabledBtn]} 
                        onPress={() => handleVote(item.id, 'reject')}
                        disabled={isAnyLoading}
                      >
                        {isThisLoading && votingSessionId === item.id ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <X color="white" size={18} />
                            <Text style={styles.btnText}>Fraude</Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable 
                        style={[styles.voteBtn, { backgroundColor: colors.accent }, isAnyLoading && styles.disabledBtn]} 
                        onPress={() => handleVote(item.id, 'accept')}
                        disabled={isAnyLoading}
                      >
                        {isThisLoading ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Check color="white" size={18} />
                            <Text style={styles.btnText}>Aceptar</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <Pressable 
            style={[styles.closeBtn, { backgroundColor: colors.surfaceElevated }, votingSessionId !== null && styles.disabledBtn]} 
            onPress={onClose}
            disabled={votingSessionId !== null}
          >
            <Text style={[styles.closeText, { color: colors.text }]}>Volver a la Sala</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 16 },
  modalContainer: { borderRadius: 24, padding: 20, maxHeight: '80%', borderWidth: 1 },
  header: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  scroll: { marginVertical: 10 },
  emptyBox: { alignItems: 'center', marginVertical: 40, gap: 6 },
  emptyText: { fontWeight: 'bold', fontSize: 15 },
  emptySub: { fontSize: 13 },
  reviewCard: { padding: 14, borderRadius: 16, marginBottom: 14, borderWidth: 1 },
  userName: { fontWeight: 'bold', fontSize: 15 },
  duration: { fontSize: 13, marginVertical: 2 },
  imageWrapper: { width: '100%', height: 140, borderRadius: 12, overflow: 'hidden', marginVertical: 8 },
  evidenceImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageFallbackBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12 },
  imageFallbackText: { fontSize: 13, fontWeight: '500' },
  summary: { fontSize: 14, fontStyle: 'italic', marginBottom: 12, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 10 },
  voteBtn: { flex: 1, height: 38, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  disabledBtn: { opacity: 0.4 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  closeBtn: { marginTop: 10, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontWeight: 'bold' },
});