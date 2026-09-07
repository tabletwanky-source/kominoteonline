import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  coursesService,
  categoriesService,
  usersService,
  enrollmentsService,
  certificatesService,
  aboutService,
  siteSettingsService,
} from '../../services/firebaseService';
import {
  Course,
  Category,
  Profile,
  Enrollment,
  Certificate,
  AboutPageCMS,
  TeamMember,
  SiteSettings,
  CourseLevel,
} from '../../types/database';
import { CourseBuilderModal } from '../../components/admin/CourseBuilderModal';
import { CoursePreviewVideoSettings } from '../../components/admin/CoursePreviewVideoSettings';
import { AdminOrdersView } from '../../components/admin/AdminOrdersView';
import { AdminCourseRegistrationsView } from '../../components/admin/AdminCourseRegistrationsView';
import { AdminProductsView } from '../../components/admin/AdminProductsView';
import { AdminShopOrdersView } from '../../components/admin/AdminShopOrdersView';
import { AdminPaymentSettingsView } from '../../components/admin/AdminPaymentSettingsView';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Award,
  Sparkles,
  ExternalLink,
  Trash2,
  Edit,
  UserPlus,
  RefreshCw,
  X,
  FileText,
  Star,
  Eye,
  EyeOff,
  UserCheck,
  Search,
  ShoppingBag,
  Video
} from 'lucide-react';

interface AdminDashboardProps {
  initialSection?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialSection }) => {
  const { user } = useAuth();
  const { navigate, params } = useNavigation();
  const [activeSection, setActiveSection] = useState(initialSection || params.section || 'dashboard');
  const [selectedCourseForPreview, setSelectedCourseForPreview] = useState<Course | null>(null);
  const [isPreviewSettingsOpen, setIsPreviewSettingsOpen] = useState(false);

  useEffect(() => {
    if (params.section) {
      setActiveSection(params.section);
    } else if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [params.section, initialSection]);

  // Firestore Data State
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [aboutCMS, setAboutCMS] = useState<AboutPageCMS>({
    id: 'main',
    title: 'About Us',
    description: '',
    mission: '',
    vision: '',
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    id: 'general',
    site_name: 'Kominote Online',
    contact_email: 'wanky7713@gmail.com',
  });

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Modals
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    thumbnail: '',
    category_id: '',
    instructor_id: '',
    level: 'Tout Nivo' as CourseLevel,
    price: 49,
    sale_price: 29,
    duration_hours: 10,
    featured: false,
    certificate_enabled: true,
  });

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedCourseForBuilder, setSelectedCourseForBuilder] = useState<string | null>(null);

  const [isCreateInstructorOpen, setIsCreateInstructorOpen] = useState(false);
  const [newInstructorData, setNewInstructorData] = useState({
    full_name: '',
    email: '',
    headline: '',
    bio: '',
    avatar_url: '',
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'Layers',
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    role: '',
    professional_title: '',
    organizations: '',
    photo: '',
    bio: '',
    display_order: 1,
    is_active: true,
  });

  // Load all data from Firestore
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [cList, catList, instList, stuList, enrList, certList, aboutData, teamList, settingsData] =
        await Promise.all([
          coursesService.getAll(),
          categoriesService.getAll(),
          usersService.getInstructors(),
          usersService.getStudents(),
          enrollmentsService.getAll(),
          certificatesService.getAll(),
          aboutService.getContent(),
          aboutService.getTeamMembers(false),
          siteSettingsService.getSettings(),
        ]);

      setCourses(cList);
      setCategories(catList);
      setInstructors(instList);
      setStudents(stuList);
      setEnrollments(enrList);
      setCertificates(certList);
      if (aboutData) setAboutCMS(aboutData);
      setTeamMembers(teamList);
      if (settingsData) setSiteSettings(settingsData);
    } catch (err) {
      console.error('Failed to load admin data from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (params.section) {
      setActiveSection(params.section);
    }
    if (params.courseId && courses.length > 0) {
      const found = courses.find((c) => c.id === params.courseId || c.slug === params.courseId);
      if (found) {
        setSelectedCourseForPreview(found);
        setIsPreviewSettingsOpen(true);
      }
    }
  }, [params.section, params.courseId, courses]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadAllData();
    triggerNotification('Done Firestore yo rafrechi!');
  };

  // COURSE ACTIONS
  const handleOpenCreateCourse = () => {
    setEditingCourseId(null);
    setCourseFormData({
      title: '',
      slug: '',
      short_description: '',
      description: '',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      category_id: categories[0]?.id || '',
      instructor_id: instructors[0]?.id || user?.id || 'wanky-lead-admin',
      level: 'Tout Nivo',
      price: 49,
      sale_price: 29,
      duration_hours: 10,
      featured: true,
      certificate_enabled: true,
    });
    setIsCreateCourseOpen(true);
  };

  const handleOpenEditCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setCourseFormData({
      title: course.title,
      slug: course.slug,
      short_description: course.short_description || '',
      description: course.description || '',
      thumbnail: course.thumbnail,
      category_id: course.category_id,
      instructor_id: course.instructor_id,
      level: course.level,
      price: course.price,
      sale_price: course.sale_price || 0,
      duration_hours: course.duration_hours || 10,
      featured: course.featured,
      certificate_enabled: course.certificate_enabled ?? true,
    });
    setIsCreateCourseOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugVal = courseFormData.slug.trim()
        ? courseFormData.slug.toLowerCase().replace(/\s+/g, '-')
        : courseFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (editingCourseId) {
        await coursesService.update(editingCourseId, {
          ...courseFormData,
          slug: slugVal,
        });
        triggerNotification('Kou a modifye avèk siksè nan Firestore!');
      } else {
        await coursesService.create({
          ...courseFormData,
          slug: slugVal,
          status: 'published',
          requirements: ['Koneksyon entènèt', 'Motivasyon pou aprann'],
          learning_outcomes: ['Metrize konpetans pratik nan domèn sa a'],
        });
        triggerNotification('Nouvo kou kreye avèk siksè nan Firestore!');
      }
      setIsCreateCourseOpen(false);
      await loadAllData();
    } catch (err) {
      console.error('Error saving course:', err);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    const nextStatus = course.status === 'published' ? 'draft' : 'published';
    await coursesService.update(course.id, { status: nextStatus });
    triggerNotification(`Kou "${course.title}" mete kòm ${nextStatus === 'published' ? 'Pibliye' : 'Brouyon'}!`);
    await loadAllData();
  };

  const handleToggleFeatured = async (course: Course) => {
    const nextVal = !course.featured;
    await coursesService.update(course.id, { featured: nextVal });
    triggerNotification(
      nextVal ? `Kou "${course.title}" ap parèt sou Paj Akèy la kounye a!` : `Kou retire nan pwen cho akèy la.`
    );
    await loadAllData();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Èske ou sèten ou vle efase kou sa a ak tout modil li yo?')) return;
    await coursesService.delete(courseId);
    triggerNotification('Kou a efase nan baz done Firestore a.');
    await loadAllData();
  };

  // INSTRUCTOR CREATION (Admin Only)
  const handleCreateInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructorData.full_name || !newInstructorData.email) return;

    try {
      const created = await usersService.createInstructor(newInstructorData);
      setIsCreateInstructorOpen(false);
      setNewInstructorData({ full_name: '', email: '', headline: '', bio: '', avatar_url: '' });
      triggerNotification(`Kont enstriktè pou "${created.full_name}" kreye nan Firestore!`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // CATEGORY ACTIONS
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slugVal = categoryFormData.slug.trim()
        ? categoryFormData.slug.toLowerCase().replace(/\s+/g, '-')
        : categoryFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      if (editingCategoryId) {
        await categoriesService.update(editingCategoryId, { ...categoryFormData, slug: slugVal });
        triggerNotification('Kategori a modifye!');
      } else {
        await categoriesService.create({ ...categoryFormData, slug: slugVal, course_count: 0 });
        triggerNotification('Nouvo kategori kreye!');
      }
      setIsCategoryModalOpen(false);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!window.confirm('Èske ou vle efase kategori sa a?')) return;
    await categoriesService.delete(catId);
    triggerNotification('Kategori efase!');
    await loadAllData();
  };

  // ABOUT CMS ACTIONS
  const handleSaveAboutCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    await aboutService.saveContent(aboutCMS);
    triggerNotification('Kontni Paj "About Us" la sove nan Firestore avèk siksè!');
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const orgsList = teamFormData.organizations
      ? teamFormData.organizations
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload = {
      name: teamFormData.name.trim(),
      role: teamFormData.role.trim(),
      professional_title: teamFormData.professional_title.trim(),
      organizations: orgsList,
      photo: teamFormData.photo.trim(),
      bio: teamFormData.bio.trim(),
      display_order: Number(teamFormData.display_order) || 1,
      is_active: Boolean(teamFormData.is_active),
    };

    if (editingTeamId) {
      await aboutService.updateTeamMember(editingTeamId, payload);
      triggerNotification('Manm ekip la modifye nan Firestore avèk siksè!');
    } else {
      await aboutService.createTeamMember(payload);
      triggerNotification('Nouvo manm ekip ajoute nan Firestore!');
    }
    setIsTeamModalOpen(false);
    await loadAllData();
  };

  const handleToggleTeamMemberActive = async (member: TeamMember) => {
    try {
      const newStatus = member.is_active === false ? true : false;
      await aboutService.updateTeamMember(member.id, { is_active: newStatus });
      triggerNotification(`Estati vizibilite chanje pou: ${member.name}`);
      await loadAllData();
    } catch (err: any) {
      triggerNotification('Erè pandan mizajou estati a.');
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if (!window.confirm('Efase manm ekip sa a?')) return;
    await aboutService.deleteTeamMember(id);
    triggerNotification('Manm ekip la efase!');
    await loadAllData();
  };

  // SITE SETTINGS ACTIONS
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await siteSettingsService.saveSettings(siteSettings);
    triggerNotification('Paramèt sit la sove nan Firestore!');
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Panèl Administratè (Admin Dashboard)';
      case 'course-registrations':
        return 'Enskripsyon Manyèl Kou (Bank, PayPal, MonCash, NatCash)';
      case 'orders':
        return 'Kòmand & Peman Stripe (Stripe Orders)';
      case 'shop-products':
        return 'Boutik: Katalòg Pwodwi Dijital';
      case 'shop-orders':
        return 'Boutik: Kòmand & Apwobasyon Telechajman';
      case 'shop-payments':
        return 'Boutik: Paramèt Metòd Peman';
      case 'courses':
        return 'Jesyon & Piblikasyon Kou yo';
      case 'categories':
        return 'Jesyon Kategori yo';
      case 'instructors':
        return 'Jesyon Enstriktè (Kreye pa Wanky Sèlman)';
      case 'students':
        return 'Rejis Elèv yo (Students)';
      case 'enrollments':
        return 'Suivi Enskripsyon & Pwogrè';
      case 'certificates':
        return 'Rejis Sètifika Ofisyèl yo';
      case 'about-cms':
        return 'CMS Paj "About Us" & Ekip la';
      case 'settings':
        return 'Paramèt Sit la & Enfòmasyon Kontak';
      default:
        return 'Panèl Administratè';
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={(sec) => {
        if (sec === 'admin-coupons') {
          navigate('admin-coupons');
        } else {
          setActiveSection(sec);
        }
      }}
      title={getSectionTitle()}
      subtitle="Kominote Online — Platfòm prive dirije pa Wanky. Tout kontwòl konekte nan Cloud Firestore."
    >
      {/* Toast Notification Banner */}
      {notification && (
        <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between transition-all animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-sm font-bold">{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: DASHBOARD OVERVIEW */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8">
          {/* Platform Rule & Founder Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>Règ Platfòm: Prive & Dirije pa Wanky</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Santral Kontwòl LMS Kominote Online
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Kominote Online baze sou Cloud Firestore ak Firebase Auth. Piblik la ka enskri sèlman kòm elèv.
                Se sèlman ou menm kòm <strong>Wanky (Admin)</strong> ki ka kreye enstriktè, pibliye fòmasyon,
                epi asiyen kou yo.
              </p>

              <div className="pt-3 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setActiveSection('courses');
                    handleOpenCreateCourse();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kreye Nouvo Kou</span>
                </button>

                <button
                  onClick={() => {
                    setActiveSection('instructors');
                    setIsCreateInstructorOpen(true);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Kreye Nouvo Enstriktè</span>
                </button>

                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Rafrechi Done</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Kou Total nan Firestore</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{courses.length}</p>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {courses.filter((c) => c.status === 'published').length} pibliye
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Elèv Enskri</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{students.length}</p>
              <span className="text-[11px] text-blue-600 font-semibold">Kont piblik verifye</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Enstriktè Otorize</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{instructors.length}</p>
              <span className="text-[11px] text-indigo-600 font-semibold">Kreye manyèlman pa Admin</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Sètifika Emèt</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{certificates.length}</p>
              <span className="text-[11px] text-amber-600 font-semibold">Valide a 100% pwogrè</span>
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm">Aksè Rapid nan Modil Jesyon yo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveSection('courses')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
              >
                <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600">Jesyon Kou yo</h4>
                <p className="text-[11px] text-slate-500 mt-1">Konstwi modil, leson videyo/PDF, epi pibliye.</p>
              </button>

              <button
                onClick={() => setActiveSection('about-cms')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
              >
                <FileText className="w-6 h-6 text-indigo-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600">About Page CMS</h4>
                <p className="text-[11px] text-slate-500 mt-1">Modifye Misyon, Vizyon, ak manm ekip Wanky.</p>
              </button>

              <button
                onClick={() => setActiveSection('certificates')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
              >
                <Award className="w-6 h-6 text-amber-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-amber-600">Rejis Sètifika</h4>
                <p className="text-[11px] text-slate-500 mt-1">Gade sètifika elèv ki fin fè 100% nan kou yo.</p>
              </button>

              <button
                onClick={() => setActiveSection('course-registrations')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
              >
                <CheckCircle2 className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600">Enskripsyon Manyèl Kou</h4>
                <p className="text-[11px] text-slate-500 mt-1">Apwouve oswa rejte peman Bank, PayPal, MonCash, NatCash.</p>
              </button>

              <button
                onClick={() => setActiveSection('orders')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer group"
              >
                <ShoppingBag className="w-6 h-6 text-emerald-600 mb-2" />
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-600">Kòmand & Peman Stripe</h4>
                <p className="text-[11px] text-slate-500 mt-1">Gade tranzaksyon, resi Stripe, ak ranbousman.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: COURSE MANUAL REGISTRATIONS MANAGEMENT */}
      {activeSection === 'course-registrations' && (
        <AdminCourseRegistrationsView onNotify={triggerNotification} />
      )}

      {/* SECTION: STRIPE ORDERS MANAGEMENT */}
      {activeSection === 'orders' && (
        <AdminOrdersView onNotify={triggerNotification} />
      )}

      {/* SECTION: DIGITAL SHOP PRODUCTS */}
      {activeSection === 'shop-products' && (
        <AdminProductsView />
      )}

      {/* SECTION: DIGITAL SHOP ORDERS & APPROVALS */}
      {activeSection === 'shop-orders' && (
        <AdminShopOrdersView />
      )}

      {/* SECTION: DIGITAL SHOP PAYMENT SETTINGS */}
      {activeSection === 'shop-payments' && (
        <AdminPaymentSettingsView />
      )}

      {/* SECTION 2: COURSES MANAGEMENT */}
      {activeSection === 'courses' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Katalòg Fòmasyon yo ({courses.length})</h2>
              <p className="text-xs text-slate-500">
                Pibliye, retire, modifye estrikti leson, epi asiyen enstriktè.
              </p>
            </div>
            <button
              onClick={handleOpenCreateCourse}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Kreye Nouvo Kou</span>
            </button>
          </div>

          {/* Courses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4">Kou & Detay</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Enstriktè</th>
                    <th className="p-4">Pri</th>
                    <th className="p-4">Estati</th>
                    <th className="p-4">Pwen Cho</th>
                    <th className="p-4 text-right">Aksyon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={course.thumbnail}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs max-w-xs truncate">
                              {course.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">/{course.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px]">
                          {course.category?.name || 'San kategori'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">
                          {course.instructor?.full_name || 'Wanky'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900">${course.price}</span>
                        {course.sale_price && (
                          <span className="text-slate-400 text-[10px] block line-through">
                            ${course.sale_price}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleTogglePublish(course)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            course.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {course.status === 'published' ? 'Pibliye' : 'Brouyon'}
                        </button>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(course)}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            course.featured
                              ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
                          title={course.featured ? 'Kou sa a parèt sou Paj Akèy' : 'Mete sou Paj Akèy'}
                        >
                          <Star className={`w-4 h-4 ${course.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedCourseForPreview(course);
                              setIsPreviewSettingsOpen(true);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              course.previewEnabled && course.previewType && course.previewVideoUrl
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                            }`}
                            title="Konfigire Videyo Apèsi Kou a"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{course.previewEnabled && course.previewType && course.previewVideoUrl ? 'Apèsi' : '+ Apèsi'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedCourseForBuilder(course.id);
                              setIsBuilderOpen(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Konstriktè Modil & Leson"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Leson</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditCourse(course)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Modifye Enfòmasyon Kou"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Efase Kou"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CATEGORIES */}
      {activeSection === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Kategori Fòmasyon yo ({categories.length})</h2>
              <p className="text-xs text-slate-500">Kreye epi klase domèn fòmasyon yo.</p>
            </div>
            <button
              onClick={() => {
                setEditingCategoryId(null);
                setCategoryFormData({ name: '', slug: '', description: '', icon: 'Layers' });
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajoute Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setCategoryFormData({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                          icon: cat.icon || 'Layers',
                        });
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">{cat.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">/{cat.slug}</span>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{cat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: INSTRUCTORS MANAGEMENT */}
      {activeSection === 'instructors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Enstriktè Otorize pa Wanky ({instructors.length})</h2>
              <p className="text-xs text-slate-500">
                Kont enstriktè yo kreye manyèlman pa Admin. Pa gen enskripsyon piblik pou enstriktè.
              </p>
            </div>
            <button
              onClick={() => setIsCreateInstructorOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Kreye Kont Enstriktè</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {instructors.map((inst) => (
              <div key={inst.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={inst.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{inst.full_name}</h4>
                    <span className="text-xs text-slate-500 block truncate max-w-xs">{inst.email}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-800 block text-[11px] mb-0.5">{inst.headline || 'Enstriktè Otorize'}</span>
                  <p className="line-clamp-2 text-[11px]">{inst.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: STUDENTS REPOSITORY */}
      {activeSection === 'students' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Rejis Elèv yo ({students.length})</h2>
            <p className="text-xs text-slate-500">
              Itilizatè piblik ki enskri kòm elèv nan Kominote Online atravè Firebase Auth.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Non & Foto</th>
                  <th className="p-4">Imèl</th>
                  <th className="p-4">Wòl</th>
                  <th className="p-4">Dat Kreyasyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={stu.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <span className="font-bold text-slate-900">{stu.full_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{stu.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">
                        Elèv (Student)
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">{new Date(stu.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: ENROLLMENTS & PROGRESS */}
      {activeSection === 'enrollments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Enskripsyon & Pwogrè Elèv yo ({enrollments.length})</h2>
            <p className="text-xs text-slate-500">Suivi detaye sou kijan elèv yo ap avanse nan chak fòmasyon.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">Elèv</th>
                  <th className="p-4">Kou</th>
                  <th className="p-4">Pwogrè</th>
                  <th className="p-4">Estati</th>
                  <th className="p-4">Dat Enskripsyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{enr.student?.full_name || enr.student_id}</td>
                    <td className="p-4 text-slate-800">{enr.course?.title || enr.course_id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${enr.progress_percentage}%` }}
                          />
                        </div>
                        <span className="font-bold text-[10px]">{enr.progress_percentage}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          enr.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {enr.status === 'completed' ? 'Konplete' : 'An kou'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {new Date(enr.enrolled_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 7: CERTIFICATES */}
      {activeSection === 'certificates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900">Rejis Sètifika Ofisyèl yo ({certificates.length})</h2>
            <p className="text-xs text-slate-500">
              Sètifika sa yo emèt otomatikman sèlman lè yon elèv konplete 100% nan yon kou ki gen sètifika aktive.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">ID Sètifika</th>
                  <th className="p-4">Elèv</th>
                  <th className="p-4">Kou</th>
                  <th className="p-4">Dat Emisyon</th>
                  <th className="p-4 text-right">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-black text-blue-600">{cert.certificate_id}</td>
                    <td className="p-4 font-bold text-slate-900">{cert.student_name}</td>
                    <td className="p-4 text-slate-800">{cert.course_title}</td>
                    <td className="p-4 text-slate-500">{cert.completion_date}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => navigate('certificate', { id: cert.certificate_id })}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-blue-600 transition-colors cursor-pointer"
                      >
                        Gade Sètifika
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 8: ABOUT PAGE CMS & TEAM MEMBERS */}
      {activeSection === 'about-cms' && (
        <div className="space-y-8">
          {/* Main Content Form */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Kontni Paj "About Us" (Firestore CMS)</h3>
              <p className="text-xs text-slate-500">
                Fè chanjman nan tit, deskripsyon, misyon, ak vizyon Kominote Online dirije pa Wanky.
              </p>
            </div>

            <form onSubmit={handleSaveAboutCMS} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tit Paj la</label>
                <input
                  type="text"
                  value={aboutCMS.title}
                  onChange={(e) => setAboutCMS({ ...aboutCMS, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsyon Jeneral</label>
                <textarea
                  rows={3}
                  value={aboutCMS.description}
                  onChange={(e) => setAboutCMS({ ...aboutCMS, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Misyon Kominote Online</label>
                  <textarea
                    rows={4}
                    value={aboutCMS.mission}
                    onChange={(e) => setAboutCMS({ ...aboutCMS, mission: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vizyon Kominote Online</label>
                  <textarea
                    rows={4}
                    value={aboutCMS.vision}
                    onChange={(e) => setAboutCMS({ ...aboutCMS, vision: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sove Kontni About la nan Firestore
              </button>
            </form>
          </div>

          {/* Team Members Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Manm Ekip la ({teamMembers.length})</h3>
                <p className="text-xs text-slate-500">Moun ki parèt sou paj About Us la.</p>
              </div>
              <button
                onClick={() => {
                  setEditingTeamId(null);
                  setTeamFormData({ name: '', role: '', photo: '', bio: '', display_order: teamMembers.length + 1 });
                  setIsTeamModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajoute Manm Ekip</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((m) => (
                <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-start gap-3">
                    <img src={m.photo} alt={m.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200 bg-white" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{m.name}</h4>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${m.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {m.is_active !== false ? 'Piblik' : 'Kache'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#0056D2] font-semibold block truncate">{m.role}</span>
                      {m.professional_title && (
                        <p className="text-[10px] text-slate-500 truncate">{m.professional_title}</p>
                      )}
                    </div>
                  </div>

                  {m.organizations && m.organizations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.organizations.map((org, i) => (
                        <span key={i} className="text-[9px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                          {org}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 line-clamp-3">{m.bio}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 font-bold">Lòd: #{m.display_order ?? 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTeamMemberActive(m)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer underline"
                      >
                        {m.is_active !== false ? 'Kache' : 'Afiche'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeamId(m.id);
                          setTeamFormData({
                            name: m.name || '',
                            role: m.role || '',
                            professional_title: m.professional_title || '',
                            organizations: (m.organizations || []).join('\n'),
                            photo: m.photo || '',
                            bio: m.bio || '',
                            display_order: m.display_order || 1,
                            is_active: m.is_active !== false,
                          });
                          setIsTeamModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Modifye
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTeamMember(m.id)}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Efase
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: SETTINGS */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">Paramèt Platfòm & Pwopriyete</h2>
            <p className="text-xs text-slate-500">Konfigirasyon jeneral Kominote Online.</p>
          </div>

          <form onSubmit={handleSaveSiteSettings} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Non Sit la</label>
              <input
                type="text"
                value={siteSettings.site_name}
                onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Imèl Kontak Administratè (Wanky)</label>
              <input
                type="email"
                value={siteSettings.contact_email}
                onChange={(e) => setSiteSettings({ ...siteSettings, contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nimewo Telefòn / WhatsApp Kontak</label>
              <input
                type="text"
                value={siteSettings.contact_phone || ''}
                onChange={(e) => setSiteSettings({ ...siteSettings, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Mesaj Anons sou Sit la (Banner)</label>
              <input
                type="text"
                value={siteSettings.announcement || ''}
                onChange={(e) => setSiteSettings({ ...siteSettings, announcement: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
            >
              Sove Paramèt yo nan Firestore
            </button>
          </form>
        </div>
      )}

      {/* COURSE BUILDER MODAL */}
      {selectedCourseForBuilder && (
        <CourseBuilderModal
          courseId={selectedCourseForBuilder}
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setSelectedCourseForBuilder(null);
          }}
          onSaved={loadAllData}
        />
      )}

      {/* COURSE PREVIEW VIDEO SETTINGS MODAL */}
      {isPreviewSettingsOpen && selectedCourseForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Videyo Apèsi Kou a
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {selectedCourseForPreview.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewSettingsOpen(false);
                  setSelectedCourseForPreview(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CoursePreviewVideoSettings
              course={selectedCourseForPreview}
              onUpdated={(updated) => {
                setCourses((prev) =>
                  prev.map((c) =>
                    c.id === selectedCourseForPreview.id ? { ...c, ...updated } : c
                  )
                );
                setSelectedCourseForPreview((prev) =>
                  prev ? { ...prev, ...updated } : null
                );
                triggerNotification('Videyo apèsi kou a mete ajou avèk siksè!');
              }}
            />
          </div>
        </div>
      )}

      {/* CREATE / EDIT COURSE MODAL */}
      {isCreateCourseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingCourseId ? 'Modifye Kou a' : 'Kreye Nouvo Fòmasyon'}
              </h3>
              <button onClick={() => setIsCreateCourseOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tit Kou a *</label>
                <input
                  type="text"
                  required
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  placeholder="egz: Metrize AI & Pwodiktivite ak Wanky"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slug URL (opsyonèl)</label>
                <input
                  type="text"
                  value={courseFormData.slug}
                  onChange={(e) => setCourseFormData({ ...courseFormData, slug: e.target.value })}
                  placeholder="metrize-ai-pwodiktivite-wanky"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori *</label>
                  <select
                    required
                    value={courseFormData.category_id}
                    onChange={(e) => setCourseFormData({ ...courseFormData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Enstriktè Asiyen *</label>
                  <select
                    required
                    value={courseFormData.instructor_id}
                    onChange={(e) => setCourseFormData({ ...courseFormData, instructor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    {instructors.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.full_name} ({i.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pri ($ USD)</label>
                  <input
                    type="number"
                    value={courseFormData.price}
                    onChange={(e) => setCourseFormData({ ...courseFormData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pri Rabè ($)</label>
                  <input
                    type="number"
                    value={courseFormData.sale_price}
                    onChange={(e) => setCourseFormData({ ...courseFormData, sale_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nivo</label>
                  <select
                    value={courseFormData.level}
                    onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value as CourseLevel })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  >
                    <option value="Tout Nivo">Tout Nivo</option>
                    <option value="Kòmansan">Kòmansan</option>
                    <option value="Entèmedyè">Entèmedyè</option>
                    <option value="Avanse">Avanse</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Imaj Thumbnail (URL) *</label>
                <input
                  type="url"
                  required
                  value={courseFormData.thumbnail}
                  onChange={(e) => setCourseFormData({ ...courseFormData, thumbnail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kout Deskripsyon</label>
                <textarea
                  rows={2}
                  value={courseFormData.short_description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, short_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsyon Konplè</label>
                <textarea
                  rows={4}
                  value={courseFormData.description}
                  onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseFormData.featured}
                    onChange={(e) => setCourseFormData({ ...courseFormData, featured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Mete sou Paj Akèy kòm Kou Vedèt (Featured)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={courseFormData.certificate_enabled}
                    onChange={(e) => setCourseFormData({ ...courseFormData, certificate_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">
                    Bay Sètifika Finisyon lè elèv la konplete 100%
                  </span>
                </label>
              </div>

              {editingCourseId && (
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs block">Videyo Apèsi Kou a</span>
                      <span className="text-[11px] text-slate-600">
                        {courses.find((c) => c.id === editingCourseId)?.previewEnabled &&
                        courses.find((c) => c.id === editingCourseId)?.previewVideoUrl
                          ? 'Videyo apèsi a konfigire epi aktif'
                          : 'Poko gen videyo apèsi pou kou sa a'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const targetCourse = courses.find((c) => c.id === editingCourseId);
                      if (targetCourse) {
                        setSelectedCourseForPreview(targetCourse);
                        setIsPreviewSettingsOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
                  >
                    Konfigire Apèsi
                  </button>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {editingCourseId ? 'Sove Chanjman yo' : 'Kreye Kou a'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INSTRUCTOR MODAL (Admin Only) */}
      {isCreateInstructorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Kreye Nouvo Kont Enstriktè</h3>
              <button onClick={() => setIsCreateInstructorOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selon règleman Kominote Online, se sèlman Wanky ki ka kreye kont enstriktè.
            </p>

            <form onSubmit={handleCreateInstructor} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Non Konplè *</label>
                <input
                  type="text"
                  required
                  value={newInstructorData.full_name}
                  onChange={(e) => setNewInstructorData({ ...newInstructorData, full_name: e.target.value })}
                  placeholder="egz: Jean-Marc Pierre"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adrès Imèl *</label>
                <input
                  type="email"
                  required
                  value={newInstructorData.email}
                  onChange={(e) => setNewInstructorData({ ...newInstructorData, email: e.target.value })}
                  placeholder="enstriktè@kominote.online"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tit / Headline</label>
                <input
                  type="text"
                  value={newInstructorData.headline}
                  onChange={(e) => setNewInstructorData({ ...newInstructorData, headline: e.target.value })}
                  placeholder="Ekspè nan Devlopman Web & AI"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Biyografi</label>
                <textarea
                  rows={3}
                  value={newInstructorData.bio}
                  onChange={(e) => setNewInstructorData({ ...newInstructorData, bio: e.target.value })}
                  placeholder="Eksperyans ak konpetans pwofesyonèl..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Foto Profil (URL)</label>
                <input
                  type="url"
                  value={newInstructorData.avatar_url}
                  onChange={(e) => setNewInstructorData({ ...newInstructorData, avatar_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateInstructorOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Kreye Kont la
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingCategoryId ? 'Modifye Kategori' : 'Ajoute Kategori'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Non Kategori a *</label>
                <input
                  type="text"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="egz: AI & Teknoloji"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Slug URL</label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  placeholder="ai-teknoloji"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsyon</label>
                <textarea
                  rows={3}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Deskripsyon fòmasyon ki nan kategori sa a..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Sove
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingTeamId ? 'Modifye Manm Ekip' : 'Ajoute Manm Ekip'}
              </h3>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeamMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Non Konplè *</label>
                <input
                  type="text"
                  required
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  placeholder="egz: Dr Wanky Massenat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Wòl nan Ekip la *</label>
                <input
                  type="text"
                  required
                  value={teamFormData.role}
                  onChange={(e) => setTeamFormData({ ...teamFormData, role: e.target.value })}
                  placeholder="egz: Fondatè Kominote Online"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tit Pwofesyonèl</label>
                <input
                  type="text"
                  value={teamFormData.professional_title}
                  onChange={(e) => setTeamFormData({ ...teamFormData, professional_title: e.target.value })}
                  placeholder="egz: Medikal • Espesyalis nan Teknoloji • Webmaster • Antreprenè"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Òganizasyon & Konpayi (Mete youn pa liy)
                </label>
                <textarea
                  rows={2}
                  value={teamFormData.organizations}
                  onChange={(e) => setTeamFormData({ ...teamFormData, organizations: e.target.value })}
                  placeholder="Massenat Consulting Group&#10;Wanky Academy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Foto Profil (URL) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={teamFormData.photo}
                    onChange={(e) => setTeamFormData({ ...teamFormData, photo: e.target.value })}
                    placeholder="https://i.postimg.cc/vH7SzM7b/6.png"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                  {teamFormData.photo && (
                    <img
                      src={teamFormData.photo}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Biyografi *</label>
                <textarea
                  rows={4}
                  required
                  value={teamFormData.bio}
                  onChange={(e) => setTeamFormData({ ...teamFormData, bio: e.target.value })}
                  placeholder="Biyografi an Kreyòl..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lòd Afichaj (Order)</label>
                  <input
                    type="number"
                    value={teamFormData.display_order}
                    onChange={(e) => setTeamFormData({ ...teamFormData, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={teamFormData.is_active}
                      onChange={(e) => setTeamFormData({ ...teamFormData, is_active: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-700 text-xs">Piblik (Afiche)</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                >
                  Sove
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
