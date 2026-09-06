import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { coursesService, categoriesService } from '../services/firebaseService';
import { Course, Category } from '../types/database';
import { CourseCard } from '../components/CourseCard';
import { Search, Filter, BookOpen, Sparkles, X } from 'lucide-react';

export const CoursesPage: React.FC = () => {
  const { params } = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'rating'>('popular');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cList, catList] = await Promise.all([
          coursesService.getAll({ publishedOnly: true }),
          categoriesService.getAll(),
        ]);
        setCourses(cList || []);
        setCategories(catList || []);
      } catch (err) {
        console.error('Error loading courses from Firestore:', err);
        setCourses([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses
      .filter((course) => {
        const matchesCategory =
          selectedCategory === 'all' || course.category?.slug === selectedCategory || course.category_id === selectedCategory;

        const matchesLevel =
          selectedLevel === 'all' || course.level === selectedLevel || course.level === 'Tout Nivo';

        const matchesSearch =
          searchQuery.trim() === '' ||
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesLevel && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return (a.sale_price ?? a.price) - (b.sale_price ?? b.price);
        }
        if (sortBy === 'rating') {
          return (b.rating || 5) - (a.rating || 5);
        }
        return (b.students_count || 0) - (a.students_count || 0);
      });
  }, [courses, selectedCategory, selectedLevel, searchQuery, sortBy]);

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Katalòg Fòmasyon
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tout Kou yo sou Kominote Online
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Chwazi nan lis fòmasyon pwofesyonèl nou yo, aprann pratik, epi bati nouvo opòtinite.
          </p>
        </div>

        {/* Official Education Promotional Section (Hero 3) */}
        <div className="mb-10 bg-gradient-to-r from-blue-900 via-[#0056D2] to-blue-800 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl overflow-hidden relative border border-blue-400/20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Fòmasyon Pwofesyonèl &amp; Kalifye
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                Devlope Nouvo Konpetans Dijital ak AI
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-xl">
                Chak fòmasyon sou Kominote Online fèt pou ba ou konesans dirèk, pratik, ak sètifikasyon verifye pou devlope pwojè w oswa ranfòse karyè w.
              </p>
              <div className="pt-1 flex flex-wrap gap-4 text-xs font-semibold text-blue-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  100% an Kreyòl Ayisyen
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Sètifika Verifye
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Aksè a Vi
                </span>
              </div>
            </div>

            {/* Official Hero 3 Asset */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-blue-950/40 aspect-4/3 sm:aspect-16/10">
                <img
                  src="https://i.postimg.cc/Pxzc529V/hero3.png"
                  alt="Kominote Online — Edikasyon &amp; Fòmasyon Pwofesyonèl"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs mb-8 space-y-4">
          {/* Top Row: Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-courses-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chèche yon kou, sijè, oswa enstriktè..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Level & Sort Selectors */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="all">Tout Nivo</option>
                <option value="Kòmansan">Kòmansan</option>
                <option value="Entèmedyè">Entèmedyè</option>
                <option value="Avanse">Avanse</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="popular">Pi Popilè</option>
                <option value="rating">Pi Bon Nòt</option>
                <option value="price-asc">Pri ki Pi Ba</option>
              </select>
            </div>
          </div>

          {/* Category Pills Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0056D2] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tout Kou yo ({courses.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-[#0056D2] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Chaje fòmasyon yo nan Firestore...</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">
              {courses.length === 0 ? 'Pa gen kou disponib pou kounye a' : 'Pa gen kou ki koresponn'}
            </h3>
            <p className="text-xs text-slate-500">
              {courses.length === 0
                ? 'Poko gen okenn fòmasyon ki pibliye nan platfòm lan. Wanky ak ekip li a ap prepare nouvo kontni yo.'
                : 'Eseye modifye rechèch ou an oswa chwazi yon lòt kategori fòmasyon.'}
            </p>
            {courses.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setSelectedLevel('all');
                }}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Reyinisyalize Filtè yo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
