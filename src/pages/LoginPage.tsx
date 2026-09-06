import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { usersService } from '../services/firebaseService';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthLayout } from '../components/auth/AuthLayout';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Copy, 
  X, 
  Loader2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { login, loginWithGoogle } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Lamp states
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLampGlowIntense, setIsLampGlowIntense] = useState(false);

  // Forgot password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');

  // Google Sign-In domain diagnosis
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);

  // Route user after successful authentication based on real profile & admin list
  const routeUserAfterLogin = async (userUid: string, userEmail: string) => {
    let role = 'student';
    const emailLower = userEmail.toLowerCase();
    
    // Check known administrator identities
    const isAdmin = 
      emailLower === 'wanky7713@gmail.com' ||
      emailLower === 'wanky@kominote.online' ||
      emailLower === 'tabletwanky@gmail.com' ||
      emailLower === 'wankymassenat@gmail.com' ||
      emailLower === 'motivationmtv2026@gmail.com';

    if (isAdmin) {
      role = 'admin';
    } else {
      try {
        const profile = await usersService.getProfile(userUid);
        if (profile?.role) {
          role = profile.role;
        }
      } catch (err) {
        console.warn('Profile role fetch fallback:', err);
      }
    }

    if (role === 'admin') {
      navigate('admin-dashboard');
    } else if (role === 'instructor') {
      navigate('instructor-dashboard');
    } else {
      navigate('student-dashboard');
    }
  };

  // Standard email/password submit
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Tanpri antre imèl ou ak modpas ou.');
      return;
    }

    setErrorMsg('');
    setUnauthorizedDomain(null);
    setIsLoading(true);
    setIsLampGlowIntense(true);

    try {
      const res = await login({ email: email.trim(), password });
      if (res.success) {
        const currentFbUser = auth.currentUser;
        if (currentFbUser) {
          await routeUserAfterLogin(currentFbUser.uid, currentFbUser.email || email);
        } else {
          navigate('student-dashboard');
        }
      } else {
        setIsLampGlowIntense(false);
        setErrorMsg(res.error || 'Imèl oswa modpas la pa kòrèk.');
      }
    } catch (err: any) {
      setIsLampGlowIntense(false);
      setErrorMsg('Nou pa t kapab konekte ou. Tanpri eseye ankò.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsLampGlowIntense(false), 500);
    }
  };

  // Google Sign In
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setUnauthorizedDomain(null);
    setIsLoading(true);
    setIsLampGlowIntense(true);

    try {
      const res = await loginWithGoogle();
      if (res.success) {
        const currentFbUser = auth.currentUser;
        if (currentFbUser) {
          await routeUserAfterLogin(currentFbUser.uid, currentFbUser.email || '');
        } else {
          navigate('student-dashboard');
        }
      } else if (res.isUnauthorizedDomain) {
        setUnauthorizedDomain(res.domain || (typeof window !== 'undefined' ? window.location.hostname : ''));
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg('Erè pandan koneksyon Google la. Tanpri eseye ankò.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsLampGlowIntense(false), 500);
    }
  };

  // Password reset submit
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Tanpri antre imèl ou.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetSuccess(false);

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
    } catch (err: any) {
      let msg = 'Nou pa t kapab voye imèl la. Tanpri verifye imèl la epi eseye ankò.';
      if (err.code === 'auth/user-not-found') {
        msg = 'Pa gen okenn kont ki anrejistre ak imèl sa a.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Fòma imèl sa a pa valab.';
      }
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        mode="login"
        isInputFocused={isInputFocused}
        isLampGlowIntense={isLampGlowIntense}
      >
        {({ isLampOn }) => (
          <div 
            className={`relative rounded-3xl p-7 sm:p-10 backdrop-blur-2xl transition-all duration-500 border ${
              isLampOn
                ? 'bg-[#0f172a]/55 border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),-5px_0_35px_-5px_rgba(251,191,36,0.18)]'
                : 'bg-[#0b1120]/75 border-blue-500/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_-5px_rgba(59,130,246,0.15)]'
            }`}
          >
            {/* Ambient Reflection Glare on Card Edge */}
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

            {/* Card Header */}
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Byenvini Ankò</span>
                <span className="text-2xl">👋</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Konekte nan kont ou pou kontinye.
              </p>
            </div>

            {/* Error Message Display */}
            {errorMsg && !unauthorizedDomain && (
              <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl text-xs sm:text-sm text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Google Sign-In Domain Warning Diagnostic */}
            {unauthorizedDomain && (
              <div className="mb-5 p-4 bg-amber-500/15 border border-amber-400/40 rounded-2xl text-amber-200 text-xs space-y-3 shadow-inner">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300">Domèn sa a poko otorize nan Firebase</h4>
                    <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                      Pou Google Sign-In ka mache, ajoute domèn sa a nan <strong className="text-white">Authorized domains</strong> nan Firebase Console ou a:
                    </p>
                  </div>
                </div>

                {/* Copyable domain chip */}
                <div className="bg-black/40 border border-amber-400/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <code className="text-xs font-mono text-amber-300 font-bold truncate select-all">
                    {unauthorizedDomain}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomain);
                      setDomainCopied(true);
                      setTimeout(() => setDomainCopied(false), 2500);
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {domainCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-900" />
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
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleStandardLogin} className="space-y-4">
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="login-email" 
                  className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1.5"
                >
                  Imèl ou
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Antre imèl ou"
                    value={email}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label 
                    htmlFor="login-password" 
                    className="block text-xs sm:text-sm font-semibold text-slate-200"
                  >
                    Modpas ou
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer hover:underline"
                  >
                    Bliye modpas ou?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Antre modpas ou"
                    value={password}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                    aria-label={showPassword ? 'Kache modpas la' : 'Montre modpas la'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>K ap konekte...</span>
                  </>
                ) : (
                  <>
                    <span>Konekte</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs font-semibold text-slate-400 lowercase">oswa</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Real Firebase Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
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
              <span>Konekte avèk Google</span>
            </button>

            {/* Mobile Registration Link */}
            <div className="mt-5 text-center text-xs text-slate-400">
              <span>Pa gen kont? </span>
              <button
                type="button"
                onClick={() => navigate('register')}
                className="text-blue-400 font-bold hover:underline cursor-pointer"
              >
                Kreye yon kont
              </button>
            </div>

            {/* Security Guarantee Message */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Kont ou an sekirite avèk Firebase</span>
            </div>
          </div>
        )}
      </AuthLayout>

      {/* CLEAN FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl text-slate-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setResetSuccess(false);
                setResetError('');
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Fèmen modal modpas bliye"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Bliye modpas ou?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Antre imèl ou pou nou ka voye yon lyen sekirize pou rekipere modpas ou.
              </p>
            </div>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs sm:text-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-200">
                  <Check className="w-4 h-4" />
                  <span>Imèl voye avèk siksè!</span>
                </div>
                <p className="leading-relaxed">
                  Nou voye yon lyen pou reset modpas ou nan imèl ou. Tanpri verifye bwat mesaj ou (ak dosye Spam si nesesè).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetSuccess(false);
                  }}
                  className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Mwen konprann
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetError && (
                  <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Antre imèl ou
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      placeholder="Antre imèl ou"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Voye ap fèt...</span>
                    </>
                  ) : (
                    <span>Voye lyen pou reset modpas</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
