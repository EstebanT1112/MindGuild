import { useState, useEffect } from 'react';
import { ArrowLeft, Pause, Play, Square, Timer, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function PomodoroSession() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos en segundos
  const [isRunning, setIsRunning] = useState(true);

  const totalTime = 25 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Timer principal del Pomodoro
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Sesión completada - registrar tiempo y volver
          alert('¡Sesión completada! +25 H ganados');
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    if (confirm('¿Estás seguro de detener el Pomodoro? Se perderán los puntos potenciales.')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* iPhone 14 Container */}
      <div className="w-[390px] h-[844px] bg-[#1a1d29] text-white flex flex-col relative overflow-hidden rounded-[3rem] shadow-2xl border-8 border-gray-950">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-repeat"
               style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E")`
               }}>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-950 rounded-b-3xl z-50"></div>

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 pt-9 relative z-10">
          <button
            onClick={handleStop}
            className="w-9 h-9 rounded-full bg-gray-800/90 flex items-center justify-center border border-gray-700/50 hover:bg-gray-700/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>

          <h2 className="text-lg font-bold">SESIÓN ACTIVA</h2>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">+25</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 flex flex-col items-center justify-center">
          {/* Advertencia Hard-Lock */}
          <div className="w-full mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-300 mb-1">Modo Hard-Lock Activado</h4>
                  <p className="text-sm text-red-200 leading-relaxed">
                    Si sales de esta pantalla o la app pasa a segundo plano,
                    la sesión se invalidará automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Circular Timer */}
          <div className="relative w-72 h-72 mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#2a2d3a"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#gradient-active)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  filter: 'drop-shadow(0 0 25px #4ade80)',
                  transition: 'stroke-dashoffset 1s linear'
                }}
              />
              <defs>
                <linearGradient id="gradient-active" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Timer className={`w-10 h-10 mb-3 ${isRunning ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
              <div className="text-6xl font-bold mb-2">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-400">
                {isRunning ? 'En progreso...' : 'Pausado'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progreso de la sesión</span>
              <span className="text-sm font-bold text-green-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="w-full flex gap-3">
            <button
              onClick={handleTogglePause}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Reanudar
                </>
              )}
            </button>
            <button
              onClick={handleStop}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Detener
            </button>
          </div>

          {/* Stats Info */}
          <div className="w-full mt-8 bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 border border-gray-700/50 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">+25 H</div>
                <div className="text-xs text-gray-400 mt-1">Puntos Potenciales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">1/4</div>
                <div className="text-xs text-gray-400 mt-1">Sesiones de Hoy</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
