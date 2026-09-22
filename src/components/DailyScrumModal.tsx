import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useJira } from '../context/JiraContext';
import { User, Role, ROLE_BADGE_LABELS, ROLE_LABELS } from '../types/jira';
import {
  X,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Users,
  Volume2,
  VolumeX,
  Shuffle,
  Coffee,
  Sparkles,
  Award,
  ChevronRight,
  UserX,
  UserCheck,
  CheckSquare,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface DailyScrumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParticipantItem {
  user: User;
  role: Role;
  timeSpentSeconds: number;
  blockerNotes?: string;
  isDone: boolean;
}

// Synthesize pleasant mechanical beep/ding for toast/timer events
const playSoundAlert = (type: 'tick' | 'ding' | 'finish') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'ding') {
      // Pleasant double bell
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
    } else if (type === 'finish') {
      // Fanfare chord
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.6);
      });
    }
  } catch {
    // Ignore audio failures if browser restricts audio
  }
};

export const DailyScrumModal: React.FC<DailyScrumModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, members, users, tasks } = useJira();

  // Session phases: 'setup' | 'active' | 'summary'
  const [phase, setPhase] = useState<'setup' | 'active' | 'summary'>('setup');

  // Configurable speaker time limit (in seconds)
  const [speakerTimeLimit, setSpeakerTimeLimit] = useState<number>(90); // 90s by default
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // List of active participants for this daily
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  // List of excluded/absent members from the project
  const [excludedMembers, setExcludedMembers] = useState<{ user: User; role: Role }[]>([]);

  // Active session state
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentBlockerInput, setCurrentBlockerInput] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive initial project members automatically
  const projectMembersPool = useMemo(() => {
    if (!currentProject) return [];
    const pMembers = members.filter((m) => m.project_id === currentProject.id);
    const pool: { user: User; role: Role }[] = [];
    const seenIds = new Set<number>();

    pMembers.forEach((m) => {
      const u = users.find((usr) => usr.id === m.user_id);
      if (u && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        pool.push({ user: u, role: m.role || u.role || 'frontend' });
      }
    });

    // Fallback: If no explicit project members, include users who have tasks in this project
    if (pool.length === 0) {
      tasks
        .filter((t) => t.project_id === currentProject.id)
        .forEach((t) => {
          const aIds = t.assignee_ids || (t.assignee_id ? [t.assignee_id] : []);
          aIds.forEach((uid) => {
            if (!seenIds.has(uid)) {
              seenIds.add(uid);
              const u = users.find((usr) => usr.id === uid);
              if (u) pool.push({ user: u, role: u.role || 'frontend' });
            }
          });
        });
    }

    // Secondary fallback: if still empty, provide first few users
    if (pool.length === 0) {
      users.slice(0, 4).forEach((u) => {
        pool.push({ user: u, role: u.role || 'frontend' });
      });
    }

    return pool;
  }, [currentProject, members, users, tasks]);

  // Reset and load participants when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      setPhase('setup');
      setExcludedMembers([]);
      setCurrentSpeakerIndex(0);
      setSecondsLeft(speakerTimeLimit);
      setTotalElapsedSeconds(0);
      setIsPaused(false);
      setCurrentBlockerInput('');
      setCopiedSummary(false);

      const items: ParticipantItem[] = projectMembersPool.map((p) => ({
        user: p.user,
        role: p.role,
        timeSpentSeconds: 0,
        isDone: false,
      }));
      setParticipants(items);
    }
  }, [isOpen, projectMembersPool, speakerTimeLimit]);

  // Timer runner
  useEffect(() => {
    if (phase !== 'active' || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsedSeconds((prev) => prev + 1);

      setSecondsLeft((prevSec) => {
        // Track current speaker time
        setParticipants((prevList) => {
          const next = [...prevList];
          if (next[currentSpeakerIndex]) {
            next[currentSpeakerIndex] = {
              ...next[currentSpeakerIndex],
              timeSpentSeconds: next[currentSpeakerIndex].timeSpentSeconds + 1,
            };
          }
          return next;
        });

        if (prevSec <= 1) {
          if (soundEnabled) playSoundAlert('ding');
          return 0;
        }

        if (prevSec === 10 && soundEnabled) {
          playSoundAlert('tick');
        }

        return prevSec - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isPaused, currentSpeakerIndex, soundEnabled]);

  if (!isOpen || !currentProject) return null;

  // Handler: Remove participant (Mark absent)
  const handleRemoveParticipant = (userId: number) => {
    const target = participants.find((p) => p.user.id === userId);
    if (!target) return;
    setParticipants((prev) => prev.filter((p) => p.user.id !== userId));
    setExcludedMembers((prev) => [...prev, { user: target.user, role: target.role }]);
  };

  // Handler: Restore excluded member
  const handleRestoreMember = (userId: number) => {
    const target = excludedMembers.find((m) => m.user.id === userId);
    if (!target) return;
    setExcludedMembers((prev) => prev.filter((m) => m.user.id !== userId));
    setParticipants((prev) => [
      ...prev,
      { user: target.user, role: target.role, timeSpentSeconds: 0, isDone: false },
    ]);
  };

  // Handler: Shuffle participants order
  const handleShuffleParticipants = () => {
    setParticipants((prev) => {
      const arr = [...prev];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  // Handler: Start Daily Session
  const handleStartSession = () => {
    if (participants.length === 0) return;
    setPhase('active');
    setCurrentSpeakerIndex(0);
    setSecondsLeft(speakerTimeLimit);
    setTotalElapsedSeconds(0);
    setIsPaused(false);
    if (soundEnabled) playSoundAlert('ding');
  };

  // Handler: Save blocker and advance to next speaker
  const handleNextSpeaker = () => {
    // Mark current speaker as done and store blocker notes
    setParticipants((prev) => {
      const next = [...prev];
      if (next[currentSpeakerIndex]) {
        next[currentSpeakerIndex] = {
          ...next[currentSpeakerIndex],
          isDone: true,
          blockerNotes: currentBlockerInput.trim() || undefined,
        };
      }
      return next;
    });

    setCurrentBlockerInput('');

    if (currentSpeakerIndex + 1 < participants.length) {
      setCurrentSpeakerIndex((prev) => prev + 1);
      setSecondsLeft(speakerTimeLimit);
      if (soundEnabled) playSoundAlert('tick');
    } else {
      // Completed all speakers!
      setPhase('summary');
      if (soundEnabled) playSoundAlert('finish');
    }
  };

  // Handler: Add +30s to current speaker
  const handleAddExtraTime = () => {
    setSecondsLeft((prev) => prev + 30);
    if (soundEnabled) playSoundAlert('tick');
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSpeaker = participants[currentSpeakerIndex];
  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / speakerTimeLimit) * 100));

  // Copy meeting summary to clipboard
  const handleCopySummary = () => {
    const dateStr = new Date().toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let text = `🍞 RESUMEN DE DAILY SCRUM - [${currentProject.key}] ${currentProject.name}\n`;
    text += `Fecha: ${dateStr}\n`;
    text += `Duración Total: ${formatTime(totalElapsedSeconds)}\n`;
    text += `Participantes: ${participants.length} integrantes\n\n`;
    text += `DETALLE DE PARTICIPACIÓN:\n`;

    participants.forEach((p, idx) => {
      text += `${idx + 1}. ${p.user.name} (${ROLE_BADGE_LABELS[p.role] || p.role}) - Tiempo: ${formatTime(
        p.timeSpentSeconds
      )}\n`;
      if (p.blockerNotes) {
        text += `   ⚠️ Bloqueo: ${p.blockerNotes}\n`;
      }
    });

    if (excludedMembers.length > 0) {
      text += `\nAUSENTES: ${excludedMembers.map((m) => m.user.name).join(', ')}\n`;
    }

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-mono">
      <div className="bg-white border-4 border-black brutal-shadow-lg max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Top Header */}
        <div className="bg-black text-white px-5 py-3.5 border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-400 border-2 border-white flex items-center justify-center text-black font-black brutal-shadow-sm text-lg">
              🍞
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-yellow-400">
                  DAILY TOAST · SCRUM STANDUP
                </h2>
                <span className="bg-orange-500 text-black text-[10px] font-black px-1.5 py-0.2 border border-black">
                  [{currentProject.key}]
                </span>
              </div>
              <p className="text-[10px] font-bold text-neutral-300 uppercase">
                SINCRONIZACIÓN DIARIA DE 15 MINUTOS DEL EQUIPO DE DESARROLLO
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white"
              title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PHASE 1: SETUP SCREEN                                    */}
        {/* ======================================================== */}
        {phase === 'setup' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-industrial-grid">
            {/* Project info banner */}
            <div className="bg-yellow-100 border-2 border-black p-3 brutal-shadow-sm flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-black uppercase text-black">
                  LISTA AUTOMÁTICA DE PARTICIPANTES DEL PROYECTO
                </h3>
                <p className="text-[11px] font-bold text-neutral-700 mt-0.5 uppercase">
                  Los miembros asignados al proyecto se han cargado automáticamente. Si algún integrante no
                  asistió hoy al Daily, márcalo como ausente con el botón [X] antes de iniciar.
                </p>
              </div>
            </div>

            {/* Time limit selector */}
            <div className="bg-white border-2 border-black p-3.5 brutal-shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                TIEMPO POR DESARROLLADOR:
              </span>
              <div className="flex items-center gap-1.5">
                {[60, 90, 120, 180].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSpeakerTimeLimit(t)}
                    className={`px-3 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                      speakerTimeLimit === t
                        ? 'bg-orange-500 text-black border-black brutal-shadow-sm'
                        : 'bg-white text-black border-black hover:bg-neutral-100'
                    }`}
                  >
                    {t >= 60 ? `${t / 60}m` : `${t}s`}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Participants List */}
            <div className="bg-white border-2 border-black p-4 brutal-shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  ORADORES CONFIRMADOS ({participants.length}):
                </span>
                <button
                  onClick={handleShuffleParticipants}
                  className="px-2.5 py-1 bg-neutral-100 hover:bg-yellow-300 text-black border border-black text-[11px] font-black uppercase flex items-center gap-1 brutal-shadow-sm brutal-btn cursor-pointer"
                  title="Ordenar aleatoriamente la ronda de oradores"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>ALEATORIO</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {participants.map((p, index) => (
                  <div
                    key={p.user.id}
                    className="p-2.5 bg-neutral-50 border-2 border-black flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-black text-yellow-400 font-mono font-black text-xs flex items-center justify-center border border-black">
                        {index + 1}
                      </span>
                      <div
                        className="w-8 h-8 border border-black flex items-center justify-center text-white text-xs font-black"
                        style={{ backgroundColor: p.user.avatar_color || '#000000' }}
                      >
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase text-black">{p.user.name}</span>
                          <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.2 uppercase font-mono">
                            {ROLE_BADGE_LABELS[p.role] || p.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">@{p.user.username}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveParticipant(p.user.id)}
                      className="px-2 py-1 bg-red-100 hover:bg-red-500 hover:text-white text-red-900 border border-black text-[10px] font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center gap-1"
                      title="Marcar ausente para este Daily"
                    >
                      <UserX className="w-3 h-3" />
                      <span>AUSENTE</span>
                    </button>
                  </div>
                ))}

                {participants.length === 0 && (
                  <div className="p-6 border-2 border-dashed border-red-400 text-center text-red-700 font-bold text-xs uppercase">
                    NO HAY INTEGRANTES DISPONIBLES EN LA LISTA. RESTAURA AL MENOS UNO PARA COMENZAR.
                  </div>
                )}
              </div>
            </div>

            {/* Excluded / Absent Members Pool */}
            {excludedMembers.length > 0 && (
              <div className="bg-neutral-100 border-2 border-dashed border-neutral-400 p-3 space-y-2">
                <span className="text-[11px] font-black uppercase text-neutral-600 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />
                  MIEMBROS DEL PROYECTO MARCADOS AUSENTES ({excludedMembers.length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {excludedMembers.map((m) => (
                    <button
                      key={m.user.id}
                      onClick={() => handleRestoreMember(m.user.id)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-300 text-black border border-black text-xs font-bold uppercase flex items-center gap-1.5 brutal-shadow-sm brutal-btn cursor-pointer"
                      title="Reintegrar a la sesión de hoy"
                    >
                      <UserCheck className="w-3 h-3 text-emerald-700" />
                      <span>+ {m.user.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: ACTIVE DAILY SCRUM SESSION                      */}
        {/* ======================================================== */}
        {phase === 'active' && currentSpeaker && (
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-industrial-grid">
            {/* Top Stats Bar */}
            <div className="flex items-center justify-between bg-black text-white p-2.5 border-2 border-black brutal-shadow-sm text-xs font-black">
              <span className="text-yellow-400 flex items-center gap-1.5 uppercase">
                <Users className="w-3.5 h-3.5" />
                ORADOR {currentSpeakerIndex + 1} DE {participants.length}
              </span>
              <span className="text-neutral-300 flex items-center gap-1.5 uppercase font-mono">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                TOTAL ELAPSED: {formatTime(totalElapsedSeconds)}
              </span>
            </div>

            {/* Main Speaker Stage */}
            <div className="bg-white border-4 border-black p-5 brutal-shadow text-center space-y-3">
              {/* Speaker Identity */}
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-14 h-14 border-2 border-black flex items-center justify-center text-white text-2xl font-black brutal-shadow-sm"
                  style={{ backgroundColor: currentSpeaker.user.avatar_color || '#000000' }}
                >
                  {currentSpeaker.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase text-black tracking-wide">
                    {currentSpeaker.user.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="bg-yellow-400 text-black border border-black text-[10px] font-black px-2 py-0.2 uppercase">
                      {ROLE_LABELS[currentSpeaker.role] || currentSpeaker.role}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">@{currentSpeaker.user.username}</span>
                  </div>
                </div>
              </div>

              {/* Big Toast Timer */}
              <div className="py-2">
                <div
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-colors ${
                    secondsLeft <= 10
                      ? 'text-red-600 animate-pulse'
                      : secondsLeft <= 30
                      ? 'text-orange-500'
                      : 'text-black'
                  }`}
                >
                  {formatTime(secondsLeft)}
                </div>

                {/* Toast Progress Bar */}
                <div className="w-full h-4 bg-neutral-200 border-2 border-black mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      secondsLeft <= 10
                        ? 'bg-red-500'
                        : secondsLeft <= 30
                        ? 'bg-yellow-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Canonical 3 Scrum Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left pt-2 border-t-2 border-black">
                <div className="p-2.5 bg-emerald-50 border-2 border-black">
                  <span className="text-[10px] font-black text-emerald-900 uppercase block mb-1">
                    1. ¿QUÉ HICE AYER?
                  </span>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Tareas completadas o commits enviados.
                  </p>
                </div>
                <div className="p-2.5 bg-yellow-50 border-2 border-black">
                  <span className="text-[10px] font-black text-yellow-900 uppercase block mb-1">
                    2. ¿QUÉ HARÉ HOY?
                  </span>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Historias o criterios BDD a avanzar.
                  </p>
                </div>
                <div className="p-2.5 bg-red-50 border-2 border-black">
                  <span className="text-[10px] font-black text-red-900 uppercase block mb-1">
                    3. ¿BLOQUEOS?
                  </span>
                  <p className="text-[11px] font-bold text-neutral-800">
                    Impedimentos técnicos o dependencias.
                  </p>
                </div>
              </div>

              {/* Quick Blocker / Note Input */}
              <div className="text-left pt-2">
                <label className="text-[10px] font-black uppercase text-neutral-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                  REGISTRAR BLOQUEO O NOTA RÁPIDA (OPCIONAL):
                </label>
                <input
                  type="text"
                  value={currentBlockerInput}
                  onChange={(e) => setCurrentBlockerInput(e.target.value)}
                  placeholder="Ej: Esperando endpoint de autenticación de Backend..."
                  className="w-full px-3 py-1.5 border-2 border-black text-xs font-bold uppercase placeholder:text-neutral-400 focus:bg-yellow-50 outline-none"
                />
              </div>
            </div>

            {/* Mechanical Control Buttons */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-3 py-2 border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center gap-1.5 ${
                    isPaused ? 'bg-yellow-400 text-black' : 'bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'REANUDAR' : 'PAUSAR'}</span>
                </button>

                <button
                  onClick={handleAddExtraTime}
                  className="px-3 py-2 bg-white hover:bg-yellow-100 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center gap-1"
                >
                  <Coffee className="w-4 h-4 text-orange-600" />
                  <span>+30s</span>
                </button>
              </div>

              <button
                onClick={handleNextSpeaker}
                className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer flex items-center gap-2 ml-auto"
              >
                <span>
                  {currentSpeakerIndex + 1 < participants.length ? 'SIGUIENTE ORADOR' : 'FINALIZAR STANDUP'}
                </span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Orators Progress Strip */}
            <div className="bg-white border-2 border-black p-2.5 flex items-center gap-2 overflow-x-auto">
              {participants.map((p, idx) => {
                const isActive = idx === currentSpeakerIndex;
                const isPast = idx < currentSpeakerIndex;

                return (
                  <div
                    key={p.user.id}
                    className={`px-2 py-1 border-2 text-[10px] font-black uppercase whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-yellow-400 text-black border-black brutal-shadow-sm'
                        : isPast
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-300 line-through'
                        : 'bg-white text-neutral-600 border-neutral-400'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    <span>{p.user.name.split(' ')[0]}</span>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-600 no-underline" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: SUMMARY SCREEN                                  */}
        {/* ======================================================== */}
        {phase === 'summary' && (
          <div className="p-5 overflow-y-auto space-y-5 flex-1 bg-industrial-grid">
            <div className="bg-emerald-400 border-4 border-black p-4 brutal-shadow text-center space-y-1">
              <span className="text-3xl block">🍞🎉</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-black">
                ¡DAILY SCRUM COMPLETADO CON ÉXITO!
              </h3>
              <p className="text-xs font-bold text-black uppercase">
                DURACIÓN TOTAL: {formatTime(totalElapsedSeconds)} · {participants.length} INTEGRANTES SINCRONIZADOS
              </p>
            </div>

            {/* Participants Summary Table */}
            <div className="bg-white border-4 border-black p-4 brutal-shadow space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-black border-b-2 border-black pb-1.5">
                REGISTRO DE PARTICIPACIÓN:
              </h4>

              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.user.id}
                    className="p-2.5 bg-neutral-50 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 border border-black flex items-center justify-center text-white text-[11px] font-black"
                        style={{ backgroundColor: p.user.avatar_color || '#000000' }}
                      >
                        {p.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-black uppercase text-black">{p.user.name}</span>
                        <span className="ml-2 text-[9px] bg-black text-white px-1.5 py-0.2 font-mono">
                          {ROLE_BADGE_LABELS[p.role] || p.role}
                        </span>
                        {p.blockerNotes && (
                          <div className="text-[11px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                            <span>Bloqueo: {p.blockerNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="font-mono font-black text-black bg-neutral-200 px-2 py-0.5 border border-black self-start sm:self-auto">
                      {formatTime(p.timeSpentSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy Summary button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopySummary}
                className="flex-1 py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedSummary ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSummary ? '¡COPIADO AL PORTAPAPELES!' : 'COPIAR RESUMEN DEL STANDUP'}</span>
              </button>

              <button
                onClick={onClose}
                className="py-2.5 px-5 bg-black hover:bg-neutral-900 text-white border-2 border-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions for Setup Phase */}
        {phase === 'setup' && (
          <div className="bg-neutral-100 border-t-2 border-black p-4 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold text-neutral-600 uppercase">
              {participants.length} ORADORES LISTOS
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-neutral-200 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                onClick={handleStartSession}
                disabled={participants.length === 0}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black border-2 border-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR DAILY STANDUP</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
