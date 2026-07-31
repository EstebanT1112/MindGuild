import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { useAppDataStore } from '../../../store/appDataStore';
import {
  startStudySession,
  pauseStudySession,
  resumeStudySession,
  endStudySession,
} from '../services/sessionsService';
import AppAlert, { type AlertType } from '../../../components/ui/AppAlert';

export type TimerStatus = 'idle' | 'starting' | 'running' | 'paused' | 'finishing' | 'error';

interface UseStudyTimerProps {
  roomId: string | null;
  initialMode: 'pomodoro' | 'free';
  initialDurationMinutes: number;
  onSessionEnded: (result: { status: 'invalid' | 'pending'; duration_minutes: number; session_id: string }) => void;
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

  const forceEndActiveSession = async () => {
    const { sessionId: currentSessionId, startTime: currentStartTime, initialMode: currentMode, displaySeconds: currentDisplay, accumulatedSeconds: currentAccumulated, initialDurationMinutes: currentDuration } = stateRef.current;
    if (!accessToken || !currentSessionId || !currentStartTime) return;

    clearLocalInterval();
    
    let totalSecondsStudied = 0;
    if (currentMode === 'pomodoro') {
      const targetTotal = currentDuration * 60;
      totalSecondsStudied = Math.max(0, targetTotal - currentDisplay);
    } else {
      totalSecondsStudied = Math.max(0, currentAccumulated);
    }

    const minutesStudied = Math.max(0, Math.floor(totalSecondsStudied / 60));
    const finalStatus = minutesStudied >= 30 ? 'pending' : 'invalid';

    if (finalStatus === 'invalid') {
      setStatus('idle');
      setSessionId(null);
      setStartTime(null);
      setAccumulatedSeconds(0);
    }
    
    setStatus('idle');
    setSessionId(null);
    setActiveStudySession(null);
    setStartTime(null);
    setAccumulatedSeconds(0);

    onSessionEnded({
      status: finalStatus,
      duration_minutes: minutesStudied,
      session_id: currentSessionId
    });

    try {
      if (finalStatus === 'invalid') {
        endStudySession(accessToken, currentSessionId, {
          ended_at: new Date().toISOString(),
          duration_minutes: minutesStudied,
          paused_seconds: 0, 
        }).catch((err) => console.error('Error al cerrar automáticamente por background:', err));
      }
    } catch (error) {
      console.error('Error en cierre forzado por AppState:', error);
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
          .catch((error) => console.error('Error al finalizar por navegación nativa:', error))
          .finally(() => navigation.dispatch(e.data.action));
      }
    });
    return unsubscribe;
  }, [navigation, accessToken]);

  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (stateRef.current.status === 'running' || stateRef.current.status === 'paused') {
        forceEndActiveSession().catch((error) => console.error('Error al finalizar por blur:', error));
      }
    });
    return unsubscribeBlur;
  }, [navigation, accessToken]);

  const startLocalTimer = () => {
    clearLocalInterval();
    
    timerIntervalRef.current = setInterval(() => {
      const mode = stateRef.current.initialMode;
      
      if (mode === 'pomodoro') {
        setDisplaySeconds((prev) => {
          if (prev <= 1) {
            clearLocalInterval();
            showAlert('Tiempo cumplido', 'Finalizá la sesión para guardar el tiempo de estudio.', 'info');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setAccumulatedSeconds((prevSecs) => {
          const nextSecs = prevSecs + 1;
          setDisplaySeconds(nextSecs);
          return nextSecs;
        });
      }
    }, 1000);
  };

  const startSession = async () => {
    if (!accessToken || !roomId) return;

    setStatus('starting');
    const now = Date.now();
    setStartTime(now);

    try {
      const data = await startStudySession(accessToken, {
        room_id: roomId,
        mode: initialMode,
      });
      setSessionId(data.session_id);
      setActiveStudySession({ sessionId: data.session_id, roomId });
      setStatus('running');
      startLocalTimer();
    } catch (error: any) {
      setStatus('idle');
      setStartTime(null);
      setDisplaySeconds(initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0);
      showAlert('Error de sesión', error.message ?? 'No se pudo sincronizar el inicio con el servidor.', 'error');
    }
  };

  const pauseSession = async () => {
    const { sessionId: currentSessionId } = stateRef.current;
    if (!accessToken || !currentSessionId) return;
    
    clearLocalInterval();
    setStatus('paused');

    try {
      await pauseStudySession(accessToken, currentSessionId);
    } catch (error: any) {
      setStatus('running');
      startLocalTimer();
      showAlert('Error', error.message ?? 'No se pudo registrar la pausa.', 'error');
    }
  };

  const resumeSession = async () => {
    const { sessionId: currentSessionId } = stateRef.current;
    if (!accessToken || !currentSessionId) return;

    setStatus('running');

    try {
      await resumeStudySession(accessToken, currentSessionId);
      startLocalTimer();
    } catch (error: any) {
      startLocalTimer();
      showAlert('Error', 'Se reanudó localmente pero el servidor no impactó el cambio.', 'warning');
    }
  };

  const endSession = async () => {
    const { sessionId: currentSessionId, displaySeconds: currentDisplay, accumulatedSeconds: currentAccumulated } = stateRef.current;
    if (!accessToken || !currentSessionId) return;

    clearLocalInterval();
    setStatus('finishing');

    let totalSecondsStudied = 0;
    if (initialMode === 'pomodoro') {
      totalSecondsStudied = Math.max(0, (initialDurationMinutes * 60) - currentDisplay);
    } else {
      totalSecondsStudied = Math.max(0, currentAccumulated);
    }

    const finalMinutes = Math.max(0, Math.floor(totalSecondsStudied / 60));
    const finalStatus = finalMinutes >= 30 ? 'pending' : 'invalid';

    onSessionEnded({
      status: finalStatus,
      duration_minutes: finalMinutes,
      session_id: currentSessionId
    });
    setActiveStudySession(null);

    try {
      if (finalStatus === 'invalid') {
        await endStudySession(accessToken, currentSessionId, {
          ended_at: new Date().toISOString(),
          duration_minutes: finalMinutes,
          paused_seconds: 0, 
        });
        setStatus('idle');
        setSessionId(null);
        setStartTime(null);
        setAccumulatedSeconds(0);
        setDisplaySeconds(initialMode === 'pomodoro' ? initialDurationMinutes * 60 : 0);
      }
    } catch (error: any) {
      console.error('Error al finalizar sesión manual:', error);
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
    setStatus,
    setSessionId,
    sessionId,
    displaySeconds,
    setDisplaySeconds,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    // ✅ Exponemos el alert para que las pantallas puedan mostrarlo si es necesario
    alert,
    showAlert,
  };
}