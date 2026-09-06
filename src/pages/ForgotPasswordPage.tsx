import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from '../components/BrandLogo';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo size="lg" className="justify-center" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          Reyajiste Modpas Ou
        </h2>
        <p className="text-xs text-slate-500">
          Mete imèl ou pou w resevwa yon lyen an sekirite pou kreye yon nouvo modpas.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-slate-200/80 space-y-6">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Lyen an Voye!</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Si gen yon kont ki anrejistre ak <strong>{email}</strong>, ou pral resevwa enstriksyon pou reyajiste modpas ou nan kèk minit.
              </p>
              <button
                onClick={() => navigate('login')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
              >
                Retounen nan Koneksyon
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adrès Imèl Ou</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="oumenm@egzanp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-98 transition-all cursor-pointer"
              >
                Voye Lyen Reyajisteman
              </button>

              <button
                type="button"
                onClick={() => navigate('login')}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retounen nan Paj Koneksyon</span>
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Ou bezwen èd? Ekri sipò:{" "}
                  <a
                    href="mailto:AI@kominote.online"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    AI@kominote.online
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
