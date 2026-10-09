import React, { useState, useMemo, useCallback } from 'react';
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
  Bug,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  ListTodo,
  Activity,
  Zap,
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

  // Selected developer filter: 'all' | 'unassigned' | userId
  const [selectedDevId, setSelectedDevId] = useState<number | 'all' | 'unassigned'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'devs' | 'frontend' | 'backend'>('all');
  const [devSearchQuery, setDevSearchQuery] = useState('');

  if (!currentProject) return null;

  // ----------------------------------------------------
  // Robust Data Filtering by Current Project
  // Normalizes string/number IDs to prevent type mismatches
  // ----------------------------------------------------
  const currentProjId = Number(currentProject.id);

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => Number(t.project_id) === currentProjId);
  }, [tasks, currentProjId]);

  const projectColumns = useMemo(() => {
    return columns
      .filter((c) => Number(c.project_id) === currentProjId)
      .sort((a, b) => a.position - b.position);
  }, [columns, currentProjId]);

  const projectSprints = useMemo(() => {
    return sprints.filter((s) => Number(s.project_id) === currentProjId);
  }, [sprints, currentProjId]);

  const projectMembers = useMemo(() => {
    return members.filter((m) => Number(m.project_id) === currentProjId);
  }, [members, currentProjId]);

  // ----------------------------------------------------
  // Task State Helpers (Bulletproof status & column matching)
  // ----------------------------------------------------
  const isTaskDone = useCallback(
    (t: Task): boolean => {
      if (!t) return false;

      // 1. Check if column_id matches a column marked as done or named like done
      if (t.column_id !== null && t.column_id !== undefined) {
        const colIdNum = Number(t.column_id);
        const col = projectColumns.find((c) => Number(c.id) === colIdNum);
        if (col) {
          if (col.is_done_column) return true;
          const colName = (col.name || '').toLowerCase();
          if (
            colName.includes('done') ||
            colName.includes('completad') ||
            colName.includes('terminad') ||
            colName.includes('finaliz') ||
            colName.includes('listo') ||
            colName.includes('cerrad')
          ) {
            return true;
          }
        }
      }

      // 2. Check task status string
      const s = String(t.status || '').toLowerCase().trim();
      return (
        s === 'done' ||
        s === 'completado' ||
        s === 'completada' ||
        s === 'terminado' ||
        s === 'terminada' ||
        s === 'finalizado' ||
        s === 'finalizada' ||
        s === 'listo' ||
        s === 'cerrado' ||
        s === 'resolved' ||
        s === 'resuelto'
      );
    },
    [projectColumns]
  );

  const isTaskInProgress = useCallback(
    (t: Task): boolean => {
      if (!t || isTaskDone(t)) return false;

      // Check column
      if (t.column_id !== null && t.column_id !== undefined) {
        const colIdNum = Number(t.column_id);
        const col = projectColumns.find((c) => Number(c.id) === colIdNum);
        if (col) {
          const colName = (col.name || '').toLowerCase();
          if (
            colName.includes('progress') ||
            colName.includes('progreso') ||
            colName.includes('curso') ||
            colName.includes('review') ||
            colName.includes('revis') ||
            colName.includes('qa') ||
            colName.includes('test') ||
            colName.includes('desarrollo') ||
            colName.includes('dev')
          ) {
            return true;
          }
        }
      }

      // Check status string
      const s = String(t.status || '').toLowerCase().trim();
      return (
        s.includes('progress') ||
        s.includes('progreso') ||
        s.includes('curso') ||
        s.includes('review') ||
        s.includes('revis') ||
        s.includes('qa') ||
        s.includes('test') ||
        s.includes('desarrollo')
      );
    },
    [projectColumns, isTaskDone]
  );

  const isTaskPending = useCallback(
    (t: Task): boolean => {
      return !isTaskDone(t) && !isTaskInProgress(t);
    },
    [isTaskDone, isTaskInProgress]
  );

  // Helper to extract story points safely as a number
  const getTaskPoints = (t: Task): number => {
    if (t.story_points === null || t.story_points === undefined) return 0;
    const n = Number(t.story_points);
    return isNaN(n) ? 0 : n;
  };

  // Helper to get normalized assignee IDs
  const getAssigneeIds = useCallback((t: Task): number[] => {
    if (!t) return [];
    const ids: number[] = [];
    if (Array.isArray(t.assignee_ids) && t.assignee_ids.length > 0) {
      t.assignee_ids.forEach((id) => {
        const n = Number(id);
        if (!isNaN(n) && n > 0 && !ids.includes(n)) ids.push(n);
      });
    }
    if (t.assignee_id !== null && t.assignee_id !== undefined) {
      const n = Number(t.assignee_id);
      if (!isNaN(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
    if (t.assignee && t.assignee.id) {
      const n = Number(t.assignee.id);
      if (!isNaN(n) && n > 0 && !ids.includes(n)) ids.push(n);
    }
    return ids;
  }, []);

  // ----------------------------------------------------
  // Developers in Project
  // ----------------------------------------------------
  const projectDevs: User[] = useMemo(() => {
    const userMap = new Map<number, User>();

    // 1. Members registered to project
    projectMembers.forEach((m) => {
      const u = users.find((usr) => Number(usr.id) === Number(m.user_id));
      if (u) {
        userMap.set(Number(u.id), { ...u, role: m.role || u.role });
      }
    });

    // 2. Users assigned to tasks in this project
    projectTasks.forEach((t) => {
      const aIds = getAssigneeIds(t);
      aIds.forEach((uid) => {
        if (!userMap.has(uid)) {
          const u = users.find((usr) => Number(usr.id) === uid);
          if (u) userMap.set(Number(u.id), u);
        }
      });
    });

    // Fallback: If no members or assigned tasks, show system developers
    if (userMap.size === 0) {
      users.forEach((u) => userMap.set(Number(u.id), u));
    }

    return Array.from(userMap.values());
  }, [projectMembers, projectTasks, users, getAssigneeIds]);

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
    if (typeof selectedDevId !== 'number') return null;
    return projectDevs.find((d) => Number(d.id) === selectedDevId) || null;
  }, [selectedDevId, projectDevs]);

  // Tasks in current scope (either whole project or filtered by developer)
  const scopedTasks = useMemo(() => {
    if (selectedDevId === 'all') {
      return projectTasks;
    }
    if (selectedDevId === 'unassigned') {
      return projectTasks.filter((t) => getAssigneeIds(t).length === 0);
    }
    const targetDevId = Number(selectedDevId);
    return projectTasks.filter((t) => getAssigneeIds(t).includes(targetDevId));
  }, [projectTasks, selectedDevId, getAssigneeIds]);

  // ----------------------------------------------------
  // 1. RECHARTS: AVANCE POR SPRINT
  // Tareas Completadas vs Total de Tareas por Sprint
  // Guaranteed to plot all tasks without dropping Backlog or active sprints
  // ----------------------------------------------------
  const sprintProgressData = useMemo(() => {
    const list: Array<{
      id: number | string;
      name: string;
      status: string;
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
      completionRate: number;
      totalPoints: number;
      completedPoints: number;
      velocityRate: number;
    }> = [];

    // 1. Process all actual project sprints
    projectSprints.forEach((sprint) => {
      const sTasks = scopedTasks.filter(
        (t) => t.sprint_id !== null && Number(t.sprint_id) === Number(sprint.id)
      );
      const totalTasks = sTasks.length;
      const completedTasks = sTasks.filter(isTaskDone).length;
      const inProgressTasks = sTasks.filter(isTaskInProgress).length;
      const pendingTasks = sTasks.filter(isTaskPending).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const totalPoints = sTasks.reduce((acc, t) => acc + getTaskPoints(t), 0);
      const completedPoints = sTasks
        .filter(isTaskDone)
        .reduce((acc, t) => acc + getTaskPoints(t), 0);
      const velocityRate = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

      list.push({
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        totalPoints,
        completedPoints,
        velocityRate,
      });
    });

    // 2. Check for tasks not assigned to any sprint (Backlog tasks)
    const unassignedSprintTasks = scopedTasks.filter((t) => {
      if (t.sprint_id === null || t.sprint_id === undefined || Number(t.sprint_id) === 0) return true;
      return !projectSprints.some((s) => Number(s.id) === Number(t.sprint_id));
    });

    if (unassignedSprintTasks.length > 0 || list.length === 0) {
      const totalTasks = unassignedSprintTasks.length;
      const completedTasks = unassignedSprintTasks.filter(isTaskDone).length;
      const inProgressTasks = unassignedSprintTasks.filter(isTaskInProgress).length;
      const pendingTasks = unassignedSprintTasks.filter(isTaskPending).length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const totalPoints = unassignedSprintTasks.reduce((acc, t) => acc + getTaskPoints(t), 0);
      const completedPoints = unassignedSprintTasks
        .filter(isTaskDone)
        .reduce((acc, t) => acc + getTaskPoints(t), 0);

      list.push({
        id: 'backlog',
        name: list.length === 0 ? 'Tareas del Proyecto' : 'Backlog (Sin Sprint)',
        status: 'backlog',
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        totalPoints,
        completedPoints,
        velocityRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
      });
    }

    return list;
  }, [projectSprints, scopedTasks, isTaskDone, isTaskInProgress, isTaskPending]);

  // ----------------------------------------------------
  // 2. RECHARTS: PRODUCTIVIDAD COMPARATIVA POR DEV
  // ----------------------------------------------------
  const devsProductivityData = useMemo(() => {
    return projectDevs.map((dev) => {
      const devTasks = projectTasks.filter((t) => getAssigneeIds(t).includes(Number(dev.id)));
      const total = devTasks.length;
      const completed = devTasks.filter(isTaskDone).length;
      const inProgress = devTasks.filter(isTaskInProgress).length;
      const pending = devTasks.filter(isTaskPending).length;
      const pointsDelivered = devTasks
        .filter(isTaskDone)
        .reduce((acc, t) => acc + getTaskPoints(t), 0);
      const pointsTotal = devTasks.reduce((acc, t) => acc + getTaskPoints(t), 0);
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
  }, [projectDevs, projectTasks, isTaskDone, isTaskInProgress, isTaskPending, getAssigneeIds]);

  // ----------------------------------------------------
  // 3. RECHARTS: DISTRIBUCIÓN POR ESTADO (PIPELINE)
  // ----------------------------------------------------
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};

    projectColumns.forEach((col) => {
      counts[col.name] = 0;
    });

    scopedTasks.forEach((t) => {
      let colName = '';
      if (t.column_id !== null && t.column_id !== undefined) {
        const found = projectColumns.find((c) => Number(c.id) === Number(t.column_id));
        if (found) colName = found.name;
      }
      if (!colName) {
        colName = t.status || 'To Do';
      }
      counts[colName] = (counts[colName] || 0) + 1;
    });

    const entries = Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    return entries.length > 0 ? entries : [{ name: 'Sin tareas', value: 1 }];
  }, [scopedTasks, projectColumns]);

  const STATUS_PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4'];

  // ----------------------------------------------------
  // 4. RECHARTS: DISTRIBUCIÓN POR TIPO DE TAREA
  // ----------------------------------------------------
  const typeDistributionData = useMemo(() => {
    const counts = {
      story: { total: 0, completed: 0 },
      task: { total: 0, completed: 0 },
      bug: { total: 0, completed: 0 },
      epic: { total: 0, completed: 0 },
      'sub-task': { total: 0, completed: 0 },
    };

    scopedTasks.forEach((t) => {
      const rawType = String(t.task_type || (t as any).type || 'task').toLowerCase().trim();
      let key: keyof typeof counts = 'task';

      if (rawType.includes('stor') || rawType.includes('hist') || rawType === 'hu') {
        key = 'story';
      } else if (rawType.includes('bug') || rawType.includes('error') || rawType.includes('defec')) {
        key = 'bug';
      } else if (rawType.includes('epic') || rawType.includes('épic')) {
        key = 'epic';
      } else if (rawType.includes('sub')) {
        key = 'sub-task';
      } else {
        key = 'task';
      }

      counts[key].total += 1;
      if (isTaskDone(t)) {
        counts[key].completed += 1;
      }
    });

    return [
      { type: 'Historias (HU)', total: counts.story.total, completadas: counts.story.completed },
      { type: 'Tareas Dev', total: counts.task.total, completadas: counts.task.completed },
      { type: 'Bugs / QA', total: counts.bug.total, completadas: counts.bug.completed },
      { type: 'Epics', total: counts.epic.total, completadas: counts.epic.completed },
      { type: 'Sub-Tareas', total: counts['sub-task'].total, completadas: counts['sub-task'].completed },
    ];
  }, [scopedTasks, isTaskDone]);

  // ----------------------------------------------------
  // 5. RECHARTS: DISTRIBUCIÓN POR PRIORIDAD
  // ----------------------------------------------------
  const priorityDistributionData = useMemo(() => {
    const priorityCounts: Record<string, number> = {
      highest: 0,
      high: 0,
      medium: 0,
      low: 0,
      lowest: 0,
    };

    scopedTasks.forEach((t) => {
      const rawP = String(t.priority || 'medium').toLowerCase().trim();
      let key = 'medium';
      if (rawP === 'highest' || rawP.includes('muy alta') || rawP.includes('urgente') || rawP.includes('crit')) {
        key = 'highest';
      } else if (rawP === 'high' || rawP.includes('alta')) {
        key = 'high';
      } else if (rawP === 'low' || (rawP.includes('baja') && !rawP.includes('muy'))) {
        key = 'low';
      } else if (rawP === 'lowest' || rawP.includes('muy baja')) {
        key = 'lowest';
      } else {
        key = 'medium';
      }
      priorityCounts[key] = (priorityCounts[key] || 0) + 1;
    });

    return [
      { name: 'Muy Alta', count: priorityCounts.highest, fill: '#dc2626' },
      { name: 'Alta', count: priorityCounts.high, fill: '#f97316' },
      { name: 'Media', count: priorityCounts.medium, fill: '#eab308' },
      { name: 'Baja', count: priorityCounts.low, fill: '#10b981' },
      { name: 'Muy Baja', count: priorityCounts.lowest, fill: '#64748b' },
    ];
  }, [scopedTasks]);

  // ----------------------------------------------------
  // 6. TOTALES & KPIS DEL ALCANCE ACTUAL
  // ----------------------------------------------------
  const totalTasksCount = scopedTasks.length;
  const completedTasksCount = scopedTasks.filter(isTaskDone).length;
  const inProgressTasksCount = scopedTasks.filter(isTaskInProgress).length;
  const pendingTasksCount = scopedTasks.filter(isTaskPending).length;

  const globalCompletionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const totalPoints = scopedTasks.reduce((acc, t) => acc + getTaskPoints(t), 0);
  const deliveredPoints = scopedTasks
    .filter(isTaskDone)
    .reduce((acc, t) => acc + getTaskPoints(t), 0);

  const pointsDeliveryRate =
    totalPoints > 0 ? Math.round((deliveredPoints / totalPoints) * 100) : 0;

  // Bugs count
  const isBug = (t: Task) => {
    const ty = String(t.task_type || (t as any).type || '').toLowerCase();
    return ty === 'bug' || ty.includes('error') || ty.includes('defec');
  };
  const bugsCount = scopedTasks.filter(isBug).length;
  const bugsResolved = scopedTasks.filter((t) => isBug(t) && isTaskDone(t)).length;
  const bugsResolutionRate = bugsCount > 0 ? Math.round((bugsResolved / bugsCount) * 100) : 100;

  // Unassigned tasks in current project
  const unassignedTasksCount = projectTasks.filter((t) => getAssigneeIds(t).length === 0).length;

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
                getAssigneeIds(t).includes(Number(dev.id))
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

            {/* Unassigned Filter Option */}
            {unassignedTasksCount > 0 && (
              <button
                onClick={() => setSelectedDevId('unassigned')}
                className={`px-3 py-2 border-2 text-xs font-black uppercase whitespace-nowrap flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  selectedDevId === 'unassigned'
                    ? 'bg-neutral-800 text-yellow-300 border-black brutal-shadow brutal-btn'
                    : 'bg-white text-neutral-700 border-black hover:bg-neutral-100 brutal-shadow-sm'
                }`}
              >
                <span className="text-xs">⚠️</span>
                <span>SIN ASIGNAR ({unassignedTasksCount})</span>
              </button>
            )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm uppercase text-black">{selectedDev.name}</span>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                    {selectedDev.role ? ROLE_LABELS[selectedDev.role] || selectedDev.role : 'DEVELOPER'}
                  </span>
                  <span className="text-xs text-neutral-600 font-mono">@{selectedDev.username}</span>
                </div>
                <p className="text-xs font-bold text-neutral-700 mt-0.5 uppercase">
                  MÉTRICAS INDIVIDUALES: {completedTasksCount} de {totalTasksCount} tareas completadas ({globalCompletionRate}% avance) · {deliveredPoints} de {totalPoints} story points entregados
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedDevId('all')}
              className="px-3 py-1.5 bg-white border-2 border-black text-black hover:bg-neutral-200 text-xs font-black uppercase brutal-shadow-sm brutal-btn self-start md:self-auto cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
              <span>VER TODO EL EQUIPO</span>
            </button>
          </div>
        ) : selectedDevId === 'unassigned' ? (
          <div className="p-2.5 bg-amber-100 border-2 border-black text-xs font-bold text-black uppercase flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              VIENDO {scopedTasks.length} TAREAS PENDIENTES DE ASIGNACIÓN EN EL PROYECTO
            </span>
            <button
              onClick={() => setSelectedDevId('all')}
              className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase hover:bg-neutral-800"
            >
              VER TODO
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-neutral-100 border-2 border-dashed border-neutral-400 text-xs font-bold text-neutral-700 uppercase flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4 text-neutral-800" />
              VIENDO MÉTRICAS CONSOLIDADAS DE TODO EL EQUIPO EN EL PROYECTO
            </span>
            <span className="text-[10px] bg-black text-white px-2 py-0.5 font-mono font-black">
              {scopedTasks.length} TAREAS EN ALCANCE
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

        {/* Pending / To Do */}
        <div className="bg-white p-3.5 border-4 border-black brutal-shadow">
          <div className="flex items-center justify-between text-black mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600">
              PENDIENTES
            </span>
            <div className="p-1 border border-black bg-neutral-200">
              <ListTodo className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-black text-black tracking-tight">{pendingTasksCount}</div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase mt-0.5 truncate">
            POR INICIAR / TO DO
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
            DE {totalPoints} PTS ({pointsDeliveryRate}%)
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
            {bugsResolutionRate}% RESUELTOS
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. GRÁFICO PRINCIPAL DE AVANCE: COMPARATIVA POR SPRINT */}
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

          <div className="flex items-center gap-2 text-xs font-black flex-wrap">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900 text-white border border-black">
              <span className="w-2.5 h-2.5 bg-neutral-600 inline-block border border-white" />
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
        <div className="h-72 w-full min-h-[280px]">
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
                minPointSize={4}
              />
              <Bar
                yAxisId="left"
                dataKey="completedTasks"
                name="Tareas Completadas"
                fill="#10b981"
                stroke="#000000"
                strokeWidth={1.5}
                radius={[2, 2, 0, 0]}
                minPointSize={4}
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
                <span className="text-xs font-black uppercase truncate text-black" title={s.name}>
                  {s.name}
                </span>
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

          <div className="h-64 w-full min-h-[250px]">
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
                <Bar dataKey="completed" name="Completadas" fill="#10b981" stackId="a" stroke="#000000" minPointSize={2} />
                <Bar dataKey="inProgress" name="En Progreso" fill="#38bdf8" stackId="a" stroke="#000000" minPointSize={2} />
                <Bar dataKey="pending" name="Pendientes" fill="#94a3b8" stackId="a" stroke="#000000" minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[10px] font-bold text-neutral-500 uppercase italic">
            * HAZ CLIC EN EL BOTÓN DE UN DESARROLLADOR ARRIBA PARA FILTRAR TODAS LAS MÉTRICAS
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
              {deliveredPoints} PTS ENTREGADOS
            </span>
          </div>

          <div className="h-64 w-full min-h-[250px]">
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
                  minPointSize={3}
                />
                <Bar
                  dataKey="completedPoints"
                  name="Points Entregados"
                  fill="#f59e0b"
                  stroke="#000000"
                  radius={[2, 2, 0, 0]}
                  minPointSize={3}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between p-2 bg-yellow-100 border-2 border-black text-xs font-black uppercase">
            <span>VELOCIDAD MEDIA:</span>
            <span>
              {sprintProgressData.length > 0
                ? Math.round(
                    sprintProgressData.reduce((a, s) => a + s.completedPoints, 0) /
                      sprintProgressData.length
                  )
                : 0}{' '}
              PTS / CICLO
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

          <div className="h-48 w-full min-h-[190px] flex items-center justify-center">
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

          <div className="h-48 w-full min-h-[190px]">
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
                <Bar dataKey="total" name="Total" fill="#3b82f6" stroke="#000000" minPointSize={3} />
                <Bar dataKey="completadas" name="Completadas" fill="#10b981" stroke="#000000" minPointSize={3} />
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

          <div className="h-48 w-full min-h-[190px]">
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
                <Bar dataKey="count" name="Tareas" stroke="#000000" strokeWidth={1.5} minPointSize={3}>
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
              {scopedTasks.slice(0, 20).map((task) => {
                const isDone = isTaskDone(task);
                const isProg = isTaskInProgress(task);
                const sprint = projectSprints.find((s) => Number(s.id) === Number(task.sprint_id));

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
                          isBug(task)
                            ? 'bg-red-500 text-white'
                            : (task.task_type || '').toLowerCase().includes('stor')
                            ? 'bg-emerald-400 text-black'
                            : 'bg-blue-300 text-black'
                        }`}
                      >
                        {task.task_type || 'task'}
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
                        {task.priority || 'medium'}
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
                            : isProg
                            ? 'bg-cyan-200 text-black'
                            : 'bg-yellow-200 text-black'
                        }`}
                      >
                        {task.status || (isDone ? 'Done' : 'To Do')}
                      </span>
                    </td>
                    <td className="p-2.5 font-black text-center whitespace-nowrap">
                      <span className="bg-orange-500 text-black px-1.5 py-0.5 border border-black text-[11px]">
                        {getTaskPoints(task)}
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
                    NO SE ENCONTRARON TAREAS EN ESTE ALCANCE
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {scopedTasks.length > 20 && (
          <p className="text-[11px] font-bold text-neutral-500 uppercase text-right">
            MOSTRANDO 20 DE {scopedTasks.length} TAREAS TOTALES
          </p>
        )}
      </div>
    </div>
  );
};
