import React, { useState, useEffect } from 'react';
import { categoriesService } from '../services/firebaseService';
import { Category } from '../types/database';
import { CategoryCard } from '../components/CategoryCard';
import { useNavigation } from '../context/NavigationContext';
import { Layers, ArrowRight } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { navigate } = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCats() {
      try {
        setLoading(true);
        const list = await categoriesService.getAll();
        setCategories(list || []);
      } catch (err) {
        console.error('Error loading categories from Firestore:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    loadCats();
  }, []);

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Eksplore pa Domèn
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kategori Fòmasyon yo
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Chwazi domèn kote ou vle devlope konpetans ou jodi a epi dekouvri kou ki koresponn yo.
          </p>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">Chaje kategori yo nan Firestore...</p>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Poko gen kategori ki anrejistre</h3>
            <p className="text-xs text-slate-500">
              Administrasyon an ap mete ajou kategori fòmasyon yo talè konsa.
            </p>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-extrabold">Ou pa jwenn sijè ou t ap chèche a?</h3>
            <p className="text-blue-100 text-sm max-w-xl">
              Nou ajoute nouvo kou chak semèn. Fè nou konnen ki konpetans ou ta renmen aprann oswa vin yon enstriktè sou Kominote Online.
            </p>
          </div>
          <button
            onClick={() => navigate('contact')}
            className="px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold text-sm shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Pwopoze yon Kou</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
