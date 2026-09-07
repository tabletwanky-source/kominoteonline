import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { aboutService } from '../services/firebaseService';
import { AboutPageCMS, TeamMember } from '../types/database';
import { Facebook, Twitter, Linkedin, Award, BookOpen, Building2, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [content, setContent] = useState<AboutPageCMS>({
    id: 'main',
    title: 'Konsènan Nou',
    description: 'Platfòm modèn dedye a fòmasyon pwofesyonèl ak pratik an Kreyòl Ayisyen, dirije pa Dr Wanky Massenat.',
    mission: 'Bay tout Ayisyen nan peyi a ak nan dyaspora a aksè ak pi bon fòmasyon pwofesyonèl ak teknolojik nan pwòp lang manman yo pou yo ka ogmante revni yo epi bati karyè dirab.',
    vision: 'Vin pi gwo akademi fòmasyon sou entènèt an Kreyòl Ayisyen nan mond lan, kote konesans pratik transfòme an reyisit finansye ak endepandans pwofesyonèl.',
  });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        setLoading(true);
        const [c, t] = await Promise.all([
          aboutService.getContent(),
          aboutService.getTeamMembers(true),
        ]);
        if (c) setContent(c);
        setTeam(t || []);
      } catch (err) {
        console.error('Error loading about data from baz done yo:', err);
        setTeam([]);
      } finally {
        setLoading(false);
      }
    }

    loadAboutData();
  }, []);

  // Isolate founder profile and any other team members
  const founder = team.length > 0 ? team[0] : null;
  const otherMembers = team.length > 1 ? team.slice(1) : [];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* 1. HERO BANNER: Classic Rich Blue Page Model */}
      <section className="bg-[#0056D2] text-white py-16 sm:py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {content.title === 'About Us' ? 'Konsènan Nou' : (content.title || 'Konsènan Nou')}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            {content.description || 'Platfòm modèn dedye a fòmasyon pwofesyonèl ak pratik an Kreyòl Ayisyen.'}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-24">
        {/* 2. OUR STORY & GLOBAL LEARNING SECTION (Official Asset: lothero.png) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
          {/* Left: Official Global Learning Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-slate-100 aspect-4/3 sm:aspect-16/10 lg:aspect-4/3">
              <img
                src="https://i.postimg.cc/sxjLQ5CY/lothero.png"
                alt="Aprantisaj Global & Fòmasyon Kominote Online"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right: Our Story Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/90 space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold text-[#0056D2] tracking-wider">
                  Istwa &amp; Fondasyon Nou
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Kominote Online: Aprantisaj Pratik pou Tout Kominote a
                </h2>
              </div>

              <div className="text-slate-600 text-sm leading-relaxed space-y-4">
                <p>
                  Kominote Online fèt avèk yon konviksyon solid: <strong>lang Kreyòl Ayisyen an se yon zouti pwisan pou aprantisaj segondè, syantifik, ak pwofesyonèl</strong>.
                </p>
                <p>
                  Nou se yon akademi fòmasyon prive kote chak kou seleksyone e sipèvize pou bay konesans pratik: automatisation ak AI, devlopman web, sante, ak modèl biznis sou entènèt. Nou retire tout teyori initil pou nou konsantre sou sa ki vrèman ede elèv yo avanse.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-1">
                  <span className="text-2xl font-black text-[#0056D2]">100%</span>
                  <p className="text-xs font-bold text-slate-700">An Kreyòl Ayisyen</p>
                </div>
                <div className="space-y-1">
                  <span className="text-2xl font-black text-[#0056D2]">Ofisyèl</span>
                  <p className="text-xs font-bold text-slate-700">Sètifika Verifye</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. MISSION & VISION GRID (Baz Done Managed) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Mission Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-200 space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0056D2] flex items-center justify-center font-black">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Misyon Nou</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {content.mission || 'Bay tout Ayisyen nan peyi a ak nan dyaspora a aksè ak pi bon fòmasyon pwofesyonèl ak teknolojik nan pwòp lang manman yo pou yo ka ogmante revni yo epi bati karyè dirab.'}
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-slate-200 space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Vizyon Nou</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {content.vision || 'Vin pi gwo akademi fòmasyon sou entènèt an Kreyòl Ayisyen nan mond lan, kote konesans pratik transfòme an reyisit finansye ak endepandans pwofesyonèl.'}
            </p>
          </div>
        </div>

        {/* 4. REAL FOUNDER PROFILE SECTION (Dynamically managed from baz done yo CMS) */}
        {founder && (
          <div className="space-y-8 max-w-6xl mx-auto">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs uppercase font-extrabold text-[#0056D2] tracking-wider">
                Lidèchip &amp; Fondasyon
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Moun Dèyè Vizyon an
              </h2>
            </div>

            {/* Premium Clean Founder Card */}
            <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden relative">
              <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700" />

              <div className="p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* Large Professional Portrait */}
                <div className="lg:col-span-5 flex justify-center">
                  <div className="relative w-64 h-72 sm:w-72 sm:h-80 lg:w-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl border-4 border-white ring-1 ring-slate-200/80 bg-slate-50 shrink-0">
                    <img
                      src={founder.photo || 'https://i.postimg.cc/vH7SzM7b/6.png'}
                      alt={founder.name}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Founder Bio & Organization Details */}
                <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#0056D2] border border-blue-100 text-xs font-bold uppercase tracking-wider">
                      {founder.role || 'Fondatè Kominote Online'}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {founder.name}
                    </h3>
                    {founder.professional_title && (
                      <p className="text-sm sm:text-base font-semibold text-blue-700">
                        {founder.professional_title}
                      </p>
                    )}
                  </div>

                  {/* Organizations Badges */}
                  {founder.organizations && founder.organizations.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
                      {founder.organizations.map((org, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 bg-slate-50 hover:bg-blue-50/50 border border-slate-200/90 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                        >
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{org}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Haitian Creole Biography */}
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                    {founder.bio}
                  </p>

                  {/* Social links (if configured) */}
                  {founder.social_links && (founder.social_links.linkedin || founder.social_links.twitter || founder.social_links.facebook) && (
                    <div className="flex items-center justify-center lg:justify-start gap-3 pt-2 text-slate-400">
                      {founder.social_links.linkedin && (
                        <a href={founder.social_links.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:text-blue-700 hover:border-blue-300 transition-all">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {founder.social_links.twitter && (
                        <a href={founder.social_links.twitter} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:text-blue-500 hover:border-blue-300 transition-all">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {founder.social_links.facebook && (
                        <a href={founder.social_links.facebook} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:text-blue-600 hover:border-blue-300 transition-all">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Team Grid (Only shown if Admin adds additional real team members) */}
            {otherMembers.length > 0 && (
              <div className="pt-8 space-y-6">
                <h4 className="text-xl font-bold text-slate-900 text-center">
                  Lòt Manm Ekip la
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherMembers.map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col items-center text-center space-y-4"
                    >
                      <div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 shadow-md">
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-extrabold text-slate-900">{member.name}</h3>
                        <span className="text-xs font-bold text-[#0056D2] block">{member.role}</span>
                        {member.professional_title && (
                          <p className="text-[11px] text-slate-500">{member.professional_title}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {member.bio}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. CALL TO ACTION */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-14 text-white text-center shadow-2xl max-w-4xl mx-auto space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black">Pare pou Kòmanse Fòmasyon w?</h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Antre nan kominote a jodi a epi kòmanse metrize zouti AI ak teknoloji modèn yo an Kreyòl.
            </p>
          </div>

          <button
            onClick={() => navigate('courses')}
            className="px-8 py-3.5 bg-white text-[#0056D2] font-black rounded-2xl text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-xl active:scale-98 cursor-pointer inline-flex items-center gap-2"
          >
            <span>Eksplore Fòmasyon yo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
