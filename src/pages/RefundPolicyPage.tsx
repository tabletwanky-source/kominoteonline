import React from 'react';
import { RotateCcw, Mail, Phone, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';

export const RefundPolicyPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Garanti & Ranbousman</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Politik Ranbousman (Refund Policy)
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mizajou: 2026</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Transparans & Satisfaksyon Kliyan</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Angajman Nou sou Kalite</h2>
            <p>
              Sou <strong>{PLATFORM_INFO.name}</strong>, misyon nou se bay fòmasyon pratik, pwofesyonèl, ak kalite siperyè an Kreyòl Ayisyen. Nou vle pou chak elèv ki envesti tan li ak lajan li jwenn rezilta reyèl.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Delè & Kondisyon pou Ranbousman</h2>
            <p>
              Nou ofri yon garanti satisfaksyon oswa ranbousman sou kou nou yo an akò ak prensip sa yo:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Demann ranbousman an dwe fèt nan lespas <strong>14 jou</strong> apre dat acha kou a.</li>
              <li>Pou kalifye pou yon ranbousman konplè, elèv la pa dwe konsome plis pase <strong>25%</strong> nan leson videyo fòmasyon an, epi li pa dwe telechaje tout resous kòd oswa sètifika ofisyèl la.</li>
              <li>Ranbousman an trete sou menm mòd peman ou te itilize lè w t ap achte kou a (Kat debi/kredi, PayPal, elatriye).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Kijan pou Fè yon Demann Ranbousman</h2>
            <p>
              Pou soumèt yon demann ranbousman, tou senpleman voye yon imèl bay <strong>{PLATFORM_INFO.email}</strong> avèk:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
              <li>Non konplè w ak imèl ki asosye ak kont elèv ou an.</li>
              <li>Tit kou ou te achte a.</li>
              <li>Rezon demann lan (sa ap ede nou amelyore kalite fòmasyon nou yo).</li>
            </ol>
            <p className="text-xs text-slate-500 pt-1">
              Ekip sipò nou an ap analize demann ou an epi reponn ou nan lespas 24 a 48 èdtan ouvrab.
            </p>
          </section>

          {/* Official Contact Box */}
          <section className="pt-6 border-t border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">4. Kontak Ofisyèl Sipò & Ranbousman</h2>
            <p className="text-slate-600">
              Pou nenpòt asistans sou peman oswa ranbousman, tanpri kontakte nou dirèkteman:
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
