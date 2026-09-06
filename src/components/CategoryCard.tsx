import React from 'react';
import { Category } from '../types/database';
import { useNavigation } from '../context/NavigationContext';
import { Code2, Cpu, TrendingUp, Briefcase, Palette, DollarSign, ArrowUpRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { navigate } = useNavigation();

  const getIcon = (slug: string) => {
    switch (slug) {
      case 'teknoloji-pwogramasyon':
        return <Code2 className="w-6 h-6 text-blue-600" />;
      case 'entelijans-atifisyel':
        return <Cpu className="w-6 h-6 text-indigo-600" />;
      case 'maketing-dijital':
        return <TrendingUp className="w-6 h-6 text-emerald-600" />;
      case 'biznis-antreprenarya':
        return <Briefcase className="w-6 h-6 text-amber-600" />;
      case 'ui-ux-grafik-design':
        return <Palette className="w-6 h-6 text-fuchsia-600" />;
      case 'finans-ecommerce':
        return <DollarSign className="w-6 h-6 text-cyan-600" />;
      default:
        return <Code2 className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div
      onClick={() => navigate('courses', { category: category.slug })}
      className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
            {getIcon(category.slug)}
          </div>
          <span className="text-slate-400 group-hover:text-blue-700 transition-colors">
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>

        <h3 className="font-bold text-base text-slate-800 group-hover:text-blue-700 transition-colors mb-1.5">
          {category.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {category.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md text-[11px]">
          {category.course_count || 5} kou
        </span>
        <span className="text-slate-500 font-medium group-hover:text-blue-700 transition-colors text-xs">
          Eksplore &rarr;
        </span>
      </div>
    </div>
  );
};
