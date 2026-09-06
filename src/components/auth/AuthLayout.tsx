import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { BookOpen, Users, TrendingUp, Sparkles } from 'lucide-react';

interface BenefitItem {
  icon: React.ElementType;
  title: string;
  desc: string;
  colorClass: string;
}

interface AuthLayoutProps {
  mode: 'login' | 'register';
  isInputFocused: boolean;
  isLampGlowIntense: boolean;
  children: (props: { isLampOn: boolean }) => React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  mode,
  isInputFocused,
  isLampGlowIntense,
  children,
}) => {
  const { navigate } = useNavigation();
  const [isLampOn, setIsLampOn] = useState(true);
  const [isPullingChain, setIsPullingChain] = useState(false);

  // Toggle Lamp switch
  const handleToggleLamp = () => {
    setIsPullingChain(true);
    setTimeout(() => {
      setIsLampOn((prev) => !prev);
      setIsPullingChain(false);
    }, 200);
  };

  const isLogin = mode === 'login';

  // Educational benefits
  const benefits: BenefitItem[] = isLogin
    ? [
        {
          icon: BookOpen,
          title: 'Kou sou Entènèt',
          desc: 'Aprann nan pwòp rit ou tout kote ou ye',
          colorClass: 'text-blue-400 group-hover:border-blue-400/50',
        },
        {
          icon: Users,
          title: 'Yon Kominote Aktif',
          desc: 'Pataje konesans ak lòt manm ki motive',
          colorClass: 'text-cyan-400 group-hover:border-cyan-400/50',
        },
        {
          icon: TrendingUp,
          title: 'Plis Opòtinite',
          desc: 'Bati yon pi bon avni ak nouvo konpetans pratik',
          colorClass: 'text-amber-400 group-hover:border-amber-400/50',
        },
      ]
    : [
        {
          icon: BookOpen,
          title: 'Aprann nan Pwòp Rit Ou',
          desc: 'Aksede kou yo nenpòt lè sou tout aparèy',
          colorClass: 'text-blue-400 group-hover:border-blue-400/50',
        },
        {
          icon: Sparkles,
          title: 'Konpetans Pratik',
          desc: 'Aprann sa ou ka itilize reyèlman nan lavi w',
          colorClass: 'text-cyan-400 group-hover:border-cyan-400/50',
        },
        {
          icon: TrendingUp,
          title: 'Devlope Avni Ou',
          desc: 'Jwenn nouvo konesans ak opòtinite san limit',
          colorClass: 'text-amber-400 group-hover:border-amber-400/50',
        },
      ];

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-700 flex flex-col justify-between selection:bg-blue-500 selection:text-white ${
        isLampOn ? 'bg-[#0b101c] text-slate-100' : 'bg-[#06080e] text-slate-200'
      }`}
    >
      {/* Background Ambient Warm & Cool Lighting Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep navy vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090e1a]/95 via-[#0b1120]/90 to-[#070912]" />

        {/* Dynamic Warm Lamp Conical Glow (Visible when lamp is ON) */}
        {isLampOn && (
          <>
            {/* Ambient Room Warmth */}
            <div
              className={`absolute top-1/4 left-1/4 w-[650px] h-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/15 blur-[120px] transition-all duration-700 pointer-events-none ${
                isInputFocused || isLampGlowIntense
                  ? 'opacity-90 scale-110 bg-amber-500/22'
                  : 'opacity-70 scale-100'
              }`}
            />

            {/* Conic beam wash towards the desk and card */}
            <div
              className={`absolute top-[42%] left-[43%] w-[700px] h-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-400/20 via-amber-600/10 to-transparent blur-[85px] transition-all duration-500 pointer-events-none ${
                isInputFocused ? 'opacity-95' : 'opacity-75'
              }`}
            />
          </>
        )}

        {/* Soft Electric Blue Backlight for contrast */}
        <div className="absolute top-10 right-10 w-[450px] h-[450px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      </div>

      {/* TOP BAR: Brand Logo & Switch Link */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => navigate('home')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-xl p-1"
          aria-label="Kominote Online - Ale sou Paj Akèy"
        >
          <img
            src="https://i.postimg.cc/hGb7Tk9s/kominotelogo.png"
            alt="Kominote Online Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <div>
            <div className="font-extrabold text-xl sm:text-2xl text-white tracking-tight flex items-center gap-1.5">
              <span>Kominote</span>
              <span className="text-blue-400">Online</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
              Aprann • Pataje • Evolye
            </div>
          </div>
        </button>

        {/* Switch Link Pill */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          {isLogin ? (
            <>
              <span className="text-slate-400 hidden sm:inline">Pa gen kont?</span>
              <button
                type="button"
                onClick={() => navigate('register')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-blue-500/10 active:scale-97"
              >
                Kreye yon kont
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-400 hidden sm:inline">Ou deja gen yon kont?</span>
              <button
                type="button"
                onClick={() => navigate('login')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-blue-500/10 active:scale-97"
              >
                Konekte
              </button>
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* LEFT COLUMN: Inspirational Heading, Benefits & Interactive Desk Lamp Scene */}
        <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-8 lg:space-y-10">
          {/* Main Title & Subtitle */}
          <div className="space-y-4">
            {isLogin ? (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                  Konesans <br />
                  ki chanje{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
                    lavi
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed font-normal">
                  Konekte pou kontinye aprantisaj ou avèk Kominote Online.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                  Kòmanse aprann <br />
                  depi{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">
                    jodi a
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed font-normal">
                  Kreye kont ou epi jwenn aksè ak kou, fòmasyon ak resous dijital sou Kominote Online.
                </p>
              </>
            )}
          </div>

          {/* 3 Small Educational Benefit Items */}
          <div className="space-y-3.5 max-w-md">
            {benefits.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3.5 group">
                  <div
                    className={`w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-inner transition-colors ${item.colorClass}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">{item.title}</h2>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INTERACTIVE DESK LAMP & STUDY DESK VISUAL */}
          <div className="relative pt-6 pb-2 w-full max-w-lg select-none">
            {/* Wooden Desk Surface Base */}
            <div className="relative w-full h-24 rounded-2xl bg-gradient-to-r from-[#1c120c] via-[#2d1c12] to-[#1a100a] border-t border-amber-900/40 shadow-2xl overflow-hidden flex items-end px-6 pb-2">
              {/* Wood Grain Specular Highlight from Lamp */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-600/10 mix-blend-overlay transition-opacity duration-700 ${
                  isLampOn ? (isInputFocused ? 'opacity-95' : 'opacity-70') : 'opacity-0'
                }`}
              />

              {/* Study Notebook & Pen on the Desk */}
              <div className="relative z-10 w-28 h-12 bg-[#221b16] rounded-t-md border border-amber-800/40 shadow-md transform -rotate-2 p-1.5 flex flex-col justify-between">
                <div className="h-0.5 w-full bg-amber-900/30 rounded" />
                <div className="h-0.5 w-4/5 bg-amber-900/30 rounded" />
                <div className="h-0.5 w-3/5 bg-amber-900/30 rounded" />
                {/* Pen */}
                <div className="absolute -right-3 top-2 w-14 h-1.5 bg-gradient-to-r from-slate-400 via-amber-200 to-slate-900 rounded-full shadow-sm transform rotate-45" />
              </div>
            </div>

            {/* Desk Accessories: Stack of Leather Books */}
            <div className="absolute left-44 bottom-14 z-10 flex flex-col space-y-1">
              {/* Book 1 - APRANN */}
              <div className="w-24 h-4 rounded bg-[#1e293b] border-l-2 border-amber-400/60 shadow-md flex items-center px-2">
                <span className="text-[7px] font-black tracking-widest text-amber-300/80">APRANN</span>
              </div>
              {/* Book 2 - PATAJE */}
              <div className="w-26 h-4 rounded bg-[#3c2415] border-l-2 border-amber-500/80 shadow-md flex items-center px-2">
                <span className="text-[7px] font-black tracking-widest text-amber-200/90">PATAJE</span>
              </div>
              {/* Book 3 - EVOLYE */}
              <div className="w-28 h-4.5 rounded bg-[#161f30] border-l-2 border-blue-400/70 shadow-md flex items-center px-2">
                <span className="text-[7px] font-black tracking-widest text-blue-200/90">EVOLYE</span>
              </div>
            </div>

            {/* Potted Desk Plant */}
            <div className="absolute left-74 bottom-14 z-10 flex flex-col items-center">
              <div className="relative -mb-1 flex gap-1">
                <div className="w-4 h-6 rounded-full bg-emerald-800/90 transform -rotate-25 shadow-sm border border-emerald-700/30" />
                <div className="w-5 h-8 rounded-full bg-emerald-700/95 transform rotate-5 shadow-sm border border-emerald-600/30" />
                <div className="w-4 h-6 rounded-full bg-emerald-800/90 transform rotate-35 shadow-sm border border-emerald-700/30" />
              </div>
              <div className="w-8 h-7 bg-amber-950/80 rounded-b-lg border border-amber-900/60 shadow-inner" />
            </div>

            {/* THE DESK LAMP COMPONENT */}
            <div className="absolute left-10 bottom-12 z-20 flex flex-col items-center">
              <div className="relative">
                {/* Outer Curved Metallic Shade */}
                <div
                  className={`w-32 h-16 rounded-t-full bg-gradient-to-b from-[#1c1d22] via-[#24262d] to-[#121316] border-t border-slate-600/40 shadow-2xl relative overflow-hidden transition-all duration-500 ${
                    isLampOn ? 'shadow-amber-500/30' : 'shadow-none'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />
                </div>

                {/* Underneath Bulb & Warm Glowing Light Cone */}
                <div className="relative flex justify-center items-center">
                  <div
                    className={`w-14 h-4 -mt-1 rounded-full transition-all duration-500 ${
                      isLampOn
                        ? 'bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 shadow-[0_0_35px_12px_rgba(251,191,36,0.85)] animate-lamp-breathe'
                        : 'bg-stone-800 opacity-40 shadow-none'
                    }`}
                  />

                  {/* Wide Amber Conic Beam projected down towards desk */}
                  {isLampOn && (
                    <div
                      className={`absolute top-2 w-64 h-36 bg-gradient-to-b from-amber-300/40 via-amber-500/15 to-transparent pointer-events-none blur-md transition-all duration-500 ${
                        isInputFocused ? 'scale-105 opacity-95' : 'scale-100 opacity-80'
                      }`}
                      style={{
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
                      }}
                    />
                  )}
                </div>

                {/* Interactive Pull-Chain Switch with Golden Bead */}
                <button
                  type="button"
                  onClick={handleToggleLamp}
                  title={isLampOn ? 'Klike pou etenn lanp lan' : 'Klike pou limen lanp lan'}
                  className="absolute right-6 top-12 z-30 group flex flex-col items-center cursor-pointer focus:outline-none"
                  aria-label={isLampOn ? 'Etenn lanp la' : 'Limen lanp la'}
                >
                  <div
                    className={`w-0.5 h-7 bg-amber-400/80 group-hover:bg-amber-300 transition-colors ${
                      isPullingChain ? 'animate-pull-chain' : ''
                    }`}
                  />
                  <div
                    className={`w-3.5 h-3.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-md group-hover:scale-125 transition-transform duration-200 border border-amber-300/60 ${
                      isPullingChain ? 'translate-y-2 scale-95' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Lamp Stand & Slender Stem */}
              <div className="w-2.5 h-20 bg-gradient-to-r from-stone-700 via-amber-600/40 to-stone-900 border-x border-stone-800" />

              {/* Lamp Base resting on Desk */}
              <div className="w-16 h-3 rounded-full bg-gradient-to-r from-stone-800 via-stone-700 to-stone-900 border border-amber-700/30 shadow-lg" />
            </div>

            {/* Lamp Status Caption */}
            <div className="absolute right-2 bottom-0 text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLampOn ? 'bg-amber-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>
                {isLampOn
                  ? 'Lanp lan limen • Klike sou chenn an pou etenn li'
                  : 'Lanp lan etenn • Klike sou chenn an pou limen li'}
              </span>
            </div>
          </div>

          {/* Inspirational Quote at Bottom */}
          <div className="pt-2 border-t border-slate-800/80">
            {isLogin ? (
              <>
                <blockquote className="text-xs sm:text-sm text-slate-400 italic">
                  “Edikasyon se pi bon envestisman pou demen.”
                </blockquote>
                <p className="text-xs text-blue-400 font-bold mt-0.5">— Kominote Online</p>
              </>
            ) : (
              <>
                <blockquote className="text-xs sm:text-sm text-slate-400 italic">
                  “Chak gwo chanjman kòmanse ak yon premye etap.”
                </blockquote>
                <p className="text-xs text-blue-400 font-bold mt-0.5">— Kominote Online</p>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Frosted Glass Form Card Container */}
        <div className="w-full lg:w-1/2 max-w-md lg:max-w-lg mx-auto">
          {children({ isLampOn })}
        </div>
      </main>

      {/* BOTTOM FOOTER BAR */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 border-t border-slate-800/40 gap-2">
        <div>© {new Date().getFullYear()} Kominote Online. Tout dwa rezève.</div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('privacy-policy')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Politik Konfidansyalite
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => navigate('terms-conditions')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Kondisyon Itilizasyon
          </button>
        </div>
      </footer>
    </div>
  );
};
