import { User, Users, Plus, Trophy, Copy, CheckCircle, ChevronRight, Flame, Target, Clock, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useState } from 'react';
import aldeasImage from 'figma:asset/b223a66f24d050fa22578245935d2697d8d2a15a.png';

export default function Home() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Mock data - salas más frecuentes (top 2)
  const frequentRooms = [
    {
      id: 1,
      name: "Cálculo I - Final",
      code: "CALC-7X9P",
      mode: "Supervivencia",
      members: 5,
      myRanking: 2,
      weeklyHours: 12.5,
    },
    {
      id: 2,
      name: "Física II",
      code: "FIS2-A4B1",
      mode: "Por Equipos",
      members: 8,
      myRanking: 3,
      weeklyHours: 8.0,
    },
  ];

  // Racha del usuario
  const streakData = {
    currentStreak: 7,
    bestStreak: 12,
    todayCompleted: true,
  };

  // Retos/Misiones por cumplir
  const missions = [
    {
      id: 1,
      title: "Estudia 5 horas esta semana",
      progress: 3.5,
      target: 5,
      reward: 50,
      type: "weekly"
    },
    {
      id: 2,
      title: "Completa 3 pomodoros hoy",
      progress: 1,
      target: 3,
      reward: 25,
      type: "daily"
    },
    {
      id: 3,
      title: "Mantén tu racha por 7 días",
      progress: 7,
      target: 7,
      reward: 100,
      type: "streak"
    },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = () => {
    // Navegar a página de unirse o mostrar modal
    navigate('/salas');
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
          <Link to="/profile">
            <button className="w-9 h-9 rounded-full bg-gray-800/90 flex items-center justify-center border border-gray-700/50 hover:bg-gray-700/90 transition-colors">
              <User className="w-5 h-5 text-gray-400" />
            </button>
          </Link>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">1,250 H</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-6 tracking-wide">
            MINDGUILD
          </h1>

          {/* Racha */}
          <div className="bg-gradient-to-b from-orange-900/40 via-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-orange-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-400">{streakData.currentStreak} días</h3>
                  <p className="text-xs text-gray-400">Racha actual</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Mejor racha</p>
                <p className="text-lg font-bold text-orange-300">{streakData.bestStreak} días</p>
              </div>
            </div>
            {streakData.todayCompleted && (
              <div className="mt-3 flex items-center gap-2 bg-green-500/20 rounded-lg px-3 py-2 border border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-300 font-semibold">¡Racha completada hoy!</span>
              </div>
            )}
          </div>

          {/* Retos por Cumplir */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Retos Activos</h3>
              <Link to="/retos" className="text-xs text-green-400 font-semibold hover:text-green-300">
                Ver todos
              </Link>
            </div>
            <div className="space-y-2">
              {missions.slice(0, 2).map((mission) => {
                const progress = Math.round((mission.progress / mission.target) * 100);
                const isCompleted = mission.progress >= mission.target;

                return (
                  <div
                    key={mission.id}
                    className={`bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-3.5 border backdrop-blur-sm ${
                      isCompleted
                        ? 'border-green-500/50 bg-green-500/5'
                        : 'border-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-200 mb-1">{mission.title}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {mission.progress}/{mission.target}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-0.5">
                            <span className="text-xs font-bold text-yellow-400">+{mission.reward} H</span>
                          </div>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Salas Más Frecuentes */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Salas Frecuentes</h3>
              <Link to="/salas" className="text-xs text-green-400 font-semibold hover:text-green-300">
                Ver todas
              </Link>
            </div>
            {frequentRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/salas/${room.id}`)}
                className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 border border-gray-700/50 backdrop-blur-sm cursor-pointer hover:border-green-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold mb-1">{room.name}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(room.code);
                        }}
                        className="flex items-center gap-1.5 bg-gray-800/60 rounded-lg px-2 py-1 border border-gray-700/50 hover:bg-gray-700/60 transition-colors"
                      >
                        <span className="text-xs font-mono font-bold text-green-400">{room.code}</span>
                        {copied ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">{room.members}</span>
                    </div>
                    <span className="text-gray-400">{room.mode}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-green-500/20 rounded-full px-2 py-0.5">
                    <Trophy className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400">#{room.myRanking}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Acceso a Aldea/Ayuntamiento */}
          <div
            onClick={() => navigate('/ayuntamiento')}
            className="bg-gradient-to-br from-amber-900/40 via-gray-800/80 to-gray-900/80 rounded-3xl p-5 border border-amber-500/30 backdrop-blur-sm cursor-pointer hover:border-amber-500/50 transition-all mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-amber-300">Mi Aldea</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center p-2">
                <img
                  src={aldeasImage}
                  alt="Aldea"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))'
                  }}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 bg-amber-500/20 rounded-full px-2.5 py-0.5 border border-amber-500/40">
                    <span className="text-xs font-bold text-amber-400">Nivel 5</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50 mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: '65%',
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">
                  2 Pomodoros para nivel 6
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              <span>Visita el Ayuntamiento para mejorar tu aldea</span>
            </div>
          </div>
        </main>

        {/* Botón Flotante - Unirse a Sala */}
        <button
          onClick={handleJoinRoom}
          className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center z-20"
          style={{
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
          }}
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Bottom Navigation */}
        <nav className="bg-gray-900/50 border-t border-gray-800 backdrop-blur-sm relative z-10 pb-safe">
          <div className="flex items-center justify-around px-3 py-2">
            <button className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-400">
                <path d="M16 4 L24 10 L24 12 L8 12 L8 10 Z M6 12 L6 28 L26 28 L26 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="10" y="14" width="3" height="14" fill="currentColor"/>
                <rect x="19" y="14" width="3" height="14" fill="currentColor"/>
              </svg>
              <span className="text-[10px] font-semibold">Home</span>
            </button>

            <Link to="/salas" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect x="8" y="10" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 10 L16 6 L24 10" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px]">Salas</span>
            </Link>

            <Link to="/ranking" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 4 L18 10 L24 10 L19 14 L21 20 L16 16 L11 20 L13 14 L8 10 L14 10 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="4" y="20" width="24" height="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px]">Ranking</span>
            </Link>

            <Link to="/amigos" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 28 C8 22 11 18 16 18 C21 18 24 22 24 28" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px]">Amigos</span>
            </Link>
          </div>
        </nav>

      </div>
    </div>
  );
}