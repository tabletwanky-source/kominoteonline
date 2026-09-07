import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { BrandLogo } from './BrandLogo';
import {
  Menu,
  X,
  ChevronRight,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Sparkles,
  ShoppingCart,
  Package,
  Download,
  ShoppingBag,
  Tag,
  Search,
  BookOpen,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentRoute, navigate } = useNavigation();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getDashboardRoute = () => {
    if (!user) return 'student-dashboard';
    if (user.role === 'admin') return 'admin-dashboard';
    if (user.role === 'instructor') return 'instructor-dashboard';
    return 'student-dashboard';
  };

  const getDashboardLabel = () => {
    if (!user) return 'Tablodbò';
    if (user.role === 'admin') return 'Panèl Admin';
    if (user.role === 'instructor') return 'Espace Pwofesè';
    return 'Kou Mwen yo';
  };

  const navItems = [
    { label: 'Akèy', route: 'home' as const },
    { label: 'Tout Kou', route: 'courses' as const },
    { label: 'Shop', route: 'shop' as const },
    { label: 'Kategori', route: 'categories' as const },
    { label: 'Konsènan', route: 'about' as const },
    { label: 'Kontak', route: 'contact' as const },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 flex items-center transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              id="navbar-brand-logo"
              onClick={() => {
                navigate('home');
                setMobileMenuOpen(false);
              }}
              className="flex items-center text-left group cursor-pointer focus:outline-hidden"
            >
              <BrandLogo size="md" showText={false} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              {navItems.map((item) => {
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    id={`nav-link-${item.route}`}
                    onClick={() => navigate(item.route)}
                    className={`transition-colors cursor-pointer ${
                      isActive
                        ? 'text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-blue-700 font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Shopping Cart Button */}
            <button
              id="btn-nav-cart"
              onClick={() => navigate('cart')}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Panye Kòmand"
              aria-label="Panye Kòmand"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-50">
                  {cartCount}
                </span>
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <button
                    id="btn-nav-dashboard"
                    onClick={() => navigate(getDashboardRoute())}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-700" />
                    <span>{getDashboardLabel()}</span>
                  </button>

                  <div className="relative">
                    <button
                      id="btn-user-profile-menu"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                    >
                      <img
                        src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-700/30"
                      />
                      <div className="text-left hidden lg:block">
                        <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[110px]">
                          {user.full_name.split(' ')[0]}
                        </p>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {user.role === 'student' ? 'Elèv' : user.role === 'instructor' ? 'Enstriktè' : 'Admin'}
                        </span>
                      </div>
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-medium text-slate-400">Konekte kòm</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{user.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>

                        <button
                          id="dropdown-dashboard-link"
                          onClick={() => {
                            navigate(getDashboardRoute());
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-500" />
                          <span>{getDashboardLabel()}</span>
                        </button>

                        <button
                          id="dropdown-profile-link"
                          onClick={() => {
                            navigate('profile');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Profil Mwen</span>
                        </button>

                        <button
                          id="dropdown-my-courses-link"
                          onClick={() => {
                            navigate('my-courses');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-slate-500" />
                          <span>Kou Mwen yo</span>
                        </button>

                        {/* Customer Orders & Downloads */}
                        <button
                          id="dropdown-orders-link"
                          onClick={() => {
                            navigate('customer-orders');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Package className="w-4 h-4 text-slate-500" />
                          <span>Kòmand Mwen yo</span>
                        </button>

                        <button
                          id="dropdown-downloads-link"
                          onClick={() => {
                            navigate('customer-downloads');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-slate-500" />
                          <span>Telechajman Mwen yo</span>
                        </button>

                        {user.role === 'admin' && (
                          <div className="border-t border-slate-100 pt-1 mt-1">
                            <button
                              id="dropdown-admin-products-link"
                              onClick={() => {
                                navigate('admin-products');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>Boutik Admin: Pwodwi</span>
                            </button>
                            <button
                              id="dropdown-admin-orders-link"
                              onClick={() => {
                                navigate('admin-shop-orders');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                            >
                              <Package className="w-3.5 h-3.5" />
                              <span>Boutik Admin: Kòmand</span>
                            </button>
                            <button
                              id="dropdown-admin-coupons-link"
                              onClick={() => {
                                navigate('admin-coupons');
                                setProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-1.5 text-xs text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors font-semibold cursor-pointer"
                            >
                              <Tag className="w-3.5 h-3.5" />
                              <span>Boutik Admin: Kòd Rabè</span>
                            </button>
                          </div>
                        )}

                        <div className="border-t border-slate-100 pt-1 mt-1">
                          <button
                            id="dropdown-track-order-link"
                            onClick={() => {
                              navigate('track-order');
                              setProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-1.5 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors font-medium cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5 text-amber-500" />
                            <span>Swiv yon Kòmand (/track)</span>
                          </button>
                        </div>

                        <button
                          id="dropdown-logout-link"
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                            navigate('home');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors border-t border-slate-100 mt-1 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Dekonekte</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  id="btn-nav-login"
                  onClick={() => navigate('login')}
                  className="text-sm font-semibold text-slate-700 hover:text-blue-700 px-4 py-2 transition-colors cursor-pointer"
                >
                  Konekte
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => navigate('register')}
                  className="text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 px-5 py-2 rounded-lg shadow-sm shadow-blue-200 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Kreye Kont</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="btn-mobile-cart"
              onClick={() => navigate('cart')}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Panye"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
              aria-label="Meni prensipal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={item.route}
                onClick={() => {
                  navigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2.5 rounded-lg text-base font-semibold ${
                  currentRoute === item.route
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              id="btn-mobile-track-order"
              onClick={() => {
                navigate('track-order');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2.5 rounded-lg text-base font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-amber-600" />
              <span>Swiv Kòmand (/track)</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 bg-slate-50 rounded-xl mb-1 flex items-center gap-3">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-600"
                  />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{user.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigate(getDashboardRoute());
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-center font-bold text-white bg-blue-600"
                >
                  {getDashboardLabel()}
                </button>

                <button
                  onClick={() => {
                    navigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Profil Mwen
                </button>

                <button
                  onClick={() => {
                    navigate('my-courses');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                >
                  Kou Mwen yo
                </button>

                <button
                  onClick={() => {
                    navigate('customer-orders');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>Kòmand Mwen yo</span>
                </button>

                <button
                  onClick={() => {
                    navigate('customer-downloads');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-4 rounded-xl text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Telechajman Mwen yo</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('home');
                  }}
                  className="w-full py-2 px-4 rounded-xl text-center text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Dekonekte
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-center font-bold text-slate-800 bg-slate-100 hover:bg-slate-200"
                >
                  Konekte
                </button>
                <button
                  onClick={() => {
                    navigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-center font-bold text-white bg-blue-600 hover:bg-blue-700"
                >
                  Kreye Kont
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
