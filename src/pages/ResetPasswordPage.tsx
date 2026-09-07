import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase password recovery uses hash fragments; the auth listener handles the session
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Modpas la dwe gen omwen 6 karaktè.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Modpas yo pa mache. Tanpri verifye yo.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => navigate('login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Nou pa t kapab mete ajou modpas ou. Tanpri eseye ankò.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead title="Reset Modpas" description="Met modpas ou anajou pou kont Kominote Online ou a." canonical="/reset-password" noindex />
      <AuthLayout title="Met Modpas Anajou" subtitle="Antre modpas nouvo ou a pou kontinye">
        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">Modpas ou mete ajou avèk siksè!</p>
            <p className="text-xs text-slate-500">N ap redirektye ou nan paj konekte a...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Modpas Nouvo</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Omwen 6 karaktè"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfime Modpas</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repete modpas la"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Yon ti moman...' : 'Met Modpas Anajou'}
            </button>
          </form>
        )}
      </AuthLayout>
    </>
  );
};
