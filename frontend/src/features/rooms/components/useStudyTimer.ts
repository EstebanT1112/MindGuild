import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { useAppDataStore } from '../../../store/appDataStore';
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  endStudySession,
} from '../services/sessionsService';

export type TimerStatus = 'idle' | 'starting' | 'running' | 'paused' | 'finishing' | 'error';

interface UseStudyTimerProps {
  roomId: string | null;
  initialMode: 'pomodoro' | 'free';
  initialDurationMinutes: number;
  onSessionEnded: (result: any) => void;
}

export function useStudyTimer({
  roomId,
  initialMode,
  initialDurationMinutes,
  onSessionEnded,
}: UseStudyTimerProps) {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore((state) => state.access_token);
  const setActiveStudySession = useAppDataStore((state) => state.setActiveStudySession);

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [displaySeconds, setDisplaySeconds] = useState(
    initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0
  );

  const timerIntervalRef = useRef<any>(null);
  const appStateRef = useRef(AppState.currentState);

  const stateRef = useRef({ status, sessionId, startTime, accumulatedSeconds, displaySeconds, initialMode, initialDurationMinutes });
  useEffect(() => {
    stateRef.current = { status, sessionId, startTime, accumulatedSeconds, displaySeconds, initialMode, initialDurationMinutes };
  }, [status, sessionId, startTime, accumulatedSeconds, displaySeconds, initialMode, initialDurationMinutes]);

  useEffect(() => {
    if (status === 'idle') {
      setDisplaySeconds(initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0);
      setAccumulatedSeconds(0);
      setStartTime(null);
    }
  }, [initialMode, initialDurationMinutes, status]);

  const clearLocalInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // ⚡ OPTIMIZACIÓN EXTREMA: Desacoplamos la UI de la red para disparar el cartel al instante sin delay
  const forceEndActiveSession = async () => {
    const { sessionId: currentSessionId, startTime: currentStartTime, initialMode: currentMode, displaySeconds: currentDisplay, accumulatedSeconds: currentAccumulated, initialDurationMinutes: currentDuration } = stateRef.current;
    if (!accessToken || !currentSessionId || !currentStartTime) return;

    // 1. Limpiamos hilos de inmediato
    clearLocalInterval();
    
    // 2. Calculamos tiempo localmente en el milisegundo actual
    let totalSecondsStudied = 0;
    if (currentMode === 'pomodoro') {
      const targetTotal = currentDuration * 60;
      totalSecondsStudied = Math.max(0, targetTotal - currentDisplay);
    } else {
      totalSecondsStudied = Math.max(0, currentAccumulated);
    }

    const minutesStudied = Math.max(0, Math.floor(totalSecondsStudied / 60));

    // 3. 🚀 DISPARO OPTIMISTA INSTANTÁNEO: Reseteamos la UI local y mandamos el callback
    // para que salte el Alert sin esperar la respuesta HTTP de Supabase.
    setStatus('idle');
    setSessionId(null);
    setActiveStudySession(null);
    setStartTime(null);
    setAccumulatedSeconds(0);

    // Mockeamos el formato del result de forma local inmediata para el Alert
    const localResultMock = {
      valid: minutesStudied >= 5, // Sincronizado con el umbral real de 5 min del backend
      duration_minutes: minutesStudied
    };
    onSessionEnded(localResultMock);

    // 4. Dejamos corriendo la promesa de red de fondo (en segundo plano)
    try {
      endStudySession(accessToken, currentSessionId, {
        ended_at: new Date().toISOString(),
        duration_minutes: minutesStudied,
        paused_seconds: 0, 
      }).catch((err) => console.error('Error asincrónico silencioso en backend:', err));
    } catch (error) {
      console.error('Error al finalizar sesion de forma automatica:', error);
    }
  };

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        if (stateRef.current.status === 'running' || stateRef.current.status === 'paused') {
          await forceEndActiveSession();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [accessToken]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (stateRef.current.status === 'running' || stateRef.current.status === 'paused') {
        e.preventDefault();
        forceEndActiveSession()
          .catch((error) => {
            console.error('Error al finalizar sesion durante la navegacion', error);
          })
          .finally(() => {
            navigation.dispatch(e.data.action);
          });
      }
    });
    return unsubscribe;
  }, [navigation, accessToken]);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (stateRef.current.status === 'running' || stateRef.current.status === 'paused') {
        forceEndActiveSession().catch((error) => {
          console.error('Error al finalizar sesión por desenfoque de pestaña (blur):', error);
        });
      }
    });
    return unsubscribeBlur;
  }, [navigation, accessToken]);

  const startLocalTimer = (startTs: number) => {
    clearLocalInterval();
    const mode = stateRef.current.initialMode;
    const durationSecs = stateRef.current.initialDurationMinutes * 60;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.floor((now - startTs) / 1000);

      if (mode === 'pomodoro') {
        const remaining = durationSecs - (stateRef.current.accumulatedSeconds + deltaSeconds);
        if (remaining <= 0) {
          clearLocalInterval();
          setDisplaySeconds(0);
          Alert.alert('Tiempo cumplido', 'Finaliza la sesion para guardar el tiempo de estudio.');
        } else {
          setDisplaySeconds(remaining);
        }
      } else {
        const totalFree = stateRef.current.accumulatedSeconds + deltaSeconds;
        setDisplaySeconds(totalFree);
        setAccumulatedSeconds(totalFree);
      }
    }, 1000);
  };

  const startSession = async () => {
    if (!accessToken || !roomId) return;

    setStatus('starting');
    setStartTime(Date.now());
    startLocalTimer(Date.now());

    try {
      const data = await startStudySession(accessToken, {
        room_id: roomId,
        mode: initialMode,
      });
      setSessionId(data.session_id);
      setActiveStudySession({ sessionId: data.session_id, roomId });
      setStatus('running');
    } catch (error: any) {
      clearLocalInterval();
      setStatus('idle');
      setStartTime(null);
      setDisplaySeconds(initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0);
      Alert.alert('Error de sesion', error.message ?? 'No se pudo sincronizar el inicio con el servidor.');
    }
  };

  const pauseSession = async () => {
    if (!accessToken || !sessionId) return;
    
    clearLocalInterval();
    setStatus('paused');

    if (initialMode === 'pomodoro') {
      const currentElapsed = initialDurationMinutes * 60 - displaySeconds;
      setAccumulatedSeconds(currentElapsed);
    }

    try {
      await pauseStudySession(accessToken, sessionId);
    } catch (error: any) {
      setStatus('running');
      startLocalTimer(startTime ?? Date.now());
      Alert.alert('Error de conexion', error.message ?? 'No se pudo registrar la pausa en el servidor.');
    }
  };

  const resumeSession = async () => {
    if (!accessToken || !sessionId) return;

    setStatus('running');
    const newStartTs = Date.now();
    setStartTime(newStartTs);
    startLocalTimer(newStartTs);

    try {
      await resumeStudySession(accessToken, sessionId);
    } catch (error: any) {
      Alert.alert('Aviso de sincronizacion', 'Se reanudo localmente pero el servidor no impacto el cambio.');
    }
  };

  const endSession = async () => {
    if (!accessToken || !sessionId) return;

    clearLocalInterval();
    setStatus('finishing');

    let totalSecondsStudied = 0;
    if (initialMode === 'pomodoro') {
      totalSecondsStudied = Math.max(0, (initialDurationMinutes * 60) - displaySeconds);
    } else {
      totalSecondsStudied = Math.max(0, displaySeconds);
    }

    const finalMinutes = Math.max(0, Math.floor(totalSecondsStudied / 60));

    // Mockeamos el resultado local para que pinte el cartel instantáneo
    const resultMock = {
      valid: finalMinutes >= 5,
      duration_minutes: finalMinutes
    };
    onSessionEnded(resultMock);

    // Mandamos el cierre de red asincrónico por detrás sin bloquear
    try {
      endStudySession(accessToken, sessionId, {
        ended_at: new Date().toISOString(),
        duration_minutes: finalMinutes,
        paused_seconds: 0, 
      }).catch((err) => console.error('Error asincrónico en endSession manual:', err));
    } catch (error: any) {
      console.error('Error catastrófico al finalizar sesión manualmente:', error);
    } finally {
      setStatus('idle');
      setSessionId(null);
      setActiveStudySession(null);
      setStartTime(null);
      setAccumulatedSeconds(0);
      setDisplaySeconds(initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0);
    }
  };

  useEffect(() => {
    return () => {
      clearLocalInterval();
      setStatus('idle');
      setActiveStudySession(null);
      setStartTime(null);
      setAccumulatedSeconds(0);
    };
  }, []);

  return {
    status,
    displaySeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
  };
}
