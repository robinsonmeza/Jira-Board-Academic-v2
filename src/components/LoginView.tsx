import React, { useState } from 'react';
import { useJira } from '../context/JiraContext';
import {
  Kanban,
  Lock,
  User as UserIcon,
  ShieldAlert,
  Eye,
  EyeOff,
  LogIn,
  Cloud,
  ShieldCheck,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isCloudConnected } = useJira();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Por favor ingresa tu nombre de usuario');
      return;
    }
    const res = login(username, password);
    if (!res.success) {
      setError(res.error || 'Nombre de usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="min-h-screen bg-industrial-grid flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-mono text-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 border-4 border-black brutal-shadow mb-4 text-black">
          <Kanban className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-black tracking-wider uppercase">
          Board Academico USB-FI-IS-IS2-V3
        </h1>
        <div className="inline-block bg-black text-yellow-400 text-xs font-black px-2 py-0.5 mt-1 border border-black">
          SISTEMA GESTIÓN METODOLOGÍAS ÁGILES USB
        </div>
        <p className="mt-2 text-xs font-bold text-neutral-700 max-w-sm mx-auto uppercase">
          Plataforma de alta exigencia técnica para proyectos de software
        </p>

        {isCloudConnected && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-300 text-black border-2 border-black text-xs font-black brutal-shadow-sm uppercase">
            <Cloud className="w-3.5 h-3.5 text-black" />
            <span>CLOUD_SYNC: CONECTADO</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white border-4 border-black brutal-shadow-lg p-6 sm:p-8">
          <div className="mb-6 border-b-2 border-black pb-3">
            <h2 className="text-base font-black text-black flex items-center gap-2 uppercase tracking-wider">
              <LogIn className="w-5 h-5 text-black stroke-[3]" />
              <span>TERMINAL DE ACCESO</span>
            </h2>
            <p className="text-[11px] font-bold text-neutral-600 mt-1 uppercase">
              INGRESA CON LAS CREDENCIALES ASIGNADAS
            </p>
          </div>

          {/* Feedback Alert */}
          {error && (
            <div className="mb-5 p-3 bg-rose-200 border-2 border-black text-black text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 stroke-[3]" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                OPERADOR (USUARIO)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                  <UserIcon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="EJ. ROBINSON_MEZA, PROFESOR..."
                  className="block w-full pl-9 pr-3 py-2 bg-neutral-100 border-2 border-black text-black placeholder:text-neutral-500 text-xs font-bold uppercase focus:bg-yellow-100 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-wider mb-1">
                CLAVE DE ACCESO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 bg-neutral-100 border-2 border-black text-black placeholder:text-neutral-500 text-xs font-bold focus:bg-yellow-100 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-black hover:text-orange-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 stroke-[2.5]" /> : <Eye className="w-4 h-4 stroke-[2.5]" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black uppercase text-black bg-orange-500 hover:bg-orange-400 border-2 border-black brutal-shadow brutal-btn cursor-pointer mt-4"
            >
              <LogIn className="w-4 h-4 stroke-[3]" />
              <span>INGRESAR AL SISTEMA</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-2 border-black text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              <span>SEGURIDAD ROLE-BASED ACCESS CONTROL (RBAC)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
