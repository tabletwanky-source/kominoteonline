import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { AuthLayout } from '../components/auth/AuthLayout';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  Copy, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { register, loginWithGoogle } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Status & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Lamp interactive state
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLampGlowIntense, setIsLampGlowIntense] = useState(false);

  // Google domain diagnostic
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [domainCopied, setDomainCopied] = useState(false);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  const isPasswordMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Handle Standard Account Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMsg('Tanpri antre non konplè ou.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Tanpri antre yon adrès imèl ki valab.');
      return;
    }

    // Email format regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Tanpri antre yon adrès imèl ki valab.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Modpas la pa satisfè tout kondisyon sekirite yo.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Modpas yo pa koresponn. Tanpri verifye yo.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('Tanpri aksepte kondisyon itilizasyon ak règleman sou vi prive.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setIsLoading(true);
    setIsLampGlowIntense(true);

    try {
      const res = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (res.success) {
        // Email verification is handled by Supabase auth settings

        setSuccessMsg('Kont ou kreye avèk siksè! Nou voye yon lyen verifikasyon nan imèl ou.');
        
        // Direct smooth transition to student dashboard
        setTimeout(() => {
          navigate('student-dashboard');
        }, 1200);
      } else {
        setIsLampGlowIntense(false);
        setErrorMsg(res.error || 'Nou pa t kapab kreye kont ou. Tanpri eseye ankò.');
      }
    } catch (err: any) {
      console.error('Registration submit error:', err);
      setIsLampGlowIntense(false);
      setErrorMsg('Nou pa t kapab kreye kont ou. Tanpri eseye ankò.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsLampGlowIntense(false), 500);
    }
  };

  // Google Sign-in / Registration
  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setIsLoading(true);
    setIsLampGlowIntense(true);

    try {
      const res = await loginWithGoogle();
      if (res.success) {
        setSuccessMsg('Koneksyon Google la reyisi! K ap dirije ou nan espas elèv ou a...');
        setTimeout(() => {
          navigate('student-dashboard');
        }, 1000);
      } else if (res.isUnauthorizedDomain) {
        setUnauthorizedDomain(res.domain || (typeof window !== 'undefined' ? window.location.hostname : ''));
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      setErrorMsg('Erè pandan enskripsyon Google la. Tanpri eseye ankò.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsLampGlowIntense(false), 500);
    }
  };

  return (
    <AuthLayout
      mode="register"
      isInputFocused={isInputFocused}
      isLampGlowIntense={isLampGlowIntense}
    >
      {({ isLampOn }) => (
        <div
          className={`relative rounded-3xl p-7 sm:p-9 backdrop-blur-2xl transition-all duration-500 border ${
            isLampOn
              ? 'bg-[#0f172a]/55 border-white/15 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),-5px_0_35px_-5px_rgba(251,191,36,0.18)]'
              : 'bg-[#0b1120]/75 border-blue-500/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_-5px_rgba(59,130,246,0.15)]'
          }`}
        >
          {/* Ambient Reflection Glare on Card Top Edge */}
          <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

          {/* Card Header */}
          <div className="space-y-1.5 mb-5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Kreye Kont Ou</span>
              <span className="text-2xl">🎓</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Ranpli enfòmasyon yo pou kòmanse.
            </p>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-xs sm:text-sm text-emerald-300 flex items-start gap-2.5 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

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
                  <h4 className="font-bold text-amber-300">Domèn sa a poko otorize</h4>
                  <p className="text-[11px] text-amber-200/90 mt-1 leading-relaxed">
                    Pou Google Sign-In ka mache, ajoute domèn sa a nan <strong className="text-white">Authorized domains</strong> nan paramèt otantifikasyon ou yo:
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

          {/* REGISTRATION FORM */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Full Name Field */}
            <div>
              <label 
                htmlFor="reg-fullname" 
                className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1"
              >
                Non konplè
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Antre non konplè ou"
                  value={fullName}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label 
                htmlFor="reg-email" 
                className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1"
              >
                Imèl ou
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Antre imèl ou"
                  value={email}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="reg-password" 
                className="block text-xs sm:text-sm font-semibold text-slate-200 mb-1"
              >
                Modpas
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Kreye yon modpas"
                  value={password}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
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

            {/* Clean Password Strength Checklist */}
            {password.length > 0 && (
              <div className="p-3 bg-slate-950/70 border border-white/10 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                <div className="text-[11px] font-semibold text-slate-400">Kondisyon modpas la:</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {hasMinLength ? '✓' : '•'}
                    </span>
                    <span>Omwen 8 karaktè</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${hasUppercase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {hasUppercase ? '✓' : '•'}
                    </span>
                    <span>Yon lèt majiskil</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${hasLowercase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {hasLowercase ? '✓' : '•'}
                    </span>
                    <span>Yon lèt miniskil</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0 ${hasNumber ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      {hasNumber ? '✓' : '•'}
                    </span>
                    <span>Yon chif</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="reg-confirm-password" 
                  className="block text-xs sm:text-sm font-semibold text-slate-200"
                >
                  Konfime Modpas
                </label>
                {confirmPassword.length > 0 && (
                  <span className={`text-[11px] font-semibold ${isPasswordMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPasswordMatch ? 'Modpas yo koresponn ✓' : 'Pa koresponn ✕'}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Antre modpas la ankò"
                  value={confirmPassword}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-950/60 border rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none transition-all ${
                    confirmPassword.length > 0
                      ? isPasswordMatch
                        ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-rose-500/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Kache modpas la' : 'Montre modpas la'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-slate-950 text-blue-600 focus:ring-blue-500/40 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed group-hover:text-slate-200 transition-colors">
                  Mwen dakò ak{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('terms-conditions');
                    }}
                    className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                  >
                    kondisyon itilizasyon
                  </button>{' '}
                  ak{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('privacy-policy');
                    }}
                    className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
                  >
                    règleman sou vi prive
                  </button>
                  .
                </span>
              </label>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="w-full mt-2 py-3.5 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.98] shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>K ap kreye kont...</span>
                </>
              ) : (
                <>
                  <span>Kreye Kont</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-semibold text-slate-400 lowercase">oswa</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
            <span>Kreye kont avèk Google</span>
          </button>

          {/* Switch to Login Link */}
          <div className="mt-4 text-center text-xs text-slate-400">
            <span>Ou deja gen yon kont? </span>
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Konekte
            </button>
          </div>

          {/* Security Guarantee Message */}
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Kont ou pwoteje avèk sistèm nan</span>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
