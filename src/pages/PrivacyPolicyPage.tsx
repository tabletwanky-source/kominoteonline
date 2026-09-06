import React from 'react';
import { Shield, Mail, Phone, MapPin, Calendar, Lock } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Dokiman Legal Ofisyèl</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Politik Konfidansyalite (Privacy Policy)
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dènye mizajou: 2026</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sekirite & Pwoteksyon Done</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Entwodiksyon</h2>
            <p>
              Byenvini sou <strong>{PLATFORM_INFO.name}</strong>. Nou pran pwoteksyon lavi prive w ak done pèsonèl ou trè oserye. Dokiman sa a eksplike kijan nou ranmase, itilize, epi pwoteje enfòmasyon w lè w ap itilize platfòm e-learning nou an pou w enskri nan kou yo oswa kominike avèk nou.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Enfòmasyon Nou Ranmase</h2>
            <p>Lè w kreye yon kont elèv, achte yon fòmasyon, oswa kontakte sipò nou an, nou ka kolekte:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Enfòmasyon Idantite:</strong> Non konplè, adrès imèl, nimewo telefòn.</li>
              <li><strong>Enfòmasyon sou Kont & Kou:</strong> Kou ou enskri ladan yo, pwogrè nan leson yo, sètifika ou resevwa.</li>
              <li><strong>Done Peman:</strong> Tranzaksyon yo trete atravè platfòm peman sekirize (nou pa janm konsève nimewo kat kredi konplè w sou sèvè nou yo).</li>
              <li><strong>Done Teknik:</strong> Adrès IP, kalite navigatè, ak estatistik lekti videyo pou amelyore esperyans aprantisaj la.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Kijan Nou Itilize Done Ou yo</h2>
            <p>Nou itilize enfòmasyon sa yo sèlman pou:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Fasilite aksè w nan leson videyo ak materyèl kou yo.</li>
              <li>Jenere sètifika reyisit ofisyèl ou yo sou non w.</li>
              <li>Reponn demann sipò teknik ak kesyon pedagojik ou yo.</li>
              <li>Voye notifikasyon enpòtan sou kou ou enskri yo.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Pwoteksyon ak Pataj Done</h2>
            <p>
              <strong>{PLATFORM_INFO.name}</strong> pa janm vann, lwe, oswa pataje done pèsonèl ou ak konpayi piblisite twazyèm pati. Tout done yo chiffres pandan transmisyon an lè l sèvi avèk pwotokòl sekirite modèn SSL/TLS.
            </p>
          </section>

          {/* Official Contact Box */}
          <section className="pt-6 border-t border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">5. Kijan pou Kontakte Nou</h2>
            <p className="text-slate-600">
              Pou nenpòt kesyon sou politik sa a, oswa pou egzèse dwa w sou done pèsonèl ou, tanpri kontakte nou atravè kowòdone ofisyèl sa yo:
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
  );
};
