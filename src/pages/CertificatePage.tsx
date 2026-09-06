import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { certificatesService } from '../services/firebaseService';
import { Certificate } from '../types/database';
import { Award, CheckCircle2, Printer, Share2, ArrowLeft, ShieldCheck, ExternalLink, QrCode } from 'lucide-react';

export const CertificatePage: React.FC = () => {
  const { params, navigate, goBack } = useNavigation();
  const { user } = useAuth();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCertificate() {
      if (!params.id) {
        navigate('student-dashboard');
        return;
      }
      try {
        setLoading(true);
        const data = await certificatesService.getByUniqueId(params.id);
        setCert(data);
      } catch (err) {
        console.error('Failed to load certificate:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();
  }, [params.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!cert) return;
    const url = `${window.location.origin}/verify/${cert.certificate_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chaje sètifika a...</p>
        </div>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl text-center border border-slate-800 space-y-4">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold">Sètifika Pa Jwenn</h2>
          <p className="text-slate-400 text-xs">
            Sètifika sa a poko debloke oswa li pa egziste nan baz done nou an. Ou dwe konplete 100% nan leson kou a pou w jwenn aksè.
          </p>
          <button
            onClick={() => navigate('student-dashboard')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Retounen nan Dashboard
          </button>
        </div>
      </div>
    );
  }

  const verificationUrl = `${window.location.origin}/verify/${cert.certificate_id}`;

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Action Bar */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => goBack()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retounen</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? 'Lyen Kopye!' : 'Pataje Lyen Verifikasyon'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Enprime / Telechaje PDF</span>
          </button>
        </div>
      </div>

      {/* OFFICIAL CERTIFICATE FRAME */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 rounded-3xl shadow-2xl p-8 sm:p-14 border-8 border-slate-900 relative overflow-hidden print:p-8 print:shadow-none print:border-4">
        {/* Subtle Decorative Guilloché Watermark */}
        <div className="absolute inset-4 border-2 border-amber-500/40 rounded-2xl pointer-events-none" />
        <div className="absolute inset-6 border border-slate-200 rounded-xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#0056D2] text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
              K
            </div>
            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
              Kominote Online
            </span>
          </div>

          <span className="text-[11px] uppercase tracking-[0.25em] font-extrabold text-[#0056D2]">
            Akademi Fòmasyon Pratik an Kreyòl Ayisyen
          </span>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase pt-2">
            Sètifika Finisyon ak Siksè
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 italic max-w-lg mx-auto">
            Dokiman sa a sètifye ke moun ki gen non li anba a te swiv epi metrize tout modil, leson, ak pwojè pratik yo.
          </p>
        </div>

        {/* Recipient Name */}
        <div className="my-10 text-center relative z-10">
          <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-1">
            Bay Ofisyèlman Bay:
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#0056D2] tracking-tight border-b-2 border-slate-200 pb-4 inline-block px-8">
            {cert.student_name}
          </h2>
        </div>

        {/* Course Details */}
        <div className="text-center space-y-2 max-w-2xl mx-auto relative z-10">
          <p className="text-xs sm:text-sm text-slate-600">
            Pou siksè li nan konplete tout egzijans akademik ak pratik nan kou:
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            "{cert.course_title}"
          </h3>
          <p className="text-xs text-slate-500">
            Anba direksyon ak sipèvizyon enstriktè <span className="font-bold text-slate-800">{cert.instructor_name}</span>.
          </p>
        </div>

        {/* Signatures & Verification Seal */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-8 items-end relative z-10">
          {/* Signature 1 */}
          <div className="text-center space-y-1">
            <div className="h-12 flex items-center justify-center">
              <span className="font-serif italic text-2xl text-slate-800 font-bold">Wanky</span>
            </div>
            <div className="w-36 h-0.5 bg-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-900">Wanky</p>
            <p className="text-[10px] text-slate-500">Fondatè & CEO, Kominote Online</p>
          </div>

          {/* Official Seal Badge */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg border-2 border-white mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
              Sètifika Valide & Verifye
            </span>
          </div>

          {/* Signature 2 / Date */}
          <div className="text-center space-y-1">
            <div className="h-12 flex items-center justify-center">
              <span className="font-sans font-bold text-sm text-slate-700">{cert.completion_date}</span>
            </div>
            <div className="w-36 h-0.5 bg-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-900">Dat Emisyon</p>
            <p className="text-[10px] text-slate-500 font-mono">ID: {cert.certificate_id}</p>
          </div>
        </div>

        {/* Footer Verification Bar */}
        <div className="mt-10 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2 relative z-10">
          <span>Verifikasyon ofisyèl sou entènèt: {verificationUrl}</span>
          <span>Kominote Online © {new Date().getFullYear()} • Tout dwa rezève.</span>
        </div>
      </div>
    </div>
  );
};
