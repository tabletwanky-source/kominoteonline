import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Plus, Minus, MessageCircle } from 'lucide-react';
import { PLATFORM_INFO } from '../data/platformInfo';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      q: 'Kouman pou mwen enskri nan yon fòmasyon sou Kominote Online?',
      a: 'Ou ka klike sou bouton "Tout Kou" nan meni an, chwazi fòmasyon ki enterese w la, epi klike sou "Enskri Kounye a". Ou ka peye fasilman ak Kat Kredi/Debi, PayPal, oswa metòd lokal tankou MonCash.',
    },
    {
      q: 'Èske kou yo fèt an Kreyòl Ayisyen 100%?',
      a: 'Wi! Tout fòmasyon sou Kominote Online prepare an Kreyòl klè, dirèk, e pwofesyonèl pou pèmèt ou konprann tout konsèp yo san okenn baryè langaj.',
    },
    {
      q: 'Kijan m ap fè pou m jwenn aksè nan leson yo apre m fin peye?',
      a: 'Aksè a otomatik e imedyat. Le pli vit ke peman ou konfime, kou a ap disponib nan tablodbò elèv ou an ("Kou Mwen yo") epi ou gen aksè a vi (Lifetime Access).',
    },
    {
      q: 'Èske m ap jwenn yon sètifika apre mwen fini kou a?',
      a: 'Wi, lè w konplete tout modil ak egzèsis yo, w ap resevwa yon sètifika ofisyèl Kominote Online ke w ka telechaje, enprime, oswa pataje sou LinkedIn.',
    },
    {
      q: 'Ki delè pou ekip sipò a reponn mesaj mwen an?',
      a: 'Ekip sipò nou an reponn nan mwens pase 4 èdtan pandan jou ouvrab. Ou ka kontakte nou tou dirèkteman sou WhatsApp pou asistans rapid.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* ========================================================= */}
      {/* 1. HERO BANNER: Classic Rich Blue Page Model              */}
      {/* ========================================================= */}
      <section className="bg-[#0056D2] text-white py-16 sm:py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Bezwen Èd?
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Nou la pou reponn tout kesyon ou genyen sou fòmasyon yo, peman, oswa sipò teknik sou Kominote Online.
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TOP 3 CONTACT CARDS (Matching Screenshot 2)            */}
      {/* ========================================================= */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Call Us 24x7 / Phone */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 text-center border border-slate-100 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full border-2 border-[#0056D2] flex items-center justify-center text-[#0056D2] mb-1">
              <Phone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Rele Nou 24 sou 24, 7 jou sou 7
            </h3>
            <a
              href={`tel:${PLATFORM_INFO.phone.replace(/\s+/g, '')}`}
              className="text-[#0056D2] hover:underline font-semibold text-sm tracking-tight"
            >
              {PLATFORM_INFO.phone}
            </a>
            <p className="text-[11px] text-slate-400">
              Telefòn & WhatsApp
            </p>
          </div>

          {/* Card 2: Write Us / Email */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 text-center border border-slate-100 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full border-2 border-[#0056D2] flex items-center justify-center text-[#0056D2] mb-1">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Ekri Nou
            </h3>
            <a
              href={`mailto:${PLATFORM_INFO.email}`}
              className="text-[#0056D2] hover:underline font-semibold text-sm break-all"
            >
              {PLATFORM_INFO.email}
            </a>
            <p className="text-[11px] text-slate-400">
              Sipò Ofisyèl Kominote Online
            </p>
          </div>

          {/* Card 3: Main Office / Address */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 text-center border border-slate-100 flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full border-2 border-[#0056D2] flex items-center justify-center text-[#0056D2] mb-1">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Biwo Prensipal
            </h3>
            <div className="text-slate-700 text-xs font-semibold leading-snug">
              <p>{PLATFORM_INFO.address.footerFormattedLine1}</p>
              <p>{PLATFORM_INFO.address.footerFormattedLine2}</p>
            </div>
            <p className="text-[11px] text-slate-400">
              {PLATFORM_INFO.address.country}
            </p>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SEND US A MESSAGE FORM (Matching Screenshot 2)         */}
      {/* ========================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Voye yon Mesaj Pou Nou
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ranpli fòmilè a pou voye mesaj ou dirèkteman bay ekip sipò Kominote Online.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200/90 shadow-md">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Mèsi pou Mesaj Ou a!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Nou resevwa mesaj ou an avèk siksè. Yon manm nan ekip Kominote Online ap reponn ou sou imèl <strong>{formData.email}</strong> oswa sou telefòn ou trè byento.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Voye yon lòt mesaj
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label htmlFor="input-full-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Non Konplè <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-full-name"
                  type="text"
                  required
                  placeholder="Eg: Jean-Luc Pierre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0056D2] focus:bg-white transition-all"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Imèl <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-email"
                    type="email"
                    required
                    placeholder="oumenm@egzanp.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0056D2] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="input-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Telefòn / WhatsApp
                  </label>
                  <input
                    id="input-phone"
                    type="tel"
                    placeholder="+1 829... oswa nimewo w"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0056D2] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="input-subject" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sijè
                </label>
                <input
                  id="input-subject"
                  type="text"
                  required
                  placeholder="Ki sijè demann ou an?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0056D2] focus:bg-white transition-all"
                />
              </div>

              {/* Comment or Message */}
              <div>
                <label htmlFor="input-message" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mesaj oswa Kòmantè <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="input-message"
                  rows={4}
                  required
                  placeholder="Ekri mesaj ou an detay isit la..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0056D2] focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Send Button */}
              <div className="pt-2">
                <button
                  id="btn-send-message"
                  type="submit"
                  className="px-8 py-3 rounded-lg font-bold text-sm text-white bg-[#0056D2] hover:bg-blue-700 active:scale-98 transition-all shadow-md shadow-blue-700/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Voye Mesaj</span>
                </button>
              </div>

            </form>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. FREQUENTLY ASKED QUESTIONS (Matching Screenshot 2)     */}
      {/* ========================================================= */}
      <section className="py-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        
        {/* Framed Section Header (Page Model Signature) */}
        <div className="border border-slate-300 bg-white/70 px-8 py-4 text-center rounded-sm mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Kesyon Moun Poze Souvan
          </h2>
        </div>

        {/* Accordion List */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="transition-colors">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-800 hover:text-[#0056D2] transition-colors cursor-pointer"
                >
                  <span className={isOpen ? 'text-[#0056D2]' : ''}>
                    {faq.q}
                  </span>
                  <span className="shrink-0 text-[#0056D2] p-1">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/60 border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </section>

    </div>
  );
};
