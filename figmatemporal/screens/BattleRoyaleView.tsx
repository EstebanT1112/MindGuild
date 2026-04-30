import { useState } from 'react';
import { ArrowLeft, Users, Trophy, Plus, X, Check, MessageSquare, Edit3, Trash2, Timer, Settings, Play, Minus, Clock, Target, Crown, Copy, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

type QuestionType = 'multiple-choice' | 'open';
type SessionType = 'pomodoro' | 'libre';
type RankingTab = 'general' | 'team' | 'time' | 'answers' | 'boss';

interface Question {
  id: number;
  author: string;
  questionText: string;
  type: QuestionType;
  options?: string[];
  correctOption?: number;
  answer?: string;
  votes: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function BattleRoyaleView() {
  const navigate = useNavigate();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('pomodoro');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroCycles, setPomodoroCycles] = useState(4);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [showAddModal, setShowAddModal] = useState(false);
  const [questionType, setQuestionType] = useState<QuestionType>('multiple-choice');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [openAnswer, setOpenAnswer] = useState('');

  // Estados para el quiz
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{questionId: number, answer: number | string}[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [developAnswer, setDevelopAnswer] = useState('');
  const [rankingTab, setRankingTab] = useState<RankingTab>('general');
  const [rankingExpanded, setRankingExpanded] = useState(true);
  const [teamsExpanded, setTeamsExpanded] = useState(true);

  // Mock data de la sala
  const room = {
    id: 1,
    name: "Battle Royale - Cálculo I",
    code: "BR-CALC",
    mode: "Battle Royale",
    members: 12,
    hasTeams: false, // Battle Royale sin teams
    isAdmin: true,
  };

  // Teams de la sala (vacío para Battle Royale)
  const teams: any[] = [];
  const userTeam = null;
  const userTeamColor = null;

  // Rankings de la sala (Battle Royale no tiene teams por defecto)
  const generalRanking = [
    { rank: 1, name: "Ana García", score: 950, hours: 15.5, correctAnswers: 42, avatar: "A", isOnline: true },
    { rank: 2, name: "Carlos Ruiz", score: 820, hours: 10.2, correctAnswers: 38, avatar: "C", isOnline: false },
    { rank: 3, name: "Tú (Samurai Sensei)", score: 760, hours: 12.5, correctAnswers: 28, avatar: "S", isCurrentUser: true, isOnline: true },
    { rank: 4, name: "María López", score: 680, hours: 8.7, correctAnswers: 25, avatar: "M", isOnline: true },
    { rank: 5, name: "Pedro Sánchez", score: 580, hours: 6.3, correctAnswers: 19, avatar: "P", isOnline: false },
  ];

  const timeRanking = [
    { rank: 1, name: "Ana García", hours: 15.5, avatar: "A", isOnline: true },
    { rank: 2, name: "Tú (Samurai Sensei)", hours: 12.5, avatar: "S", isCurrentUser: true, isOnline: true },
    { rank: 3, name: "Carlos Ruiz", hours: 10.2, avatar: "C", isOnline: false },
    { rank: 4, name: "María López", hours: 8.7, avatar: "M", isOnline: true },
    { rank: 5, name: "Pedro Sánchez", hours: 6.3, avatar: "P", isOnline: false },
  ];

  const answersRanking = [
    { rank: 1, name: "Ana García", correctAnswers: 42, accuracy: 95.5, avatar: "A", isOnline: true },
    { rank: 2, name: "Carlos Ruiz", correctAnswers: 38, accuracy: 92.7, avatar: "C", isOnline: false },
    { rank: 3, name: "Tú (Samurai Sensei)", correctAnswers: 28, accuracy: 90.3, avatar: "S", isCurrentUser: true, isOnline: true },
    { rank: 4, name: "María López", correctAnswers: 25, accuracy: 86.2, avatar: "M", isOnline: true },
    { rank: 5, name: "Pedro Sánchez", correctAnswers: 19, accuracy: 79.2, avatar: "P", isOnline: false },
  ];

  const bossRanking = [
    { rank: 1, name: "Ana García", bossCount: 10, wins: 7, avatar: "A", isOnline: true },
    { rank: 2, name: "Carlos Ruiz", bossCount: 8, wins: 5, avatar: "C", isOnline: false },
    { rank: 3, name: "Tú (Samurai Sensei)", bossCount: 6, wins: 4, avatar: "S", isCurrentUser: true, isOnline: true },
    { rank: 4, name: "María López", bossCount: 4, wins: 2, avatar: "M", isOnline: true },
    { rank: 5, name: "Pedro Sánchez", bossCount: 3, wins: 1, avatar: "P", isOnline: false },
  ];

  // Lista completa de miembros de la sala
  const members = [
    { name: "Ana García", avatar: "A", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Tú (Samurai Sensei)", avatar: "S", isOnline: true, isCurrentUser: true, role: "Admin" },
    { name: "Carlos Ruiz", avatar: "C", isOnline: false, isCurrentUser: false, role: "Miembro" },
    { name: "María López", avatar: "M", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Pedro Sánchez", avatar: "P", isOnline: false, isCurrentUser: false, role: "Miembro" },
    { name: "Laura Martínez", avatar: "L", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Diego Torres", avatar: "D", isOnline: false, isCurrentUser: false, role: "Miembro" },
    { name: "Sofia Ramírez", avatar: "So", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Miguel Ángel", avatar: "MA", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Isabella Cruz", avatar: "I", isOnline: false, isCurrentUser: false, role: "Miembro" },
    { name: "Javier Méndez", avatar: "J", isOnline: true, isCurrentUser: false, role: "Miembro" },
    { name: "Valentina Díaz", avatar: "V", isOnline: false, isCurrentUser: false, role: "Miembro" },
  ];

  const getTeamOnlyRanking = () => {
    if (!room.hasTeams) return [];

    // Agrupar por equipo y calcular totales de todas las métricas
    const teamData: any = {};

    generalRanking.forEach((member: any) => {
      if (member.team) {
        if (!teamData[member.team]) {
          teamData[member.team] = {
            name: member.team,
            color: member.teamColor,
            memberCount: 0,
            totalScore: 0,
            totalHours: 0,
            totalAnswers: 0,
            totalBoss: 0,
          };
        }
        teamData[member.team].memberCount += 1;
        teamData[member.team].totalScore += member.score;
        teamData[member.team].totalHours += member.hours;
        teamData[member.team].totalAnswers += member.correctAnswers;
      }
    });

    bossRanking.forEach((member: any) => {
      if (member.team && teamData[member.team]) {
        teamData[member.team].totalBoss += member.bossCount;
      }
    });

    // Ordenar equipos por score total
    const sortedTeams = Object.values(teamData).sort((a: any, b: any) => b.totalScore - a.totalScore);

    return sortedTeams.map((team: any, index: number) => ({
      ...team,
      rank: index + 1
    }));
  };

  const getTeamRankings = () => {
    if (!room.hasTeams || rankingTab === 'general' || rankingTab === 'team') return null;

    // Agrupar miembros por equipo y calcular totales
    const teamData: any = {};
    let individualMembers: any[] = [];

    let sourceRanking = rankingTab === 'time' ? timeRanking :
                       rankingTab === 'answers' ? answersRanking : bossRanking;

    sourceRanking.forEach((member: any) => {
      if (member.team) {
        if (!teamData[member.team]) {
          teamData[member.team] = {
            name: member.team,
            color: member.teamColor,
            members: [],
            total: 0
          };
        }
        teamData[member.team].members.push(member);

        // Sumar totales según el tab
        if (rankingTab === 'time') {
          teamData[member.team].total += member.hours;
        } else if (rankingTab === 'answers') {
          teamData[member.team].total += member.correctAnswers;
        } else if (rankingTab === 'boss') {
          teamData[member.team].total += member.bossCount;
        }
      } else {
        individualMembers.push(member);
      }
    });

    // Ordenar miembros dentro de cada equipo por su aporte
    Object.values(teamData).forEach((team: any) => {
      team.members.sort((a: any, b: any) => {
        if (rankingTab === 'time') return b.hours - a.hours;
        if (rankingTab === 'answers') return b.correctAnswers - a.correctAnswers;
        if (rankingTab === 'boss') return b.bossCount - a.bossCount;
        return 0;
      });
    });

    // Ordenar equipos por total
    const sortedTeams = Object.values(teamData).sort((a: any, b: any) => b.total - a.total);

    return { teams: sortedTeams, individuals: individualMembers };
  };

  const getRoomRanking = () => {
    switch (rankingTab) {
      case 'general':
        return generalRanking;
      case 'time':
        return timeRanking;
      case 'answers':
        return answersRanking;
      case 'boss':
        return bossRanking;
      default:
        return generalRanking;
    }
  };

  // Preguntas del quiz semanal
  const [weeklyQuestions, setWeeklyQuestions] = useState<Question[]>([
    {
      id: 1,
      author: "Ana García",
      questionText: "¿Cuál es la derivada de x²?",
      type: 'multiple-choice',
      options: ['x', '2x', 'x²', '2'],
      correctOption: 1,
      votes: 8,
      status: 'approved'
    },
    {
      id: 2,
      author: "Carlos Ruiz",
      questionText: "Explica el teorema fundamental del cálculo",
      type: 'open',
      answer: "El teorema fundamental del cálculo establece la relación entre derivación e integración...",
      votes: 5,
      status: 'approved'
    },
  ]);

  // Preguntas propuestas (pendientes)
  const [proposedQuestions, setProposedQuestions] = useState<Question[]>([
    {
      id: 3,
      author: "Tú (Samurai Sensei)",
      questionText: "¿Qué es un límite en cálculo?",
      type: 'multiple-choice',
      options: ['Un valor fijo', 'El valor al que tiende una función', 'Una derivada', 'Una integral'],
      correctOption: 1,
      votes: 3,
      status: 'pending'
    },
  ]);

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      alert('Debes escribir una pregunta');
      return;
    }

    if (questionType === 'multiple-choice') {
      const filledOptions = options.filter(opt => opt.trim() !== '');
      if (filledOptions.length < 2) {
        alert('Debes agregar al menos 2 opciones');
        return;
      }
    } else {
      if (!openAnswer.trim()) {
        alert('Debes agregar una respuesta');
        return;
      }
    }

    const newQuestion: Question = {
      id: Date.now(),
      author: "Tú (Samurai Sensei)",
      questionText,
      type: questionType,
      ...(questionType === 'multiple-choice'
        ? { options: options.filter(opt => opt.trim() !== ''), correctOption }
        : { answer: openAnswer }
      ),
      votes: 0,
      status: 'pending'
    };

    setProposedQuestions(prev => [...prev, newQuestion]);

    // Resetear formulario
    setQuestionText('');
    setOptions(['', '', '', '']);
    setCorrectOption(0);
    setOpenAnswer('');
    setShowAddModal(false);

    alert('¡Pregunta agregada! Será votada por el grupo.');
  };

  const handleStartSession = () => {
    navigate('/pomodoro');
  };

  const handleSaveConfig = () => {
    setShowConfigModal(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleJoinTeam = (teamName: string) => {
    // Aquí iría la lógica para unirse al team
    // Por ahora solo cierra el modal
    alert(`Te has unido al team: ${teamName}`);
    setShowTeamsModal(false);
  };

  const getSessionDuration = () => {
    if (sessionType === 'pomodoro') {
      return `${pomodoroMinutes.toString().padStart(2, '0')}:00`;
    } else {
      return '∞';
    }
  };

  const incrementMinutes = () => setPomodoroMinutes(prev => Math.min(prev + 5, 120));
  const decrementMinutes = () => setPomodoroMinutes(prev => Math.max(prev - 5, 5));
  const incrementCycles = () => setPomodoroCycles(prev => Math.min(prev + 1, 10));
  const decrementCycles = () => setPomodoroCycles(prev => Math.max(prev - 1, 1));
  const incrementShortBreak = () => setShortBreak(prev => Math.min(prev + 1, 15));
  const decrementShortBreak = () => setShortBreak(prev => Math.max(prev - 1, 1));
  const incrementLongBreak = () => setLongBreak(prev => Math.min(prev + 5, 30));
  const decrementLongBreak = () => setLongBreak(prev => Math.max(prev - 5, 10));
  const incrementLongBreakInterval = () => setLongBreakInterval(prev => Math.min(prev + 1, 10));
  const decrementLongBreakInterval = () => setLongBreakInterval(prev => Math.max(prev - 1, 2));

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleVote = (questionId: number, voteType: 'up' | 'down') => {
    setProposedQuestions(prev =>
      prev.map(q =>
        q.id === questionId
          ? { ...q, votes: voteType === 'up' ? q.votes + 1 : q.votes - 1 }
          : q
      )
    );
  };

  const deleteQuestion = (questionId: number) => {
    if (confirm('¿Estás seguro de eliminar esta pregunta?')) {
      setProposedQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  const handleStartQuiz = () => {
    setShowQuizModal(true);
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizCompleted(false);
    setSelectedOption(null);
    setDevelopAnswer('');
  };

  const handleNextQuestion = () => {
    const currentQuestion = weeklyQuestions[currentQuestionIndex];

    // Guardar respuesta
    if (currentQuestion.type === 'multiple-choice') {
      if (selectedOption !== null) {
        setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: selectedOption }]);
      }
    } else {
      if (developAnswer.trim()) {
        setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: developAnswer }]);
      }
    }

    // Resetear para la siguiente pregunta
    setSelectedOption(null);
    setDevelopAnswer('');

    // Avanzar o finalizar
    if (currentQuestionIndex < weeklyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleFinishQuiz = () => {
    const currentQuestion = weeklyQuestions[currentQuestionIndex];

    // Guardar última respuesta
    if (currentQuestion.type === 'multiple-choice') {
      if (selectedOption !== null) {
        setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: selectedOption }]);
      }
    } else {
      if (developAnswer.trim()) {
        setUserAnswers(prev => [...prev, { questionId: currentQuestion.id, answer: developAnswer }]);
      }
    }

    setQuizCompleted(true);
  };

  const handleVoteQuestion = (questionId: number, voteType: 'approve' | 'reject') => {
    alert(`Pregunta ${voteType === 'approve' ? 'aprobada' : 'rechazada'}`);
  };

  const handleVoteAnswer = (questionId: number, voteType: 'approve' | 'reject') => {
    alert(`Respuesta ${voteType === 'approve' ? 'aprobada' : 'rechazada'}`);
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
          <Link to="/salas">
            <button className="w-9 h-9 rounded-full bg-gray-800/90 flex items-center justify-center border border-gray-700/50 hover:bg-gray-700/90 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
          </Link>

          <div className="flex-1 mx-3">
            <h2 className="text-base font-bold text-center truncate">{room.name}</h2>
            <p className="text-xs text-gray-400 text-center">{room.mode}</p>
          </div>

          <button
            onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1.5 bg-gray-800/60 rounded-full px-2.5 py-1 border border-gray-700/50 hover:bg-gray-700/60 hover:border-purple-500/50 transition-colors"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold">{room.members}</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-5 pb-4 relative z-10 overflow-y-auto">
          {/* Botón Configurar Sesión */}
          <button
            onClick={() => setShowConfigModal(true)}
            className="w-full mb-5 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-2xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              <div className="text-left">
                <h3 className="text-sm font-bold text-gray-200">Configurar Sesión</h3>
                <p className="text-xs text-gray-500">
                  {sessionType === 'pomodoro'
                    ? `Pomodoro · ${pomodoroMinutes}min · ${pomodoroCycles} ciclos`
                    : 'Libre · Sin límites'}
                </p>
              </div>
            </div>
            <div className="text-gray-400 group-hover:text-purple-400 transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 6 L12 10 L7 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>

          {/* Temporizador Preview */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-6 mb-5 border border-gray-700/50 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              {/* Circular Timer Preview */}
              <div className="relative w-48 h-48 mb-5">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="#2a2d3a"
                    strokeWidth="10"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke="url(#gradient-purple)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="534.07"
                    strokeDashoffset="0"
                    style={{
                      filter: 'drop-shadow(0 0 20px #a855f7)',
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {sessionType === 'pomodoro' ? (
                    <Timer className="w-8 h-8 text-purple-400 mb-2" />
                  ) : (
                    <Clock className="w-8 h-8 text-purple-400 mb-2" />
                  )}
                  <div className="text-4xl font-bold">{getSessionDuration()}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {sessionType === 'pomodoro' ? `${pomodoroCycles} ${pomodoroCycles === 1 ? 'ciclo' : 'ciclos'}` : 'Sin límite de tiempo'}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartSession}
                className="w-full font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-400 text-white"
                style={{
                  filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.4))'
                }}
              >
                <Play className="w-6 h-6" />
                COMENZAR SESIÓN
              </button>
            </div>
          </div>

          {/* Ranking de la Sala */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 mb-5 border border-gray-700/50 backdrop-blur-sm">
            <button
              onClick={() => setRankingExpanded(!rankingExpanded)}
              className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
            >
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                Ranking de la Sala
              </h3>
              {rankingExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {rankingExpanded && (
              <>
                {/* Tabs de Ranking */}
                <div className="flex gap-1 mb-3 bg-gray-900/50 rounded-xl p-1">
              {room.hasTeams && (
                <button
                  onClick={() => setRankingTab('team')}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    rankingTab === 'team'
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-500 hover:text-gray-400'
                  }`}
                >
                  Team
                </button>
              )}
              <button
                onClick={() => setRankingTab('time')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  rankingTab === 'time'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Tiempo
              </button>
              <button
                onClick={() => setRankingTab('answers')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  rankingTab === 'answers'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Respuestas
              </button>
              <button
                onClick={() => setRankingTab('boss')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  rankingTab === 'boss'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                Jefes
              </button>
              <button
                onClick={() => setRankingTab('general')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  rankingTab === 'general'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                {room.hasTeams ? 'Individual' : 'General'}
              </button>
            </div>

            <div className="space-y-2">
              {rankingTab === 'team' && room.hasTeams ? (
                // Mostrar ranking de equipos completo
                getTeamOnlyRanking().map((team: any) => (
                  <div
                    key={team.name}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-800/30"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      team.rank === 1
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900'
                        : team.rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                        : team.rank === 3
                        ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                        : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {team.rank}
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: team.color }}
                      ></div>
                      <Shield className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ color: team.color }}
                      >
                        {team.name}
                      </div>
                      <div className="text-[9px] text-gray-500 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {team.memberCount} miembros
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-400">{team.totalScore}</div>
                      <div className="text-[9px] text-gray-500">{team.totalHours.toFixed(1)}h · {team.totalAnswers} resp</div>
                    </div>
                  </div>
                ))
              ) : room.hasTeams && rankingTab !== 'general' ? (
                // Mostrar ranking por equipos
                (() => {
                  const teamRankings = getTeamRankings();
                  if (!teamRankings) return null;

                  return (
                    <>
                      {teamRankings.teams.map((team: any, teamIndex: number) => (
                        <div key={team.name} className="space-y-1">
                          {/* Header del equipo */}
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/60 rounded-lg border border-gray-700/50">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                              teamIndex === 0
                                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-gray-900'
                                : teamIndex === 1
                                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900'
                                : teamIndex === 2
                                ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                : 'bg-gray-700/50 text-gray-400'
                            }`}>
                              {teamIndex + 1}
                            </div>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                            <span className="text-xs font-bold" style={{ color: team.color }}>{team.name}</span>
                            <div className="ml-auto text-xs font-bold">
                              {rankingTab === 'time' && <span className="text-green-400">{team.total.toFixed(1)}h</span>}
                              {rankingTab === 'answers' && <span className="text-blue-400">{team.total}</span>}
                              {rankingTab === 'boss' && <span className="text-yellow-400">{team.total}x</span>}
                            </div>
                          </div>

                          {/* Miembros del equipo */}
                          {team.members.map((member: any, memberIndex: number) => (
                            <div
                              key={member.name}
                              className={`flex items-center gap-2.5 p-2 pl-4 rounded-xl ${
                                member.isCurrentUser
                                  ? 'bg-purple-500/10 border border-purple-500/30'
                                  : 'bg-gray-800/30'
                              }`}
                            >
                              <div className="w-6 h-6 flex items-center justify-center">
                                <span className="text-[10px] text-gray-500 font-semibold">{memberIndex + 1}°</span>
                              </div>

                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  member.isCurrentUser
                                    ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                    : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                                }`}>
                                  {member.avatar}
                                </div>
                                {member.isOnline && (
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1a1d29]"></div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-xs font-semibold truncate"
                                  style={{ color: team.color }}
                                >
                                  {member.name}
                                </div>
                              </div>

                              {rankingTab === 'time' && (
                                <span className="text-xs font-bold text-green-400">{member.hours}h</span>
                              )}
                              {rankingTab === 'answers' && (
                                <div className="text-right">
                                  <div className="text-xs font-bold text-blue-400">{member.correctAnswers}</div>
                                  <div className="text-[9px] text-gray-500">{member.accuracy}%</div>
                                </div>
                              )}
                              {rankingTab === 'boss' && (
                                <div className="text-right">
                                  <div className="text-xs font-bold text-yellow-400">{member.bossCount}x</div>
                                  <div className="text-[9px] text-gray-500">{member.wins} wins</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Miembros sin equipo */}
                      {teamRankings.individuals.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 px-2">Sin equipo</div>
                          {teamRankings.individuals.map((member: any) => (
                            <div
                              key={member.name}
                              className={`flex items-center gap-2.5 p-2 rounded-xl ${
                                member.isCurrentUser
                                  ? 'bg-purple-500/10 border border-purple-500/30'
                                  : 'bg-gray-800/30'
                              }`}
                            >
                              <div className="relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                  member.isCurrentUser
                                    ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                                    : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                                }`}>
                                  {member.avatar}
                                </div>
                                {member.isOnline && (
                                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1a1d29]"></div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate text-gray-400">
                                  {member.name}
                                </div>
                              </div>

                              {rankingTab === 'time' && (
                                <span className="text-xs font-bold text-green-400">{member.hours}h</span>
                              )}
                              {rankingTab === 'answers' && (
                                <div className="text-right">
                                  <div className="text-xs font-bold text-blue-400">{member.correctAnswers}</div>
                                  <div className="text-[9px] text-gray-500">{member.accuracy}%</div>
                                </div>
                              )}
                              {rankingTab === 'boss' && (
                                <div className="text-right">
                                  <div className="text-xs font-bold text-yellow-400">{member.bossCount}x</div>
                                  <div className="text-[9px] text-gray-500">{member.wins} wins</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()
              ) : (
                // Mostrar ranking individual normal
                getRoomRanking().map((member: any) => (
                  <div
                    key={member.rank}
                    className={`flex items-center gap-2.5 p-2 rounded-xl ${
                      member.isCurrentUser
                        ? 'bg-purple-500/10 border border-purple-500/30'
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

                    <div className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        member.isCurrentUser
                          ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                          : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                      }`}>
                        {member.avatar}
                      </div>
                      {member.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#1a1d29]"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ color: member.team ? member.teamColor : (member.isCurrentUser ? '#d8b4fe' : '#d1d5db') }}
                      >
                        {member.name}
                      </div>
                      {member.team && (
                        <div className="text-[9px] text-gray-500 truncate flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: member.teamColor }}
                          ></div>
                          {member.team}
                        </div>
                      )}
                    </div>

                    {rankingTab === 'general' && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-purple-400">{member.score}</div>
                        <div className="text-[9px] text-gray-500">{member.hours}h · {member.correctAnswers} resp</div>
                      </div>
                    )}
                    {rankingTab === 'time' && (
                      <span className="text-xs font-bold text-green-400">{member.hours}h</span>
                    )}
                    {rankingTab === 'answers' && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-blue-400">{member.correctAnswers}</div>
                        <div className="text-[9px] text-gray-500">{member.accuracy}%</div>
                      </div>
                    )}
                    {rankingTab === 'boss' && (
                      <div className="text-right">
                        <div className="text-xs font-bold text-yellow-400">{member.bossCount}x</div>
                        <div className="text-[9px] text-gray-500">{member.wins} wins</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
              </>
            )}
          </div>

          {/* Sección Quiz Semanal */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
              Quiz Semanal
            </h3>

            {/* Botón para iniciar quiz */}
            <div className="mb-4">
              <button
                onClick={handleStartQuiz}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Comenzar Quiz Semanal
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                {weeklyQuestions.length} preguntas · Después podrás validar las respuestas
              </p>
            </div>

            {/* Sección Agregar Preguntas */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Agregar Preguntas
              </h4>

              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mb-3"
              >
                <Plus className="w-5 h-5" />
                Nueva Pregunta
              </button>

              <p className="text-xs text-gray-500 text-center mt-2 mb-3">
                Las preguntas serán votadas por el grupo
              </p>

              {/* Mis preguntas propuestas */}
              {proposedQuestions.filter(q => q.author.includes('Tú')).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Mis Preguntas Propuestas
                  </h4>
                  <div className="space-y-2">
                    {proposedQuestions
                      .filter(q => q.author.includes('Tú'))
                      .map((question) => (
                        <div
                          key={question.id}
                          className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-3 border border-gray-700/50 backdrop-blur-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-bold text-gray-200 flex-1">{question.questionText}</p>
                            <button
                              onClick={() => deleteQuestion(question.id)}
                              className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center transition-all ml-2"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                              Pendiente
                            </span>
                            <span className="text-[10px] text-gray-500">{question.votes} votos</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección de Teams */}
          {room.hasTeams && (
            <div className="mt-5 bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-3xl p-4 border border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setTeamsExpanded(!teamsExpanded)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold">Equipos (Teams)</h3>
                  {teamsExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {room.isAdmin && teamsExpanded && (
                  <button
                    onClick={() => setShowCreateTeamModal(true)}
                    className="flex items-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-purple-500/50 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear
                  </button>
                )}
              </div>

              {teamsExpanded && (
                <>
                  {/* Lista de Teams */}
                  {teams.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {teams.map((team: any) => (
                    <div
                      key={team.id}
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          ></div>
                          <h4 className="text-sm font-bold text-gray-200">{team.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-700/50 rounded-full px-2 py-0.5">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] text-gray-400">{team.members.length}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {team.members.map((memberName: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400"
                          >
                            {memberName}
                          </span>
                        ))}
                      </div>

                      {!userTeam && (
                        <button
                          onClick={() => handleJoinTeam(team.name)}
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-xs py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all active:scale-95"
                        >
                          Unirse
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 mb-4">
                  <Shield className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No hay equipos creados aún</p>
                  {room.isAdmin && (
                    <p className="text-[10px] text-gray-500 mt-1">Crea el primer team</p>
                  )}
                </div>
              )}

              {/* Tu equipo actual */}
              {userTeam && (
                <div className="bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-xl p-3 border border-gray-600/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tu equipo</p>
                    <div className="bg-yellow-500/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
                      No puedes cambiar
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: userTeamColor || '#8b5cf6' }}
                    ></div>
                    <h3 className="text-sm font-bold" style={{ color: userTeamColor || '#8b5cf6' }}>
                      {userTeam}
                    </h3>
                  </div>
                </div>
              )}
                </>
              )}
            </div>
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

            <Link to="/salas" className="flex flex-col items-center gap-0.5 text-green-400">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="text-green-400">
                <rect x="8" y="10" width="16" height="18" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="16" cy="19" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M8 10 L16 6 L24 10" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-[10px] font-semibold">Salas</span>
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

        {/* Modal de Teams */}
        {showTeamsModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-[#1a1d29] rounded-t-3xl p-5 max-h-[80%] overflow-y-auto">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-200">Equipos (Teams)</h2>
                <button
                  onClick={() => setShowTeamsModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Botón Crear Team (solo admin) */}
              {room.isAdmin && (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="w-full mb-5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl p-4 border-2 border-dashed border-purple-500/50 hover:border-purple-400 transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-purple-400">Crear Nuevo Team</span>
                </button>
              )}

              {/* Lista de Teams */}
              <div className="space-y-3">
                {teams.map((team: any) => (
                  <div
                    key={team.id}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4"
                  >
                    {/* Header del Team */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color }}
                        ></div>
                        <h3 className="text-base font-bold text-gray-200">{team.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-700/50 rounded-full px-2.5 py-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">{team.members.length}</span>
                      </div>
                    </div>

                    {/* Miembros del Team */}
                    <div className="mb-3 space-y-1.5">
                      {team.members.map((memberName: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: team.color }}
                          ></div>
                          <span>{memberName}</span>
                        </div>
                      ))}
                    </div>

                    {/* Botón Unirse (solo si no estás en ningún team) */}
                    {!userTeam && (
                      <button
                        onClick={() => handleJoinTeam(team.name)}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-2.5 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all active:scale-95"
                      >
                        Unirse a este Team
                      </button>
                    )}
                  </div>
                ))}

                {/* Mensaje si no hay teams */}
                {teams.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No hay equipos creados aún</p>
                    {room.isAdmin && (
                      <p className="text-xs text-gray-500 mt-1">Crea el primer team para empezar</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Team */}
        {showCreateTeamModal && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[#1a1d29] rounded-3xl p-6 m-4 w-80 border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Crear Team</h3>
                <button
                  onClick={() => setShowCreateTeamModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nombre del Team</label>
                  <input
                    type="text"
                    placeholder="Ej: Los Matemáticos"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Color del Team</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg border-2 border-gray-700 hover:border-gray-500 transition-colors"
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    // Aquí iría la lógica para crear el team
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  Crear Team
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Miembros */}
        {showMembersModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-[#1a1d29] rounded-t-3xl p-5 max-h-[80%] overflow-y-auto">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-200">Integrantes</h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Código de la Sala */}
              <div className="mb-5 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 rounded-2xl p-4 border border-purple-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Código de la sala</p>
                    <p className="text-2xl font-bold text-purple-400 tracking-wider">{room.code}</p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="w-12 h-12 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 flex items-center justify-center transition-all active:scale-95"
                  >
                    {codeCopied ? (
                      <Check className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Copy className="w-6 h-6 text-purple-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Comparte este código para que otros se unan</p>
              </div>

              {/* Lista de Miembros */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Miembros ({members.length})
                </h3>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-2xl ${
                        member.isCurrentUser
                          ? 'bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/30'
                          : 'bg-gray-800/50 border border-gray-700/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            member.isCurrentUser
                              ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                              : 'bg-gradient-to-br from-indigo-400 to-indigo-600'
                          }`}>
                            {member.avatar}
                          </div>
                          {member.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-[#1a1d29]"></div>
                          )}
                        </div>

                        {/* Info */}
                        <div>
                          <h4 className={`text-sm font-semibold ${
                            member.isCurrentUser ? 'text-purple-300' : 'text-gray-200'
                          }`}>
                            {member.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {member.isOnline ? 'En línea' : 'Desconectado'}
                          </p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      {member.role === 'Admin' && (
                        <div className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full border border-yellow-500/30">
                          Admin
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Quiz */}
        {showQuizModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="min-h-full p-4 pt-12">
              <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Quiz Semanal</h2>
                  <button
                    onClick={() => {
                      setShowQuizModal(false);
                      setQuizStarted(false);
                      setQuizCompleted(false);
                    }}
                    className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!quizStarted && !quizCompleted ? (
                  /* Pantalla inicial antes de empezar */
                  <div className="text-center py-8">
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-6 mb-6">
                      <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">Quiz Semanal</h3>
                      <p className="text-sm text-gray-400">
                        {weeklyQuestions.length} preguntas · Después podrás validar las respuestas
                      </p>
                    </div>
                  </div>
                ) : quizStarted && !quizCompleted ? (
                  /* Quiz en progreso - Mostrar pregunta actual */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        Pregunta {currentQuestionIndex + 1} de {weeklyQuestions.length}
                      </span>
                      <div className="flex gap-1">
                        {weeklyQuestions.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              idx < currentQuestionIndex
                                ? 'bg-purple-400'
                                : idx === currentQuestionIndex
                                ? 'bg-purple-400 ring-2 ring-purple-400/50'
                                : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-b from-purple-900/20 via-gray-800/80 to-gray-900/80 rounded-2xl p-5 border border-purple-500/30 backdrop-blur-sm">
                      <p className="text-base font-bold text-gray-200 mb-4">
                        {weeklyQuestions[currentQuestionIndex].questionText}
                      </p>

                      {weeklyQuestions[currentQuestionIndex].type === 'multiple-choice' && weeklyQuestions[currentQuestionIndex].options ? (
                        <div className="space-y-3">
                          {weeklyQuestions[currentQuestionIndex].options!.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedOption(idx)}
                              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                selectedOption === idx
                                  ? 'bg-purple-500/20 border-purple-500/50'
                                  : 'bg-gray-800/30 border-gray-700/30 hover:border-gray-600/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedOption === idx
                                    ? 'border-purple-400 bg-purple-500/30'
                                    : 'border-gray-600'
                                }`}>
                                  {selectedOption === idx && <Check className="w-3 h-3 text-purple-400" />}
                                </div>
                                <span className="text-sm text-gray-300">{option}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          value={developAnswer}
                          onChange={(e) => setDevelopAnswer(e.target.value)}
                          placeholder="Escribe tu respuesta aquí..."
                          className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none h-32"
                        />
                      )}
                    </div>

                    {currentQuestionIndex < weeklyQuestions.length - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        disabled={
                          (weeklyQuestions[currentQuestionIndex].type === 'multiple-choice' && selectedOption === null) ||
                          (weeklyQuestions[currentQuestionIndex].type === 'open' && !developAnswer.trim())
                        }
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishQuiz}
                        disabled={
                          (weeklyQuestions[currentQuestionIndex].type === 'multiple-choice' && selectedOption === null) ||
                          (weeklyQuestions[currentQuestionIndex].type === 'open' && !developAnswer.trim())
                        }
                        className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Finalizar Quiz
                      </button>
                    )}
                  </div>
                ) : (
                  /* Validación después de completar el quiz */
                  <div className="space-y-4">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-4">
                      <p className="text-sm font-bold text-green-400 mb-1">✓ Quiz Completado</p>
                      <p className="text-xs text-gray-400">Ahora puedes validar las preguntas y respuestas</p>
                    </div>

                    {weeklyQuestions.map((question, index) => {
                      const userAnswer = userAnswers.find(a => a.questionId === question.id);

                      return (
                        <div
                          key={question.id}
                          className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 rounded-2xl p-4 border border-gray-700/50 backdrop-blur-sm"
                        >
                          <div className="mb-3">
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-bold text-purple-400">#{index + 1}</span>
                              <p className="text-sm font-bold text-gray-200 flex-1">{question.questionText}</p>
                            </div>
                            <span className="text-xs text-gray-500">Por {question.author}</span>
                          </div>

                          {question.type === 'multiple-choice' ? (
                            <>
                              {/* Mostrar opciones y respuesta del usuario */}
                              <div className="space-y-2 mb-3">
                                {question.options!.map((option, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-lg border ${
                                      idx === (userAnswer?.answer as number)
                                        ? idx === question.correctOption
                                          ? 'bg-green-500/10 border-green-500/30'
                                          : 'bg-red-500/10 border-red-500/30'
                                        : idx === question.correctOption
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-gray-800/30 border-gray-700/30'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {idx === (userAnswer?.answer as number) && (
                                        <span className="text-xs">👤</span>
                                      )}
                                      {idx === question.correctOption && (
                                        <Check className="w-3 h-3 text-green-400" />
                                      )}
                                      <span className="text-xs text-gray-300">{option}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Solo validar la pregunta */}
                              <div className="border-t border-gray-700/50 pt-3">
                                <p className="text-xs text-gray-500 mb-2">Validar pregunta:</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVoteQuestion(question.id, 'approve')}
                                    className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-xs font-semibold text-green-400 transition-all"
                                  >
                                    👍 Aprobar Pregunta
                                  </button>
                                  <button
                                    onClick={() => handleVoteQuestion(question.id, 'reject')}
                                    className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-semibold text-red-400 transition-all"
                                  >
                                    👎 Rechazar Pregunta
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Mostrar respuesta esperada y respuesta del usuario */}
                              <div className="space-y-3 mb-3">
                                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/30">
                                  <p className="text-xs text-gray-400 mb-1">Respuesta esperada:</p>
                                  <p className="text-sm text-gray-300 leading-relaxed">{question.answer}</p>
                                </div>
                                <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                                  <p className="text-xs text-blue-400 mb-1">Tu respuesta:</p>
                                  <p className="text-sm text-gray-300 leading-relaxed">{userAnswer?.answer as string}</p>
                                </div>
                              </div>

                              {/* Validar pregunta Y respuesta */}
                              <div className="border-t border-gray-700/50 pt-3 space-y-2">
                                <div>
                                  <p className="text-xs text-gray-500 mb-2">Validar pregunta:</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleVoteQuestion(question.id, 'approve')}
                                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-xs font-semibold text-green-400 transition-all"
                                    >
                                      👍 Aprobar
                                    </button>
                                    <button
                                      onClick={() => handleVoteQuestion(question.id, 'reject')}
                                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-semibold text-red-400 transition-all"
                                    >
                                      👎 Rechazar
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-500 mb-2">Validar tu respuesta:</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleVoteAnswer(question.id, 'approve')}
                                      className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-lg text-xs font-semibold text-green-400 transition-all"
                                    >
                                      👍 Aprobar
                                    </button>
                                    <button
                                      onClick={() => handleVoteAnswer(question.id, 'reject')}
                                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs font-semibold text-red-400 transition-all"
                                    >
                                      👎 Rechazar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        setQuizCompleted(false);
                        setQuizStarted(false);
                        setUserAnswers([]);
                      }}
                      className="w-full bg-gray-700/50 text-gray-300 font-semibold py-3 rounded-xl border border-gray-600 hover:bg-gray-600/50 transition-all"
                    >
                      Volver a realizar quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Agregar Pregunta */}
        {showAddModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-5 w-full max-w-sm border border-gray-700 max-h-[90%] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Nueva Pregunta</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-600/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Tipo */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block">Tipo de Pregunta</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQuestionType('multiple-choice')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      questionType === 'multiple-choice'
                        ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                        : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                    }`}
                  >
                    Multiple Choice
                  </button>
                  <button
                    onClick={() => setQuestionType('open')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      questionType === 'open'
                        ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                        : 'bg-gray-700/30 text-gray-400 border border-gray-600/30'
                    }`}
                  >
                    Desarrollo
                  </button>
                </div>
              </div>

              {/* Pregunta */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-1 block">Pregunta</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Escribe tu pregunta aquí..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none h-20"
                />
              </div>

              {questionType === 'multiple-choice' ? (
                <>
                  {/* Opciones */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">Opciones</label>
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={correctOption === index}
                            onChange={() => setCorrectOption(index)}
                            className="w-4 h-4 accent-green-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Opción ${String.fromCharCode(65 + index)}`}
                            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Selecciona la respuesta correcta</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Respuesta de Desarrollo */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1 block">Respuesta Esperada</label>
                    <textarea
                      value={openAnswer}
                      onChange={(e) => setOpenAnswer(e.target.value)}
                      placeholder="Escribe la respuesta esperada..."
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none h-24"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleAddQuestion}
                className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Agregar Pregunta
              </button>
            </div>
          </div>
        )}

        {/* Modal de Configuración de Sesión */}
        {showConfigModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-[#1a1d29] rounded-t-3xl p-5 max-h-[90%] overflow-y-auto">
              {/* Header del Modal */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-200">Configurar Sesión</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-800/50 flex items-center justify-center hover:bg-gray-700/50 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 5 L15 15 M15 5 L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Selector de Tipo de Sesión */}
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Tipo de Sesión
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSessionType('pomodoro')}
                    className={`flex-1 rounded-2xl p-4 transition-all ${
                      sessionType === 'pomodoro'
                        ? 'bg-gradient-to-b from-purple-500/20 to-purple-600/20 border-2 border-purple-500/50'
                        : 'bg-gray-800/50 border-2 border-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Timer className={`w-8 h-8 ${
                        sessionType === 'pomodoro' ? 'text-purple-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm font-bold ${
                        sessionType === 'pomodoro' ? 'text-purple-400' : 'text-gray-400'
                      }`}>
                        Pomodoro
                      </span>
                      <span className="text-xs text-gray-500">Sesión enfocada</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSessionType('libre')}
                    className={`flex-1 rounded-2xl p-4 transition-all ${
                      sessionType === 'libre'
                        ? 'bg-gradient-to-b from-blue-500/20 to-blue-600/20 border-2 border-blue-500/50'
                        : 'bg-gray-800/50 border-2 border-gray-700/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Clock className={`w-8 h-8 ${
                        sessionType === 'libre' ? 'text-blue-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm font-bold ${
                        sessionType === 'libre' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        Libre
                      </span>
                      <span className="text-xs text-gray-500">Sin límites</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Configuración de Pomodoro */}
              {sessionType === 'pomodoro' && (
                <div className="mb-5 space-y-4">
                  {/* Selector de Duración */}
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300">Duración</span>
                      <span className="text-xs text-gray-500">por ciclo</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={decrementMinutes}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5 text-gray-300" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-purple-400">{pomodoroMinutes}</span>
                        <span className="text-xs text-gray-500">minutos</span>
                      </div>

                      <button
                        onClick={incrementMinutes}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                      {[15, 25, 45, 60].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setPomodoroMinutes(preset)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            pomodoroMinutes === preset
                              ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                              : 'bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
                          }`}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Ciclos */}
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300">Ciclos</span>
                      <span className="text-xs text-gray-500">repeticiones</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={decrementCycles}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5 text-gray-300" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-purple-400">{pomodoroCycles}</span>
                        <span className="text-xs text-gray-500">{pomodoroCycles === 1 ? 'ciclo' : 'ciclos'}</span>
                      </div>

                      <button
                        onClick={incrementCycles}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>
                    <div className="mt-2 text-center">
                      <span className="text-xs text-gray-500">
                        Total estudio: <span className="text-purple-400 font-bold">{pomodoroMinutes * pomodoroCycles} min</span>
                      </span>
                    </div>
                  </div>

                  {/* Selector de Descanso Corto */}
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300">Descanso Corto</span>
                      <span className="text-xs text-gray-500">entre ciclos</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={decrementShortBreak}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5 text-gray-300" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-cyan-400">{shortBreak}</span>
                        <span className="text-xs text-gray-500">minutos</span>
                      </div>

                      <button
                        onClick={incrementShortBreak}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>
                    <div className="mt-3 flex justify-center gap-2">
                      {[3, 5, 10].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setShortBreak(preset)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            shortBreak === preset
                              ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500/50'
                              : 'bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30'
                          }`}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Descanso Largo */}
                  <div className="bg-gradient-to-b from-gray-800/60 to-gray-900/60 rounded-2xl p-4 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-300">Descanso Largo</span>
                      <span className="text-xs text-gray-500">ocasional</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={decrementLongBreak}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Minus className="w-5 h-5 text-gray-300" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-purple-400">{longBreak}</span>
                        <span className="text-xs text-gray-500">minutos</span>
                      </div>

                      <button
                        onClick={incrementLongBreak}
                        className="w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                      >
                        <Plus className="w-5 h-5 text-gray-300" />
                      </button>
                    </div>

                    {/* Intervalo de descanso largo */}
                    <div className="border-t border-gray-700/50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">Cada cuántos ciclos</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={decrementLongBreakInterval}
                          className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                        >
                          <Minus className="w-4 h-4 text-gray-300" />
                        </button>

                        <div className="flex items-center gap-2 bg-purple-500/10 rounded-lg px-4 py-2 border border-purple-500/30">
                          <span className="text-2xl font-bold text-purple-400">{longBreakInterval}</span>
                          <span className="text-xs text-gray-400">ciclos</span>
                        </div>

                        <button
                          onClick={incrementLongBreakInterval}
                          className="w-8 h-8 rounded-full bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 flex items-center justify-center transition-all active:scale-95"
                        >
                          <Plus className="w-4 h-4 text-gray-300" />
                        </button>
                      </div>
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Descanso largo después del ciclo {longBreakInterval}, {longBreakInterval * 2}, {longBreakInterval * 3}...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Guardar */}
              <button
                onClick={handleSaveConfig}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all active:scale-95 shadow-lg mt-5"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
