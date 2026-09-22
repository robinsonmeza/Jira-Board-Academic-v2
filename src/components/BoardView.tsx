import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { Task, BoardColumn, getTaskAssigneeIds } from '../types/jira';
import {
  ArrowLeft,
  Kanban,
  ListPlus,
  BarChart3,
  Users,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { TaskCard } from './TaskCard';
import { SprintBar } from './SprintBar';
import { FilterBar } from './FilterBar';
import { BacklogView } from './BacklogView';
import { ReportsView } from './ReportsView';
import { TaskModal } from './TaskModal';
import { SprintModal } from './SprintModal';
import { MembersModal } from './MemberModals';

interface BoardViewProps {
  onBackToProjects: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ onBackToProjects }) => {
  const {
    currentProject,
    columns,
    tasks,
    currentRole,
    hasPerm,
    moveTask,
    addColumn,
    updateColumn,
    deleteColumn,
  } = useJira();

  // Active View Tab: 'board' | 'backlog' | 'reports'
  const [activeTab, setActiveTab] = useState<'board' | 'backlog' | 'reports'>('board');

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');

  // Selected Sprint Filter ('all' | 'backlog' | sprintId)
  const [selectedSprintId, setSelectedSprintId] = useState<number | 'all' | 'backlog'>('all');

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColColor, setNewColColor] = useState('#C3CFE2');

  // Drag over tracking
  const [dragOverColId, setDragOverColId] = useState<number | null>(null);
  const [columnMenuId, setColumnMenuId] = useState<number | null>(null);

  if (!currentProject) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">No hay ningún proyecto seleccionado.</p>
        <button
          onClick={onBackToProjects}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          Volver a Proyectos
        </button>
      </div>
    );
  }

  const projectColumns = columns
    .filter((c) => c.project_id === currentProject.id)
    .sort((a, b) => a.position - b.position);

  const projectTasks = tasks.filter((t) => t.project_id === currentProject.id);

  // Apply Sprint & Attribute Filters
  const filteredTasks = projectTasks.filter((t) => {
    // Sprint filter
    if (selectedSprintId === 'backlog') {
      if (t.sprint_id !== null && t.status.toLowerCase() !== 'backlog') return false;
    } else if (typeof selectedSprintId === 'number') {
      if (t.sprint_id !== selectedSprintId) return false;
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchKey = t.task_key?.toLowerCase().includes(q) ?? false;
      if (!matchTitle && !matchKey) return false;
    }

    // Type filter
    if (typeFilter && t.task_type !== typeFilter) return false;

    // Priority filter
    if (priorityFilter && t.priority !== priorityFilter) return false;

    // Assignee filter
    if (assigneeFilter) {
      const taskAssigneeIds = getTaskAssigneeIds(t);
      if (assigneeFilter === 'unassigned') {
        if (taskAssigneeIds.length > 0) return false;
      } else {
        const filterUserId = Number(assigneeFilter);
        if (!taskAssigneeIds.includes(filterUserId)) return false;
      }
    }

    // Label filter
    if (labelFilter && !(t.labels || []).includes(labelFilter)) return false;

    return true;
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    if (!hasPerm('move_tasks')) return;
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: number) => {
    if (!hasPerm('move_tasks')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: number) => {
    if (dragOverColId === colId) {
      setDragOverColId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: number) => {
    e.preventDefault();
    setDragOverColId(null);
    if (!hasPerm('move_tasks')) return;

    const rawTaskId = e.dataTransfer.getData('text/plain');
    if (!rawTaskId) return;

    const taskId = Number(rawTaskId);
    moveTask(taskId, colId);
  };

  const handleOpenCreateTask = (columnId?: number | null) => {
    setSelectedTaskId(null);
    setTargetColumnId(columnId ?? null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    addColumn(newColName.trim(), newColColor);
    setNewColName('');
    setIsAddColumnModalOpen(false);
  };

  const handleRenameColumn = (col: BoardColumn) => {
    const newName = prompt('Nuevo nombre para la columna:', col.name);
    if (newName && newName.trim() && newName.trim() !== col.name) {
      updateColumn(col.id, { name: newName.trim() });
    }
  };

  const handleDeleteColumn = (col: BoardColumn) => {
    if (confirm(`¿Eliminar la columna '${col.name}'? Las tareas se reasignarán a otra columna o al backlog.`)) {
      deleteColumn(col.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-mono">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToProjects}
            className="p-2 border-2 border-black bg-white hover:bg-neutral-200 text-black brutal-shadow-sm brutal-btn cursor-pointer transition-colors"
            title="Volver a lista de proyectos"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-black border border-black font-mono text-xs font-black px-2 py-0.5 brutal-shadow-sm">
                [{currentProject.key}]
              </span>
              <h1 className="text-xl font-black text-black uppercase tracking-wider">{currentProject.name}</h1>
            </div>
            <p className="text-xs font-bold text-neutral-600 mt-0.5 uppercase tracking-wide">
              {currentProject.description || 'TABLERO ÁGIL INDUSTRIAL'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs and Members action */}
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-black p-1 flex items-center gap-1 text-xs font-black brutal-shadow-sm">
            <button
              onClick={() => setActiveTab('board')}
              className={`px-3 py-1.5 flex items-center gap-1.5 uppercase transition-all cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-yellow-400 text-black border border-black font-black'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>TABLERO</span>
            </button>

            <button
              onClick={() => setActiveTab('backlog')}
              className={`px-3 py-1.5 flex items-center gap-1.5 uppercase transition-all cursor-pointer ${
                activeTab === 'backlog'
                  ? 'bg-yellow-400 text-black border border-black font-black'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>BACKLOG</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 flex items-center gap-1.5 uppercase transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-yellow-400 text-black border border-black font-black'
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>MÉTRICAS</span>
            </button>
          </div>

          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-300 hover:bg-cyan-200 text-black border-2 border-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>MIEMBROS</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-5">
        {/* Sprint Bar */}
        <SprintBar
          selectedSprintId={selectedSprintId}
          setSelectedSprintId={setSelectedSprintId}
          onOpenCreateSprint={() => setIsSprintModalOpen(true)}
        />

        {/* Filter Bar */}
        <FilterBar
          search={search}
          setSearch={setSearch}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          assigneeFilter={assigneeFilter}
          setAssigneeFilter={setAssigneeFilter}
          labelFilter={labelFilter}
          setLabelFilter={setLabelFilter}
        />

        {/* 1. Board View (Kanban) */}
        {activeTab === 'board' && (
          <div className="overflow-x-auto pb-6">
            <div className="flex items-start gap-4 min-h-[580px] min-w-max">
              {projectColumns.map((col) => {
                const colTasks = filteredTasks
                  .filter((t) => t.column_id === col.id)
                  .sort((a, b) => a.position - b.position);

                const isDragOver = dragOverColId === col.id;

                return (
                  <div
                    key={col.id}
                    onDragOver={(e) => handleDragOver(e, col.id)}
                    onDragLeave={(e) => handleDragLeave(e, col.id)}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`w-80 bg-neutral-100 border-2 border-black flex flex-col shrink-0 transition-all ${
                      isDragOver
                        ? 'bg-yellow-100 border-dashed border-black ring-4 ring-orange-400'
                        : 'brutal-shadow'
                    }`}
                  >
                    {/* Column Header */}
                    <div
                      className="px-3 py-2.5 border-b-2 border-black bg-white flex items-center justify-between"
                      style={{
                        borderTop: `6px solid ${col.color || '#ea580c'}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 border border-black"
                          style={{ backgroundColor: col.color || '#ea580c' }}
                        />
                        <h3 className="text-xs font-black text-black uppercase tracking-wider">
                          {col.name}
                        </h3>
                        <span className="bg-black text-yellow-400 border border-black text-[11px] font-black px-1.5 py-0.2">
                          [{colTasks.length}]
                        </span>
                      </div>

                      {hasPerm('manage_columns') && (
                        <div className="relative">
                          <button
                            onClick={() => setColumnMenuId(columnMenuId === col.id ? null : col.id)}
                            className="p-1 text-black hover:bg-neutral-200 border border-transparent hover:border-black cursor-pointer"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {columnMenuId === col.id && (
                            <div
                              className="absolute right-0 mt-1 w-36 bg-white border-2 border-black brutal-shadow-lg py-1 z-30 text-xs font-mono"
                              onMouseLeave={() => setColumnMenuId(null)}
                            >
                              <button
                                onClick={() => {
                                  handleRenameColumn(col);
                                  setColumnMenuId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 font-bold uppercase text-black hover:bg-yellow-200 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                RENOMBRAR
                              </button>
                              {projectColumns.length > 1 && (
                                <button
                                  onClick={() => {
                                    handleDeleteColumn(col);
                                    setColumnMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 font-bold uppercase text-rose-600 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  ELIMINAR
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Task Cards Container */}
                    <div className="p-2.5 flex-1 flex flex-col gap-2.5 min-h-[160px] max-h-[calc(100vh-320px)] overflow-y-auto bg-neutral-100">
                      {colTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onOpenModal={handleOpenEditTask}
                          onDragStart={handleDragStart}
                        />
                      ))}

                      {colTasks.length === 0 && (
                        <div className="flex-1 border-2 border-dashed border-neutral-400 flex items-center justify-center p-4 text-center bg-white/50">
                          <span className="text-[11px] font-bold text-neutral-500 uppercase">
                            [ VACÍO - ARRASTRAR AQUÍ ]
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add task button in column */}
                    {hasPerm('manage_tasks') && (
                      <div className="p-2 border-t-2 border-black bg-white">
                        <button
                          onClick={() => handleOpenCreateTask(col.id)}
                          className="w-full py-1.5 px-2 border-2 border-black bg-white hover:bg-yellow-300 text-black text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all brutal-shadow-sm brutal-btn cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>+ AGREGAR TAREA</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Column Card */}
              {hasPerm('manage_columns') && (
                <button
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="w-64 h-36 border-2 border-dashed border-black bg-white hover:bg-yellow-100 flex flex-col items-center justify-center text-black transition-all shrink-0 p-4 brutal-shadow cursor-pointer"
                >
                  <Plus className="w-6 h-6 mb-1 stroke-[3]" />
                  <span className="text-xs font-black uppercase tracking-wider">+ NUEVA COLUMNA</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. Backlog View */}
        {activeTab === 'backlog' && (
          <BacklogView onOpenTaskModal={handleOpenCreateTask} tasksList={filteredTasks} />
        )}

        {/* 3. Reports View */}
        {activeTab === 'reports' && <ReportsView />}
      </div>

      {/* Task Creation & Detail Modal */}
      <TaskModal
        taskId={selectedTaskId}
        initialColumnId={targetColumnId}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      {/* Sprint Modal */}
      <SprintModal isOpen={isSprintModalOpen} onClose={() => setIsSprintModalOpen(false)} />

      {/* Members Modal */}
      <MembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} />

      {/* Add Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-3">Agregar Nueva Columna</h3>
            <form onSubmit={handleAddColumnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de Columna *
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="ej. QA Testing"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Color de Cabecera
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColColor}
                    onChange={(e) => setNewColColor(e.target.value)}
                    className="w-9 h-9 p-0.5 border border-slate-300 rounded-lg cursor-pointer shadow-2xs"
                  />
                  <span className="text-xs text-slate-500 font-mono">{newColColor}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Crear Columna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
