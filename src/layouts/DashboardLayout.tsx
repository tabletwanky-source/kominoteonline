import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from '../components/BrandLogo';
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  PlayCircle,
  Heart,
  ShoppingBag,
  User,
  LogOut,
  PlusCircle,
  Users,
  DollarSign,
  Layers,
  Settings,
  Shield,
  Menu,
  X,
  ExternalLink,
  Bell,
  Search,
  ChevronRight,
  Award,
  FileText,
  Package,
  Download
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  title: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeSection,
  onSectionChange,
  title,
  subtitle,
}) => {
  const { user, logout } = useAuth();
  const { navigate } = useNavigation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Student Navigation Items
  const studentItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Tablodbò', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'my-courses', label: 'Kou Mwen yo', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'continue-learning', label: 'Kontinye Aprann', icon: <PlayCircle className="w-5 h-5" /> },
    { id: 'customer-downloads', label: 'Telechajman Dijital', icon: <Download className="w-5 h-5" /> },
    { id: 'customer-orders', label: 'Kòmand Dijital Mwen', icon: <Package className="w-5 h-5" /> },
    { id: 'orders', label: 'Kòmand Kou (Stripe)', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Mwen', icon: <User className="w-5 h-5" /> },
  ];

  // Instructor Navigation Items
  const instructorItems: SidebarItem[] = [
    { id: 'overview', label: 'Rezime', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'my-courses', label: 'Kou Mwen yo', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'create-course', label: 'Kreye Kou', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'students', label: 'Elèv yo', icon: <Users className="w-5 h-5" /> },
    { id: 'revenue', label: 'Revni & Peman', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil Enstriktè', icon: <User className="w-5 h-5" /> },
  ];

  // Admin Navigation Items
  const adminItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Tablodbò', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'shop-products', label: 'Boutik: Pwodwi Dijital', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'shop-orders', label: 'Boutik: Kòmand & Apwobasyon', icon: <Package className="w-5 h-5" /> },
    { id: 'shop-payments', label: 'Boutik: Paramèt Peman', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'orders', label: 'Kòmand Stripe (Kou)', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'courses', label: 'Tout Kou yo', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'categories', label: 'Kategori yo', icon: <Layers className="w-5 h-5" /> },
    { id: 'instructors', label: 'Enstriktè yo', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'students', label: 'Tout Elèv yo', icon: <Users className="w-5 h-5" /> },
    { id: 'enrollments', label: 'Enskripsyon yo', icon: <User className="w-5 h-5" /> },
    { id: 'certificates', label: 'Sètifika yo', icon: <Award className="w-5 h-5" /> },
    { id: 'about-cms', label: 'Paj Konsènan (CMS)', icon: <FileText className="w-5 h-5" /> },
    { id: 'settings', label: 'Paramèt Jeneral', icon: <Settings className="w-5 h-5" /> },
  ];

  const currentRole = user?.role || 'student';
  const navItems =
    currentRole === 'admin'
      ? adminItems
      : currentRole === 'instructor'
      ? instructorItems
      : studentItems;

  const roleBadgeInfo = {
    student: { label: 'Elèv', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
    instructor: { label: 'Enstriktè', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    admin: { label: 'Administratè', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  }[currentRole];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 selection:bg-blue-600 selection:text-white">
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => navigate('home')}
              className="flex flex-col text-left group cursor-pointer focus:outline-hidden"
            >
              <BrandLogo size="sm" textColor="light" />
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1 ml-11">
                {roleBadgeInfo.label} Espace
              </span>
            </button>
          </div>

          {/* User quick info card */}
          <div className="p-4 mx-3 my-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.full_name || 'User'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/40"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Itilizatè'}</p>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeInfo.bg} mt-0.5`}>
                {roleBadgeInfo.label}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 space-y-1 overflow-y-auto">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Meni Prensipal
            </p>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-item-${item.id}`}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('home')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ale sou Sit Piblik la</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="sidebar-logout-btn"
              onClick={() => {
                logout();
                navigate('home');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Dekonekte</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Topbar */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="Louvri Meni"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
              </div>
            </div>

            {/* Quick header controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('courses')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Eksplore Kou</span>
              </button>

              <button
                onClick={() => navigate('home')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sit Piblik
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-slate-300 flex flex-col h-full shadow-2xl z-10">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <BrandLogo size="sm" textColor="light" />
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSectionChange(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  navigate('home');
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Ale sou sit piblik
              </button>
              <button
                onClick={() => {
                  logout();
                  setMobileSidebarOpen(false);
                  navigate('home');
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300"
              >
                Dekonekte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
