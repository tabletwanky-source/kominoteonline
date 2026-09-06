import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { coursesService, categoriesService } from '../../services/firebaseService';
import { Course, Category } from '../../types/database';
import {
  DollarSign,
  Users,
  GraduationCap,
  Star,
  PlusCircle,
  TrendingUp,
  Edit,
  Eye,
  CheckCircle2,
  Upload,
  Calendar,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [createdNotice, setCreatedNotice] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cList, catList] = await Promise.all([
          coursesService.getAll(),
          categoriesService.getAll()
        ]);
        setCourses(cList || []);
        setCategories(catList || []);
      } catch (err) {
        console.error('Error loading instructor data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Determine which courses belong to this instructor
  const myCourses = courses.filter((c) => {
    if (!user) return true;
    if (user.role === 'admin' || user.full_name?.toLowerCase().includes('wanky')) {
      return true; // Admin can see all courses
    }
    return (
      c.instructor_id === user.id ||
      c.instructor?.email === user.email ||
      c.instructor?.full_name?.toLowerCase() === user.full_name?.toLowerCase()
    );
  });

  const displayedCourses = myCourses;

  // Calculation of metrics
  const totalStudents = displayedCourses.reduce((acc, c) => acc + (c.students_count || 0), 0);
  const totalRevenue = displayedCourses.reduce(
    (acc, c) => acc + (c.students_count || 0) * (c.sale_price ?? c.price ?? 0),
    0
  );
  const averageRating =
    displayedCourses.length > 0
      ? (
          displayedCourses.reduce((acc, c) => acc + (c.rating || 5), 0) / displayedCourses.length
        ).toFixed(2)
      : '5.0';

  // New course form state
  const [newCourse, setNewCourse] = useState({
    title: '',
    category_id: '',
    price: '29.99',
    level: 'Kòmansan',
    description: '',
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title) return;

    const matchedCat = categories.find((cat) => cat.id === newCourse.category_id) || categories[0];
    const catId = newCourse.category_id || (matchedCat ? matchedCat.id : 'cat-tech');

    const assignedInstructor = {
      id: user?.id || 'inst-wanky',
      full_name: user?.full_name || 'Wanky',
      email: user?.email || 'wanky@kominote.online',
      role: 'instructor' as const,
      headline: 'Enstriktè Otorize pa Wanky',
      bio: 'Enstriktè sou Kominote Online.',
      avatar_url: user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };

    const newCourseObj: Omit<Course, 'id'> = {
      title: newCourse.title,
      slug: newCourse.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: newCourse.description,
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      price: parseFloat(newCourse.price) || 0,
      level: newCourse.level as any,
      category_id: catId,
      category: matchedCat,
      instructor_id: assignedInstructor.id,
      instructor: assignedInstructor,
      students_count: 0,
      rating: 5.0,
      duration_hours: 4,
      total_lessons: 12,
      featured: false,
      status: 'published',
      certificate_enabled: true,
      requirements: ['Koneksyon entènèt', 'Motivasyon'],
      learning_outcomes: ['Konpetans pratik nan domèn nan'],
      created_at: new Date().toISOString(),
    };

    try {
      const created = await coursesService.create(newCourseObj as any);
      setCourses([created, ...courses]);
      setCreatedNotice(true);

      setTimeout(() => {
        setCreatedNotice(false);
        setActiveSection('my-courses');
        setNewCourse({
          title: '',
          category_id: '',
          price: '29.99',
          level: 'Kòmansan',
          description: '',
        });
      }, 1200);
    } catch (err) {
      console.error('Error creating course:', err);
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview':
        return 'Overview Enstriktè';
      case 'my-courses':
        return 'Kou Mwen yo';
      case 'create-course':
        return 'Kreye yon Nouvo Kou';
      case 'students':
        return 'Elèv Mwen yo';
      case 'revenue':
        return 'Revni & Peman';
      case 'profile':
        return 'Profil Enstriktè';
      default:
        return 'Espace Enstriktè';
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      title={getSectionTitle()}
      subtitle={`Byenvini nan panèl enstriktè Kominote Online, ${user?.full_name || 'Enstriktè'}.`}
    >
      {/* Authorized Badge Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
              Kont Enstriktè Otorize pa Wanky
            </p>
            <p className="text-xs text-indigo-800">
              Kominote Online se yon akademi prive. Ou gen privilèj pou pibliye kou ak anseye elèv kominote a.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-white text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 shadow-2xs">
          Otorizasyon Aktif
        </span>
      </div>

      {/* SECTION 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-8">
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Revni Total Estimé</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18% mwa sa a</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Elèv Enskri</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {totalStudents.toLocaleString()}
              </p>
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Nan tout fòmasyon w yo</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Kou Asiyen / Pibliye</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {displayedCourses.length}
              </p>
              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Kou aktif sou platfòm nan</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Nòt Mwayèn</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                {averageRating} / 5.0
              </p>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Apresiyasyon elèv yo</span>
              </span>
            </div>
          </div>

          {/* Quick Create CTA Bar */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Ou pare pou pataje yon lòt fòmasyon?</h3>
              <p className="text-xs text-slate-500">
                Pibliye nouvo kou an Kreyòl sou Kominote Online epi elaji enpak pedagojik ou.
              </p>
            </div>
            <button
              onClick={() => setActiveSection('create-course')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kreye yon Nouvo Kou</span>
            </button>
          </div>

          {/* Recent Courses List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Kou Mwen Pibliye yo</h3>
              <button
                onClick={() => setActiveSection('my-courses')}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Gere tout kou yo &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Kou</th>
                    <th className="p-3">Pri</th>
                    <th className="p-3">Elèv</th>
                    <th className="p-3">Nòt</th>
                    <th className="p-3">Estati</th>
                    <th className="p-3 text-right">Aksyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedCourses.slice(0, 4).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <img
                          src={c.thumbnail}
                          alt={c.title}
                          className="w-12 h-8 rounded-lg object-cover"
                        />
                        <span className="font-bold text-slate-900">{c.title}</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {c.price === 0 ? 'Gratis' : `$${c.price.toFixed(2)}`}
                      </td>
                      <td className="p-3">{c.students_count.toLocaleString()}</td>
                      <td className="p-3 text-amber-600 font-bold">{c.rating} ★</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Pibliye
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setActiveSection('my-courses')}
                          className="p-1.5 text-slate-500 hover:text-blue-600 cursor-pointer"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SECTION 2: MY COURSES */}
      {activeSection === 'my-courses' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">
              Tout Kou Asiyen bay {user?.full_name || 'Enstriktè a'} ({displayedCourses.length})
            </h3>
            <button
              onClick={() => setActiveSection('create-course')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ajoute Kou</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCourses.map((c) => (
              <div key={c.id} className="border border-slate-200 rounded-2xl overflow-hidden p-4 space-y-3 bg-white hover:shadow-md transition-shadow">
                <img src={c.thumbnail} alt={c.title} className="w-full aspect-video object-cover rounded-xl" />
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{c.title}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{c.students_count.toLocaleString()} elèv</span>
                  <span className="font-bold text-blue-600">{c.price === 0 ? 'Gratis' : `$${c.price.toFixed(2)}`}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer">
                    Modifye
                  </button>
                  <button className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg cursor-pointer">
                    Leson yo ({c.total_lessons || 8})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CREATE COURSE */}
      {activeSection === 'create-course' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 max-w-3xl">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-900">Kreye yon Nouvo Kou</h3>
            <p className="text-xs text-slate-500">
              Mete enfòmasyon debaz sou kou ou vle pibliye sou Kominote Online.
            </p>
          </div>

          {createdNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Kou a kreye avèk siksè epi ajoute sou platfòm nan! N ap transfere w nan lis kou yo...</span>
            </div>
          )}

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tit Kou a *</label>
              <input
                type="text"
                required
                placeholder="Eg: Aprann Kòde ak Python soti nan zewo"
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={newCourse.category_id}
                  onChange={(e) => setNewCourse({ ...newCourse, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Chwazi yon kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pri ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="29.99 (0 pou Gratis)"
                  value={newCourse.price}
                  onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nivo</label>
                <select
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Kòmansan">Kòmansan</option>
                  <option value="Entèmedyè">Entèmedyè</option>
                  <option value="Avanse">Avanse</option>
                  <option value="Tout Nivo">Tout Nivo</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsyon Detaye</label>
              <textarea
                rows={4}
                required
                placeholder="Eksplike kisa elèv la pral aprann ak pwojè y ap reyalize..."
                value={newCourse.description}
                onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Kreye Kou a Kounye a</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 4: STUDENTS */}
      {activeSection === 'students' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Elèv ki Enskri nan Kou w yo</h3>
          <p className="text-xs text-slate-500">Lis dènye elèv ki aktif sou fòmasyon w yo.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Elèv</th>
                  <th className="p-3">Kou</th>
                  <th className="p-3">Dat Enskripsyon</th>
                  <th className="p-3">Pwogrè</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">Daphnée Fleurival</td>
                  <td className="p-3">Estrateji Maketing sou Rezo Sosyal</td>
                  <td className="p-3">01 Fev 2026</td>
                  <td className="p-3 font-bold text-blue-600">68%</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Jean Renaud</td>
                  <td className="p-3">Estrateji Maketing sou Rezo Sosyal</td>
                  <td className="p-3">28 Jan 2026</td>
                  <td className="p-3 font-bold text-emerald-600">100% (Sètifye)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-900">Pierre-Louis Marc</td>
                  <td className="p-3">Python pou Tout Moun</td>
                  <td className="p-3">04 Fev 2026</td>
                  <td className="p-3 font-bold text-blue-600">35%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: REVENUE */}
      {activeSection === 'revenue' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Rapò Revni & Peman</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-bold">Total Vant Kou yo</p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-bold">Peman Disponib</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">$1,240.00 USD</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-600 font-bold">Metòd Peman Enstriktè</p>
              <p className="text-sm font-bold text-slate-800 mt-1">MonCash / Bank Transfer</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: PROFILE */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6 max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900">Profil Enstriktè</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Non Enstriktè</label>
              <input
                type="text"
                defaultValue={user?.full_name}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tit / Headline Pwofesyonèl</label>
              <input
                type="text"
                defaultValue="Enstriktè Otorize pa Wanky sou Kominote Online"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
              Mete a jou
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
