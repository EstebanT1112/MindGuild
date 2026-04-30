import { useState } from 'react';
import { ArrowLeft, MapPin, ShoppingBag, TrendingUp, Lock, Check, Star } from 'lucide-react';
import { Link } from 'react-router';
import aldeasImage from 'figma:asset/b223a66f24d050fa22578245935d2697d8d2a15a.png';

type TabType = 'overview' | 'shop';

export default function Ayuntamiento() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [userCoins, setUserCoins] = useState(1250);

  const villageData = {
    level: 5,
    progress: 65,
    name: "Villa Samurai",
    nextLevelReq: 2,
  };

  // Edificios desbloqueados
  const buildings = [
    { id: 1, name: "Casa Principal", level: 5, unlocked: true, icon: "🏠" },
    { id: 2, name: "Dojo de Entrenamiento", level: 3, unlocked: true, icon: "🥋" },
    { id: 3, name: "Biblioteca", level: 4, unlocked: true, icon: "📚" },
    { id: 4, name: "Templo de Meditación", level: 5, unlocked: true, icon: "⛩️" },
    { id: 5, name: "Torre del Reloj", level: 6, unlocked: false, icon: "🗼" },
    { id: 6, name: "Jardín Zen", level: 7, unlocked: false, icon: "🌸" },
  ];

  // Tienda de mejoras
  const shopItems = [
    {
      id: 1,
      name: "Sakura en Flor",
      description: "Añade cerezos florales a tu aldea",
      price: 500,
      category: "Decoración",
      unlocked: false,
      preview: "🌸"
    },
    {
      id: 2,
      name: "Faroles Dorados",
      description: "Ilumina tu aldea con faroles tradicionales",
      price: 300,
      category: "Decoración",
      unlocked: true,
      preview: "🏮"
    },
    {
      id: 3,
      name: "Puente de Bambú",
      description: "Conecta las áreas de tu aldea",
      price: 800,
      category: "Estructura",
      unlocked: false,
      preview: "🌉"
    },
    {
      id: 4,
      name: "Estanque Koi",
      description: "Añade un estanque con carpas koi",
      price: 1200,
      category: "Decoración",
      unlocked: false,
      preview: "🎏"
    },
    {
      id: 5,
      name: "Camino de Piedra",
      description: "Caminos elegantes para tu aldea",
      price: 400,
      category: "Decoración",
      unlocked: true,
      preview: "🪨"
    },
    {
      id: 6,
      name: "Estatua del Dragón",
      description: "Monumento legendario",
      price: 2000,
      category: "Monumento",
      unlocked: false,
      preview: "🐉"
    },
  ];

  const handlePurchase = (itemId: number, price: number) => {
    if (userCoins >= price) {
      setUserCoins(prev => prev - price);
      alert('¡Mejora comprada exitosamente!');
      // Aquí iría la lógica para desbloquear el item
    } else {
      alert('No tienes suficientes monedas H');
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
            <MapPin className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">AYUNTAMIENTO</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-sm font-bold text-gray-900">H</span>
            </div>
            <span className="text-sm font-semibold pr-1">{userCoins}</span>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-5 mb-4 relative z-10">
          <div className="flex gap-2 bg-gray-800/50 rounded-2xl p-1.5 border border-gray-700/50">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/20 border border-amber-500/50'
                  : 'hover:bg-gray-700/30'
              }`}
            >
              <MapPin className={`w-4 h-4 ${activeTab === 'overview' ? 'text-amber-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-semibold ${
                activeTab === 'overview' ? 'text-amber-400' : 'text-gray-500'
              }`}>
                Mi Aldea
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shop')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${
                activeTab === 'shop'
                  ? 'bg-gradient-to-b from-green-500/20 to-green-600/20 border border-green-500/50'
                  : 'hover:bg-gray-700/30'
              }`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeTab === 'shop' ? 'text-green-400' : 'text-gray-500'}`} />
              <span className={`text-sm font-semibold ${
                activeTab === 'shop' ? 'text-green-400' : 'text-gray-500'
              }`}>
                Tienda
              </span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {activeTab === 'overview' ? (
            <>
              {/* Estado de la Aldea */}
              <div className="bg-gradient-to-b from-amber-900/40 via-gray-800/80 to-gray-900/80 rounded-3xl p-5 mb-4 border border-amber-500/30 backdrop-blur-sm">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-amber-300 mb-1">{villageData.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-gray-400">Nivel {villageData.level}</span>
                  </div>
                </div>

                <div className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center p-3 mb-4">
                  <img
                    src={aldeasImage}
                    alt="Aldea"
                    className="w-full h-full object-contain"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(251, 191, 36, 0.5))'
                    }}
                  />
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-400">Progreso al nivel {villageData.level + 1}</span>
                    <span className="text-sm font-bold text-amber-400">{villageData.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-800/80 rounded-full overflow-hidden border border-gray-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${villageData.progress}%`,
                        boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 text-center">
                    {villageData.nextLevelReq} Pomodoros más para subir de nivel
                  </p>
                </div>
              </div>

              {/* Edificios */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Edificios
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {buildings.map((building) => (
                    <div
                      key={building.id}
                      className={`rounded-2xl p-4 border backdrop-blur-sm ${
                        building.unlocked
                          ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-gray-700/50'
                          : 'bg-gray-800/30 border-gray-700/30'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`text-4xl mb-2 ${!building.unlocked && 'grayscale opacity-40'}`}>
                          {building.unlocked ? building.icon : '🔒'}
                        </div>
                        <h4 className={`text-xs font-bold text-center mb-1 ${
                          building.unlocked ? 'text-gray-200' : 'text-gray-500'
                        }`}>
                          {building.name}
                        </h4>
                        <div className={`flex items-center gap-1 ${
                          building.unlocked ? 'text-amber-400' : 'text-gray-600'
                        }`}>
                          {building.unlocked ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span className="text-[10px] font-semibold">Nivel {building.level}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <span className="text-[10px]">Nivel {building.level}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Tienda */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Mejoras Disponibles
                </h3>
                <div className="space-y-3">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 border backdrop-blur-sm ${
                        item.unlocked
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{item.preview}</div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <div>
                              <h4 className="text-sm font-bold text-gray-200">{item.name}</h4>
                              <p className="text-xs text-gray-400 mb-2">{item.description}</p>
                              <span className="text-[10px] bg-gray-700/50 rounded px-2 py-0.5 text-gray-400">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-900">H</span>
                          </div>
                          <span className="text-sm font-bold text-yellow-400">{item.price}</span>
                        </div>

                        {item.unlocked ? (
                          <div className="flex items-center gap-1.5 bg-green-500/20 rounded-lg px-3 py-1.5 border border-green-500/40">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-semibold text-green-400">Comprado</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item.id, item.price)}
                            disabled={userCoins < item.price}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              userCoins >= item.price
                                ? 'bg-gradient-to-r from-green-500 to-green-400 text-white hover:shadow-lg active:scale-95'
                                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            Comprar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
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
      </div>
    </div>
  );
}
