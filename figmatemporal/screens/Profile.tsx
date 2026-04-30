import { ArrowLeft, Star, Trophy, Flame, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import aldeasImage from 'figma:asset/b223a66f24d050fa22578245935d2697d8d2a15a.png';

export default function Profile() {
  const avatarUrl = "https://images.unsplash.com/photo-1668261200441-95a4667b1720?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHNhbXVyYWklMjB3YXJyaW9yJTIwYXZhdGFyfGVufDF8fHx8MTc3NTg0NDI5OXww&ixlib=rb-4.1.0&q=80&w=1080";
  const villageUrl = "https://images.unsplash.com/photo-1762112800067-d8f750a0ef49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHZpbGxhZ2UlMjBsYW5kc2NhcGUlMjBpc29tZXRyaWN8ZW58MXx8fHwxNzc1ODQ0Mjk5fDA&ixlib=rb-4.1.0&q=80&w=1080";

  const stats = [
    { label: 'Pomodoros', value: '142', icon: Trophy },
    { label: 'Racha Actual', value: '3 días', icon: Flame },
    { label: 'Ranking', value: '#7', icon: TrendingUp },
    { label: 'Nivel Aldea', value: '5', icon: Star },
  ];

  const badges = [
    { name: '3 Días Consecutivos', emoji: '🔥', earned: true },
    { name: 'Auditor Implacable', emoji: '🛡️', earned: true },
    { name: 'Estudiante Dedicado', emoji: '📚', earned: true },
    { name: 'Maestro del Focus', emoji: '🎯', earned: false },
    { name: 'Racha de 7 días', emoji: '⚡', earned: false },
    { name: 'Top 3 del Ranking', emoji: '👑', earned: false },
  ];

  const weeklyProgress = [
    { day: 'L', completed: 4 },
    { day: 'M', completed: 3 },
    { day: 'X', completed: 5 },
    { day: 'J', completed: 4 },
    { day: 'V', completed: 2 },
    { day: 'S', completed: 0 },
    { day: 'D', completed: 0 },
  ];

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

          <h2 className="text-lg font-bold">MI PERFIL</h2>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">1,250</span>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Avatar and User Info */}
          <div className="flex flex-col items-center mb-5">
            <div className="relative mb-3">
              <div className="w-28 h-28 rounded-full border-4 border-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-1 bg-gradient-to-br from-yellow-400 to-amber-500">
                <ImageWithFallback
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-2 border-[#1a1d29] shadow-lg">
                <span className="text-lg font-bold">5</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">Samurai Sensei</h3>
            <p className="text-sm text-gray-400 mb-2">@samurai_warrior</p>
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="text-sm font-semibold">Rating: 4.8/5.0</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-4 border border-gray-700/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-0.5">{stat.value}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Weekly Progress */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Progreso Semanal
            </h3>
            <div className="flex items-end justify-between gap-2">
              {weeklyProgress.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full h-20 bg-gray-700/50 rounded-lg overflow-hidden flex items-end">
                    <div
                      className={`w-full ${day.completed > 0 ? 'bg-gradient-to-t from-green-500 to-green-400' : 'bg-gray-700/30'}`}
                      style={{ height: `${(day.completed / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-gray-300 text-center">
              <span className="text-green-400 font-bold">18 Pomodoros</span> esta semana
            </div>
          </div>

          {/* Badges/Achievements */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-400" />
              Medallas Desbloqueadas
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-2xl border-2 ${
                    badge.earned
                      ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-amber-600/20'
                      : 'border-gray-700/50 bg-gray-800/30'
                  } p-3 flex flex-col items-center justify-center transition-all hover:scale-105`}
                >
                  <span className={`text-3xl mb-1 ${!badge.earned && 'grayscale opacity-40'}`}>
                    {badge.emoji}
                  </span>
                  <span className={`text-[9px] text-center leading-tight ${
                    badge.earned ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Village Progress */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-gray-700/50 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4">Tu Aldea en Evolución</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-green-500/30">
                <ImageWithFallback
                  src={villageUrl}
                  alt="Village"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">Nivel 5</span>
                  <span className="text-sm font-semibold text-green-400">40%</span>
                </div>
                <div className="w-full h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div className="h-full w-[40%] bg-gradient-to-r from-green-500 to-green-400 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  2 Pomodoros más para nivel 6
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <img 
                src={aldeasImage} 
                alt="Village Icon" 
                className="w-16 h-16 object-contain"
              />
              <p className="text-xs text-gray-300 leading-relaxed">
                Tu aldea prospera con cada sesión de estudio. ¡Sigue adelante para desbloquear nuevas estructuras y mejoras visuales!
              </p>
            </div>
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

        {/* Decorative sparkle */}
        <div className="absolute top-32 right-6 z-10 animate-pulse">
          <Sparkles className="w-8 h-8 text-yellow-400/40" />
        </div>
        <div className="absolute bottom-1/3 left-6 z-10 animate-pulse" style={{ animationDelay: '1s' }}>
          <Sparkles className="w-6 h-6 text-green-400/40" />
        </div>
      </div>
    </div>
  );
}
