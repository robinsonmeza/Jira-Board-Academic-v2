import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { X, FolderPlus, AlertCircle } from 'lucide-react';
import { Project } from '../types/jira';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject } = useJira();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = createProject(name, key, description);
    if (res.success) {
      setName('');
      setKey('');
      setDescription('');
      onClose();
    } else {
      setError(res.error || 'Error al crear el proyecto');
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key.length <= 3) {
      // Auto-generate key acronym from name if not manually typed
      const initials = val
        .split(' ')
        .map((w) => w.charAt(0))
        .join('')
        .slice(0, 4)
        .toUpperCase();
      if (initials) setKey(initials);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-4 border-black brutal-shadow-lg max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
            <FolderPlus className="w-5 h-5 stroke-[2.5]" />
            <span>CREAR NUEVO PROYECTO</span>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-neutral-200 border-2 border-black p-1 bg-white cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              NOMBRE DEL PROYECTO *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="ej. Sistema de Gestión Web"
              className="w-full px-3.5 py-2 border-2 border-black text-xs font-bold outline-none focus:bg-yellow-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              CLAVE DEL PROYECTO * <span className="text-neutral-600 font-bold lowercase">(ej: PRJ, PRO)</span>
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="PRJ"
              maxLength={10}
              className="w-full px-3.5 py-2 border-2 border-black text-xs font-bold uppercase outline-none focus:bg-yellow-50"
              required
            />
            <p className="text-[11px] font-bold text-neutral-600 mt-1 uppercase">
              PREFIJO DE TAREAS (EJ. {key || 'PRJ'}-1).
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              DESCRIPCIÓN
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de los objetivos del proyecto..."
              rows={3}
              className="w-full px-3.5 py-2 border-2 border-black text-xs font-bold outline-none focus:bg-yellow-50"
            />
          </div>

          <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black uppercase text-black bg-white hover:bg-neutral-200 border-2 border-black brutal-shadow-sm brutal-btn cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black uppercase text-black bg-orange-500 hover:bg-orange-400 border-2 border-black brutal-shadow brutal-btn cursor-pointer"
            >
              CREAR PROYECTO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, isOpen, onClose }) => {
  const { updateProject } = useJira();
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = updateProject(project.id, name, description);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Error al actualizar el proyecto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-4 border-black brutal-shadow-lg max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
            <span className="bg-black text-white text-xs px-2 py-0.5 font-black">
              {project.key}
            </span>
            <span>EDITAR PROYECTO</span>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-neutral-200 border-2 border-black p-1 bg-white cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border-2 border-black text-red-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 stroke-[2.5]" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              NOMBRE DEL PROYECTO *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border-2 border-black text-xs font-bold outline-none focus:bg-yellow-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              DESCRIPCIÓN
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 border-2 border-black text-xs font-bold outline-none focus:bg-yellow-50"
            />
          </div>

          <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-black uppercase text-black bg-white hover:bg-neutral-200 border-2 border-black brutal-shadow-sm brutal-btn cursor-pointer"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-black uppercase text-black bg-orange-500 hover:bg-orange-400 border-2 border-black brutal-shadow brutal-btn cursor-pointer"
            >
              GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
