import { useState } from 'react';
import { ArrowLeft, Target, CheckCircle, Trophy, Clock, Flame, Award } from 'lucide-react';
import { Link } from 'react-router';

export default function Retos() {
  // Todos los retos (completados y por completar)
  const allMissions = [
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
    {
      id: 4,
      title: "Responde 10 preguntas correctamente",
      progress: 8,
      target: 10,
      reward: 30,
      type: "daily"
    },
    {
      id: 5,
      title: "Únete a 2 salas de estudio",
      progress: 2,
      target: 2,
      reward: 40,
      type: "social"
    },
    {
      id: 6,
      title: "Alcanza 10 horas de estudio este mes",
      progress: 4.2,
      target: 10,
      reward: 150,
      type: "monthly"
    },
    {
      id: 7,
      title: "Completa 5 sesiones de Pomodoro",
      progress: 2,
      target: 5,
      reward: 35,
      type: "daily"
    },
    {
      id: 8,
      title: "Gana 3 batallas de jefe",
      progress: 3,
      target: 3,
      reward: 75,
      type: "weekly"
    },
    {
      id: 9,
      title: "Estudia 2 horas sin interrupciones",
      progress: 0.5,
      target: 2,
      reward: 45,
      type: "daily"
    },
    {
      id: 10,
      title: "Invita a 3 amigos a la app",
      progress: 1,
      target: 3,
      reward: 200,
      type: "social"
    },
  ];

  // Separar y ordenar retos
  const incompleteMissions = allMissions
    .filter(mission => mission.progress < mission.target)
    .sort((a, b) => {
      const progressA = (a.progress / a.target) * 100;
      const progressB = (b.progress / b.target) * 100;
      return progressB - progressA; // Ordenar de mayor a menor progreso
    });

  const completedMissions = allMissions
    .filter(mission => mission.progress >= mission.target);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily':
        return <Clock className="w-3.5 h-3.5" />;
      case 'weekly':
        return <Target className="w-3.5 h-3.5" />;
      case 'monthly':
        return <Trophy className="w-3.5 h-3.5" />;
      case 'streak':
        return <Flame className="w-3.5 h-3.5" />;
      case 'social':
        return <Award className="w-3.5 h-3.5" />;
      default:
        return <Target className="w-3.5 h-3.5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily':
        return 'Diario';
      case 'weekly':
        return 'Semanal';
      case 'monthly':
        return 'Mensual';
      case 'streak':
        return 'Racha';
      case 'social':
        return 'Social';
      default:
        return type;
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
          <Link to="/">
            <button className="w-9 h-9 rounded-full bg-gray-800/90 flex items-center justify-center border border-gray-700/50 hover:bg-gray-700/90 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>

          <h2 className="text-base font-bold">Todos los Retos</h2>

          <div className="w-9"></div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Resumen */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 mb-5 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{incompleteMissions.length}</p>
                <p className="text-xs text-gray-400">Activos</p>
              </div>
              <div className="h-10 w-px bg-gray-700"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{completedMissions.length}</p>
                <p className="text-xs text-gray-400">Completados</p>
              </div>
              <div className="h-10 w-px bg-gray-700"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{allMissions.length}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
          </div>

          {/* Retos por Completar */}
          {incompleteMissions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-400" />
                Retos Activos ({incompleteMissions.length})
              </h3>
              <div className="space-y-2">
                {incompleteMissions.map((mission) => {
                  const progress = Math.round((mission.progress / mission.target) * 100);

                  return (
                    <div
                      key={mission.id}
                      className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-3.5 border border-gray-700/50 backdrop-blur-sm hover:border-green-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-200 mb-1">{mission.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {mission.progress}/{mission.target}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-0.5">
                              <span className="text-xs font-bold text-yellow-400">+{mission.reward} H</span>
                            </div>
                            <div className="flex items-center gap-1 bg-blue-500/20 rounded-full px-2 py-0.5 text-blue-400">
                              {getTypeIcon(mission.type)}
                              <span className="text-xs font-semibold">{getTypeLabel(mission.type)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-400">{progress}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-500 to-emerald-400"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Retos Completados */}
          {completedMissions.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                Completados ({completedMissions.length})
              </h3>
              <div className="space-y-2">
                {completedMissions.map((mission) => {
                  return (
                    <div
                      key={mission.id}
                      className="bg-gradient-to-b from-green-900/20 to-gray-900/80 rounded-2xl p-3.5 border border-green-500/30 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-200 mb-1">{mission.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Target className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">
                                {mission.target}/{mission.target}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-500/20 rounded-full px-2 py-0.5">
                              <span className="text-xs font-bold text-yellow-400">+{mission.reward} H</span>
                            </div>
                            <div className="flex items-center gap-1 bg-blue-500/20 rounded-full px-2 py-0.5 text-blue-400">
                              {getTypeIcon(mission.type)}
                              <span className="text-xs font-semibold">{getTypeLabel(mission.type)}</span>
                            </div>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      </div>
                      <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-gray-900/50 border-t border-gray-800 backdrop-blur-sm relative z-10 pb-safe">
          <div className="flex items-center justify-around px-3 py-2">
            <Link to="/" className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 4 L24 10 L24 12 L8 12 L8 10 Z M6 12 L6 28 L26 28 L26 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="10" y="14" width="3" height="14" fill="currentColor"/>
                <rect x="19" y="14" width="3" height="14" fill="currentColor"/>
              </svg>
              <span className="text-[10px] font-semibold">Home</span>
            </Link>

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
