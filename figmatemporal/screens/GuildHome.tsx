import { useState } from 'react';
import { ArrowLeft, Copy, Users, Trophy, Zap, TrendingUp, MessageCircle, Vote, Flame, Award, Shield, CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import aldeasImage from 'figma:asset/b223a66f24d050fa22578245935d2697d8d2a15a.png';

export default function GuildHome() {
  const [copied, setCopied] = useState(false);

  const guildData = {
    name: "Guerreros de Kanto",
    accessCode: "KW-7X9P",
    competitionMode: "Por Equipos",
    weeklyScore: 458,
    villageLevel: 7,
    villageProgress: 65,
  };

  const leaderboard = [
    { rank: 1, name: "Kenji Tanaka", avatar: "K", points: 1450, streak: 7, badges: ['🔥', '🛡️', '👑'] },
    { rank: 2, name: "Yuki Yamamoto", avatar: "Y", points: 1380, streak: 5, badges: ['🔥', '📚'] },
    { rank: 3, name: "Tu (Samurai Sensei)", avatar: "S", points: 1250, streak: 3, badges: ['🔥', '🛡️', '📚'], isCurrentUser: true },
    { rank: 4, name: "Akira Sato", avatar: "A", points: 1120, streak: 4, badges: ['📚'] },
    { rank: 5, name: "Hiro Nakamura", avatar: "H", points: 980, streak: 2, badges: ['🔥'] },
  ];

  const socialAlerts = [
    { type: 'warning', message: '¡Todos en tu Guild completaron un Pomodoro hoy excepto tú!', time: 'Hace 2h' },
    { type: 'success', message: '¡Kenji Tanaka acaba de completar su racha de 7 días!', time: 'Hace 4h' },
  ];

  const recentMessages = [
    { user: 'Kenji', message: '¿Alguien quiere hacer un pomodoro grupal ahora?', time: '5m' },
    { user: 'Yuki', message: 'Acabo de terminar mi sesión. ¡Vamos por esa racha!', time: '12m' },
    { user: 'Akira', message: 'La pregunta de matemáticas que subí está lista para votar', time: '23m' },
  ];

  const currentVote = {
    question: "¿Qué formato de competencia prefieres para la próxima semana?",
    options: [
      { id: 1, label: 'FFA (Todos contra Todos)', votes: 8 },
      { id: 2, label: 'Por Equipos', votes: 12 },
    ],
    totalVotes: 20,
    endsIn: '2d 5h',
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(guildData.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Cyber effects */}
        <div className="absolute top-20 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-0 w-1 h-24 bg-gradient-to-b from-transparent via-indigo-400 to-transparent opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>

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
            <Users className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold">MI GUILD</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">1,250</span>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Guild Header Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 via-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-indigo-500/30 backdrop-blur-sm relative overflow-hidden">
            {/* Cyber accent line */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>

            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-6 h-6 text-indigo-400" />
                  <h1 className="text-2xl font-bold">{guildData.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Código de acceso:</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 bg-gray-800/60 rounded-lg px-2 py-1 border border-gray-700/50 hover:bg-gray-700/60 transition-colors"
                  >
                    <span className="text-sm font-mono font-bold text-green-400">{guildData.accessCode}</span>
                    {copied ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-indigo-500/20 rounded-lg px-3 py-2 border border-indigo-500/40 w-fit">
                <Vote className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-semibold text-indigo-200">Modo: {guildData.competitionMode}</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-500/10 rounded-lg px-3 py-2 border border-yellow-500/30 w-fit">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-sm font-bold text-yellow-400">{guildData.weeklyScore} pts esta semana</span>
              </div>
            </div>
          </div>

          {/* Social Pressure Feed */}
          <div className="mb-4 space-y-2">
            {socialAlerts.map((alert, index) => (
              <div
                key={index}
                className={`${
                  alert.type === 'warning'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                } border rounded-2xl p-3 backdrop-blur-sm`}
              >
                <div className="flex items-start gap-2.5">
                  {alert.type === 'warning' ? (
                    <Zap className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-xs leading-relaxed ${
                      alert.type === 'warning' ? 'text-red-200' : 'text-green-200'
                    }`}>
                      {alert.message}
                    </p>
                    <span className="text-[10px] text-gray-500 mt-1 block">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Village Evolution Preview */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Aldea del Guild
              </h3>
              <div className="flex items-center gap-1 bg-green-500/20 rounded-full px-2.5 py-0.5 border border-green-500/40">
                <span className="text-xs font-bold text-green-400">Nivel {guildData.villageLevel}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-500/10 to-indigo-500/10 border border-green-500/30 flex items-center justify-center p-2">
                <img
                  src={aldeasImage}
                  alt="Aldea del Guild"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.4))'
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-300">Progreso Semanal</span>
                  <span className="text-sm font-bold text-green-400">{guildData.villageProgress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 via-green-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${guildData.villageProgress}%`,
                      boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  35 Pomodoros más para nivel {guildData.villageLevel + 1}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              La aldea evoluciona con cada sesión completada por el guild. ¡Colabora para desbloquear nuevas estructuras!
            </p>
          </div>

          {/* Dynamic Ranking Table */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Ranking del Guild
            </h3>
            <div className="space-y-2">
              {leaderboard.map((member) => (
                <div
                  key={member.rank}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                    member.isCurrentUser
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-gray-800/50 border border-gray-700/30'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    member.rank === 1
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900'
                      : member.rank === 2
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                      : member.rank === 3
                      ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {member.rank}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    member.isCurrentUser
                      ? 'bg-gradient-to-br from-green-400 to-green-600'
                      : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                  }`}>
                    {member.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-semibold truncate ${
                        member.isCurrentUser ? 'text-green-300' : 'text-gray-200'
                      }`}>
                        {member.name}
                      </h4>
                      {member.streak >= 3 && (
                        <div className="flex items-center gap-0.5 bg-orange-500/20 rounded px-1.5 py-0.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] font-bold text-orange-400">{member.streak}d</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {member.badges.map((badge, idx) => (
                        <span key={idx} className="text-xs">{badge}</span>
                      ))}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-400">{member.points}</div>
                    <div className="text-[10px] text-gray-500">puntos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voting Widget */}
          <div className="bg-gradient-to-b from-indigo-900/30 via-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-indigo-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Vote className="w-4 h-4 text-indigo-400" />
                Votación Activa
              </h3>
              <span className="text-xs text-indigo-300 bg-indigo-500/20 rounded-full px-2 py-0.5">
                Termina en {currentVote.endsIn}
              </span>
            </div>

            <p className="text-sm text-gray-300 mb-3">{currentVote.question}</p>

            <div className="space-y-2 mb-3">
              {currentVote.options.map((option) => {
                const percentage = Math.round((option.votes / currentVote.totalVotes) * 100);
                return (
                  <button
                    key={option.id}
                    className="w-full bg-gray-800/50 rounded-xl p-3 border border-gray-700/30 hover:border-indigo-500/50 transition-all relative overflow-hidden group"
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-200">{option.label}</span>
                      <span className="text-xs font-bold text-indigo-400">{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 text-center">
              {currentVote.totalVotes} votos de {leaderboard.length} miembros
            </p>
          </div>

          {/* Chat Mini-view */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                Chat del Guild
              </h3>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>

            <div className="space-y-2.5">
              {recentMessages.map((msg, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {msg.user.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-gray-300">{msg.user}</span>
                      <span className="text-[10px] text-gray-500">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mt-0.5">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-3 bg-gray-800/50 rounded-xl py-2.5 text-sm text-gray-400 border border-gray-700/30 hover:bg-gray-700/50 transition-all">
              Abrir chat completo
            </button>
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

            <button className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-400">
                <rect x="8" y="10" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 10 L16 6 L24 10" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px] font-semibold">Guild</span>
            </button>

            <Link to="/peer-review" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 16 L15 19 L21 13" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="22" cy="10" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M20 10 L21 11 L24 8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span className="text-[10px]">Auditoría</span>
            </Link>

            <Link to="/profile" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-gray-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 4 L18 10 L24 10 L19 14 L21 20 L16 16 L11 20 L13 14 L8 10 L14 10 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 20 L10 26 M20 20 L22 26" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span className="text-[10px]">Perfil/Ranking</span>
            </Link>
          </div>
        </nav>

        {/* Cyber decorative elements */}
        <div className="absolute top-24 left-4 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ boxShadow: '0 0 10px #4ade80' }}></div>
        <div className="absolute bottom-32 right-4 w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s', boxShadow: '0 0 10px #818cf8' }}></div>
      </div>
    </div>
  );
}
