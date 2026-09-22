import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import { X, Zap, Calendar, AlertCircle } from 'lucide-react';

interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SprintModal: React.FC<SprintModalProps> = ({ isOpen, onClose }) => {
  const { createSprint, startSprint, sprints } = useJira();
  const [name, setName] = useState(`Sprint ${sprints.length + 1}`);
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [autoStart, setAutoStart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del sprint es requerido');
      return;
    }

    try {
      const created = createSprint(name, goal, startDate, endDate);
      if (autoStart) {
        startSprint(created.id);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear sprint');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-4 border-black brutal-shadow-lg max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-black flex items-center justify-between bg-yellow-400">
          <div className="flex items-center gap-2 text-black font-black text-sm uppercase tracking-wider">
            <Zap className="w-5 h-5 stroke-[2.5]" />
            <span>CREAR NUEVO SPRINT</span>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-neutral-200 border border-black p-1 bg-white cursor-pointer"
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
              NOMBRE DEL SPRINT *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. SPRINT 2 - MÓDULO REPORTES"
              className="w-full px-3.5 py-2 border-2 border-black bg-white text-xs font-bold focus:bg-yellow-50 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
              OBJETIVO DEL SPRINT (SPRINT GOAL)
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="¿Qué valor entregará este sprint al cliente o producto?"
              rows={2}
              className="w-full px-3.5 py-2 border-2 border-black bg-white text-xs font-bold focus:bg-yellow-50 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                FECHA INICIO
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-black bg-white text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                FECHA FIN
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-black bg-white text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-100 border-2 border-black flex items-center gap-2.5">
            <input
              type="checkbox"
              id="auto-start"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-4 h-4 accent-black border-2 border-black cursor-pointer"
            />
            <label htmlFor="auto-start" className="text-xs text-black font-black uppercase cursor-pointer">
              INICIAR SPRINT DE INMEDIATO
            </label>
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
              CREAR SPRINT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
