import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textSoft: string;
  accent: string;
  accentSoft: string;
  accentStrong: string;
  warning: string;
  input: string;
  inputBorder: string;
  overlay: string;
  // 🆕 Tokens de ranking / estados semánticos
  danger: string; // tendencia negativa (bajó de puesto)
  highlight: string; // fondo translúcido para destacar la fila del usuario actual
  rankGold: string; // medalla 1er puesto
  rankSilver: string; // medalla 2do puesto
  rankBronze: string; // medalla 3er puesto
  rankBadgeText: string; // texto sobre las medallas (siempre oscuro, alto contraste)
  avatarAccent: string; // fondo del avatar placeholder
  avatarText: string; // texto sobre el avatar (siempre claro, alto contraste)
  // 🆕 Tokens de marca secundaria / estados (salas, invitaciones, battle royale)
  info: string; // azul secundario (unirse a sala, acciones informativas)
  infoSoft: string; // fondo translúcido azul
  infoStrong: string; // texto de alto contraste sobre fondo azul
  purple: string; // acento de marca del modo Battle Royale
  purpleSoft: string; // fondo translúcido violeta
  dangerSoft: string; // fondo translúcido rojo (abandonar sala, rechazar, expulsar)
  dangerBorder: string; // borde de cajas en tono peligro
  warningSoft: string; // fondo translúcido ámbar (insignias tipo "Jefe")
  warningStrong: string; // texto de alto contraste sobre fondo ámbar
  // 🆕 Tokens del dashboard inteligente
  cyan: string; // acento de métricas/gráficos
  cyanSoft: string; // fondo alterno tipo "tarjeta de supervivencia"
}

interface ThemeState {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (themeMode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const createThemeColors = (themeMode: ThemeMode): ThemeColors =>
  themeMode === 'light'
    ? {
        background: '#f4f7fb',
        surface: '#f8fafc',
        surfaceElevated: '#ffffff',
        border: '#dbe3ee',
        text: '#0f172a',
        textMuted: '#475569',
        textSoft: '#64748b',
        accent: '#22c55e',
        accentSoft: '#dcfce7',
        accentStrong: '#14532d',
        warning: '#f59e0b',
        input: '#f8fafc',
        inputBorder: '#cbd5e1',
        overlay: 'rgba(15, 23, 42, 0.72)',
        danger: '#dc2626',
        highlight: 'rgba(34, 197, 94, 0.12)',
        rankGold: '#eab308',
        rankSilver: '#cbd5e1',
        rankBronze: '#b45309',
        rankBadgeText: '#0f172a',
        avatarAccent: '#6366f1',
        avatarText: '#ffffff',
        info: '#3b82f6',
        infoSoft: 'rgba(59, 130, 246, 0.12)',
        infoStrong: '#1d4ed8',
        purple: '#a855f7',
        purpleSoft: 'rgba(168, 85, 247, 0.12)',
        dangerSoft: 'rgba(220, 38, 38, 0.10)',
        dangerBorder: '#fca5a5',
        warningSoft: 'rgba(245, 158, 11, 0.12)',
        warningStrong: '#92400e',
        cyan: '#0284c7',
        cyanSoft: '#e0f2fe',
      }
    : {
        background: '#0f172a',
        surface: '#111827',
        surfaceElevated: '#1e293b',
        border: '#334155',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        textSoft: '#64748b',
        accent: '#22c55e',
        accentSoft: '#14532d',
        accentStrong: '#bbf7d0',
        warning: '#facc15',
        input: '#0f172a',
        inputBorder: '#334155',
        overlay: 'rgba(2, 6, 23, 0.9)',
        danger: '#ef4444',
        highlight: 'rgba(34, 197, 94, 0.1)',
        rankGold: '#facc15',
        rankSilver: '#cbd5e1',
        rankBronze: '#b45309',
        rankBadgeText: '#0f172a',
        avatarAccent: '#6366f1',
        avatarText: '#ffffff',
        info: '#3b82f6',
        infoSoft: 'rgba(59, 130, 246, 0.15)',
        infoStrong: '#bfdbfe',
        purple: '#a855f7',
        purpleSoft: 'rgba(168, 85, 247, 0.15)',
        dangerSoft: 'rgba(239, 68, 68, 0.15)',
        dangerBorder: '#7f1d1d',
        warningSoft: '#422006',
        warningStrong: '#fef3c7',
        cyan: '#38bdf8',
        cyanSoft: '#082f49',
      };

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'dark' as ThemeMode,
      colors: createThemeColors('dark'),
      setThemeMode: (themeMode: ThemeMode) => set({ themeMode, colors: createThemeColors(themeMode) }),
      toggleThemeMode: () => {
        const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
        set({ themeMode: nextMode, colors: createThemeColors(nextMode) });
      },
    }),
    {
      name: 'mindguild-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);