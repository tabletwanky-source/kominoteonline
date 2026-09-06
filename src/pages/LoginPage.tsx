import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { BrandLogo } from '../components/BrandLogo';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  ShieldAlert, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { login, loginWithGoogle, quickLoginAs, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const routeUserAfterLogin = (userEmail: string) => {
    if (userEmail.includes('wanky') || userEmail.includes('admin')) {
      navigate('admin-dashboard');
    } else if (userEmail.includes('instructor') || userEmail.includes('prof')) {
      navigate('instructor-dashboard');
    } else {
      navigate('student-dashboard');
    }
  };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setUnauthorizedDomain(null);
    const res = await login({ email, password });
    if (res.success) {
      routeUserAfterLogin(email);
    } else {
      setErrorMsg(res.error || 'Erè koneksyon. Tanpri verifye enfòmasyon w yo.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setUnauthorizedDomain(null);
    const res = await loginWithGoogle();
    if (res.success) {
      const currentEmail = auth.currentUser?.email || '';
      routeUserAfterLogin(currentEmail);
    } else if (res.isUnauthorizedDomain) {
      setUnauthorizedDomain(res.domain || (typeof window !== 'undefined' ? window.location.hostname : ''));
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo size="lg" className="justify-center" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Konekte sou Kont Ou
        </h2>
        <p className="text-xs text-slate-500">
          Aksede a tout kou ou te achte yo ak pwogrè ou.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200/80 space-y-6">

          {errorMsg && !unauthorizedDomain && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Konekte ak Google</span>
          </button>

          {/* Unauthorized Domain Diagnostic Guide Card */}
          {unauthorizedDomain && (
            <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-slate-800 space-y-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-950">
                    Domèn sa a poko otorize nan Firebase
                  </h4>
                  <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
                    Pou Google Sign-In ka mache sou adrès sa a, ou bezwen ajoute domèn anba a nan lis <strong className="font-semibold">Authorized domains</strong> nan pwojè Firebase <code className="bg-amber-100/90 px-1 py-0.5 rounded text-amber-950 font-mono font-bold">kominoteonline</code>.
                  </p>
                </div>
              </div>

              {/* Domain Copy Box */}
              <div className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <code className="text-xs font-mono text-slate-800 font-bold truncate select-all">
                  {unauthorizedDomain}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(unauthorizedDomain);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kopye!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiye Domèn</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions & Firebase Link */}
              <div className="space-y-1.5 text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl border border-amber-200/50">
                <p className="font-bold text-slate-800">Kòman pou w rezoud sa rapidman:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Klike bouton <strong>Kopiye Domèn</strong> anwo a.</li>
                  <li>
                    Ouvri{' '}
                    <a
                      href="https://console.firebase.google.com/project/kominoteonline/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline font-bold inline-flex items-center gap-0.5 hover:text-blue-800"
                    >
                      Firebase Console (Authentication &gt; Settings)
                      <ExternalLink className="w-3 h-3 inline ml-0.5" />
                    </a>
                  </li>
                  <li>Desann nan <strong>Authorized domains</strong>, klike <strong>Add domain</strong>, kole l epi sove l.</li>
                </ol>
              </div>

              {/* Fast Bypass for Immediate Testing */}
              <div className="pt-2 border-t border-amber-200">
                <p className="text-[11px] font-bold text-slate-800 mb-2">
                  Pandan w ap mete domèn nan, ou ka konekte dirèkteman isit la:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      quickLoginAs('admin');
                      navigate('admin-dashboard');
                    }}
                    className="py-2 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    Konekte kòm Wanky (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      quickLoginAs('student');
                      navigate('student-dashboard');
                    }}
                    className="py-2 px-3 text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    Konekte kòm Elèv
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">oswa avèk imèl</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Standard Login Form */}
          <form onSubmit={handleStandardLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Imèl</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="oumenm@egzanp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Modpas</label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Bliye Modpas?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Koneksyon ap fèt...' : 'Konekte'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Register link */}
          <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-600">
            Ou poko gen yon kont?{' '}
            <button
              onClick={() => navigate('register')}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Kreye yon kont gratis
            </button>
          </div>

          {/* Quick Access Helper for Staging/Preview Testing */}
          <div className="pt-3 border-t border-dashed border-slate-200 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Aksè Rapid (Tès & Demonstrasyon)</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  quickLoginAs('admin');
                  navigate('admin-dashboard');
                }}
                className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Konekte Wanky (Admin)
              </button>
              <button
                type="button"
                onClick={() => {
                  quickLoginAs('student');
                  navigate('student-dashboard');
                }}
                className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Konekte Elèv
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
