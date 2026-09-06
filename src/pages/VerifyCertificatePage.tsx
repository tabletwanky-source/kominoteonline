import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { certificatesService } from '../services/firebaseService';
import { Certificate } from '../types/database';
import { ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Award, Building } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { params, navigate } = useNavigation();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchedId, setSearchedId] = useState(params.certificateId || '');

  useEffect(() => {
    async function verify() {
      if (!params.certificateId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await certificatesService.getByUniqueId(params.certificateId);
        setCert(data);
      } catch (err) {
        console.error('Failed to verify certificate:', err);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [params.certificateId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedId.trim()) return;
    navigate('verify-certificate', { certificateId: searchedId.trim() });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full space-y-8">
        
        {/* Verification Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#0056D2] text-white rounded-2xl shadow-lg mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Verifikasyon Sètifika
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sistèm verifikasyon ofisyèl pou valide otantisite sètifika emèt pa Kominote Online.
          </p>
        </div>

        {/* Verification Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchedId}
            onChange={(e) => setSearchedId(e.target.value)}
            placeholder="Mete Kòd Sètifika a (egz: KO-2026-XXXXX)"
            className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-[#0056D2] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md cursor-pointer"
          >
            Verifye
          </button>
        </form>

        {/* Result Area */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs">N ap verifye nan rejis sètifika Kominote Online...</p>
          </div>
        ) : cert ? (
          /* VERIFIED CERTIFICATE CARD */
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm">Sètifika Otantik & Valide</h3>
                <p className="text-xs text-emerald-700">
                  Dokiman sa a emèt ofisyèlman pa Kominote Online e li anrejistre nan baz done a.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm space-y-3 pt-2">
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Non Elèv la:</span>
                <span className="font-extrabold text-slate-900">{cert.student_name}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500">Kou Konplete:</span>
                <span className="font-extrabold text-slate-900 text-right max-w-xs">{cert.course_title}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500">Enstriktè Kou a:</span>
                <span className="font-bold text-slate-800">{cert.instructor_name}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500">Dat Emisyon:</span>
                <span className="font-bold text-slate-800">{cert.completion_date}</span>
              </div>

              <div className="flex justify-between py-2 font-mono">
                <span className="text-slate-500 font-sans">Kòd Idantifikasyon:</span>
                <span className="font-black text-blue-600">{cert.certificate_id}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-500">Enstitisyon:</span>
                <span className="font-bold text-slate-800">Kominote Online (Wanky)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => navigate('certificate', { id: cert.certificate_id })}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Wè Vèsyon Ofisyèl la</span>
              </button>

              <button
                onClick={() => navigate('courses')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Dekouvri Tout Kou yo
              </button>
            </div>
          </div>
        ) : params.certificateId ? (
          /* NOT FOUND / INVALID */
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sètifika Sa a Pa Valide</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Pa gen okenn sètifika ak kòd <span className="font-mono font-bold text-red-600">"{params.certificateId}"</span> ki anrejistre nan rejis ofisyèl Kominote Online.
            </p>
          </div>
        ) : null}

        {/* Bottom Back link */}
        <div className="text-center">
          <button
            onClick={() => navigate('home')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>Retounen sou paj prensipal la</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
