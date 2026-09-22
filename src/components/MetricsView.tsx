import React, { useState, useMemo } from 'react';
import { useJira } from '../context/JiraContext';
import {
  getTaskAssigneeIds,
  Task,
  Sprint,
  User,
  ROLE_BADGE_LABELS,
  ROLE_LABELS,
  Role,
} from '../types/jira';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Award,
  TrendingUp,
  Users,
  Filter,
  UserCheck,
  Flame,
  Target,
  Search,
  X,
  Sparkles,
  Bug,
  FolderKanban,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';

interface MetricsViewProps {
  onOpenTaskModal?: (taskId: number) => void;
}

// Custom Industrial Brutalist Tooltip for Recharts
const BrutalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black text-white p-3 border-2 border-black brutal-shadow-sm font-mono text-xs z-50">
        <p className="font-black text-yellow-400 border-b border-neutral-700 pb-1 mb-2 uppercase tracking-wider">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-neutral-300 font-bold">
                <span
                  className="w-2.5 h-2.5 inline-block border border-black"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                {entry.name}:
              </span>
              <span className="font-black text-white font-mono">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const MetricsView: React.FC<MetricsViewProps> = ({ onOpenTaskModal }) => {
  const { currentProject, tasks, columns, sprints, users, members } = useJira();

  // Selected developer filter: 'all' | userId
  const [selectedDevId, setSelectedDevId] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'devs' | 'frontend' | 'backend'>('all');
  const [devSearchQuery, setDevSearchQuery] = useState('');

  if (!currentProject) return null;

  // Project tasks, columns and sprints
  const projectTasks = tasks.filter((t) => t.project_id === currentProject.id);
  const projectSprints = sprints.filter((s) => s.project_id === currentProject.id);
  const doneColumn = columns.find((c) => c.project_id === currentProject.id && c.is_done_column);
  const inProgressColumns = columns.filter(
    (c) =>
      c.project_id === currentProject.id &&
      !c.is_done_column &&
      c.name.toLowerCase() !== 'to do' &&
      c.name.toLowerCase() !== 'backlog'
  );

  // Helper to check if task is completed
  const isTaskDone = (t: Task) => {
    if (doneColumn) return t.column_id === doneColumn.id;
    return t.status.toLowerCase() === 'done' || t.status.toLowerCase() === 'completado';
  };

  // Helper to check if task is in progress
  const isTaskInProgress = (t: Task) => {
    if (inProgressColumns.some((c) => c.id === t.column_id)) return true;
    const s = t.status.toLowerCase();
    return s.includes('progress') || s.includes('progreso') || s.includes('review') || s.includes('revisión');
  };

  // Project developers / members
  const projectMembers = members.filter((m) => m.project_id === currentProject.id);
  const projectMemberUserIds = new Set(projectMembers.map((m) => m.user_id));

  // Users who have at least 1 task or are members in this project
  const projectDevs: User[] = useMemo(() => {
    const userMap = new Map<number, User>();

    // Add explicit members
    projectMembers.forEach((m) => {
      const u = users.find((usr) => usr.id === m.user_id);
      if (u) userMap.set(u.id, { ...u, role: m.role || u.role });
    });

    // Add any user who has tasks assigned in this project
    projectTasks.forEach((t) => {
      const aIds = getTaskAssigneeIds(t);
      aIds.forEach((uid) => {
        if (!userMap.has(uid)) {
          const u = users.find((usr) => usr.id === uid);
          if (u) userMap.set(u.id, u);
        }
      });
    });

    // Also include all developers in users if list is empty for demo richness
    if (userMap.size === 0) {
      users.forEach((u) => userMap.set(u.id, u));
    }

    return Array.from(userMap.values());
  }, [projectMembers, projectTasks, users]);

  // Filter developers by role or search
  const filteredDevs = useMemo(() => {
    return projectDevs.filter((dev) => {
      // Role filter
      if (roleFilter === 'devs') {
        if (dev.role !== 'frontend' && dev.role !== 'backend') return false;
      } else if (roleFilter === 'frontend') {
        if (dev.role !== 'frontend') return false;
      } else if (roleFilter === 'backend') {
        if (dev.role !== 'backend') return false;
      }

      // Search query
      if (devSearchQuery.trim()) {
        const q = devSearchQuery.toLowerCase();
        const matchName = dev.name.toLowerCase().includes(q);
        const matchUser = dev.username.toLowerCase().includes(q);
        if (!matchName && !matchUser) return false;
      }

      return true;
    });
  }, [projectDevs, roleFilter, devSearchQuery]);

  // Currently selected developer object
  const selectedDev = useMemo(() => {
    if (selectedDevId === 'all') return null;
    return projectDevs.find((d) => d.id === selectedDevId) || null;
  }, [selectedDevId, projectDevs]);

  // Scoped tasks based on developer filter
  const scopedTasks = useMemo(() => {
    if (selectedDevId === 'all') {
      return projectTasks;
    }
    return projectTasks.filter((t) => {
      const aIds = getTaskAssigneeIds(t);
      return aIds.includes(selectedDevId);
    });
  }, [projectTasks, selectedDevId]);

  // ==========================================
  // 1. RECHARTS: AVANCE POR SPRINT
  // Tareas Completadas vs Total de Tareas por Sprint
  // ==========================================
  const sprintProgressData = useMemo(() => {
    // If there are no sprints in this project, create a default bucket
    const sprintsToRender = projectSprints.length > 0 ? projectSprints : [
      { id: 1, name: 'Sprint 1', status: 'completed' } as Sprint,
      { id: 2, name: 'Sprint 2 (Activo)', status: 'active' } as Sprint,
    ];

    return sprintsToRender.map((sprint) => {
      // Tasks belonging to this sprint (filtered by dev if selected)
      const sTasks = scopedTasks.filter((t) => t.sprint_id === sprint.id);
      const totalTasks = sTasks.length;
      const completedTasks = sTasks.filter(isTaskDone).length;
      const inProgressTasks = sTasks.filter(isTaskInProgress).length;
      const pendingTasks = Math.max(0, totalTasks - completedTasks - inProgressTasks);
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Story points
      const totalPoints = sTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
      const completedPoints = sTasks
        .filter(isTaskDone)
        .reduce((acc, t) => acc + (t.story_points || 0), 0);

      return {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        completionRate,
        totalPoints,
        completedPoints,
      };
    });
  }, [projectSprints, scopedTasks]);

  // Include backlog tasks bucket if there are any
  const backlogTasks = scopedTasks.filter((t) => !t.sprint_id || t.status.toLowerCase() === 'backlog');
  const backlogCompleted = backlogTasks.filter(isTaskDone).length;

  // ==========================================
  // 2. RECHARTS: PRODUCTIVIDAD COMPARATIVA POR DEV
  // ==========================================
  const devsProductivityData = useMemo(() => {
    return projectDevs.map((dev) => {
      const devTasks = projectTasks.filter((t) => getTaskAssigneeIds(t).includes(dev.id));
      const total = devTasks.length;
      const completed = devTasks.filter(isTaskDone).length;
      const inProgress = devTasks.filter(isTaskInProgress).length;
      const pending = Math.max(0, total - completed - inProgress);
      const pointsDelivered = devTasks
        .filter(isTaskDone)
        .reduce((acc, t) => acc + (t.story_points || 0), 0);
      const pointsTotal = devTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: dev.id,
        name: dev.name.split(' ')[0] || dev.name,
        fullName: dev.name,
        role: dev.role || 'frontend',
        total,
        completed,
        inProgress,
        pending,
        pointsDelivered,
        pointsTotal,
        rate,
      };
    });
  }, [projectDevs, projectTasks]);

  // ==========================================
  // 3. RECHARTS: DISTRIBUCIÓN POR ESTADO
  // ==========================================
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedTasks.forEach((t) => {
      const col = columns.find((c) => c.id === t.column_id);
      const colName = col ? col.name : t.status || 'To Do';
      counts[colName] = (counts[colName] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([name, value]) => ({ name, value }));
    return entries.length > 0 ? entries : [{ name: 'Sin tareas', value: 1 }];
  }, [scopedTasks, columns]);

  const STATUS_PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4'];

  // ==========================================
  // 4. RECHARTS: DISTRIBUCIÓN POR TIPO DE TAREA
  // ==========================================
  const typeDistributionData = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {
      story: { total: 0, completed: 0 },
      task: { total: 0, completed: 0 },
      bug: { total: 0, completed: 0 },
      epic: { total: 0, completed: 0 },
      'sub-task': { total: 0, completed: 0 },
    };

    scopedTasks.forEach((t) => {
      const typeKey = (t.task_type || 'task').toLowerCase();
      if (!map[typeKey]) map[typeKey] = { total: 0, completed: 0 };
      map[typeKey].total += 1;
      if (isTaskDone(t)) map[typeKey].completed += 1;
    });

    return [
      { type: 'Historias (HU)', total: map.story?.total || 0, completadas: map.story?.completed || 0 },
      { type: 'Tareas Dev', total: map.task?.total || 0, completadas: map.task?.completed || 0 },
      { type: 'Bugs / QA', total: map.bug?.total || 0, completadas: map.bug?.completed || 0 },
      { type: 'Epics', total: map.epic?.total || 0, completadas: map.epic?.completed || 0 },
      { type: 'Sub-Tareas', total: map['sub-task']?.total || 0, completadas: map['sub-task']?.completed || 0 },
    ];
  }, [scopedTasks]);

  // ==========================================
  // 5. RECHARTS: DISTRIBUCIÓN POR PRIORIDAD
  // ==========================================
  const priorityDistributionData = useMemo(() => {
    const priorityCounts: Record<string, number> = {
      highest: 0,
      high: 0,
      medium: 0,
      low: 0,
      lowest: 0,
    };

    scopedTasks.forEach((t) => {
      const p = (t.priority || 'medium').toLowerCase();
      if (priorityCounts[p] !== undefined) {
        priorityCounts[p] += 1;
      }
    });

    return [
      { name: 'Muy Alta', count: priorityCounts.highest, fill: '#dc2626' },
      { name: 'Alta', count: priorityCounts.high, fill: '#f97316' },
      { name: 'Media', count: priorityCounts.medium, fill: '#eab308' },
      { name: 'Baja', count: priorityCounts.low, fill: '#10b981' },
      { name: 'Muy Baja', count: priorityCounts.lowest, fill: '#64748b' },
    ];
  }, [scopedTasks]);

  // ==========================================
  // 6. TOTALES & KPIS DEL ALCANCE ACTUAL
  // ==========================================
  const totalTasksCount = scopedTasks.length;
  const completedTasksCount = scopedTasks.filter(isTaskDone).length;
  const inProgressTasksCount = scopedTasks.filter(isTaskInProgress).length;
  const pendingTasksCount = Math.max(0, totalTasksCount - completedTasksCount - inProgressTasksCount);
  const globalCompletionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const totalPoints = scopedTasks.reduce((acc, t) => acc + (t.story_points || 0), 0);
  const deliveredPoints = scopedTasks
    .filter(isTaskDone)
    .reduce((acc, t) => acc + (t.story_points || 0), 0);

  const bugsCount = scopedTasks.filter((t) => t.task_type === 'bug').length;
  const bugsResolved = scopedTasks.filter((t) => t.task_type === 'bug' && isTaskDone(t)).length;

  // Acceptance criteria stats
  let totalCriteriaCount = 0;
  let doneCriteriaCount = 0;
  scopedTasks.forEach((t) => {
    if (t.acceptance_criteria && Array.isArray(t.acceptance_criteria)) {
      totalCriteriaCount += t.acceptance_criteria.length;
      doneCriteriaCount += t.acceptance_criteria.filter((c) => c.done).length;
    }
  });
  const criteriaRate =
    totalCriteriaCount > 0 ? Math.round((doneCriteriaCount / totalCriteriaCount) * 100) : 0;

  return (
    <div className="space-y-6 font-mono text-black">
      {/* ---------------------------------------------------- */}
      {/* HEADER & DEVELOPER FILTER CONTROLS                   */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-5 border-4 border-black brutal-shadow space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center text-black brutal-shadow-sm">
              <BarChart3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-black uppercase tracking-wider">
                  MÉTRICAS & PRODUCTIVIDAD DE DESARROLLO
                </h2>
                <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                  [{currentProject.key}]
                </span>
              </div>
              <p className="text-xs font-bold text-neutral-600 uppercase">
                ESTADÍSTICAS MEDIBLES DEL PROYECTO CON GRÁFICOS DE AVANCE Y FILTRADO POR DEV
              </p>
            </div>
          </div>

          {/* Quick Dev Role Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase text-neutral-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              ROL:
            </span>
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-black text-white border-black brutal-shadow-sm'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => setRoleFilter('devs')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                roleFilter === 'devs'
                  ? 'bg-orange-500 text-black border-black brutal-shadow-sm'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
              }`}
            >
              SOLO DEVS
            </button>
            <button
              onClick={() => setRoleFilter('frontend')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                roleFilter === 'frontend'
                  ? 'bg-cyan-400 text-black border-black brutal-shadow-sm'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
              }`}
            >
              FRONTEND
            </button>
            <button
              onClick={() => setRoleFilter('backend')}
              className={`px-2.5 py-1 text-xs font-black uppercase border-2 transition-all cursor-pointer ${
                roleFilter === 'backend'
                  ? 'bg-emerald-400 text-black border-black brutal-shadow-sm'
                  : 'bg-white text-black border-black hover:bg-neutral-100'
              }`}
            >
              BACKEND
            </button>
          </div>
        </div>

        {/* Developer Selector Bar */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
              FILTRAR ESTADÍSTICAS POR DESARROLLADOR:
            </label>

            {/* Search dev */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={devSearchQuery}
                onChange={(e) => setDevSearchQuery(e.target.value)}
                placeholder="BUSCAR DESARROLLADOR..."
                className="w-full pl-8 pr-2.5 py-1 border-2 border-black text-xs font-bold uppercase placeholder:text-neutral-400 focus:bg-yellow-50 outline-none"
              />
              {devSearchQuery && (
                <button
                  onClick={() => setDevSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-black hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dev Avatars / Buttons Horizontal Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
            {/* All Team Option */}
            <button
              onClick={() => setSelectedDevId('all')}
              className={`px-3 py-2 border-2 text-xs font-black uppercase whitespace-nowrap flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                selectedDevId === 'all'
                  ? 'bg-yellow-400 text-black border-black brutal-shadow brutal-btn'
                  : 'bg-white text-black border-black hover:bg-neutral-100 brutal-shadow-sm'
              }`}
            >
              <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-black text-[10px] border border-black">
                ALL
              </div>
              <span>TODO EL EQUIPO ({projectDevs.length} INTEGRANTES)</span>
            </button>

            {/* Individual Devs */}
            {filteredDevs.map((dev) => {
              const isSelected = selectedDevId === dev.id;
              const devTaskCount = projectTasks.filter((t) =>
                getTaskAssigneeIds(t).includes(dev.id)
              ).length;

              return (
                <button
                  key={dev.id}
                  onClick={() => setSelectedDevId(dev.id)}
                  className={`px-3 py-2 border-2 text-xs font-black uppercase whitespace-nowrap flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-orange-500 text-black border-black brutal-shadow brutal-btn'
                      : 'bg-white text-black border-black hover:bg-neutral-100 brutal-shadow-sm'
                  }`}
                >
                  <div
                    className="w-6 h-6 border border-black flex items-center justify-center text-white text-[10px] font-black"
                    style={{ backgroundColor: dev.avatar_color || '#000000' }}
                  >
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{dev.name}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 border border-black font-mono font-bold ${
                      isSelected ? 'bg-black text-white' : 'bg-neutral-200 text-black'
                    }`}
                  >
                    {dev.role ? ROLE_BADGE_LABELS[dev.role] || dev.role.toUpperCase() : 'DEV'}
                  </span>
                  <span className="text-[10px] bg-black text-yellow-400 px-1 border border-black font-mono">
                    {devTaskCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Developer Active Focus Card */}
        {selectedDev ? (
          <div className="p-3.5 bg-yellow-50 border-2 border-black brutal-shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 border-2 border-black flex items-center justify-center text-white text-lg font-black shrink-0 brutal-shadow-sm"
                style={{ backgroundColor: selectedDev.avatar_color || '#000000' }}
              >
                {selectedDev.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase text-black">{selectedDev.name}</span>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                    {selectedDev.role ? ROLE_LABELS[selectedDev.role] || selectedDev.role : 'DEVELOPER'}
                  </span>
                  <span className="text-xs text-neutral-600 font-mono">@{selectedDev.username}</span>
                </div>
                <p className="text-xs font-bold text-neutral-700 mt-0.5 uppercase">
                  VIENDO MÉTRICAS INDIVIDUALES: {completedTasksCount} de {totalTasksCount} tareas completadas ({globalCompletionRate}% de avance) · {deliveredPoints} pts entregados
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDevId('all')}
              className="px-3 py-1.5 bg-white border-2 border-black text-black hover:bg-neutral-200 text-xs font-black uppercase brutal-shadow-sm brutal-btn self-start md:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>QUITAR FILTRO DEV</span>
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-neutral-100 border-2 border-dashed border-neutral-400 text-xs font-bold text-neutral-700 uppercase flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-800" />
              VIENDO MÉTRICAS CONSOLIDADAS DE TODO EL EQUIPO EN EL PROYECTO
            </span>
            <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-black">
              {scopedTasks.length} TAREAS TOTALES
            </span>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* SUMMARY KPIS CARDS (BRUTALIST INDUSTRIAL)           */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              TOTAL TAREAS
            </span>
            <div className="p-1 border border-black bg-yellow-400">
              <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{totalTasksCount}</div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            {selectedDev ? 'ASIGNADAS AL DEV' : 'EN EL PROYECTO'}
          </p>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              COMPLETADAS
            </span>
            <div className="p-1 border border-black bg-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{completedTasksCount}</div>
          <p className="text-[9px] font-bold text-emerald-700 uppercase mt-0.5 truncate">
            {globalCompletionRate}% EFECTIVIDAD
          </p>
        </div>

        {/* In Progress / Active */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              EN PROGRESO
            </span>
            <div className="p-1 border border-black bg-cyan-400">
              <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{inProgressTasksCount}</div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            EN CURSO O REVISIÓN
          </p>
        </div>

        {/* Story Points Delivered */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              STORY POINTS
            </span>
            <div className="p-1 border border-black bg-orange-400">
              <Award className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{deliveredPoints} PTS</div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            DE {totalPoints} COMPROMETIDOS
          </p>
        </div>

        {/* Bugs / Quality */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              BUGS / QA
            </span>
            <div className="p-1 border border-black bg-red-400">
              <Bug className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">
            {bugsResolved} / {bugsCount}
          </div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            BUGS RESUELTOS
          </p>
        </div>

        {/* BDD Acceptance Criteria */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              CRITERIOS BDD
            </span>
            <div className="p-1 border border-black bg-yellow-400">
              <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{criteriaRate}%</div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            {doneCriteriaCount}/{totalCriteriaCount} CUMPLIDOS
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. GRÁFICO PRINCIPAL DE AVANCE: COMPATATIVA POR SPRINT */}
      {/* Tareas Completadas vs Total de Tareas por Sprint       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-5 border-4 border-black brutal-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 bg-black text-yellow-400 border border-black">
                <TrendingUp className="w-4 h-4 stroke-[3]" />
              </span>
              <h3 className="font-black text-sm uppercase tracking-wide text-black">
                AVANCE POR SPRINT: TAREAS COMPLETADAS VS TOTAL DE TAREAS
              </h3>
            </div>
            <p className="text-xs font-bold text-neutral-600 uppercase mt-0.5">
              COMPARACIÓN DE PRODUCTIVIDAD Y CUMPLIMIENTO POR SPRINT {selectedDev ? `(FILTRADO: ${selectedDev.name})` : '(EQUIPO COMPLETO)'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 text-white border border-black">
              <span className="w-2.5 h-2.5 bg-neutral-700 inline-block border border-white" />
              TOTAL TAREAS
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-400 text-black border border-black">
              <span className="w-2.5 h-2.5 bg-emerald-600 inline-block border border-black" />
              COMPLETADAS
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-orange-500 text-black border border-black">
              <span className="w-2.5 h-2.5 bg-orange-700 inline-block border border-black" />
              % AVANCE
            </span>
          </div>
        </div>

        {/* Recharts ComposedChart (Bar + Line) */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={sprintProgressData}
              margin={{ top: 15, right: 30, left: -10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#000000', fontWeight: 'bold' }}
                axisLine={{ stroke: '#000000', strokeWidth: 2 }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#000000', fontWeight: 'bold' }}
                axisLine={{ stroke: '#000000', strokeWidth: 2 }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                tick={{ fontSize: 11, fill: '#ea580c', fontWeight: 'bold' }}
                axisLine={{ stroke: '#ea580c', strokeWidth: 2 }}
              />
              <Tooltip content={<BrutalTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', paddingTop: '10px' }}
              />
              <Bar
                yAxisId="left"
                dataKey="totalTasks"
                name="Total Tareas"
                fill="#1e293b"
                stroke="#000000"
                strokeWidth={1.5}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="completedTasks"
                name="Tareas Completadas"
                fill="#10b981"
                stroke="#000000"
                strokeWidth={1.5}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="completionRate"
                name="% Tasa de Avance"
                stroke="#ea580c"
                strokeWidth={3}
                dot={{ r: 5, fill: '#ea580c', stroke: '#000000', strokeWidth: 2 }}
                activeDot={{ r: 7, stroke: '#000000', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Sprint Quick Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t-2 border-black">
          {sprintProgressData.map((s) => (
            <div key={s.id} className="p-3 bg-neutral-50 border-2 border-black brutal-shadow-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase truncate text-black">{s.name}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 uppercase border border-black ${
                    s.status === 'active'
                      ? 'bg-emerald-400 text-black'
                      : s.status === 'completed'
                      ? 'bg-black text-white'
                      : 'bg-neutral-200 text-black'
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-black">
                  {s.completedTasks} / {s.totalTasks}{' '}
                  <span className="text-xs text-neutral-500 font-bold">tareas</span>
                </span>
                <span className="text-sm font-black text-orange-600 font-mono">{s.completionRate}%</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-neutral-200 border border-black overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${s.completionRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-600">
                <span>{s.completedPoints} / {s.totalPoints} PTS</span>
                <span>{s.pendingTasks} PENDIENTES</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. PRODUCTIVIDAD COMPARATIVA POR DEV & PUNTOS STORY  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload / Productivity by Developer */}
        <div className="bg-white p-5 border-4 border-black brutal-shadow space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                <Users className="w-4 h-4 stroke-[2.5]" />
                PRODUCTIVIDAD POR DESARROLLADOR
              </h3>
              <p className="text-xs font-bold text-neutral-600 uppercase">
                TAREAS COMPLETADAS VS EN PROGRESO POR DEV
              </p>
            </div>
            <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 border border-black font-black">
              {projectDevs.length} INTEGRANTES
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={devsProductivityData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                />
                <Tooltip content={<BrutalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Bar dataKey="completed" name="Completadas" fill="#10b981" stackId="a" stroke="#000000" />
                <Bar dataKey="inProgress" name="En Progreso" fill="#38bdf8" stackId="a" stroke="#000000" />
                <Bar dataKey="pending" name="Pendientes" fill="#94a3b8" stackId="a" stroke="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick filter click helper */}
          <p className="text-[10px] font-bold text-neutral-500 uppercase italic">
            * HAZ CLIC EN EL NOMBRE DE UN DESARROLLADOR ARRIBA PARA FILTRAR TODAS LAS MÉTRICAS
          </p>
        </div>

        {/* Story Points by Sprint (Velocity) */}
        <div className="bg-white p-5 border-4 border-black brutal-shadow space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                <Award className="w-4 h-4 stroke-[2.5]" />
                PUNTOS DE HISTORIA (VELOCIDAD)
              </h3>
              <p className="text-xs font-bold text-neutral-600 uppercase">
                STORY POINTS COMPROMETIDOS VS ENTREGADOS
              </p>
            </div>
            <span className="text-xs bg-orange-500 text-black px-2 py-0.5 border border-black font-black">
              {deliveredPoints} PTS TOTALES
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sprintProgressData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                  allowDecimals={false}
                />
                <Tooltip content={<BrutalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Bar
                  dataKey="totalPoints"
                  name="Points Comprometidos"
                  fill="#64748b"
                  stroke="#000000"
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="completedPoints"
                  name="Points Entregados"
                  fill="#f59e0b"
                  stroke="#000000"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between p-2 bg-yellow-100 border-2 border-black text-xs font-black uppercase">
            <span>VELOCIDAD PROMEDIO:</span>
            <span>
              {sprintProgressData.length > 0
                ? Math.round(
                    sprintProgressData.reduce((a, s) => a + s.completedPoints, 0) /
                      sprintProgressData.length
                  )
                : 0}{' '}
              PTS / SPRINT
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. DISTRIBUCIONES: ESTADOS, TIPOS Y PRIORIDADES      */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pipeline / Column Status Distribution */}
        <div className="bg-white p-4 border-4 border-black brutal-shadow space-y-2">
          <div className="border-b-2 border-black pb-1.5">
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 stroke-[2.5]" />
              ESTADO DEL PIPELINE
            </h4>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              DISTRIBUCIÓN EN COLUMNAS
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={64}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#000000"
                  strokeWidth={2}
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell
                      key={`status-cell-${index}`}
                      fill={STATUS_PIE_COLORS[index % STATUS_PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<BrutalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Type Distribution */}
        <div className="bg-white p-4 border-4 border-black brutal-shadow space-y-2">
          <div className="border-b-2 border-black pb-1.5">
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Target className="w-4 h-4 stroke-[2.5]" />
              TIPO DE INCIDENCIA
            </h4>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              HISTORIAS, TAREAS Y BUGS
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={typeDistributionData}
                margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 9, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                  allowDecimals={false}
                />
                <Tooltip content={<BrutalTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                <Bar dataKey="total" name="Total" fill="#3b82f6" stroke="#000000" />
                <Bar dataKey="completadas" name="Completadas" fill="#10b981" stroke="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-4 border-4 border-black brutal-shadow space-y-2">
          <div className="border-b-2 border-black pb-1.5">
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Flame className="w-4 h-4 stroke-[2.5]" />
              NIVEL DE PRIORIDAD
            </h4>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              URGENCIA Y CARGA CRÍTICA
            </p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityDistributionData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  axisLine={{ stroke: '#000000' }}
                />
                <Tooltip content={<BrutalTooltip />} />
                <Bar dataKey="count" name="Tareas" stroke="#000000" strokeWidth={1.5}>
                  {priorityDistributionData.map((entry, index) => (
                    <Cell key={`prio-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. TABLA TÉCNICA DE TAREAS FILTRADAS POR DEV         */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white border-4 border-black brutal-shadow p-5 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-yellow-400 text-black border border-black">
              <CheckSquare className="w-4 h-4 stroke-[3]" />
            </span>
            <h3 className="font-black text-sm uppercase tracking-wide text-black">
              DETALLE DE TAREAS Y ASIGNACIONES {selectedDev ? `(${selectedDev.name})` : '(PROYECTO)'}
            </h3>
          </div>
          <span className="text-xs bg-black text-white px-2 py-0.5 font-mono font-black">
            {scopedTasks.length} TAREAS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-yellow-400 border-2 border-black text-black">
                <th className="p-2.5 font-black uppercase">CLAVE</th>
                <th className="p-2.5 font-black uppercase">TÍTULO</th>
                <th className="p-2.5 font-black uppercase">TIPO</th>
                <th className="p-2.5 font-black uppercase">PRIORIDAD</th>
                <th className="p-2.5 font-black uppercase">SPRINT</th>
                <th className="p-2.5 font-black uppercase">ESTADO</th>
                <th className="p-2.5 font-black uppercase text-center">PTS</th>
                <th className="p-2.5 font-black uppercase text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black border-2 border-black bg-white">
              {scopedTasks.slice(0, 15).map((task) => {
                const isDone = isTaskDone(task);
                const sprint = projectSprints.find((s) => s.id === task.sprint_id);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-yellow-50 transition-colors font-mono"
                  >
                    <td className="p-2.5 font-black whitespace-nowrap">
                      <span className="bg-black text-yellow-400 px-1.5 py-0.5 border border-black text-[11px]">
                        {task.task_key || `#${task.id}`}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-black max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="p-2.5 uppercase font-bold text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 border border-black ${
                          task.task_type === 'bug'
                            ? 'bg-red-500 text-white'
                            : task.task_type === 'story'
                            ? 'bg-emerald-400 text-black'
                            : 'bg-blue-300 text-black'
                        }`}
                      >
                        {task.task_type}
                      </span>
                    </td>
                    <td className="p-2.5 uppercase font-bold text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 border border-black ${
                          task.priority === 'highest' || task.priority === 'high'
                            ? 'bg-orange-400 text-black'
                            : 'bg-neutral-100 text-black'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-2.5 uppercase font-bold text-neutral-700 whitespace-nowrap">
                      {sprint ? sprint.name : 'Backlog'}
                    </td>
                    <td className="p-2.5 font-black whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 border border-black text-[11px] uppercase ${
                          isDone
                            ? 'bg-emerald-400 text-black'
                            : 'bg-yellow-200 text-black'
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-black text-center whitespace-nowrap">
                      <span className="bg-orange-500 text-black px-1.5 py-0.5 border border-black text-[11px]">
                        {task.story_points ?? 0}
                      </span>
                    </td>
                    <td className="p-2.5 text-right whitespace-nowrap">
                      {onOpenTaskModal && (
                        <button
                          onClick={() => onOpenTaskModal(task.id)}
                          className="px-2 py-1 bg-white hover:bg-black hover:text-white text-black border border-black text-[10px] font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>VER</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {scopedTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-neutral-500 font-bold uppercase">
                    NO SE ENCONTRARON TAREAS ASIGNADAS AL DESARROLLADOR EN ESTE PROYECTO
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {scopedTasks.length > 15 && (
          <p className="text-[11px] font-bold text-neutral-500 uppercase text-right">
            MOSTRANDO 15 DE {scopedTasks.length} TAREAS TOTALES
          </p>
        )}
      </div>
    </div>
  );
};
