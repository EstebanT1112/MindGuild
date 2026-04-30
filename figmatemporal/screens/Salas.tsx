import { useState } from 'react';
import { ArrowLeft, Users, Plus, LogIn, Trophy, Copy, CheckCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

export default function Salas() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Mock data - salas del usuario
  const userRooms = [
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
      mode: "Supervivencia",
      members: 8,
      myRanking: 3,
      weeklyHours: 8.0,
      hasTeams: true,
    },
    {
      id: 3,
      name: "Battle Royale - Cálculo I",
      code: "BR-CALC",
      mode: "Battle Royale",
      members: 12,
      myRanking: 5,
      weeklyHours: 6.5,
    },
  ];

  // Ranking de la sala seleccionada
  const roomRanking = [
    { rank: 1, name: "Ana García", hours: 15.5 },
    { rank: 2, name: "Tú (Samurai Sensei)", hours: 12.5, isCurrentUser: true },
    { rank: 3, name: "Carlos Ruiz", hours: 10.2 },
    { rank: 4, name: "María López", hours: 8.7 },
    { rank: 5, name: "Pedro Sánchez", hours: 6.3 },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = () => {
    // Lógica para crear sala
    setShowCreateModal(false);
    alert('Sala creada exitosamente');
  };

  const handleJoinRoom = () => {
    // Lógica para unirse a sala
    setShowJoinModal(false);
    alert('Te has unido a la sala');
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
            <Users className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold">MIS SALAS</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">1,250</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Botón Crear Sala */}
          <div className="mb-5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Crear Nueva Sala
            </button>
          </div>

          {/* Salas del Usuario */}
          <div className="space-y-3 mb-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">Mis Salas</h3>
            {userRooms.map((room) => (
              <div
                key={room.id}
                className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 border border-gray-700/50 backdrop-blur-sm cursor-pointer hover:border-green-500/30 transition-all"
              >
                <div
                  className="flex items-start justify-between mb-3"
                  onClick={() => {
                    if (room.mode === 'Battle Royale') {
                      navigate(`/battle-royale/${room.id}`);
                    } else {
                      navigate(`/salas/${room.id}`);
                    }
                  }}
                >
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

                {/* Ranking desplegable */}
                {selectedRoom === room.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50">
                    <h5 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      Ranking Semanal
                    </h5>
                    <div className="space-y-2">
                      {roomRanking.map((member) => (
                        <div
                          key={member.rank}
                          className={`flex items-center gap-3 p-2 rounded-xl ${
                            member.isCurrentUser
                              ? 'bg-green-500/10 border border-green-500/30'
                              : 'bg-gray-800/30'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
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
                          <span className={`flex-1 text-sm ${
                            member.isCurrentUser ? 'text-green-300 font-semibold' : 'text-gray-300'
                          }`}>
                            {member.name}
                          </span>
                          <span className="text-sm font-bold text-yellow-400">{member.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* Botón Flotante - Unirse a Sala */}
        <button
          onClick={() => setShowJoinModal(true)}
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
              <span className="text-[10px] font-semibold">Salas</span>
            </button>

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

        {/* Modal Crear Sala */}
        {showCreateModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 m-4 w-80 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Crear Sala</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nombre de la Sala</label>
                  <input
                    type="text"
                    placeholder="Ej: Cálculo I - Final"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Modo de Sala</label>
                  <select className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500">
                    <option>Supervivencia</option>
                    <option>Quiz semanal</option>
                    <option>Battle Royale</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-700 bg-gray-800/50 text-green-500 focus:ring-green-500 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-300">Habilitar equipos (Teams)</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">Los miembros podrán unirse a diferentes equipos</p>
                </div>
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Crear Sala
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Unirse */}
        {showJoinModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 m-4 w-80 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Unirse a Sala</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Código de Invitación</label>
                  <input
                    type="text"
                    placeholder="Ej: CALC-7X9P"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono uppercase"
                    maxLength={9}
                  />
                </div>
                <button
                  onClick={handleJoinRoom}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Unirse
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
