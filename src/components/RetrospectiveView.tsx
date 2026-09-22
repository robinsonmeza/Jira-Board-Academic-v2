import React, { useState, useMemo } from 'react';
import { useJira } from '../context/JiraContext';
import { Sprint, User } from '../types/jira';
import {
  Plus,
  ThumbsUp,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  Lock,
  Eye,
  ShieldAlert,
} from 'lucide-react';

interface RetroCard {
  id: string;
  columnType: 'good' | 'improve' | 'action';
  content: string;
  authorName: string;
  authorColor: string;
  votes: number;
  votedUserIds: number[];
  convertedToTaskId?: number;
}

export const RetrospectiveView: React.FC = () => {
  const { currentProject, sprints, currentUser, currentRole, createTask } = useJira();

  // Role permissions check: Only PO and PM can create, edit, delete or convert cards
  const effectiveRole = currentRole || currentUser?.role;
  const canEditRetro =
    effectiveRole === 'product_owner' ||
    effectiveRole === 'admin' ||
    effectiveRole === 'project_manager';

  // Selected Sprint for this Retrospective
  const projectSprints = useMemo(() => {
    if (!currentProject) return [];
    return sprints.filter((s) => s.project_id === currentProject.id);
  }, [sprints, currentProject]);

  const [selectedSprintId, setSelectedSprintId] = useState<number | 'general'>('general');

  // Retrospective cards state initialized empty (no mock/sample cards)
  const [cards, setCards] = useState<RetroCard[]>([]);

  // Input states per column
  const [inputGood, setInputGood] = useState('');
  const [inputImprove, setInputImprove] = useState('');
  const [inputAction, setInputAction] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!currentProject) return null;

  const handleAddCard = (type: 'good' | 'improve' | 'action', content: string) => {
    if (!canEditRetro) return;
    if (!content.trim() || !currentUser) return;

    const newCard: RetroCard = {
      id: `rc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      columnType: type,
      content: content.trim(),
      authorName: currentUser.name,
      authorColor: currentUser.avatar_color || '#000000',
      votes: 1,
      votedUserIds: [currentUser.id],
    };

    setCards((prev) => [newCard, ...prev]);

    if (type === 'good') setInputGood('');
    if (type === 'improve') setInputImprove('');
    if (type === 'action') setInputAction('');
  };

  // Voting is allowed for all team members
  const handleVoteCard = (cardId: string) => {
    if (!currentUser) return;
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const hasVoted = c.votedUserIds.includes(currentUser.id);
          return {
            ...c,
            votes: hasVoted ? c.votes - 1 : c.votes + 1,
            votedUserIds: hasVoted
              ? c.votedUserIds.filter((id) => id !== currentUser.id)
              : [...c.votedUserIds, currentUser.id],
          };
        }
        return c;
      })
    );
  };

  const handleDeleteCard = (cardId: string) => {
    if (!canEditRetro) return;
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Convert an Action Item into a real Backlog Task (restricted to PO / PM)
  const handleConvertToActionTask = (card: RetroCard) => {
    if (!canEditRetro) return;
    if (!currentProject || !currentUser || card.convertedToTaskId) return;

    const res = createTask({
      title: `[MEJORA] ${card.content.slice(0, 70)}`,
      description: `Acción originada en la Retrospectiva de Sprint: "${card.content}".\nPropuesta por: ${card.authorName}`,
      project_id: currentProject.id,
      type: 'task',
      priority: 'high',
      story_points: 2,
    });

    if (res.success && res.task) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, convertedToTaskId: res.task?.id } : c))
      );
    }
  };

  const handleCopySummary = () => {
    let text = `📋 RETROSPECTIVA DE SPRINT - [${currentProject.key}] ${currentProject.name}\n\n`;

    text += `🟢 ¿QUÉ FUNCIONÓ BIEN?:\n`;
    if (goodCards.length === 0) text += ` (Sin tarjetas registradas)\n`;
    goodCards.forEach((c) => (text += ` - ${c.content} (+${c.votes} votos, por ${c.authorName})\n`));

    text += `\n🟠 ¿QUÉ PODEMOS MEJORAR?:\n`;
    if (improveCards.length === 0) text += ` (Sin tarjetas registradas)\n`;
    improveCards.forEach((c) => (text += ` - ${c.content} (+${c.votes} votos, por ${c.authorName})\n`));

    text += `\n🔵 ACCIONES DE MEJORA COMPROMETIDAS:\n`;
    if (actionCards.length === 0) text += ` (Sin tarjetas registradas)\n`;
    actionCards.forEach((c) => (text += ` - ${c.content} (+${c.votes} votos, por ${c.authorName})\n`));

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const goodCards = cards.filter((c) => c.columnType === 'good');
  const improveCards = cards.filter((c) => c.columnType === 'improve');
  const actionCards = cards.filter((c) => c.columnType === 'action');

  return (
    <div className="space-y-5 font-mono">
      {/* Top Controls Bar */}
      <div className="bg-white border-4 border-black p-4 brutal-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">🔄</span>
            <h2 className="text-base sm:text-lg font-black uppercase text-black tracking-wider">
              TABLERO DE RETROSPECTIVA DE SPRINT
            </h2>
            <span className="bg-black text-yellow-400 text-xs font-black px-2 py-0.5 border border-black">
              CEREMONIA ÁGIL
            </span>

            {/* Permission indicator */}
            {canEditRetro ? (
              <span className="bg-emerald-400 text-black text-[10px] font-black px-2 py-0.5 border border-black flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                EDICIÓN HABILITADA (PO / PM)
              </span>
            ) : (
              <span className="bg-neutral-200 text-neutral-800 text-[10px] font-black px-2 py-0.5 border border-neutral-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-neutral-600" />
                SÓLO LECTURA Y VOTACIÓN
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-neutral-600 uppercase mt-0.5">
            {canEditRetro
              ? 'INSPECCIÓN Y ADAPTACIÓN: CREA TARJETAS, COMPROMETE ACCIONES Y CONVIÉRTELAS AL BACKLOG.'
              : 'INSPECCIÓN Y ADAPTACIÓN: VISUALIZA LAS REFLEXIONES DEL EQUIPO Y VOTA (+1) POR LAS MÁS CRÍTICAS.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Sprint Selector */}
          <div className="flex items-center gap-1.5 text-xs font-black">
            <span className="text-neutral-700 uppercase">SPRINT:</span>
            <select
              value={selectedSprintId}
              onChange={(e) =>
                setSelectedSprintId(e.target.value === 'general' ? 'general' : Number(e.target.value))
              }
              className="px-2.5 py-1.5 bg-neutral-50 border-2 border-black text-xs font-black uppercase outline-none cursor-pointer"
            >
              <option value="general">Retrospectiva General</option>
              {projectSprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center gap-1.5"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? '¡COPIADO!' : 'COPIAR ACTA'}</span>
          </button>
        </div>
      </div>

      {/* 3 Canonical Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* ======================================================== */}
        {/* COLUMN 1: QUÉ FUNCIONÓ BIEN                             */}
        {/* ======================================================== */}
        <div className="bg-emerald-50 border-4 border-black p-4 brutal-shadow flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="border-b-3 border-black pb-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                ¿QUÉ FUNCIONÓ BIEN?
              </span>
              <span className="bg-emerald-600 text-white font-mono font-black text-xs px-2 py-0.5 border border-black">
                {goodCards.length}
              </span>
            </div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase mt-1">
              Éxitos técnicos, buenas prácticas y acuerdos cumplidos.
            </p>
          </div>

          {/* Quick Add Input (PO / PM only) */}
          {canEditRetro ? (
            <div className="bg-white border-2 border-black p-2 mb-3 brutal-shadow-sm space-y-2">
              <textarea
                value={inputGood}
                onChange={(e) => setInputGood(e.target.value)}
                placeholder="Escribe lo que salió excelente en este Sprint..."
                rows={2}
                className="w-full text-xs font-bold uppercase placeholder:text-neutral-400 outline-none resize-none"
              />
              <button
                onClick={() => handleAddCard('good', inputGood)}
                disabled={!inputGood.trim()}
                className="w-full py-1 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black border border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>AGREGAR REFLEXIÓN</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/80 border border-emerald-300 p-2 mb-3 text-[10px] font-bold text-emerald-900 uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
              <span>EDICIÓN RESERVADA A PO/PM · PUEDES VOTAR (+1)</span>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {goodCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border-2 border-black p-3 brutal-shadow-sm space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs font-bold text-black uppercase leading-snug">{card.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 border border-black text-white text-[8px] font-black flex items-center justify-center"
                      style={{ backgroundColor: card.authorColor }}
                    >
                      {card.authorName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-600">{card.authorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voting: available to everyone */}
                    <button
                      onClick={() => handleVoteCard(card.id)}
                      className={`px-1.5 py-0.5 border border-black text-[10px] font-black flex items-center gap-1 brutal-btn cursor-pointer ${
                        card.votedUserIds.includes(currentUser?.id || 0)
                          ? 'bg-emerald-400 text-black'
                          : 'bg-neutral-100 hover:bg-emerald-200 text-black'
                      }`}
                      title="Votar por este punto"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{card.votes}</span>
                    </button>

                    {/* Delete: PO / PM only */}
                    {canEditRetro && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-neutral-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {goodCards.length === 0 && (
              <div className="p-8 border-2 border-dashed border-emerald-300 text-center text-emerald-800 text-xs font-bold uppercase space-y-1">
                <span>SIN TARJETAS REGISTRADAS</span>
                <p className="text-[10px] text-emerald-600">
                  {canEditRetro
                    ? 'Agrega la primera reflexión positiva del equipo usando el formulario.'
                    : 'Aún no se han publicado reflexiones en esta columna.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: QUÉ PODEMOS MEJORAR                           */}
        {/* ======================================================== */}
        <div className="bg-amber-50 border-4 border-black p-4 brutal-shadow flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="border-b-3 border-black pb-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                ¿QUÉ PODEMOS MEJORAR?
              </span>
              <span className="bg-amber-500 text-black font-mono font-black text-xs px-2 py-0.5 border border-black">
                {improveCards.length}
              </span>
            </div>
            <p className="text-[10px] font-bold text-amber-800 uppercase mt-1">
              Fricciones, cuellos de botella, bloqueos o deuda técnica.
            </p>
          </div>

          {/* Quick Add Input (PO / PM only) */}
          {canEditRetro ? (
            <div className="bg-white border-2 border-black p-2 mb-3 brutal-shadow-sm space-y-2">
              <textarea
                value={inputImprove}
                onChange={(e) => setInputImprove(e.target.value)}
                placeholder="Escribe qué obstáculo o problema detectaste..."
                rows={2}
                className="w-full text-xs font-bold uppercase placeholder:text-neutral-400 outline-none resize-none"
              />
              <button
                onClick={() => handleAddCard('improve', inputImprove)}
                disabled={!inputImprove.trim()}
                className="w-full py-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black border border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>REGISTRAR OPORTUNIDAD</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/80 border border-amber-300 p-2 mb-3 text-[10px] font-bold text-amber-900 uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-amber-700 shrink-0" />
              <span>EDICIÓN RESERVADA A PO/PM · PUEDES VOTAR (+1)</span>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {improveCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border-2 border-black p-3 brutal-shadow-sm space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs font-bold text-black uppercase leading-snug">{card.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 border border-black text-white text-[8px] font-black flex items-center justify-center"
                      style={{ backgroundColor: card.authorColor }}
                    >
                      {card.authorName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-600">{card.authorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voting: available to everyone */}
                    <button
                      onClick={() => handleVoteCard(card.id)}
                      className={`px-1.5 py-0.5 border border-black text-[10px] font-black flex items-center gap-1 brutal-btn cursor-pointer ${
                        card.votedUserIds.includes(currentUser?.id || 0)
                          ? 'bg-amber-400 text-black'
                          : 'bg-neutral-100 hover:bg-amber-200 text-black'
                      }`}
                      title="Votar por este punto"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{card.votes}</span>
                    </button>

                    {/* Delete: PO / PM only */}
                    {canEditRetro && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-neutral-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {improveCards.length === 0 && (
              <div className="p-8 border-2 border-dashed border-amber-300 text-center text-amber-800 text-xs font-bold uppercase space-y-1">
                <span>SIN TARJETAS REGISTRADAS</span>
                <p className="text-[10px] text-amber-600">
                  {canEditRetro
                    ? 'Registra cuellos de botella o áreas de mejora detectadas en el Sprint.'
                    : 'Aún no se han publicado oportunidades de mejora en esta columna.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: ACCIONES DEL PRÓXIMO SPRINT                   */}
        {/* ======================================================== */}
        <div className="bg-cyan-50 border-4 border-black p-4 brutal-shadow flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="border-b-3 border-black pb-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-950 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-cyan-700" />
                ACCIONES DEL PRÓXIMO SPRINT
              </span>
              <span className="bg-cyan-500 text-black font-mono font-black text-xs px-2 py-0.5 border border-black">
                {actionCards.length}
              </span>
            </div>
            <p className="text-[10px] font-bold text-cyan-800 uppercase mt-1">
              Compromisos accionables con impacto directo en el Backlog.
            </p>
          </div>

          {/* Quick Add Input (PO / PM only) */}
          {canEditRetro ? (
            <div className="bg-white border-2 border-black p-2 mb-3 brutal-shadow-sm space-y-2">
              <textarea
                value={inputAction}
                onChange={(e) => setInputAction(e.target.value)}
                placeholder="Escribe una acción concreta y medible..."
                rows={2}
                className="w-full text-xs font-bold uppercase placeholder:text-neutral-400 outline-none resize-none"
              />
              <button
                onClick={() => handleAddCard('action', inputAction)}
                disabled={!inputAction.trim()}
                className="w-full py-1 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black border border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>COMPROMETER ACCIÓN</span>
              </button>
            </div>
          ) : (
            <div className="bg-white/80 border border-cyan-300 p-2 mb-3 text-[10px] font-bold text-cyan-900 uppercase flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-700 shrink-0" />
              <span>EDICIÓN RESERVADA A PO/PM · PUEDES VOTAR (+1)</span>
            </div>
          )}

          {/* Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {actionCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border-2 border-black p-3 brutal-shadow-sm space-y-2 flex flex-col justify-between"
              >
                <p className="text-xs font-bold text-black uppercase leading-snug">{card.content}</p>

                {/* Conversion to Task Badge / Button */}
                {card.convertedToTaskId ? (
                  <div className="p-1.5 bg-emerald-100 border border-black text-[10px] font-black text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>CONVERTIDA EN TAREA DE BACKLOG</span>
                  </div>
                ) : canEditRetro ? (
                  <button
                    onClick={() => handleConvertToActionTask(card)}
                    className="w-full py-1 bg-neutral-100 hover:bg-yellow-300 text-black border border-black text-[10px] font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer flex items-center justify-center gap-1"
                    title="Convertir esta acción en una tarea real en el Backlog del proyecto"
                  >
                    <span>CONVERTIR EN TAREA DE BACKLOG</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="p-1 bg-neutral-100 border border-neutral-300 text-[9px] font-bold text-neutral-600 uppercase text-center">
                    ACCIÓN PENDIENTE DE VINCULACIÓN
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 border border-black text-white text-[8px] font-black flex items-center justify-center"
                      style={{ backgroundColor: card.authorColor }}
                    >
                      {card.authorName.charAt(0)}
                    </div>
                    <span className="text-[10px] font-bold text-neutral-600">{card.authorName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Voting: available to everyone */}
                    <button
                      onClick={() => handleVoteCard(card.id)}
                      className={`px-1.5 py-0.5 border border-black text-[10px] font-black flex items-center gap-1 brutal-btn cursor-pointer ${
                        card.votedUserIds.includes(currentUser?.id || 0)
                          ? 'bg-cyan-400 text-black'
                          : 'bg-neutral-100 hover:bg-cyan-200 text-black'
                      }`}
                      title="Votar por esta acción"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{card.votes}</span>
                    </button>

                    {/* Delete: PO / PM only */}
                    {canEditRetro && (
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-neutral-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="Eliminar tarjeta"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {actionCards.length === 0 && (
              <div className="p-8 border-2 border-dashed border-cyan-300 text-center text-cyan-800 text-xs font-bold uppercase space-y-1">
                <span>SIN ACCIONES COMPROMETIDAS</span>
                <p className="text-[10px] text-cyan-600">
                  {canEditRetro
                    ? 'Define compromisos de mejora que luego podrás convertir directamente al Backlog.'
                    : 'Aún no se han publicado acciones de mejora en esta columna.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
