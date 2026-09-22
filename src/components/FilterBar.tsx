import React from 'react';
import { useJira } from '../context/JiraContext';
import { TaskType, Priority } from '../types/jira';
import { Search, Filter, X, Tag, User as UserIcon } from 'lucide-react';

interface FilterBarProps {
  search: string;
  setSearch: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;
  priorityFilter: string;
  setPriorityFilter: (p: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (a: string) => void;
  labelFilter: string;
  setLabelFilter: (l: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  labelFilter,
  setLabelFilter,
}) => {
  const { currentProject, members, users, tasks } = useJira();

  if (!currentProject) return null;

  // Project members
  const projectMemberIds = new Set(
    members.filter((m) => m.project_id === currentProject.id).map((m) => m.user_id)
  );
  const projectUsers = users.filter((u) => projectMemberIds.has(u.id));

  // Collect all unique labels in this project
  const projectTasks = tasks.filter((t) => t.project_id === currentProject.id);
  const uniqueLabels: string[] = Array.from(new Set(projectTasks.flatMap((t) => t.labels || [])));

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== '' ||
    priorityFilter !== '' ||
    assigneeFilter !== '' ||
    labelFilter !== '';

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setLabelFilter('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-mono">
      {/* Search Input */}
      <div className="relative min-w-[220px] flex-1 sm:flex-initial">
        <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="BUSCAR [CLAVE / TEXTO]..."
          className="w-full pl-9 pr-8 py-1.5 bg-white border-2 border-black text-xs font-bold uppercase text-black placeholder:text-neutral-400 focus:bg-yellow-100 outline-none brutal-shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-orange-600 font-black cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>

      {/* Type Filter */}
      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value)}
        className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase outline-none brutal-shadow-sm cursor-pointer ${
          typeFilter ? 'bg-orange-500 text-black' : 'bg-white text-black'
        }`}
      >
        <option value="">TIPO: TODOS</option>
        <option value="story">📘 STORY</option>
        <option value="task">☑️ TASK</option>
        <option value="bug">🐞 BUG</option>
        <option value="epic">⚡ EPIC</option>
        <option value="sub-task">🔗 SUB-TASK</option>
      </select>

      {/* Priority Filter */}
      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase outline-none brutal-shadow-sm cursor-pointer ${
          priorityFilter ? 'bg-yellow-400 text-black' : 'bg-white text-black'
        }`}
      >
        <option value="">PRIORIDAD: TODAS</option>
        <option value="highest">🔴 HIGHEST</option>
        <option value="high">🟠 HIGH</option>
        <option value="medium">🟡 MEDIUM</option>
        <option value="low">🟢 LOW</option>
        <option value="lowest">🔵 LOWEST</option>
      </select>

      {/* Assignee Filter */}
      <select
        value={assigneeFilter}
        onChange={(e) => setAssigneeFilter(e.target.value)}
        className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase outline-none brutal-shadow-sm cursor-pointer ${
          assigneeFilter ? 'bg-emerald-400 text-black' : 'bg-white text-black'
        }`}
      >
        <option value="">ASIGNADO: TODOS</option>
        <option value="unassigned">SIN ASIGNAR</option>
        {projectUsers.map((u) => (
          <option key={u.id} value={String(u.id)}>
            {u.name.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Label Filter */}
      {uniqueLabels.length > 0 && (
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className={`px-3 py-1.5 border-2 border-black text-xs font-bold uppercase outline-none brutal-shadow-sm cursor-pointer ${
            labelFilter ? 'bg-cyan-400 text-black' : 'bg-white text-black'
          }`}
        >
          <option value="">TAG: TODOS</option>
          {uniqueLabels.map((lbl) => (
            <option key={lbl} value={lbl}>
              🏷️ {lbl.toUpperCase()}
            </option>
          ))}
        </select>
      )}

      {/* Clear Filters button */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white border-2 border-black brutal-shadow-sm brutal-btn text-xs font-black uppercase flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5 stroke-[3]" />
          <span>LIMPIAR FILTROS</span>
        </button>
      )}
    </div>
  );
};
