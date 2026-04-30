import { useState } from 'react';
import { ArrowLeft, UserPlus, Users, Trophy, Flame, X, Check, Search } from 'lucide-react';
import { Link } from 'react-router';

export default function Amigos() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');

  // Mock data - amigos
  const friends = [
    {
      id: 1,
      username: "kenji_tanaka",
      avatar: "K",
      streak: 7,
      weeklyHours: 15.5,
      level: 8,
      status: "online"
    },
    {
      id: 2,
      username: "yuki_yamamoto",
      avatar: "Y",
      streak: 5,
      weeklyHours: 12.3,
      level: 6,
      status: "online"
    },
    {
      id: 3,
      username: "akira_sato",
      avatar: "A",
      streak: 3,
      weeklyHours: 8.7,
      level: 5,
      status: "offline"
    },
    {
      id: 4,
      username: "hiro_nakamura",
      avatar: "H",
      streak: 2,
      weeklyHours: 6.2,
      level: 4,
      status: "offline"
    },
  ];

  // Mock data - solicitudes pendientes
  const pendingRequests = [
    {
      id: 1,
      username: "maria_lopez",
      avatar: "M",
      mutualFriends: 2,
    },
    {
      id: 2,
      username: "carlos_ruiz",
      avatar: "C",
      mutualFriends: 1,
    },
  ];

  const handleAddFriend = () => {
    if (searchUsername.trim()) {
      alert(`Solicitud enviada a @${searchUsername}`);
      setSearchUsername('');
      setShowAddModal(false);
    }
  };

  const handleAcceptRequest = (username: string) => {
    alert(`Has aceptado la solicitud de @${username}`);
  };

  const handleRejectRequest = (username: string) => {
    alert(`Has rechazado la solicitud de @${username}`);
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
            <h2 className="text-lg font-bold">AMIGOS</h2>
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
          {/* Solicitudes Pendientes */}
          {pendingRequests.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                Solicitudes Pendientes ({pendingRequests.length})
              </h3>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-gradient-to-b from-blue-900/20 via-gray-800/80 to-gray-900/80 rounded-2xl p-4 border border-blue-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-lg">
                        {request.avatar}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-200">@{request.username}</h4>
                        <p className="text-xs text-gray-400">{request.mutualFriends} amigos en común</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request.username)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-2 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" />
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.username)}
                        className="flex-1 bg-gray-700/50 text-gray-300 font-bold py-2 rounded-xl text-sm border border-gray-600/50 hover:bg-gray-600/50 transition-all active:scale-95 flex items-center justify-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Amigos */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Mis Amigos ({friends.length})
              </h3>
              <button className="text-xs text-green-400 font-semibold hover:text-green-300">
                Ordenar
              </button>
            </div>

            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 border border-gray-700/50 backdrop-blur-sm hover:border-green-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center font-bold text-xl">
                      {friend.avatar}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#1a1d29] ${
                      friend.status === 'online' ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-200">@{friend.username}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 bg-green-500/20 rounded-full px-2 py-0.5">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-[8px] font-bold text-gray-900">
                          {friend.level}
                        </div>
                        <span className="text-xs font-bold text-green-400">Nivel {friend.level}</span>
                      </div>
                      {friend.streak >= 3 && (
                        <div className="flex items-center gap-0.5 bg-orange-500/20 rounded-full px-2 py-0.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-xs font-bold text-orange-400">{friend.streak}d</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <div>
                      <p className="text-xs text-gray-400">Esta semana</p>
                      <p className="text-sm font-bold text-yellow-400">{friend.weeklyHours}h</p>
                    </div>
                  </div>
                  <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all">
                    Ver Perfil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Botón Flotante - Agregar Amigo */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-green-500 to-green-400 text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center z-20"
          style={{
            boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)'
          }}
        >
          <UserPlus className="w-6 h-6" />
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

            <button className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-400">
                <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 28 C8 22 11 18 16 18 C21 18 24 22 24 28" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px] font-semibold">Amigos</span>
            </button>
          </div>
        </nav>

        {/* Modal Agregar Amigo */}
        {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-6 m-4 w-80 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Agregar Amigo</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nombre de usuario</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="@usuario"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Busca por nombre de usuario exacto</p>
                </div>
                <button
                  onClick={handleAddFriend}
                  disabled={!searchUsername.trim()}
                  className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all ${
                    searchUsername.trim()
                      ? 'bg-gradient-to-r from-green-500 to-green-400 text-white hover:shadow-xl active:scale-95'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
