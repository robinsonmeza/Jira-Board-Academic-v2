import React, { useState, useEffect, useMemo } from 'react';
import { useJira } from '../context/JiraContext';
import { Task, User, Role, ROLE_BADGE_LABELS } from '../types/jira';
import {
  X,
  Eye,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Coffee,
  Sparkles,
  Award,
  Layers,
  Check,
  ChevronDown,
} from 'lucide-react';

interface PlanningPokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTaskId?: number | null;
}

const FIBONACCI_CARDS = [
  { value: 0.5, label: '0.5' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 13, label: '13' },
  { value: 20, label: '20' },
  { value: 40, label: '40' },
  { value: 100, label: '100' },
  { value: '?', label: '?' },
  { value: '☕', label: '☕' },
];

export const PlanningPokerModal: React.FC<PlanningPokerModalProps> = ({
  isOpen,
  onClose,
  initialTaskId,
}) => {
  const { currentProject, tasks, members, users, currentUser, updateTask } = useJira();

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [votes, setVotes] = useState<Record<number, number | string>>({});
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Available tasks for estimation in this project
  const projectTasks = useMemo(() => {
    if (!currentProject) return [];
    return tasks.filter((t) => t.project_id === currentProject.id);
  }, [tasks, currentProject]);

  // Project participants list
  const projectParticipants = useMemo(() => {
    if (!currentProject) return [];
    const pMembers = members.filter((m) => m.project_id === currentProject.id);
    const list: { user: User; role: Role }[] = [];
    const seen = new Set<number>();

    pMembers.forEach((m) => {
      const u = users.find((usr) => usr.id === m.user_id);
      if (u && !seen.has(u.id)) {
        seen.add(u.id);
        list.push({ user: u, role: m.role || u.role || 'frontend' });
      }
    });

    if (list.length === 0) {
      users.slice(0, 4).forEach((u) => {
        list.push({ user: u, role: u.role || 'frontend' });
      });
    }

    return list;
  }, [currentProject, members, users]);

  useEffect(() => {
    if (isOpen) {
      if (initialTaskId) {
        setSelectedTaskId(initialTaskId);
      } else if (projectTasks.length > 0 && !selectedTaskId) {
        setSelectedTaskId(projectTasks[0].id);
      }
      setIsRevealed(false);
      setSavedSuccess(false);
      setVotes({});
    }
  }, [isOpen, initialTaskId, projectTasks]);

  if (!isOpen || !currentProject) return null;

  const currentTask = projectTasks.find((t) => t.id === selectedTaskId);

  // Handle current user casting a vote
  const handleVote = (val: number | string) => {
    if (!currentUser) return;
    setVotes((prev) => ({
      ...prev,
      [currentUser.id]: val,
    }));
  };

  // Simulate or set vote for another member (helpful for demo/lab environments)
  const handleSetMemberVote = (userId: number, val: number | string) => {
    setVotes((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  // Randomize realistic votes for remaining team members (for demonstration or quick estimation)
  const handleAutoFillTeamVotes = () => {
    const baseValue = typeof votes[currentUser?.id || 0] === 'number' ? (votes[currentUser?.id || 0] as number) : 3;
    const nearby = [baseValue, baseValue <= 1 ? 1 : baseValue - 1, baseValue + 1, baseValue + 2].filter(
      (n) => typeof n === 'number' && n > 0
    );

    const newVotes = { ...votes };
    projectParticipants.forEach((p) => {
      if (newVotes[p.user.id] === undefined) {
        const randomPick = nearby[Math.floor(Math.random() * nearby.length)] || baseValue;
        newVotes[p.user.id] = randomPick;
      }
    });
    setVotes(newVotes);
  };

  const handleResetRound = () => {
    setVotes({});
    setIsRevealed(false);
    setSavedSuccess(false);
  };

  // Stats calculation
  const numericVotes = Object.values(votes).filter((v): v is number => typeof v === 'number');
  const avg =
    numericVotes.length > 0 ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1) : null;
  const closestFibonacci = avg
    ? [1, 2, 3, 5, 8, 13, 20, 40]
        .slice()
        .sort((a, b) => Math.abs(a - parseFloat(avg)) - Math.abs(b - parseFloat(avg)))[0]
    : 3;

  const hasDivergence =
    numericVotes.length > 1 && Math.max(...numericVotes) - Math.min(...numericVotes) >= 5;

  const handleApplyStoryPoints = (pointsToApply: number) => {
    if (!currentTask) return;
    updateTask(currentTask.id, { story_points: pointsToApply });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-mono">
      <div className="bg-white border-4 border-black brutal-shadow-lg max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-black text-white px-5 py-3.5 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 border-2 border-white flex items-center justify-center text-black font-black brutal-shadow-sm text-lg">
              🃏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-yellow-400">
                  PLANNING POKER · ESTIMACIÓN FIBONACCI
                </h2>
                <span className="bg-cyan-400 text-black text-[10px] font-black px-1.5 py-0.2 border border-black">
                  [{currentProject.key}]
                </span>
              </div>
              <p className="text-[10px] font-bold text-neutral-300 uppercase">
                ESTIMACIÓN COLABORATIVA DE STORY POINTS Y CONSENSO DE EQUIPO
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-industrial-grid">
          {/* Task Selector Banner */}
          <div className="bg-white border-3 border-black p-3.5 brutal-shadow-sm space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                TAREA A ESTIMAR:
              </label>

              {currentTask && (
                <span className="text-[11px] font-bold text-neutral-600 uppercase font-mono">
                  Puntos actuales:{' '}
                  <span className="bg-yellow-400 text-black px-1.5 py-0.2 border border-black font-black">
                    {currentTask.story_points ?? 'Sin estimar'} SP
                  </span>
                </span>
              )}
            </div>

            <div className="relative">
              <select
                value={selectedTaskId || ''}
                onChange={(e) => {
                  setSelectedTaskId(Number(e.target.value));
                  handleResetRound();
                }}
                className="w-full bg-neutral-50 border-2 border-black px-3 py-2 text-xs font-black uppercase outline-none focus:bg-yellow-50 cursor-pointer appearance-none"
              >
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.key}] {t.title} ({t.story_points ? `${t.story_points} SP` : '0 SP'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-black absolute right-3 top-3 pointer-events-none stroke-[2.5]" />
            </div>

            {currentTask && (
              <p className="text-[11px] text-neutral-600 line-clamp-2 border-l-2 border-black pl-2 mt-1">
                {currentTask.description || 'Sin descripción detallada.'}
              </p>
            )}
          </div>

          {/* Table of Members & Votes */}
          <div className="bg-white border-3 border-black p-4 brutal-shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                MESA DE VOTACIÓN DEL EQUIPO ({projectParticipants.length} integrantes):
              </span>

              <div className="flex items-center gap-2">
                {!isRevealed && Object.keys(votes).length < projectParticipants.length && (
                  <button
                    onClick={handleAutoFillTeamVotes}
                    className="px-2.5 py-1 bg-yellow-200 hover:bg-yellow-300 text-black border border-black text-[10px] font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
                    title="Simular votos para los miembros restantes del equipo"
                  >
                    ⚡ COMPLETAR EQUIPO
                  </button>
                )}

                <button
                  onClick={() => setIsRevealed(!isRevealed)}
                  disabled={Object.keys(votes).length === 0}
                  className={`px-3 py-1.5 border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center gap-1.5 ${
                    isRevealed
                      ? 'bg-neutral-200 text-black'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-black'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isRevealed ? 'OCULTAR CARTAS' : 'REVELAR CARTAS'}</span>
                </button>

                <button
                  onClick={handleResetRound}
                  className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
                  title="Reiniciar ronda de votos"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Members Voting Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {projectParticipants.map((p) => {
                const hasVoted = votes[p.user.id] !== undefined;
                const voteVal = votes[p.user.id];
                const isMe = currentUser?.id === p.user.id;

                return (
                  <div
                    key={p.user.id}
                    className={`p-3 border-2 border-black text-center flex flex-col items-center justify-between min-h-[140px] transition-all ${
                      hasVoted
                        ? isRevealed
                          ? 'bg-yellow-100 border-black brutal-shadow-sm'
                          : 'bg-neutral-900 text-white border-black brutal-shadow-sm'
                        : 'bg-neutral-50 text-neutral-400 border-dashed border-neutral-300'
                    }`}
                  >
                    {/* User Header */}
                    <div className="w-full flex items-center justify-between mb-2">
                      <div
                        className="w-5 h-5 border border-black flex items-center justify-center text-white text-[9px] font-black"
                        style={{ backgroundColor: p.user.avatar_color || '#000000' }}
                      >
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-1 py-0.2 border ${
                          hasVoted && !isRevealed
                            ? 'bg-black text-yellow-400 border-yellow-400'
                            : 'bg-black text-white border-black'
                        }`}
                      >
                        {ROLE_BADGE_LABELS[p.role] || p.role}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black uppercase truncate max-w-full ${
                        hasVoted && !isRevealed ? 'text-white' : 'text-black'
                      }`}
                    >
                      {p.user.name.split(' ')[0]} {isMe && '(TÚ)'}
                    </span>

                    {/* Card Display */}
                    <div className="my-2">
                      {hasVoted ? (
                        isRevealed ? (
                          <div className="w-11 h-14 bg-white border-2 border-black flex items-center justify-center text-xl font-black font-mono text-black brutal-shadow-sm">
                            {voteVal}
                          </div>
                        ) : (
                          <div className="w-11 h-14 bg-orange-500 border-2 border-white flex items-center justify-center text-black font-black text-xs brutal-shadow-sm">
                            LISTO
                          </div>
                        )
                      ) : (
                        <div className="w-11 h-14 border-2 border-dashed border-neutral-300 flex items-center justify-center text-[10px] font-bold text-neutral-400">
                          VOTANDO...
                        </div>
                      )}
                    </div>

                    {/* Quick vote click for demo members if not revealed */}
                    {!isRevealed && !hasVoted && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 5, 8].map((quick) => (
                          <button
                            key={quick}
                            onClick={() => handleSetMemberVote(p.user.id, quick)}
                            className="text-[9px] px-1 bg-white hover:bg-yellow-300 text-black border border-black font-mono font-bold"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Results Analysis (Shown when Revealed) */}
          {isRevealed && numericVotes.length > 0 && (
            <div className="bg-yellow-400 border-4 border-black p-4 brutal-shadow space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
                <div>
                  <h3 className="text-sm font-black uppercase text-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    CONSENSO DE LA MESA:
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-black uppercase">
                      PROMEDIO: <strong className="font-mono text-sm">{avg} SP</strong>
                    </span>
                    <span className="text-xs font-bold text-black uppercase">
                      SUGERENCIA FIBONACCI:{' '}
                      <strong className="font-mono text-sm bg-black text-yellow-400 px-2 py-0.5 border border-black">
                        {closestFibonacci} SP
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyStoryPoints(closestFibonacci)}
                    className="px-4 py-2 bg-black hover:bg-neutral-900 text-yellow-400 border-2 border-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer flex items-center gap-1.5"
                  >
                    {savedSuccess ? <Check className="w-4 h-4 stroke-[3]" /> : <Award className="w-4 h-4" />}
                    <span>{savedSuccess ? '¡APLICADO!' : `ASIGNAR ${closestFibonacci} SP A TAREA`}</span>
                  </button>
                </div>
              </div>

              {hasDivergence && (
                <div className="bg-white border-2 border-black p-2.5 flex items-center gap-2 text-xs font-bold text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    DIVERGENCIA DETECTADA: Hay una diferencia notable entre las estimaciones del equipo. Se
                    recomienda que los votos extremos (menor y mayor) expongan su justificación técnica antes de
                    cerrar el consenso.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* User's Card Deck (Hand) */}
          <div className="bg-white border-3 border-black p-4 brutal-shadow-sm space-y-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              🃏 TU BARAJA FIBONACCI (ELIGE TU CARTA):
            </span>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
              {FIBONACCI_CARDS.map((card) => {
                const isSelected = currentUser && votes[currentUser.id] === card.value;

                return (
                  <button
                    key={card.label}
                    onClick={() => handleVote(card.value)}
                    className={`min-w-[54px] h-20 border-3 text-base font-black font-mono transition-all flex flex-col items-center justify-between p-1.5 cursor-pointer brutal-btn ${
                      isSelected
                        ? 'bg-yellow-400 text-black border-black -translate-y-2 brutal-shadow'
                        : 'bg-white hover:bg-neutral-100 text-black border-black hover:-translate-y-1'
                    }`}
                  >
                    <span className="text-[10px] self-start leading-none">{card.label}</span>
                    <span className="text-xl font-black">{card.label}</span>
                    <span className="text-[10px] self-end leading-none">{card.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-100 border-t-2 border-black p-3.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-600 uppercase">
            SISTEMA DE PLANIFICACIÓN ÁGIL USB-IS2
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
