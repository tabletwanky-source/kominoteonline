import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppRoute =
  | 'home'
  | 'courses'
  | 'course-detail'
  | 'course-player'
  | 'certificate'
  | 'verify-certificate'
  | 'categories'
  | 'about'
  | 'contact'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'student-dashboard'
  | 'instructor-dashboard'
  | 'admin-dashboard'
  | 'privacy-policy'
  | 'terms-conditions'
  | 'refund-policy'
  | 'cookies'
  | 'profile'
  | 'my-courses'
  | 'checkout-success'
  | 'admin-orders'
  | 'admin-registrations'
  | 'admin-order-detail'
  // Digital Shop Routes
  | 'shop'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'invoice'
  | 'customer-orders'
  | 'customer-downloads'
  | 'admin-products'
  | 'admin-shop-orders'
  | 'admin-payment-settings'
  | 'admin-coupons'
  | 'track-order'
  | 'not-found';

interface NavigationContextType {
  currentRoute: AppRoute;
  params: Record<string, string>;
  navigate: (route: AppRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

// Route name → URL path builder
function routeToPath(route: AppRoute, params: Record<string, string> = {}): string {
  switch (route) {
    case 'home': return '/';
    case 'courses': return '/courses';
    case 'course-detail': return params.slug ? `/courses/${params.slug}` : params.id ? `/courses/${params.id}` : '/courses';
    case 'course-player': return params.courseId ? `/learn/${params.courseId}` : '/dashboard';
    case 'certificate': return params.id ? `/certificate/${params.id}` : '/certificate';
    case 'verify-certificate': return params.certificateId ? `/verify/${params.certificateId}` : '/verify';
    case 'categories': return '/categories';
    case 'about': return '/about';
    case 'contact': return '/contact';
    case 'login': return '/login';
    case 'register': return '/register';
    case 'forgot-password': return '/forgot-password';
    case 'reset-password': return '/reset-password';
    case 'student-dashboard': return '/dashboard';
    case 'instructor-dashboard': return '/instructor/dashboard';
    case 'admin-dashboard': return '/admin';
    case 'privacy-policy': return '/privacy';
    case 'terms-conditions': return '/terms';
    case 'refund-policy': return '/refund-policy';
    case 'cookies': return '/cookies';
    case 'profile': return '/profile';
    case 'my-courses': return '/my-courses';
    case 'checkout-success': return '/checkout/success';
    case 'shop': return '/shop';
    case 'product-detail': return params.slug ? `/shop/${params.slug}` : params.id ? `/shop/${params.id}` : '/shop';
    case 'cart': return '/cart';
    case 'checkout': return '/checkout';
    case 'invoice': return params.invoiceId ? `/invoice/${params.invoiceId}` : params.id ? `/invoice/${params.id}` : '/dashboard';
    case 'customer-orders': return '/my-orders';
    case 'customer-downloads': return '/dashboard/downloads';
    case 'admin-products': return '/admin/products';
    case 'admin-shop-orders': return '/admin/orders';
    case 'admin-registrations': return '/admin/registrations';
    case 'admin-order-detail': return params.orderId ? `/admin/orders/${params.orderId}` : '/admin/orders';
    case 'admin-payment-settings': return '/admin/settings/payments';
    case 'admin-coupons': return '/admin/coupons';
    case 'track-order': return '/track';
    case 'not-found': return '/404';
    default: return '/';
  }
}

// URL path → route name + params (the single source of truth for current route)
function pathToRoute(path: string): { route: AppRoute; params: Record<string, string> } {
  const cleanPath = path.split('?')[0].split('#')[0];
  const segments = cleanPath.split('/').filter(Boolean);

  // Legacy redirects
  if (cleanPath === '/privacy-policy') return { route: 'privacy-policy', params: {} };
  if (cleanPath === '/terms-and-conditions') return { route: 'terms-conditions', params: {} };
  if (cleanPath === '/signup') return { route: 'register', params: {} };
  if (cleanPath === '/store') return { route: 'shop', params: {} };

  if (segments.length === 0) return { route: 'home', params: {} };

  const [seg0, seg1, seg2, seg3] = segments;

  // /checkout/success
  if (seg0 === 'checkout' && seg1 === 'success') return { route: 'checkout-success', params: {} };
  if (seg0 === 'checkout' && seg1 === 'cancelled') return { route: 'checkout', params: { canceled: 'true' } };
  if (seg0 === 'checkout') return { route: 'checkout', params: {} };

  // /verify/:certificateId
  if (seg0 === 'verify' && seg1) return { route: 'verify-certificate', params: { certificateId: seg1 } };
  if (seg0 === 'verify') return { route: 'verify-certificate', params: {} };

  // /certificate/:id
  if (seg0 === 'certificate' && seg1) return { route: 'certificate', params: { id: seg1 } };
  if (seg0 === 'certificate') return { route: 'certificate', params: {} };

  // /courses/:slug
  if (seg0 === 'courses' && seg1) return { route: 'course-detail', params: { slug: seg1 } };
  if (seg0 === 'courses') return { route: 'courses', params: {} };

  // /learn/:courseId
  if (seg0 === 'learn' && seg1) return { route: 'course-player', params: { courseId: seg1 } };

  // /shop/:slug
  if (seg0 === 'shop' && seg1) return { route: 'product-detail', params: { slug: seg1 } };
  if (seg0 === 'shop') return { route: 'shop', params: {} };

  // /cart
  if (seg0 === 'cart') return { route: 'cart', params: {} };

  // /invoice/:invoiceId
  if (seg0 === 'invoice' && seg1) return { route: 'invoice', params: { invoiceId: seg1 } };

  // /categories
  if (seg0 === 'categories') return { route: 'categories', params: {} };

  // /about
  if (seg0 === 'about') return { route: 'about', params: {} };

  // /contact
  if (seg0 === 'contact') return { route: 'contact', params: {} };

  // /login, /register, /forgot-password, /reset-password
  if (seg0 === 'login') return { route: 'login', params: {} };
  if (seg0 === 'register') return { route: 'register', params: {} };
  if (seg0 === 'forgot-password') return { route: 'forgot-password', params: {} };
  if (seg0 === 'reset-password') return { route: 'reset-password', params: {} };

  // /privacy, /terms, /refund-policy, /cookies
  if (seg0 === 'privacy') return { route: 'privacy-policy', params: {} };
  if (seg0 === 'terms') return { route: 'terms-conditions', params: {} };
  if (seg0 === 'refund-policy') return { route: 'refund-policy', params: {} };
  if (seg0 === 'cookies') return { route: 'cookies', params: {} };

  // /profile
  if (seg0 === 'profile') return { route: 'profile', params: {} };

  // /my-courses
  if (seg0 === 'my-courses') return { route: 'my-courses', params: {} };

  // /my-orders
  if (seg0 === 'my-orders') return { route: 'customer-orders', params: {} };

  // /dashboard/orders → customer-orders (legacy compat)
  if (seg0 === 'dashboard' && seg1 === 'orders') return { route: 'customer-orders', params: {} };
  // /dashboard/downloads → customer-downloads
  if (seg0 === 'dashboard' && seg1 === 'downloads') return { route: 'customer-downloads', params: {} };
  // /dashboard/registrations → student-dashboard with section=orders
  if (seg0 === 'dashboard' && seg1 === 'registrations') return { route: 'student-dashboard', params: { section: 'orders' } };
  // /dashboard
  if (seg0 === 'dashboard') return { route: 'student-dashboard', params: {} };

  // /instructor/dashboard
  if (seg0 === 'instructor' && seg1 === 'dashboard') return { route: 'instructor-dashboard', params: {} };

  // /track
  if (seg0 === 'track') return { route: 'track-order', params: {} };

  // /admin/products
  if (seg0 === 'admin' && seg1 === 'products') return { route: 'admin-products', params: {} };
  // /admin/courses/:courseId
  if (seg0 === 'admin' && seg1 === 'courses' && seg2) return { route: 'admin-dashboard', params: { section: 'courses', courseId: seg2 } };
  // /admin/courses
  if (seg0 === 'admin' && seg1 === 'courses') return { route: 'admin-dashboard', params: { section: 'courses' } };
  // /admin/orders/:orderId
  if (seg0 === 'admin' && seg1 === 'orders' && seg2) return { route: 'admin-order-detail', params: { orderId: seg2 } };
  // /admin/orders
  if (seg0 === 'admin' && seg1 === 'orders') return { route: 'admin-shop-orders', params: {} };
  // /admin/registrations
  if (seg0 === 'admin' && seg1 === 'registrations') return { route: 'admin-registrations', params: {} };
  // /admin/settings/payments
  if (seg0 === 'admin' && seg1 === 'settings' && seg2 === 'payments') return { route: 'admin-payment-settings', params: {} };
  // /admin/coupons
  if (seg0 === 'admin' && seg1 === 'coupons') return { route: 'admin-coupons', params: {} };
  // /admin
  if (seg0 === 'admin') return { route: 'admin-dashboard', params: {} };

  // Unknown route
  return { route: 'not-found', params: {} };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ route: AppRoute; params: Record<string, string> }>(() => {
    if (typeof window === 'undefined') return { route: 'home', params: {} };
    return pathToRoute(window.location.pathname + window.location.search);
  });

  // Sync state with browser URL on popstate (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setState(pathToRoute(window.location.pathname + window.location.search));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle legacy redirects on initial load
  useEffect(() => {
    const path = window.location.pathname;
    const legacyMap: Record<string, string> = {
      '/privacy-policy': '/privacy',
      '/terms-and-conditions': '/terms',
      '/signup': '/register',
      '/store': '/shop',
    };
    if (legacyMap[path]) {
      window.history.replaceState(null, '', legacyMap[path]);
      setState(pathToRoute(legacyMap[path]));
    }
  }, []);

  const navigate = useCallback((route: AppRoute, newParams: Record<string, string> = {}) => {
    const targetPath = routeToPath(route, newParams);
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setState({ route, params: newParams });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <NavigationContext.Provider value={{ currentRoute: state.route, params: state.params, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
