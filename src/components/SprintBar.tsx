import React from 'react';
import { useJira } from '../context/JiraContext';
import { Play, CheckCircle2, Plus, Calendar, Target, Layers } from 'lucide-react';
import { Sprint } from '../types/jira';

interface SprintBarProps {
  selectedSprintId: number | 'all' | 'backlog';
  setSelectedSprintId: (id: number | 'all' | 'backlog') => void;
  onOpenCreateSprint: () => void;
}

export const SprintBar: React.FC<SprintBarProps> = ({
  selectedSprintId,
  setSelectedSprintId,
  onOpenCreateSprint,
}) => {
  const { currentProject, sprints, tasks, columns, hasPerm, startSprint, completeSprint } = useJira();

  if (!currentProject) return null;

  const projectSprints = sprints.filter((s) => s.project_id === currentProject.id);
  const activeSprint = projectSprints.find((s) => s.status === 'active');

  // Currently focused sprint for metrics
  const displayedSprint =
    typeof selectedSprintId === 'number'
      ? projectSprints.find((s) => s.id === selectedSprintId)
      : activeSprint || null;

  const sprintTasks = displayedSprint
    ? tasks.filter((t) => t.sprint_id === displayedSprint.id)
    : [];

  const doneCol = columns.find((c) => c.project_id === currentProject.id && c.is_done_column);
  const doneTasks = sprintTasks.filter((t) => doneCol && t.column_id === doneCol.id);

  const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
  const donePoints = doneTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);

  const handleCompleteSprint = () => {
    if (!displayedSprint) return;
    const incompleteCount = sprintTasks.length - doneTasks.length;
    const message =
      incompleteCount > 0
        ? `¿Completar el '${displayedSprint.name}'? Hay ${incompleteCount} tareas incompletas que volverán al Backlog.`
        : `¿Completar el '${displayedSprint.name}'? Todas las tareas fueron finalizadas.`;

    if (confirm(message)) {
      completeSprint(displayedSprint.id);
    }
  };

  const handleStartSprint = () => {
    if (!displayedSprint) return;
    if (confirm(`¿Iniciar el '${displayedSprint.name}'? Se moverán las tareas del backlog al tablero activo.`)) {
      startSprint(displayedSprint.id);
    }
  };

  return (
    <div className="bg-white border-2 border-black p-4 brutal-shadow mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
      {/* Left: Sprint Status & Info */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {displayedSprint?.status === 'active' ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-400 text-black border-2 border-black text-xs font-black px-2.5 py-1 brutal-shadow-sm uppercase">
              <span className="w-2 h-2 rounded-none bg-black inline-block animate-pulse" />
              SPRINT_ACTIVO
            </span>
          ) : displayedSprint?.status === 'planned' ? (
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-black border-2 border-black text-xs font-black px-2.5 py-1 brutal-shadow-sm uppercase">
              PLANIFICADO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-neutral-200 text-black border-2 border-black text-xs font-bold px-2.5 py-1 uppercase">
              <Layers className="w-3.5 h-3.5 text-black" />
              {projectSprints.length === 0 ? 'SIN SPRINTS' : 'SELECTOR'}
            </span>
          )}

          {/* Sprint Selector Dropdown */}
          <select
            value={selectedSprintId}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all' || val === 'backlog') {
                setSelectedSprintId(val);
              } else {
                setSelectedSprintId(Number(val));
              }
            }}
            className="px-3 py-1.5 bg-neutral-50 border-2 border-black text-xs font-bold uppercase text-black focus:bg-yellow-200 outline-none brutal-shadow-sm cursor-pointer"
          >
            <option value="all">TODAS LAS TAREAS DEL PROYECTO</option>
            {projectSprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status === 'active' ? '[ACTIVO]' : s.status === 'completed' ? '[LISTO]' : '[PLAN]'})
              </option>
            ))}
            <option value="backlog">SOLO BACKLOG (SIN SPRINT)</option>
          </select>
        </div>

        {/* Sprint Meta */}
        {displayedSprint && (
          <div className="flex items-center gap-3 text-xs text-neutral-800 border-l-2 border-black pl-3 font-mono">
            {displayedSprint.goal && (
              <div className="flex items-center gap-1 truncate max-w-xs" title={displayedSprint.goal}>
                <Target className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                <span className="truncate uppercase font-bold text-[11px]">META: "{displayedSprint.goal}"</span>
              </div>
            )}

            {(displayedSprint.start_date || displayedSprint.end_date) && (
              <div className="flex items-center gap-1 text-[11px] whitespace-nowrap font-bold text-neutral-600">
                <Calendar className="w-3 h-3 text-black" />
                <span>
                  {displayedSprint.start_date || 'N/A'} » {displayedSprint.end_date || 'N/A'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 font-black text-black bg-orange-200 border-2 border-black px-2 py-0.5 text-xs brutal-shadow-sm">
              <span>
                {donePoints}/{totalPoints} SP
              </span>
              <span className="text-black/70 font-bold">({doneTasks.length}/{sprintTasks.length} T)</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        {hasPerm('manage_sprints') && (
          <>
            {displayedSprint && displayedSprint.status === 'planned' && (
              <button
                onClick={handleStartSprint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black uppercase border-2 border-black brutal-shadow-sm brutal-btn cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>INICIAR SPRINT</span>
              </button>
            )}

            {displayedSprint && displayedSprint.status === 'active' && (
              <button
                onClick={handleCompleteSprint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase border-2 border-black brutal-shadow-sm brutal-btn cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>FINALIZAR SPRINT</span>
              </button>
            )}

            <button
              onClick={onOpenCreateSprint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ SPRINT</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
