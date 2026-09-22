import React from 'react';
import { useJira } from '../context/JiraContext';
import { Task, TaskType, Priority, getTaskAssigneeIds } from '../types/jira';
import {
  ListPlus,
  Bookmark,
  CheckSquare,
  AlertCircle,
  Zap,
  GitCommit,
  ArrowUp,
  ArrowDown,
  Equal,
  ChevronsUp,
  ChevronsDown,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface BacklogViewProps {
  onOpenTaskModal: (taskId: number | null, columnId?: number | null) => void;
  tasksList: Task[];
}

export const BacklogView: React.FC<BacklogViewProps> = ({ onOpenTaskModal, tasksList }) => {
  const { currentProject, sprints, users, columns, updateTask, hasPerm } = useJira();

  if (!currentProject) return null;

  const projectSprints = sprints.filter((s) => s.project_id === currentProject.id);
  const activeSprints = projectSprints.filter((s) => s.status === 'active' || s.status === 'planned');
  const activeSprint = projectSprints.find((s) => s.status === 'active');
  const plannedSprints = projectSprints.filter((s) => s.status === 'planned');

  // Backlog tasks (no sprint or in backlog column)
  const backlogTasks = tasksList.filter((t) => !t.sprint_id || t.status.toLowerCase() === 'backlog');

  const renderTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'story':
        return <Bookmark className="w-4 h-4 text-emerald-600 fill-emerald-100" />;
      case 'bug':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'epic':
        return <Zap className="w-4 h-4 text-indigo-600 fill-indigo-100" />;
      case 'sub-task':
        return <GitCommit className="w-4 h-4 text-slate-500" />;
      case 'task':
      default:
        return <CheckSquare className="w-4 h-4 text-indigo-600" />;
    }
  };

  const renderPriority = (priority: Priority) => {
    switch (priority) {
      case 'highest':
        return <ChevronsUp className="w-4 h-4 text-rose-600" title="Muy Alta" />;
      case 'high':
        return <ArrowUp className="w-4 h-4 text-rose-500" title="Alta" />;
      case 'medium':
        return <Equal className="w-4 h-4 text-amber-500" title="Media" />;
      case 'low':
        return <ArrowDown className="w-4 h-4 text-emerald-500" title="Baja" />;
      case 'lowest':
        return <ChevronsDown className="w-4 h-4 text-slate-400" title="Muy Baja" />;
    }
  };

  const moveToSprint = (taskId: number, sprintId: number) => {
    const firstCol =
      columns.find((c) => c.project_id === currentProject.id && c.name.toLowerCase().includes('to do')) ||
      columns.find((c) => c.project_id === currentProject.id && !c.is_done_column);

    updateTask(taskId, {
      sprint_id: sprintId,
      column_id: firstCol ? firstCol.id : null,
      status: firstCol ? firstCol.name : 'To Do',
    });
  };

  return (
    <div className="bg-white border-4 border-black brutal-shadow overflow-hidden font-mono">
      {/* Header */}
      <div className="px-6 py-4 bg-yellow-400 border-b-2 border-black flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-black border-2 border-black text-white flex items-center justify-center font-bold">
            <ListPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-black tracking-wider uppercase">BACKLOG DEL PRODUCTO</h2>
            <p className="text-xs font-bold text-neutral-800 uppercase">
              {backlogTasks.length} TAREAS PENDIENTES DE PLANIFICACIÓN EN SPRINT.
            </p>
          </div>
        </div>

        {hasPerm('manage_tasks') && (
          <button
            onClick={() => onOpenTaskModal(null, null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-400 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ CREAR TAREA BACKLOG</span>
          </button>
        )}
      </div>

      {/* Table List */}
      {backlogTasks.length === 0 ? (
        <div className="p-12 text-center text-neutral-500 text-xs font-bold uppercase">
          <Layers className="w-10 h-10 mx-auto text-neutral-400 mb-2 stroke-[2]" />
          <p>NO HAY TAREAS EN EL BACKLOG ACTUALMENTE.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-100 border-b-2 border-black text-black uppercase font-black text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3.5 border-r border-black">Tipo / Clave</th>
                <th className="px-4 py-3.5 border-r border-black">Título</th>
                <th className="px-4 py-3.5 border-r border-black">Prioridad</th>
                <th className="px-4 py-3.5 border-r border-black">SP</th>
                <th className="px-4 py-3.5 border-r border-black">Asignados</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-neutral-200">
              {backlogTasks.map((task) => {
                const assignedUsers = getTaskAssigneeIds(task)
                  .map((id) => users.find((u) => u.id === id))
                  .filter(Boolean);

                return (
                  <tr
                    key={task.id}
                    onClick={() => onOpenTaskModal(task.id, null)}
                    className="hover:bg-yellow-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 border-r border-neutral-200 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        {renderTypeIcon(task.task_type)}
                        <span className="bg-neutral-200 border border-black px-1 text-[11px]">{task.task_key}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-neutral-200 font-bold uppercase text-black max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="px-4 py-3 border-r border-neutral-200">{renderPriority(task.priority)}</td>
                    <td className="px-4 py-3 border-r border-neutral-200 font-bold">
                      {task.story_points !== null ? (
                        <span className="w-5 h-5 bg-orange-400 border border-black text-black text-[10px] font-black inline-flex items-center justify-center">
                          {task.story_points}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 border-r border-neutral-200">
                      <div className="flex -space-x-1">
                        {assignedUsers.slice(0, 3).map((u) => u && (
                          <div
                            key={u.id}
                            className="w-5 h-5 flex items-center justify-center text-[10px] text-black font-black border border-black"
                            style={{ backgroundColor: u.avatar_color || '#fbbf24' }}
                            title={u.name}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {activeSprints.length > 0 && hasPerm('manage_tasks') && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              moveToSprint(task.id, Number(e.target.value));
                            }
                          }}
                          defaultValue=""
                          className="bg-white border-2 border-black text-[11px] font-bold uppercase px-2 py-1 outline-none cursor-pointer"
                        >
                          <option value="" disabled>
                            MOVER A SPRINT...
                          </option>
                          {activeSprints.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
