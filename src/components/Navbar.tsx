import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { ROLE_LABELS } from '../types/jira';
import {
  Kanban,
  FolderKanban,
  UserCheck,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCog,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { ManageUsersModal } from './ManageUsersModal';

interface NavbarProps {
  currentView: 'projects' | 'board';
  setCurrentView: (view: 'projects' | 'board') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView }) => {
  const {
    currentUser,
    currentProject,
    projects,
    users,
    currentRole,
    isCloudConnected,
    isSyncing,
    selectProject,
    switchUser,
    logout,
    resetToDemoData,
  } = useJira();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showManageUsersModal, setShowManageUsersModal] = useState(false);

  return (
    <header className="bg-black border-b-4 border-black text-white sticky top-0 z-40 brutal-shadow font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Project Selector */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentView('projects')}
            className="flex items-center gap-2.5 text-white hover:text-orange-400 transition-colors font-black text-lg tracking-wider group cursor-pointer"
          >
            <div className="w-10 h-10 bg-orange-500 border-2 border-white flex items-center justify-center text-black font-black brutal-shadow-sm group-hover:bg-yellow-400 transition-all">
              <Kanban className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <span className="font-black tracking-widest uppercase text-base block">JIRA_RAW</span>
              <span className="text-[9px] text-orange-400 tracking-tighter block -mt-1 font-bold">USB AGILE CORE</span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setCurrentView('projects')}
              className={`px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                currentView === 'projects'
                  ? 'bg-orange-500 text-black border-black brutal-shadow-sm'
                  : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-white hover:text-white'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              PROYECTOS
            </button>

            {currentProject && (
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className={`px-3 py-1.5 border-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    currentView === 'board'
                      ? 'bg-yellow-400 text-black border-black brutal-shadow-sm'
                      : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-white hover:text-white'
                  }`}
                >
                  <span className="bg-black text-yellow-400 border border-black text-[11px] px-1.5 py-0.2 font-mono font-black">
                    [{currentProject.key}]
                  </span>
                  <span className="truncate max-w-[140px]">{currentProject.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showProjectDropdown && (
                  <div
                    className="absolute left-0 mt-2 w-72 bg-neutral-950 border-4 border-black brutal-shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setShowProjectDropdown(false)}
                  >
                    <div className="px-3.5 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b-2 border-neutral-800 flex items-center justify-between">
                      <span>SELECCIONAR PROYECTO</span>
                      <span className="text-orange-500">[{projects.length}]</span>
                    </div>
                    <div className="p-1 space-y-1">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            selectProject(p.id);
                            setCurrentView('board');
                            setShowProjectDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs border-2 flex items-center gap-2.5 transition-colors cursor-pointer ${
                            p.id === currentProject?.id
                              ? 'bg-orange-500 text-black border-black font-bold'
                              : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:border-neutral-500 hover:bg-neutral-800'
                          }`}
                        >
                          <span className="bg-black text-orange-400 text-[11px] px-1.5 py-0.5 font-mono font-bold border border-neutral-700">
                            {p.key}
                          </span>
                          <span className="truncate uppercase font-bold">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right Section: User & Role controls */}
        {currentUser && (
          <div className="flex items-center gap-3">
            {/* Realtime Cloud Sync Status */}
            <div
              className={`hidden md:inline-flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider border-2 ${
                isSyncing
                  ? 'bg-neutral-900 text-orange-400 border-orange-500 animate-pulse'
                  : isCloudConnected
                  ? 'bg-emerald-400 text-black border-black brutal-shadow-sm'
                  : 'bg-neutral-800 text-neutral-300 border-neutral-600'
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />
              ) : isCloudConnected ? (
                <Cloud className="w-3.5 h-3.5 text-black" />
              ) : (
                <CloudOff className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>{isSyncing ? 'SYNC' : isCloudConnected ? 'CLOUD: ON' : 'LOCAL'}</span>
            </div>

            {/* Project Manager Admin Button */}
            {currentUser.is_admin && (
              <button
                onClick={() => setShowManageUsersModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black brutal-shadow-sm text-xs font-black uppercase px-3 py-1 transition-all cursor-pointer brutal-btn"
                title="Administrar y editar usuarios del sistema"
              >
                <UserCog className="w-4 h-4 text-black" />
                <span>USUARIOS</span>
              </button>
            )}
            {!currentUser.is_admin && currentProject && (
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-neutral-900 text-neutral-300 border-2 border-neutral-700 text-xs px-2.5 py-1 font-bold uppercase">
                ROL: <strong className="text-orange-400">{ROLE_LABELS[currentRole]}</strong>
              </span>
            )}

            {/* Quick user role switcher for testing */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 pr-3 border-2 border-black bg-neutral-900 hover:bg-neutral-800 transition-colors brutal-shadow-sm cursor-pointer"
              >
                <div
                  className="w-7 h-7 flex items-center justify-center text-black text-xs font-black border border-black"
                  style={{ backgroundColor: currentUser.avatar_color || '#ea580c' }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-black leading-tight text-white uppercase">{currentUser.name}</div>
                  <div className="text-[10px] text-orange-400 font-mono">@{currentUser.username}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showUserDropdown && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-neutral-950 border-4 border-black brutal-shadow-lg p-2 z-50 text-neutral-200"
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <div className="p-3 border-b-2 border-neutral-800 bg-black">
                    <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">PERFIL OPERADOR</div>
                    <div className="font-black text-white text-sm uppercase mt-0.5">{currentUser.name}</div>
                    <div className="text-xs text-orange-400 font-mono">@{currentUser.username}</div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">{currentUser.email}</div>
                    <div className="mt-2">
                      <span className="inline-block text-[10px] bg-yellow-400 text-black border border-black px-2 py-0.5 font-black uppercase">
                        ROL: {ROLE_LABELS[currentRole]}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    {currentUser.is_admin && (
                      <button
                        onClick={() => {
                          setShowManageUsersModal(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-yellow-400 hover:bg-neutral-900 border border-transparent hover:border-yellow-400 flex items-center gap-2 transition-colors font-bold uppercase cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 text-yellow-400" />
                        GESTIONAR USUARIOS
                      </button>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-neutral-900 border border-transparent hover:border-rose-400 flex items-center gap-2 transition-colors font-bold uppercase cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      CERRAR SESIÓN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      <ManageUsersModal
        isOpen={showManageUsersModal}
        onClose={() => setShowManageUsersModal(false)}
      />
    </header>
  );
};
