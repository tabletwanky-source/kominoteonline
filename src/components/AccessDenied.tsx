import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { ShieldAlert, ArrowLeft, Lock, LayoutDashboard, LogIn } from 'lucide-react';

interface AccessDeniedProps {
  requiredRole: 'admin' | 'instructor';
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRole }) => {
  const { navigate } = useNavigation();
  const { user, logout } = useAuth();

  const isInstructorArea = requiredRole === 'instructor';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <BrandLogo size="lg" className="justify-center mb-2" />

        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 mx-auto flex items-center justify-center shadow-xs">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
              Aksè Refize (403 Forbidden)
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Ou pa gen Otorizasyon
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {isInstructorArea ? (
                <>
                  Espas sa a rezève sèlman pou <strong>Enstriktè ki otorize</strong>. Kominote Online se yon akademi prive dirije pa <strong>Wanky</strong> — vizitè pa ka kreye kont enstriktè poukont yo. Sèlman Administratè a ka kreye oswa delege yon kont enstriktè.
                </>
              ) : (
                <>
                  Espas sa a rezève sèlman pou <strong>Administratè Sistèm nan (Wanky)</strong>. Kont elèv ak enstriktè pa gen otorizasyon pou jwenn aksè nan panèl administrasyon jeneral la.
                </>
              )}
            </p>
          </div>

          {user ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-left">
              <p className="font-semibold text-slate-800">Enfòmasyon Sesyon Ou:</p>
              <p className="truncate">Non: {user.full_name}</p>
              <p className="truncate">Imèl: {user.email}</p>
              <p>Wòl aktyèl: <span className="font-bold text-blue-700 uppercase">{user.role}</span></p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              Ou pa konekte nan okenn kont kounye a.
            </div>
          )}

          <div className="space-y-2 pt-2">
            {user?.role === 'student' && (
              <button
                id="btn-access-denied-student-dash"
                onClick={() => navigate('student-dashboard')}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Ale sou Dashboard Elèv Mwen</span>
              </button>
            )}

            {!user && (
              <button
                id="btn-access-denied-login"
                onClick={() => navigate('login')}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Konekte sou Kont Ou</span>
              </button>
            )}

            <button
              id="btn-access-denied-home"
              onClick={() => navigate('home')}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retounen sou Paj Akèy la</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Kominote Online &copy; 2026. Platfòm prive dirije pa Wanky.
        </p>
      </div>
    </div>
  );
};
