import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { SEOHead } from '../components/seo/SEOHead';
import { Home, ShoppingBag, BookOpen, SearchX } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <>
      <SEOHead title="Paj Sa a Pa Egziste" description="Paj ou chache a pa egziste oswa li pa disponib." canonical="/404" noindex />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto">
            <SearchX className="w-10 h-10 text-rose-500" />
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">404</h1>
            <h2 className="text-xl font-bold text-slate-700">Paj sa a pa egziste.</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              URL ou eseye ouvri a pa jwenn sou platfòm Kominote Online a. Tanpri tcheke adrès la oswa itilize youn nan bouton ki anba yo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => navigate('home')}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Retounen Akèy
            </button>
            <button
              onClick={() => navigate('shop')}
              className="px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Ale nan Shop
            </button>
            <button
              onClick={() => navigate('courses')}
              className="px-6 py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Kou yo
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
