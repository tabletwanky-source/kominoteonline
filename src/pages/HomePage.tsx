import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { coursesService } from '../services/firebaseService';
import { Course } from '../types/database';
import { CourseCard } from '../components/CourseCard';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  Sparkles,
  BookOpen,
  Lock
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useNavigation();
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    async function loadHomeCourses() {
      try {
        setLoadingCourses(true);
        let courses = await coursesService.getFeatured();
        if (!courses || courses.length === 0) {
          courses = await coursesService.getPopular(6);
        }
        setPopularCourses(courses || []);
      } catch (err) {
        console.error('Error loading home courses from Firestore:', err);
        setPopularCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    }

    loadHomeCourses();
  }, []);

  // Accordion items matching Screenshot 4 ("homme2.png")
  const professionalTrainingItems = [
    {
      title: 'Devlope Konpetans ki Itil',
      content:
        'Aprann konpetans teknik, dijital, ak antreprenarya ki gen plis demann jodi a sou mache a. Nou mete aksan sou fòmasyon pratik ki pèmèt ou kreye pwojè konkrè e kòmanse jenere revni san pèdi tan.',
    },
    {
      title: 'Swiv Bon Chemen an pou Reyisi nan Aprantisaj Ou',
      content:
        'Chak kou fèt ak yon plan pedagojik estriktire depi nan debistan rive nan nivo avanse. Ou konnen egzakteman ki pwochen etap pou w franchi pou atenn objektif pwofesyonèl ou.',
    },
    {
      title: 'Aprann ak Pwofesyonèl',
      content:
        'Tout fòmasyon sou Kominote Online dirije pa Wanky ak enstriktè sètifye ki gen plizyè lane eksperyans nan endistri a. Yo pataje teknik ak pi bon estrateji pratik pou reyisi pi vit.',
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-slate-50">
      
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Full Background Image)                   */}
      {/* ========================================================= */}
      <section
        className="relative w-full min-h-[560px] sm:min-h-[620px] lg:min-h-[680px] xl:min-h-[720px] bg-[#0056D2] bg-cover bg-no-repeat bg-[center_right_30%] sm:bg-center flex items-center text-white shrink-0 overflow-hidden"
        style={{
          backgroundImage: `url("https://i.postimg.cc/zvzQbTYw/homehero.png")`,
        }}
      >
        {/* Professional Dark Blue Gradient Overlay: Stronger on LEFT behind text, progressively transparent toward woman & laptop */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#011438]/95 via-[#011438]/85 sm:via-[#011438]/70 md:via-[#011438]/60 to-[#011438]/40 lg:to-transparent pointer-events-none" />

        {/* Subtle bottom shadow to anchor the hero cleanly into the page */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#011438]/50 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-28 relative z-10">
          <div className="max-w-xl lg:max-w-2xl text-left space-y-6">

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-black text-white leading-[1.15] tracking-tight drop-shadow-sm">
              Aprann nan men moun <br />
              <span className="text-[#38BDF8]">ki metrize</span> sa y ap fè.
            </h1>

            {/* Supporting text */}
            <p className="text-blue-100/95 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg font-normal drop-shadow-sm">
              Dekouvri kou pratik an Kreyòl ki ede w devlope nouvo konpetans dijital epi avanse pi vit nan karyè w.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <button
                id="hero-cta-button"
                onClick={() => navigate('courses')}
                className="bg-white text-[#0056D2] hover:bg-blue-50 font-black px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-2 text-sm group"
              >
                <span>Gade Tout Kou yo</span>
                <ArrowRight className="w-4 h-4 text-[#0056D2] transition-transform group-hover:translate-x-1" />
              </button>

              <button
                id="hero-cta-shop-btn"
                onClick={() => navigate('shop')}
                className="bg-blue-950/60 hover:bg-blue-900/80 text-white border border-white/25 backdrop-blur-xs font-bold px-7 py-3.5 rounded-full shadow-lg active:scale-98 transition-all cursor-pointer inline-flex items-center justify-center gap-2 text-sm"
              >
                <span>Boutik Dijital</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. OVERLAPPING 3 BENTO CARDS                              */}
      {/* ========================================================= */}
      <div className="-mt-14 sm:-mt-16 px-4 sm:px-8 flex flex-col md:flex-row justify-center gap-6 shrink-0 z-10 max-w-6xl mx-auto w-full">
        {/* Bento Card 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl flex-1 border border-slate-100 hover:shadow-2xl transition-shadow">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 text-[#0056D2]">
            <Sparkles className="w-5 h-5 text-[#0056D2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Fòmasyon Pratik</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Aprann pa mwayen pwojè reyèl ke w ka itilize kounye a nan biznis ou oswa travay ou.
          </p>
        </div>

        {/* Bento Card 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl flex-1 border border-slate-100 hover:shadow-2xl transition-shadow">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3 text-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Aprantisaj Fleksib</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Gade leson yo sou telefòn, tablèt, oswa òdinatè, nenpòt kote ak nenpòt lè sa bon pou ou.
          </p>
        </div>

        {/* Bento Card 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-xl flex-1 border border-slate-100 hover:shadow-2xl transition-shadow">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 text-indigo-600">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1">Kontni Kalite Gran Nivo</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Tout fòmasyon prepare pa ekspè ki metrize domèn yo epi teste anvan yo pibliye.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. OUR MOST POPULAR COURSES (Matching Screenshot 3)       */}
      {/* ========================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Kou ki Pi Popilè yo
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kou ki pi popilè sou Kominote Online ki prepare elèv yo pou opòtinite reyèl sou mache mondyal la.
          </p>
        </div>

        {/* 3-Column Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {popularCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('courses')}
            className="text-xs font-bold text-[#0056D2] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Wè Tout Katalòg Kou yo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. BE IN DEMAND WITH PROFESSIONAL TRAINING (Screenshot 4) */}
      {/* ========================================================= */}
      <section className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Devlope Konpetans ki Gen Anpil Demann
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Devlope konpetans pratik ak fòmasyon entansif ki reponn dirèkteman ak demand mache travay jodi a.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Official Professional Training Visual (Hero 2) */}
            <div className="lg:col-span-5 flex flex-col items-center text-center">
              <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-slate-100 aspect-4/3">
                <img
                  src="https://i.postimg.cc/gjz7X3bq/hero2.png"
                  alt="Devlope Konpetans ki Gen Anpil Demann — Kominote Online"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-4 space-y-0.5">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Fòmasyon Pwofesyonèl Kalifye
                </h3>
                <p className="text-xs text-blue-600 font-semibold">Devlope konpetans ki prepare w pou mache travay la</p>
              </div>
            </div>

            {/* Right Column: Clean Accordion (Matching Screenshot 4) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden">
                {professionalTrainingItems.map((item, idx) => {
                  const isOpen = openAccordion === idx;
                  return (
                    <div key={idx} className="transition-colors">
                      <button
                        type="button"
                        onClick={() => setOpenAccordion(isOpen ? null : idx)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-[#0056D2] transition-colors cursor-pointer"
                      >
                        <span className={isOpen ? 'text-[#0056D2]' : ''}>
                          {item.title}
                        </span>
                        <span className="text-[#0056D2]">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 border-t border-slate-100">
                          {item.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* 5. PEMAN NOU AKSEPTE (Payment Methods Section)            */}
          {/* ========================================================= */}
          <div className="mt-20 pt-12 border-t border-slate-200/80">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
                PEMAN NOU AKSEPTE
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-normal">
                Ou ka peye fasil, rapid epi an sekirite ak metòd sa yo.
              </p>
            </div>

            {/* 4 Official Payment Logos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {/* MonCash */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-6 flex items-center justify-center min-h-[110px] sm:min-h-[130px]">
                <img
                  src="https://i.postimg.cc/jwdTj9RP/4.png"
                  alt="MonCash"
                  className="max-h-12 sm:max-h-14 w-auto object-contain select-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* NatCash */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-6 flex items-center justify-center min-h-[110px] sm:min-h-[130px]">
                <img
                  src="https://i.postimg.cc/Q943KbMB/5.png"
                  alt="NatCash"
                  className="max-h-12 sm:max-h-14 w-auto object-contain select-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* PayPal */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-6 flex items-center justify-center min-h-[110px] sm:min-h-[130px]">
                <img
                  src="https://i.postimg.cc/xJx2NRdJ/6.png"
                  alt="PayPal"
                  className="max-h-12 sm:max-h-14 w-auto object-contain select-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Stripe / Debit & Credit Card */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow p-6 flex items-center justify-center min-h-[110px] sm:min-h-[130px]">
                <img
                  src="https://i.postimg.cc/ft2NSKbS/7.png"
                  alt="Stripe"
                  className="max-h-12 sm:max-h-14 w-auto object-contain select-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Small Security Message */}
            <div className="mt-8 flex items-center justify-center gap-2 text-slate-600 text-xs sm:text-sm font-medium">
              <Lock className="w-4 h-4 text-[#0070BA] fill-[#0070BA] shrink-0" />
              <span>Peman ou an sekirite avèk nou.</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SIGNATURE BLUE CTA BANNER                              */}
      {/* ========================================================= */}
      <section className="bg-[#0056D2] text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Kòmanse Aprann Sou Kominote Online Jodi a!
          </h2>
          
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
            Rejwenn pi gwo platfòm fòmasyon an Kreyòl Ayisyen. Devlope konpetans ki prepare w pou siksè pwofesyonèl.
          </p>

          <div className="pt-3">
            <button
              id="final-cta-start-learning-btn"
              onClick={() => navigate('register')}
              className="px-8 py-3.5 rounded-full bg-white text-[#0056D2] hover:bg-blue-50 font-bold text-sm shadow-xl active:scale-98 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Kòmanse Fòmasyon w</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
