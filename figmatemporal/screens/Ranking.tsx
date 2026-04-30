import { useState } from 'react';
import { ArrowLeft, Trophy, Clock, Flame, Brain, Crown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';

type RankingTab = 'weekly' | 'streak' | 'academic' | 'boss';

export default function Ranking() {
  const [activeTab, setActiveTab] = useState<RankingTab>('weekly');

  // Ranking Semanal de Horas
  const weeklyRanking = [
    { rank: 1, name: "Kenji Tanaka", avatar: "K", hours: 25.5, trend: "up" },
    { rank: 2, name: "Yuki Yamamoto", avatar: "Y", hours: 22.3, trend: "same" },
    { rank: 3, name: "Tú (Samurai Sensei)", avatar: "S", hours: 18.7, isCurrentUser: true, trend: "up" },
    { rank: 4, name: "Akira Sato", avatar: "A", hours: 16.2, trend: "down" },
    { rank: 5, name: "Hiro Nakamura", avatar: "H", hours: 14.8, trend: "up" },
    { rank: 6, name: "María López", avatar: "M", hours: 12.5, trend: "same" },
    { rank: 7, name: "Carlos Ruiz", avatar: "C", hours: 11.3, trend: "down" },
    { rank: 8, name: "Ana García", avatar: "A", hours: 9.7, trend: "up" },
  ];

  // Ranking de Racha
  const streakRanking = [
    { rank: 1, name: "Ana García", avatar: "A", streak: 45, trend: "up" },
    { rank: 2, name: "Kenji Tanaka", avatar: "K", streak: 32, trend: "same" },
    { rank: 3, name: "Yuki Yamamoto", avatar: "Y", streak: 28, trend: "up" },
    { rank: 4, name: "Tú (Samurai Sensei)", avatar: "S", streak: 7, isCurrentUser: true, trend: "up" },
    { rank: 5, name: "María López", avatar: "M", streak: 6, trend: "same" },
    { rank: 6, name: "Akira Sato", avatar: "A", streak: 5, trend: "down" },
    { rank: 7, name: "Carlos Ruiz", avatar: "C", streak: 4, trend: "up" },
    { rank: 8, name: "Hiro Nakamura", avatar: "H", streak: 3, trend: "same" },
  ];

  // Ranking Académico (basado en quizzes)
  const academicRanking = [
    { rank: 1, name: "Yuki Yamamoto", avatar: "Y", score: 98.5, quizzes: 45 },
    { rank: 2, name: "Ana García", avatar: "A", score: 96.2, quizzes: 38 },
    { rank: 3, name: "Kenji Tanaka", avatar: "K", score: 94.7, quizzes: 52 },
    { rank: 4, name: "Tú (Samurai Sensei)", avatar: "S", score: 89.3, quizzes: 28, isCurrentUser: true },
    { rank: 5, name: "Akira Sato", avatar: "A", score: 87.1, quizzes: 31 },
    { rank: 6, name: "María López", avatar: "M", score: 84.6, quizzes: 25 },
    { rank: 7, name: "Hiro Nakamura", avatar: "H", score: 81.2, quizzes: 22 },
    { rank: 8, name: "Carlos Ruiz", avatar: "C", score: 78.5, quizzes: 19 },
  ];

  // Ranking de Jefe Histórico
  const bossRanking = [
    { rank: 1, name: "Kenji Tanaka", avatar: "K", bossCount: 12, wins: 8 },
    { rank: 2, name: "Ana García", avatar: "A", bossCount: 10, wins: 7 },
    { rank: 3, name: "Yuki Yamamoto", avatar: "Y", bossCount: 9, wins: 6 },
    { rank: 4, name: "Akira Sato", avatar: "A", bossCount: 7, wins: 4 },
    { rank: 5, name: "Tú (Samurai Sensei)", avatar: "S", bossCount: 5, wins: 3, isCurrentUser: true },
    { rank: 6, name: "María López", avatar: "M", bossCount: 4, wins: 2 },
    { rank: 7, name: "Carlos Ruiz", avatar: "C", bossCount: 3, wins: 1 },
    { rank: 8, name: "Hiro Nakamura", avatar: "H", bossCount: 2, wins: 1 },
  ];

  const tabs = [
    { id: 'weekly', label: 'Semanal', icon: Clock },
    { id: 'streak', label: 'Racha', icon: Flame },
    { id: 'academic', label: 'Académico', icon: Brain },
    { id: 'boss', label: 'Jefes', icon: Crown },
  ];

  const getRankingData = () => {
    switch (activeTab) {
      case 'weekly':
        return weeklyRanking;
      case 'streak':
        return streakRanking;
      case 'academic':
        return academicRanking;
      case 'boss':
        return bossRanking;
      default:
        return weeklyRanking;
    }
  };

  const renderMetric = (item: any) => {
    switch (activeTab) {
      case 'weekly':
        return (
          <div className="text-right">
            <div className="text-lg font-bold text-green-400">{item.hours}h</div>
            <div className="text-[10px] text-gray-500">esta semana</div>
          </div>
        );
      case 'streak':
        return (
          <div className="text-right">
            <div className="text-lg font-bold text-orange-400 flex items-center gap-1 justify-end">
              <Flame className="w-4 h-4" />
              {item.streak}
            </div>
            <div className="text-[10px] text-gray-500">días</div>
          </div>
        );
      case 'academic':
        return (
          <div className="text-right">
            <div className="text-lg font-bold text-blue-400">{item.score}%</div>
            <div className="text-[10px] text-gray-500">{item.quizzes} quizzes</div>
          </div>
        );
      case 'boss':
        return (
          <div className="text-right">
            <div className="text-lg font-bold text-purple-400">{item.bossCount}x</div>
            <div className="text-[10px] text-gray-500">{item.wins} victorias</div>
          </div>
        );
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

          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold">RANKING</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">1,250</span>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-5 mb-4 relative z-10">
          <div className="flex gap-2 bg-gray-800/50 rounded-2xl p-1.5 border border-gray-700/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as RankingTab)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-b from-green-500/20 to-green-600/20 border border-green-500/50'
                      : 'hover:bg-gray-700/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-gray-500'}`} />
                  <span className={`text-[10px] font-semibold ${
                    isActive ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Descripción del ranking */}
          <div className="mb-4">
            {activeTab === 'weekly' && (
              <p className="text-xs text-gray-400 text-center">
                Ranking basado en horas de estudio esta semana
              </p>
            )}
            {activeTab === 'streak' && (
              <p className="text-xs text-gray-400 text-center">
                Días consecutivos estudiando sin romper la racha
              </p>
            )}
            {activeTab === 'academic' && (
              <p className="text-xs text-gray-400 text-center">
                Promedio de calificaciones en quizzes y simulacros
              </p>
            )}
            {activeTab === 'boss' && (
              <p className="text-xs text-gray-400 text-center">
                Usuarios que más veces fueron jefe de la semana
              </p>
            )}
          </div>

          {/* Ranking List */}
          <div className="space-y-2">
            {getRankingData().map((item: any) => (
              <div
                key={item.rank}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  item.isCurrentUser
                    ? 'bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/30'
                    : 'bg-gray-800/50 border border-gray-700/30'
                }`}
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  item.rank === 1
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900'
                    : item.rank === 2
                    ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                    : item.rank === 3
                    ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                    : 'bg-gray-700/50 text-gray-400'
                }`}>
                  {item.rank}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  item.isCurrentUser
                    ? 'bg-gradient-to-br from-green-400 to-green-600'
                    : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                }`}>
                  {item.avatar}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold truncate ${
                    item.isCurrentUser ? 'text-green-300' : 'text-gray-200'
                  }`}>
                    {item.name}
                  </h4>
                  {item.trend && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className={`w-3 h-3 ${
                        item.trend === 'up' ? 'text-green-400' :
                        item.trend === 'down' ? 'text-red-400 rotate-180' :
                        'text-gray-500'
                      }`} />
                      <span className="text-[10px] text-gray-500">
                        {item.trend === 'up' ? 'Subiendo' : item.trend === 'down' ? 'Bajando' : 'Igual'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Metric */}
                {renderMetric(item)}
              </div>
            ))}
          </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-gray-900/50 border-t border-gray-800 backdrop-blur-sm relative z-10 pb-safe">
          <div className="flex items-center justify-around px-3 py-2">
            <Link to="/" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 4 L24 10 L24 12 L8 12 L8 10 Z M6 12 L6 28 L26 28 L26 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="10" y="14" width="3" height="14" fill="currentColor"/>
                <rect x="19" y="14" width="3" height="14" fill="currentColor"/>
              </svg>
              <span className="text-[10px]">Home</span>
            </Link>

            <Link to="/salas" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect x="8" y="10" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 10 L16 6 L24 10" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px]">Salas</span>
            </Link>

            <button className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-400">
                <path d="M16 4 L18 10 L24 10 L19 14 L21 20 L16 16 L11 20 L13 14 L8 10 L14 10 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <rect x="4" y="20" width="24" height="8" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px] font-semibold">Ranking</span>
            </button>

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
