import { create } from 'zustand';
import { API_BASE_URL, fetchRanking, type RankingEntry, type RankingType, type RankingScope } from '../services/apiConfig';
import { authenticatedFetch, SessionExpiredError } from '../services/authenticatedFetch';
import { fetchAchievements, type Achievement } from '../features/profiles/services/achievementsService';
import { fetchMyProfile, type FullProfile } from '../features/profiles/services/profileService';
import {
  fetchMyRooms,
  fetchRoomDetails,
  fetchRoomTimeRanking,
  type CreatedRoom,
  type JoinedRoom,
  type RoomDetails,
  type RoomTimeRankingEntry,
  type UserRoom,
} from '../features/rooms/services/roomsService';

const TTL = {
  profile: 5 * 60 * 1000,
  missions: 5 * 60 * 1000,
  rooms: 10 * 60 * 1000,
  achievements: 10 * 60 * 1000,
  globalRanking: 30 * 60 * 1000,
  roomRanking: 25 * 60 * 1000,
  roomDetails: 2 * 60 * 1000,
};

interface CacheEntry<T> {
  data: T | null;
  lastFetchedAt: number | null;
  isLoading: boolean;
  error: string | null;
  dirty: boolean;
}

export interface MissionSummary {
  id: string;
  mission_id?: string;
  title: string;
  description?: string | null;
  frequency?: 'daily' | 'weekly';
  period_key?: string;
  expires_at?: string | null;
  expired?: boolean;
  expiredMoreThan24h?: boolean;
  progress: number;
  target: number;
  percentage: number;
  completed: boolean;
  claimed: boolean;
  reward_coins: number;
}

interface AppDataState {
  profile: CacheEntry<FullProfile>;
  rooms: CacheEntry<UserRoom[]>;
  missions: CacheEntry<MissionSummary[]>;
  achievements: CacheEntry<Achievement[]>;
  globalRanking: CacheEntry<RankingEntry[]>;
  roomRankings: Record<string, CacheEntry<RoomTimeRankingEntry[]>>;
  roomDetails: Record<string, CacheEntry<RoomDetails>>;
  activeStudySession: {
    sessionId: string;
    roomId: string | null;
  } | null;

  loadProfile: (accessToken: string, options?: LoadOptions) => Promise<FullProfile | null>;
  setProfile: (profile: FullProfile) => void;
  invalidateProfile: () => void;

  loadRooms: (accessToken: string, options?: LoadOptions) => Promise<UserRoom[]>;
  addOrReplaceRoom: (room: CreatedRoom | JoinedRoom | UserRoom) => void;
  setRoomFavorite: (roomId: string, isFavorite: boolean) => void;
  removeRoom: (roomId: string) => void;
  markRoomActivity: (roomId: string) => void;
  invalidateRooms: () => void;

  loadMissions: (accessToken: string, options?: LoadOptions) => Promise<MissionSummary[]>;
  invalidateMissions: () => void;

  loadAchievements: (accessToken: string, options?: LoadOptions) => Promise<Achievement[]>;
  invalidateAchievements: () => void;

  loadGlobalRanking: (accessToken?: string, options?: LoadRankingOptions) => Promise<RankingEntry[]>;
  invalidateGlobalRanking: () => void;

  loadRoomRanking: (
    accessToken: string,
    roomId: string,
    options?: LoadOptions
  ) => Promise<RoomTimeRankingEntry[]>;
  invalidateRoomRanking: (roomId: string) => void;
  clearRoomRanking: (roomId: string) => void;

  loadRoomDetails: (accessToken: string, roomId: string, options?: LoadOptions) => Promise<RoomDetails | null>;
  setRoomDetails: (room: RoomDetails) => void;
  invalidateRoomDetails: (roomId: string) => void;
  clearRoomDetails: (roomId: string) => void;

  invalidateAfterRoomParticipation: () => void;
  invalidateAfterValidStudySession: (roomId?: string) => void;
  setActiveStudySession: (session: { sessionId: string; roomId: string | null } | null) => void;
  clearAll: () => void;
}

interface LoadOptions {
  force?: boolean;
}

interface LoadRankingOptions extends LoadOptions {
  type?: RankingType;
  scope?: RankingScope;
  limit?: number;
}

const createEntry = <T>(data: T | null = null): CacheEntry<T> => ({
  data,
  lastFetchedAt: null,
  isLoading: false,
  error: null,
  dirty: true,
});

const isFresh = <T>(entry: CacheEntry<T>, ttl: number) =>
  entry.data !== null &&
  !entry.dirty &&
  entry.lastFetchedAt !== null &&
  Date.now() - entry.lastFetchedAt < ttl;

const toUserRoom = (room: CreatedRoom | JoinedRoom | UserRoom): UserRoom => ({
  ...room,
  members_count: 'members_count' in room ? room.members_count : 1,
  role: 'role' in room ? room.role : 'owner',
  is_favorite: 'is_favorite' in room ? room.is_favorite : false,
  last_activity_at: 'last_activity_at' in room ? room.last_activity_at : null,
});

const sortUserRooms = (rooms: UserRoom[]) =>
  [...rooms].sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;

    const activityA = a.last_activity_at ? new Date(a.last_activity_at).getTime() : 0;
    const activityB = b.last_activity_at ? new Date(b.last_activity_at).getTime() : 0;

    return activityB - activityA;
  });

export const useAppDataStore = create<AppDataState>((set, get) => ({
  profile: createEntry<FullProfile>(),
  rooms: createEntry<UserRoom[]>([]),
  missions: createEntry<MissionSummary[]>([]),
  achievements: createEntry<Achievement[]>([]),
  globalRanking: createEntry<RankingEntry[]>([]),
  roomRankings: {},
  roomDetails: {},
  activeStudySession: null,

  loadProfile: async (accessToken, options = {}) => {
    const entry = get().profile;
    if (!options.force && isFresh(entry, TTL.profile)) return entry.data;
    if (entry.isLoading && entry.data) return entry.data;

    set({ profile: { ...entry, isLoading: true, error: null } });
    try {
      const data = await fetchMyProfile(accessToken);
      set({ profile: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } });
      return data;
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        set({ profile: { ...get().profile, isLoading: false, error: null } });
        throw error;
      }
      set({ profile: { ...get().profile, isLoading: false, error: error.message ?? 'No se pudo cargar el perfil' } });
      throw error;
    }
  },

  setProfile: profile =>
    set({ profile: { data: profile, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } }),

  invalidateProfile: () =>
    set(state => ({ profile: { ...state.profile, dirty: true } })),

  loadRooms: async (accessToken, options = {}) => {
    const entry = get().rooms;
    if (!options.force && isFresh(entry, TTL.rooms)) return entry.data ?? [];
    if (entry.isLoading && entry.data) return entry.data;

    set({ rooms: { ...entry, isLoading: true, error: null } });
    try {
      const data = await fetchMyRooms(accessToken);
      const sortedData = sortUserRooms(data);
      set({ rooms: { data: sortedData, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } });
      return sortedData;
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        set({ rooms: { ...get().rooms, isLoading: false, error: null } });
        throw error;
      }
      set({ rooms: { ...get().rooms, isLoading: false, error: error.message ?? 'No se pudieron cargar las salas' } });
      throw error;
    }
  },

  addOrReplaceRoom: room =>
    set(state => {
      const nextRoom = toUserRoom(room);
      const current = state.rooms.data ?? [];
      const nextRooms = sortUserRooms([nextRoom, ...current.filter(item => item.id !== nextRoom.id)]);
      return {
        rooms: {
          data: nextRooms,
          lastFetchedAt: Date.now(),
          isLoading: false,
          error: null,
          dirty: false,
        },
      };
    }),

  setRoomFavorite: (roomId, isFavorite) =>
    set(state => ({
      rooms: {
        ...state.rooms,
        data: (state.rooms.data ?? []).map(room =>
          room.id === roomId ? { ...room, is_favorite: isFavorite } : room
        ),
        lastFetchedAt: Date.now(),
      },
    })),

  removeRoom: roomId =>
    set(state => {
      const current = state.rooms.data ?? [];
      const { [roomId]: _removed, ...roomRankings } = state.roomRankings;
      const { [roomId]: _removedDetails, ...roomDetails } = state.roomDetails;
      return {
        rooms: {
          ...state.rooms,
          data: current.filter(room => room.id !== roomId),
          lastFetchedAt: Date.now(),
          dirty: false,
        },
        roomRankings,
        roomDetails,
      };
    }),

  markRoomActivity: roomId =>
    set(state => ({
      rooms: {
        ...state.rooms,
        data: sortUserRooms((state.rooms.data ?? []).map(room =>
          room.id === roomId ? { ...room, last_activity_at: new Date().toISOString() } : room
        )),
        lastFetchedAt: Date.now(),
      },
    })),

  invalidateRooms: () =>
    set(state => ({ rooms: { ...state.rooms, dirty: true } })),

  loadMissions: async (accessToken, options = {}) => {
    const entry = get().missions;
    if (!options.force && isFresh(entry, TTL.missions)) return entry.data ?? [];
    if (entry.isLoading && entry.data) return entry.data;

    set({ missions: { ...entry, isLoading: true, error: null } });
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/missions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, accessToken);
      const raw = await response.json();
      if (!response.ok) throw new Error(raw.error ?? 'No se pudieron cargar las misiones');
      const data = mapMissions(raw.data ?? []);
      set({ missions: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } });
      return data;
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        set({ missions: { ...get().missions, isLoading: false, error: null } });
        throw error;
      }
      set({ missions: { ...get().missions, isLoading: false, error: error.message ?? 'No se pudieron cargar las misiones' } });
      throw error;
    }
  },

  invalidateMissions: () =>
    set(state => ({ missions: { ...state.missions, dirty: true } })),

  loadAchievements: async (accessToken, options = {}) => {
    const entry = get().achievements;
    if (!options.force && isFresh(entry, TTL.achievements)) return entry.data ?? [];
    if (entry.isLoading && entry.data) return entry.data;

    set({ achievements: { ...entry, isLoading: true, error: null } });
    try {
      const data = await fetchAchievements(accessToken);
      set({ achievements: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } });
      return data;
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        set({ achievements: { ...get().achievements, isLoading: false, error: null } });
        throw error;
      }
      set({ achievements: { ...get().achievements, isLoading: false, error: error.message ?? 'No se pudieron cargar los logros' } });
      throw error;
    }
  },

  invalidateAchievements: () =>
    set(state => ({ achievements: { ...state.achievements, dirty: true } })),

  loadGlobalRanking: async (accessToken, options = {}) => {
    const entry = get().globalRanking;
    if (!options.force && isFresh(entry, TTL.globalRanking)) return entry.data ?? [];
    if (entry.isLoading && entry.data) return entry.data;

    set({ globalRanking: { ...entry, isLoading: true, error: null } });
    try {
      const scope = options.scope ?? 'global';
      const limit = options.limit ?? 50;
      const response = await fetchRanking(options.type ?? 'time', accessToken, undefined, scope, limit);
      const data = Array.isArray(response?.data?.data) ? response.data.data : [];
      set({ globalRanking: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false } });
      return data;
    } catch (error: any) {
      set({ globalRanking: { ...get().globalRanking, isLoading: false, error: error.message ?? 'No se pudo cargar el ranking' } });
      throw error;
    }
  },

  invalidateGlobalRanking: () =>
    set(state => ({ globalRanking: { ...state.globalRanking, dirty: true } })),

  loadRoomRanking: async (accessToken, roomId, options = {}) => {
    const entry = get().roomRankings[roomId] ?? createEntry<RoomTimeRankingEntry[]>([]);
    if (!options.force && isFresh(entry, TTL.roomRanking)) return entry.data ?? [];
    if (entry.isLoading && entry.data) return entry.data;

    set(state => ({
      roomRankings: {
        ...state.roomRankings,
        [roomId]: { ...entry, isLoading: true, error: null },
      },
    }));

    try {
      const data = await fetchRoomTimeRanking(accessToken, roomId);
      set(state => ({
        roomRankings: {
          ...state.roomRankings,
          [roomId]: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false },
        },
      }));
      return data;
    } catch (error: any) {
      set(state => ({
        roomRankings: {
          ...state.roomRankings,
          [roomId]: {
            ...state.roomRankings[roomId],
            isLoading: false,
            error: error.message ?? 'No se pudo cargar el ranking de sala',
          },
        },
      }));
      throw error;
    }
  },

  invalidateRoomRanking: roomId =>
    set(state => ({
      roomRankings: {
        ...state.roomRankings,
        [roomId]: {
          ...(state.roomRankings[roomId] ?? createEntry<RoomTimeRankingEntry[]>([])),
          dirty: true,
        },
      },
    })),

  clearRoomRanking: roomId =>
    set(state => {
      const { [roomId]: _removed, ...roomRankings } = state.roomRankings;
      return { roomRankings };
    }),

  loadRoomDetails: async (accessToken, roomId, options = {}) => {
    const entry = get().roomDetails[roomId] ?? createEntry<RoomDetails>();
    if (!options.force && isFresh(entry, TTL.roomDetails)) return entry.data;
    if (entry.isLoading && entry.data) return entry.data;

    set(state => ({
      roomDetails: {
        ...state.roomDetails,
        [roomId]: { ...entry, isLoading: true, error: null },
      },
    }));

    try {
      const data = await fetchRoomDetails(accessToken, roomId);
      set(state => ({
        roomDetails: {
          ...state.roomDetails,
          [roomId]: { data, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false },
        },
      }));
      return data;
    } catch (error: any) {
      set(state => ({
        roomDetails: {
          ...state.roomDetails,
          [roomId]: {
            ...state.roomDetails[roomId],
            isLoading: false,
            error: error.message ?? 'No se pudo cargar la sala',
          },
        },
      }));
      throw error;
    }
  },

  setRoomDetails: room =>
    set(state => ({
      roomDetails: {
        ...state.roomDetails,
        [room.id]: { data: room, lastFetchedAt: Date.now(), isLoading: false, error: null, dirty: false },
      },
      rooms: {
        ...state.rooms,
        data: (state.rooms.data ?? []).map(item =>
          item.id === room.id
            ? { ...item, name: room.name, description: room.description ?? null }
            : item
        ),
        lastFetchedAt: Date.now(),
      },
    })),

  invalidateRoomDetails: roomId =>
    set(state => ({
      roomDetails: {
        ...state.roomDetails,
        [roomId]: {
          ...(state.roomDetails[roomId] ?? createEntry<RoomDetails>()),
          dirty: true,
        },
      },
    })),

  clearRoomDetails: roomId =>
    set(state => {
      const { [roomId]: _removed, ...roomDetails } = state.roomDetails;
      return { roomDetails };
    }),

  invalidateAfterRoomParticipation: () =>
    set(state => ({
      achievements: { ...state.achievements, dirty: true },
      missions: { ...state.missions, dirty: true },
    })),

  invalidateAfterValidStudySession: roomId =>
    set(state => ({
      profile: { ...state.profile, dirty: true },
      missions: { ...state.missions, dirty: true },
      achievements: { ...state.achievements, dirty: true },
      globalRanking: { ...state.globalRanking, dirty: true },
      roomRankings: roomId
        ? {
            ...state.roomRankings,
            [roomId]: {
              ...(state.roomRankings[roomId] ?? createEntry<RoomTimeRankingEntry[]>([])),
              dirty: true,
            },
          }
        : state.roomRankings,
    })),

  setActiveStudySession: session =>
    set({ activeStudySession: session }),

  clearAll: () =>
    set({
      profile: createEntry<FullProfile>(),
      rooms: createEntry<UserRoom[]>([]),
      missions: createEntry<MissionSummary[]>([]),
      achievements: createEntry<Achievement[]>([]),
      globalRanking: createEntry<RankingEntry[]>([]),
      roomRankings: {},
      roomDetails: {},
      activeStudySession: null,
    }),
}));

function mapMissions(payload: any): MissionSummary[] {
  const missions = Array.isArray(payload)
    ? payload
    : [
        ...(payload?.daily ?? []),
        ...(payload?.weekly ?? []),
        ...(payload?.expired ?? []),
      ];

  return missions.map((mission: any) => {
    const currentProgress = mission.progress ?? 0;
    const goalValue = mission.target_value ?? 1;
    const calculatedPercentage = Math.min(100, Math.floor((currentProgress / goalValue) * 100));

    // 🆕 LÓGICA DE FILTRADO DE 24HS
    const expiresAt = mission.expires_at ? new Date(mission.expires_at).getTime() : null;
    const isExpiredMoreThan24h = expiresAt 
      ? (Date.now() - expiresAt) > (24 * 60 * 60 * 1000) 
      : false;

    return {
      id: mission.id || mission.user_mission_id,
      title: mission.title || mission.missions?.title || 'Mision Diaria',
      description: mission.description ?? null,
      frequency: mission.frequency,
      period_key: mission.period_key,
      expires_at: mission.expires_at ?? null,
      expired: Boolean(mission.expired),
      expiredMoreThan24h: isExpiredMoreThan24h,
      progress: currentProgress,
      target: goalValue,
      percentage: calculatedPercentage,
      completed: mission.completed ?? false,
      claimed: mission.claimed ?? false,
      reward_coins: Number(mission.reward_coins) || 0,
      mission_id: mission.mission_id,
    };
  });
}