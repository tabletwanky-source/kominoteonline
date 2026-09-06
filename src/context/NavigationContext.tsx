import React, { createContext, useContext, useState, useEffect } from 'react';

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
  | 'student-dashboard'
  | 'instructor-dashboard'
  | 'admin-dashboard'
  | 'privacy-policy'
  | 'terms-conditions'
  | 'refund-policy'
  | 'checkout-success'
  | 'admin-orders'
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
  | 'admin-order-detail'
  | 'admin-payment-settings'
  | 'admin-coupons'
  | 'track-order';

interface NavigationContextType {
  currentRoute: AppRoute;
  params: Record<string, string>;
  navigate: (route: AppRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const [params, setParams] = useState<Record<string, string>>({});
  const [historyStack, setHistoryStack] = useState<Array<{ route: AppRoute; params: Record<string, string> }>>([]);

  // Check URL pathname or query on initial boot
  useEffect(() => {
    try {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      if (path.startsWith('/checkout/success') || searchParams.has('session_id')) {
        const sessionId = searchParams.get('session_id') || '';
        setCurrentRoute('checkout-success');
        setParams({ sessionId });
      } else if (path.startsWith('/verify/')) {
        const certId = path.replace('/verify/', '');
        setCurrentRoute('verify-certificate');
        setParams({ certificateId: certId });
      } else if (path.startsWith('/certificate/')) {
        const certId = path.replace('/certificate/', '');
        setCurrentRoute('certificate');
        setParams({ id: certId });
      } else if (path.startsWith('/shop/')) {
        const slug = path.replace('/shop/', '');
        setCurrentRoute('product-detail');
        setParams({ slug });
      } else if (path === '/shop') {
        setCurrentRoute('shop');
      } else if (path === '/cart') {
        setCurrentRoute('cart');
      } else if (path === '/checkout') {
        setCurrentRoute('checkout');
      } else if (path.startsWith('/invoice/')) {
        const invId = path.replace('/invoice/', '');
        setCurrentRoute('invoice');
        setParams({ invoiceId: invId });
      } else if (path === '/dashboard/orders') {
        setCurrentRoute('customer-orders');
      } else if (path === '/dashboard/registrations') {
        setCurrentRoute('student-dashboard');
        setParams({ section: 'orders' });
      } else if (path === '/dashboard/downloads') {
        setCurrentRoute('customer-downloads');
      } else if (path === '/admin/products') {
        setCurrentRoute('admin-products');
      } else if (path.startsWith('/admin/orders/')) {
        const orderId = path.replace('/admin/orders/', '');
        setCurrentRoute('admin-order-detail');
        setParams({ orderId });
      } else if (path === '/admin/orders') {
        setCurrentRoute('admin-shop-orders');
      } else if (path === '/admin/registrations') {
        setCurrentRoute('admin-orders');
      } else if (path === '/admin/settings/payments') {
        setCurrentRoute('admin-payment-settings');
      } else if (path === '/admin/coupons') {
        setCurrentRoute('admin-coupons');
      } else if (path === '/track') {
        setCurrentRoute('track-order');
      }
    } catch {
      // ignore
    }
  }, []);

  const navigate = (route: AppRoute, newParams: Record<string, string> = {}) => {
    setHistoryStack((prev) => [...prev, { route: currentRoute, params }]);
    setCurrentRoute(route);
    setParams(newParams);

    // Update browser URL quietly without full page reload
    try {
      let targetPath = '/';
      if (route === 'shop') targetPath = '/shop';
      else if (route === 'product-detail' && newParams.slug) targetPath = `/shop/${newParams.slug}`;
      else if (route === 'cart') targetPath = '/cart';
      else if (route === 'checkout') targetPath = '/checkout';
      else if (route === 'invoice' && newParams.invoiceId) targetPath = `/invoice/${newParams.invoiceId}`;
      else if (route === 'customer-orders') targetPath = '/dashboard/orders';
      else if (route === 'customer-downloads') targetPath = '/dashboard/downloads';
      else if (route === 'admin-products') targetPath = '/admin/products';
      else if (route === 'admin-shop-orders') targetPath = '/admin/orders';
      else if (route === 'admin-orders') targetPath = '/admin/registrations';
      else if (route === 'student-dashboard' && newParams.section === 'orders') targetPath = '/dashboard/registrations';
      else if (route === 'admin-order-detail' && newParams.orderId) targetPath = `/admin/orders/${newParams.orderId}`;
      else if (route === 'admin-payment-settings') targetPath = '/admin/settings/payments';
      else if (route === 'admin-coupons') targetPath = '/admin/coupons';
      else if (route === 'track-order') targetPath = '/track';

      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    } catch {
      // ignore browser history security if sandboxed
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((stack) => stack.slice(0, -1));
      setCurrentRoute(prev.route);
      setParams(prev.params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentRoute('home');
      setParams({});
    }
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, params, navigate, goBack }}>
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
