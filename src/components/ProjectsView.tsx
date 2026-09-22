import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { Project, ROLE_LABELS } from '../types/jira';
import {
  FolderKanban,
  Plus,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  Kanban,
  Users,
  Search,
  ShieldCheck,
  GraduationCap,
  FileSpreadsheet,
  AlertCircle,
  UserCog,
  LayoutDashboard,
  LayoutGrid,
} from 'lucide-react';
import { CreateProjectModal, EditProjectModal } from './ProjectModals';
import { CreateMemberModal } from './MemberModals';
import { CsvImportModal } from './CsvImportModal';
import { ManageUsersModal } from './ManageUsersModal';
import { ProjectDashboardView } from './ProjectDashboardView';

interface ProjectsViewProps {
  onOpenBoard: (projectId: number) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onOpenBoard }) => {
  const {
    projects,
    accessibleProjects,
    members,
    tasks,
    users,
    currentUser,
    currentRole,
    selectProject,
    deleteProject,
  } = useJira();

  const isPM = currentUser?.is_admin || currentUser?.role === 'admin';
  const isPO = currentUser?.role === 'po';
  const canManageProjects = isPM || isPO;

  // Default to 'dashboard' view for PM and PO, or 'grid' for others
  const [viewMode, setViewMode] = useState<'dashboard' | 'grid'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const filteredProjects = accessibleProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (proj: Project) => {
    if (confirm(`¿Estás seguro de eliminar el proyecto '${proj.name}' (${proj.key})? Esta acción no se puede deshacer.`)) {
      deleteProject(proj.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-black">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-black tracking-wider uppercase flex items-center gap-2.5">
              <FolderKanban className="w-8 h-8 text-black stroke-[2.5]" />
              <span>PROYECTOS_ACTIVOS</span>
            </h1>
            {isPM && (
              <span className="bg-yellow-400 text-black border-2 border-black text-xs font-black px-2.5 py-0.5 brutal-shadow-sm flex items-center gap-1 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[3]" />
                PROJECT MANAGER
              </span>
            )}
            {isPO && (
              <span className="bg-orange-400 text-black border-2 border-black text-xs font-black px-2.5 py-0.5 brutal-shadow-sm flex items-center gap-1 uppercase">
                <GraduationCap className="w-3.5 h-3.5 stroke-[3]" />
                PRODUCT OWNER
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-neutral-600 mt-1 uppercase">
            {isPM
              ? 'BOARD DE SIMULACION DE PROYECTOS DE DESARROLLO Y APLICACION DE METODOLGIAS AGILES.'
              : isPO
              ? 'BOARD DE SIMULACION DE PROYECTOS DE DESARROLLO Y APLICACION DE METODOLGIAS AGILES.'
              : `ROL OPERATIVO: ${ROLE_LABELS[currentUser?.role || 'frontend'].toUpperCase()}.`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* User Management Button - STRICTLY FOR PROJECT MANAGER (ADMIN) */}
          {isPM && (
            <button
              onClick={() => setIsManageUsersOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
              title="Administrar, editar nombres, roles y contraseñas de usuarios"
            >
              <UserCog className="w-4 h-4 stroke-[2.5]" />
              <span>USUARIOS</span>
            </button>
          )}

          {/* CSV Import Button - STRICTLY FOR PROJECT MANAGER */}
          {isPM && (
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 border-2 border-black text-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
              title="Importar grupo masivo de usuarios desde archivo CSV con asignación automática a grupos"
            >
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
              <span>IMPORTAR CSV</span>
            </button>
          )}

          {canManageProjects && (
            <>
              <button
                onClick={() => setIsCreateMemberOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 border-2 border-black bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
              >
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>+ USUARIO</span>
              </button>

              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 border-2 border-black text-black text-xs font-black uppercase brutal-shadow brutal-btn cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ NUEVO PROYECTO</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Mode Switcher and Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Toggle between Dashboard and Grid */}
        <div className="inline-flex bg-white p-1 border-2 border-black brutal-shadow-sm text-xs font-black self-start">
          <button
            type="button"
            onClick={() => setViewMode('dashboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 uppercase transition-all cursor-pointer ${
              viewMode === 'dashboard'
                ? 'bg-yellow-400 text-black border border-black font-black'
                : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>MÉTRICAS & CONTROL</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 uppercase transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-yellow-400 text-black border border-black font-black'
                : 'text-neutral-700 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>CUADRÍCULA</span>
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="BUSCAR PROYECTO..."
              className="w-full pl-9 pr-3 py-1.5 border-2 border-black bg-white text-xs font-bold uppercase text-black placeholder:text-neutral-400 focus:bg-yellow-100 outline-none brutal-shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Main Content: Dashboard or Grid */}
      {viewMode === 'dashboard' ? (
        <ProjectDashboardView
          onOpenBoard={onOpenBoard}
          onEditProject={(p) => setEditingProject(p)}
          onDeleteProject={handleDelete}
          canManageProjects={canManageProjects}
        />
      ) : (
        /* Traditional Grid View */
        filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-2xs p-8">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {searchTerm ? 'No se encontraron proyectos' : 'Sin proyectos asignados'}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              {searchTerm
                ? 'Intenta con otro término de búsqueda.'
                : isPM || isPO
                ? 'Crea un nuevo proyecto o importa usuarios para comenzar la gestión de los equipos.'
                : `Hola ${currentUser?.name}, actualmente estás registrado como ${
                    ROLE_LABELS[currentUser?.role || 'frontend']
                  }. Aún no has sido asignado a ningún proyecto.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const projectMembers = members.filter((m) => m.project_id === project.id);
              const doneTasks = projectTasks.filter((t) => t.status === 'Done');
              const progress = projectTasks.length ? Math.round((doneTasks.length / projectTasks.length) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="bg-white border-4 border-black brutal-shadow hover:brutal-shadow-lg transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5">
                    {/* Top Bar */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="font-mono text-xs font-black bg-yellow-400 text-black border-2 border-black px-2.5 py-0.5 brutal-shadow-sm uppercase">
                        {project.key}
                      </span>

                      {/* Options dropdown */}
                      {canManageProjects && (
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                            className="p-1 border border-black hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4 text-black" />
                          </button>

                          {activeMenuId === project.id && (
                            <div
                              className="absolute right-0 mt-1 w-36 bg-white border-2 border-black brutal-shadow py-1 z-30 text-xs font-mono"
                              onMouseLeave={() => setActiveMenuId(null)}
                            >
                              <button
                                onClick={() => {
                                  setEditingProject(project);
                                  setActiveMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-black hover:bg-yellow-200 flex items-center gap-2 font-bold uppercase cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-black" />
                                Editar
                              </button>
                              {canManageProjects && (
                                <button
                                  onClick={() => {
                                    handleDelete(project);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-rose-700 hover:bg-rose-100 flex items-center gap-2 font-bold uppercase cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="font-black text-black text-lg group-hover:text-orange-600 transition-colors uppercase leading-snug">
                      {project.name}
                    </h3>
                    <p className="text-neutral-700 text-xs mt-1.5 line-clamp-2 uppercase font-medium">
                      {project.description || 'Sin descripción detallada.'}
                    </p>

                    {/* Metrics snippet */}
                    <div className="mt-4 pt-3 border-t-2 border-black flex items-center justify-between text-xs text-black font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <Kanban className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{projectTasks.length} tareas</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{projectMembers.length} miembros</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] font-bold text-black uppercase mb-1">
                        <span>Progreso ({doneTasks.length}/{projectTasks.length})</span>
                        <span className="font-black">{progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 h-3 border-2 border-black overflow-hidden">
                        <div
                          className="bg-orange-500 h-full transition-all duration-300 border-r-2 border-black"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="px-5 py-3 bg-neutral-100 border-t-2 border-black flex items-center justify-between">
                    {/* Member avatars */}
                    <div className="flex -space-x-1 overflow-hidden">
                      {projectMembers.slice(0, 4).map((m) => {
                        const u = users.find((usr) => usr.id === m.user_id);
                        return (
                          <div
                            key={m.id}
                            className="inline-block h-6 w-6 border border-black text-[10px] font-black text-black flex items-center justify-center"
                            style={{ backgroundColor: u?.avatar_color || '#fbbf24' }}
                            title={`${u?.name} (${ROLE_LABELS[m.role]})`}
                          >
                            {u?.name.charAt(0)}
                          </div>
                        );
                      })}
                      {projectMembers.length > 4 && (
                        <div className="inline-block h-6 w-6 bg-black border border-black text-[10px] font-bold text-white flex items-center justify-center">
                          +{projectMembers.length - 4}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        selectProject(project.id);
                        onOpenBoard(project.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-black text-xs font-black uppercase brutal-shadow-sm brutal-btn cursor-pointer"
                    >
                      <Kanban className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>ABRIR TABLERO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modals */}
      <CreateProjectModal isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} />
      <EditProjectModal
        project={editingProject}
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
      />
      <CreateMemberModal isOpen={isCreateMemberOpen} onClose={() => setIsCreateMemberOpen(false)} />
      <CsvImportModal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} />
      <ManageUsersModal isOpen={isManageUsersOpen} onClose={() => setIsManageUsersOpen(false)} />
    </div>
  );
};
