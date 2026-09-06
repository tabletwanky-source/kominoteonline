import React from 'react';
import { FileText, Mail, Phone, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';

export const TermsConditionsPage: React.FC = () => {
  return (
    <div className="py-12 sm:py-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Kondisyon & Règleman</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tèm & Kondisyon Itilizasyon (Terms & Conditions)
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Mizajou: 2026</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Platfòm Prive Kominote Online</span>
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-sm space-y-8 text-sm text-slate-700 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">1. Akseptasyon Kondisyon yo</h2>
            <p>
              Lè w kreye yon kont oswa achte yon kou sou <strong>{PLATFORM_INFO.name}</strong>, ou dakò pou respekte tout tèm ak kondisyon ki endike nan dokiman sa a. Si w pa dakò ak nenpòt pati nan kondisyon sa yo, ou pa dwe itilize platfòm nan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">2. Nati Platfòm nan & Estrikti Kont</h2>
            <p>
              <strong>{PLATFORM_INFO.name}</strong> se yon platfòm prive dedye a fòmasyon sou entènèt an Kreyòl Ayisyen.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Enskripsyon piblik ouvri sèlman pou elèv kap aprann.</li>
              <li>Kont enstriktè ak kont administratè yo se kont prive ke jesyon platfòm nan otorize e kreye manyèlman.</li>
              <li>Ou responsab pou kenbe sekrè modpas ou ak tout aktivite ki pase sou kont pèsonèl ou.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">3. Pwopriyete Entelektyèl & Dwa Otè</h2>
            <p>
              Tout kontni ki disponib sou {PLATFORM_INFO.name}—enkli leson videyo, tèks, kòd sous, resous telechajab, grafik, ak sètifika—se pwopriyete eksklizif {PLATFORM_INFO.name} oswa enstriktè ki prepare yo. Li entèdi fòmèlman pou telechaje videyo yo pou redistribye yo, revann yo, oswa pataje kont ou ak lòt moun.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">4. Peman & Aksè</h2>
            <p>
              Lè w peye pou yon fòmasyon, ou jwenn yon lisans pèsonèl ak aksè a vi (Lifetime) nan leson fòmasyon sa a toutotan platfòm nan ap fonksyone.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">5. Kòd Konpòtman Kominote a</h2>
            <p>
              Nou egzije respè mityèl nan tout espas echanj, kòmantè, ak sesyon Q&A. Nenpòt konpòtman ki gen difamasyon, arasman, oswa kontni deplase ka lakòz sispansyon kont san avètisman.
            </p>
          </section>

          {/* Official Contact Box */}
          <section className="pt-6 border-t border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">6. Kesyon & Sipò Ofisyèl</h2>
            <p className="text-slate-600">
              Pou nenpòt kesyon sou tèm sa yo, ou ka kontakte biwo administrasyon {PLATFORM_INFO.name} dirèkteman:
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
