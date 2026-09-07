import React from 'react';
import { Cookie, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';
import { SEOHead } from '../components/seo/SEOHead';

export const CookiePolicyPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Politik Cookies"
        description="Politik Cookies Kominote Online - konnen kijan nou itilize cookies ak done depo lokal pou amelyore esperyans ou sou platfòm nan."
        canonical="/cookies"
      />
      <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              <Cookie className="w-3.5 h-3.5 text-blue-600" />
              <span>Dokiman Legal Ofisyèl</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Politik Cookies
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Dènye mizajou: 2026</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">1. Entwodiksyon</h2>
              <p>
                <strong>{PLATFORM_INFO.name}</strong> itilize cookies ak teknoloji depo lokal (local storage) pou kenbe sesyon ou, sonje preferans ou, epi garanti ke platfòm nan fonksyone byen. Dokiman sa a eksplike kisa cookies yo fè ak kijan ou ka kontwole yo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">2. Ki Kalite Cookies Nou Itilize</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Cookies Esansyèl (Session):</strong> Sa yo nesesè pou ou konekte nan kont ou epi pou platfòm nan fonksyone. San yo, ou pa kapab konekte oswa konsève panye kòmand ou.</li>
                <li><strong>Cookies Otantikasyon:</strong> Lè w konekte, nou itilize yon cookie sesyon pou verifye idantite ou pandan w ap navige ant paj yo.</li>
                <li><strong>Depo Lokal (Local Storage):</strong> Nou sere preferans ou (tankou lang oswa estati panye kòmand) nan depo lokal navigatè ou a. Sa yo pa cookies tradisyonèl men yo fonksyone san fason.</li>
                <li><strong>PWA / Service Worker:</strong> Kominote Online se yon Aplikasyon Web Pwogresif (PWA). Service Worker la sere kèk fichye estatik (tankou paj HTML ak ikòn) pou aplikasyon an ka chaje pi vit epi mache konekte sou entènèt. Sa yo pa swiv aktivite w.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">3. Cookies Analitik</h2>
              <p>
                Kounye a, <strong>{PLATFORM_INFO.name}</strong> pa itilize okenn sèvis analitik twazyèm pati (tankou Google Analytics) pou swiv aktivite itilizatè yo. Si sa chanje nan lavni, nou ap mete ajou dokiman sa a epi mande konsantman ou anvan ou aktive yo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">4. Cookies Twazyèm Pati</h2>
              <p>
                Nou pa pataje cookies ak rezo sosyal oswa konpayi piblisite. Lè w ap peye ak Stripe, pwovizè peman nou an, ka mete cookies pwòp li yo sou aparèy ou a pou sekirite tranzaksyon an. Nou pa kontwole cookies Stripe yo.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">5. Kijan pou Jere Cookies</h2>
              <p>
                Ou kapab kontwole oswa efase cookies nan paramèt navigatè ou a. Men kèk gid jeneral:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Nan <strong>Chrome</strong>: Paramèt → Konfidansyalite ak Sekirite → Cookies.</li>
                <li>Nan <strong>Firefox</strong>: Paramèt → Konfidansyalite ak Sekirite → Cookies ak Done Sit.</li>
                <li>Nan <strong>Safari</strong>: Preferans → Konfidansyalite → Jere done sit.</li>
                <li>Nan <strong>Edge</strong>: Paramèt → Cookies ak pèmisyon sit.</li>
              </ul>
              <p className="text-xs text-slate-500 pt-1">
                Si ou dezaktive cookies esansyèl yo, ou pa kapab konekte oswa fè acha sou platfòm nan.
              </p>
            </section>

            <section className="pt-6 border-t border-slate-200 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">6. Kontakte Nou</h2>
              <p className="text-slate-600">
                Pou nenpòt kesyon sou politik cookies sa a, tanpri kontakte nou:
              </p>

              <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-3">
                <p className="font-extrabold text-base text-white">{PLATFORM_INFO.name}</p>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <a href={`mailto:${PLATFORM_INFO.email}`} className="hover:text-blue-300 font-semibold text-white">
                      {PLATFORM_INFO.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                    <a href={`tel:${PLATFORM_INFO.phone.replace(/\s+/g, '')}`} className="hover:text-blue-300 font-semibold text-white">
                      {PLATFORM_INFO.phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">{PLATFORM_INFO.address.footerFormattedLine1}</p>
                      <p className="text-slate-300">{PLATFORM_INFO.address.footerFormattedLine2}</p>
                      <p className="text-slate-400">{PLATFORM_INFO.address.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
};
