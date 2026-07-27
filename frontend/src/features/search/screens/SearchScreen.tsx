import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  FileText,
  Flame,
  Search,
  Users,
  X,
} from 'lucide-react-native';
import ScreenLayout from '../../../components/ui/ScreenLayout';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { authenticatedFetch } from '../../../services/authenticatedFetch';
import { API_BASE_URL } from '../../../services/apiConfig';

interface RoomResult {
  id: string;
  name: string;
  mode: string;
  teams_enabled: boolean;
  members_count: string;
}

interface FriendResult {
  id: string;
  username: string;
  avatar_url: string | null;
  streak_days: number;
  total_study_minutes: number;
}

interface MaterialResult {
  id: string;
  title: string;
  resource_type: string;
  file_name: string;
  room_name: string;
  room_id: string;
}

interface SearchData {
  rooms: RoomResult[];
  friends: FriendResult[];
  materials: MaterialResult[];
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore(state => state.access_token);
  const colors = useThemeStore(state => state.colors);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchData>({ rooms: [], friends: [], materials: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({ rooms: [], friends: [], materials: [] });
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(q.trim());
      const response = await authenticatedFetch(`${API_BASE_URL}/search?q=${encoded}`, {}, accessToken);
      const json = await response.json();
      if (json.success) {
        setResults(json.data);
        setHasSearched(true);
      }
    } catch {
      setResults({ rooms: [], friends: [], materials: [] });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(text), 400);
  };

  const clearQuery = () => {
    setQuery('');
    setResults({ rooms: [], friends: [], materials: [] });
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleRoomPress = (room: RoomResult) => {
    navigation.navigate('Salas', {
      screen: room.mode === 'battle_royale' ? 'BattleRoyale' : 'LiveRoom',
      params: { roomId: room.id, roomName: room.name },
    });
  };

  const handleMaterialPress = (material: MaterialResult) => {
    navigation.navigate('RoomVault', { roomId: material.room_id, roomName: material.room_name });
  };

  const totalResults = results.rooms.length + results.friends.length + results.materials.length;

  const getInitial = (username: string) => username?.charAt(0).toUpperCase() ?? '?';

  const formatMinutes = (mins: number) => {
    if (!mins) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <ScreenLayout title="Búsqueda" hideRightAction>
      <View style={styles.container}>
        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
          <Search color={colors.textSoft} size={18} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar salas, amigos o materiales..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleTextChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={clearQuery} hitSlop={8}>
              <X color={colors.textSoft} size={18} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : query.length < 2 ? (
          <View style={styles.centerState}>
            <Search color={colors.textSoft} size={40} strokeWidth={1.5} />
            <Text style={[styles.hintText, { color: colors.textSoft }]}>
              Escribí al menos 2 caracteres
            </Text>
          </View>
        ) : hasSearched && totalResults === 0 ? (
          <View style={styles.centerState}>
            <Search color={colors.textSoft} size={40} strokeWidth={1.5} />
            <Text style={[styles.hintText, { color: colors.textSoft }]}>
              No se encontraron resultados para "{query}"
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.resultsContainer} showsVerticalScrollIndicator={false}>
            {/* Rooms Section */}
            {results.rooms.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.accentSoft }]}>
                    <Users color={colors.accent} size={14} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Salas</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.countText, { color: colors.accent }]}>{results.rooms.length}</Text>
                  </View>
                </View>
                {results.rooms.map(room => (
                  <Pressable
                    key={room.id}
                    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleRoomPress(room)}
                  >
                    <View style={styles.roomIconBox}>
                      <Users color={room.mode === 'battle_royale' ? colors.purple : colors.accent} size={18} />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{room.name}</Text>
                      <View style={styles.resultMeta}>
                        <Text style={[styles.modeTag, { color: room.mode === 'battle_royale' ? colors.purple : colors.accent }]}>
                          {room.mode === 'battle_royale' ? 'Battle Royale' : 'Supervivencia'}
                        </Text>
                        <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>{room.members_count} miembros</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Friends Section */}
            {results.friends.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.infoSoft }]}>
                    <Flame color={colors.info} size={14} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Amigos</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.infoSoft }]}>
                    <Text style={[styles.countText, { color: colors.info }]}>{results.friends.length}</Text>
                  </View>
                </View>
                {results.friends.map(friend => (
                  <View
                    key={friend.id}
                    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[styles.avatarBox, { backgroundColor: colors.avatarAccent }]}>
                      {friend.avatar_url ? (
                        <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                          {getInitial(friend.username)}
                        </Text>
                      ) : (
                        <Text style={[styles.avatarText, { color: colors.avatarText }]}>
                          {getInitial(friend.username)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{friend.username}</Text>
                      <View style={styles.resultMeta}>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          🔥 {friend.streak_days} días · {formatMinutes(friend.total_study_minutes)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Materials Section */}
            {results.materials.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.warningSoft }]}>
                    <FileText color={colors.warning} size={14} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Materiales</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.warningSoft }]}>
                    <Text style={[styles.countText, { color: colors.warning }]}>{results.materials.length}</Text>
                  </View>
                </View>
                {results.materials.map(material => (
                  <Pressable
                    key={material.id}
                    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => handleMaterialPress(material)}
                  >
                    <View style={[styles.matIconBox, { backgroundColor: colors.warningSoft }]}>
                      <FileText color={colors.warning} size={18} />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>{material.title}</Text>
                      <View style={styles.resultMeta}>
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {material.resource_type} · {material.room_name}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  hintText: { fontSize: 14, textAlign: 'center' },
  resultsContainer: { paddingBottom: 20 },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIcon: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, flex: 1 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  countText: { fontSize: 11, fontWeight: '900' },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  roomIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', fontSize: 16 },
  matIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  modeTag: { fontSize: 11, fontWeight: '800' },
  metaDot: { fontSize: 11 },
  metaText: { fontSize: 12 },
});
