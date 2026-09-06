import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { CartProvider } from './context/CartContext';
import { PublicLayout } from './layouts/PublicLayout';

// Public pages
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsConditionsPage } from './pages/TermsConditionsPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';

// Digital Shop Pages
import { ShopPage } from './pages/shop/ShopPage';
import { ProductDetailPage } from './pages/shop/ProductDetailPage';
import { CartPage } from './pages/shop/CartPage';
import { CheckoutPage } from './pages/shop/CheckoutPage';
import { InvoicePage } from './pages/shop/InvoicePage';
import { CustomerOrdersPage } from './pages/student/CustomerOrdersPage';
import { CustomerDownloadsPage } from './pages/student/CustomerDownloadsPage';

// Admin Shop Pages
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminShopOrdersPage } from './pages/admin/AdminShopOrdersPage';
import { AdminPaymentSettingsPage } from './pages/admin/AdminPaymentSettingsPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { TrackOrderPage } from './pages/TrackOrderPage';

// Learning, Player & Certificate pages
import { CoursePlayerPage } from './pages/student/CoursePlayerPage';
import { CertificatePage } from './pages/CertificatePage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';

// Dashboard shells
import { StudentDashboard } from './pages/student/StudentDashboard';
import { InstructorDashboard } from './pages/instructor/InstructorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AccessDenied } from './components/AccessDenied';

const AppContent: React.FC = () => {
  const { currentRoute } = useNavigation();
  const { user, isAuthenticated } = useAuth();

  switch (currentRoute) {
    case 'home':
      return (
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      );

    case 'courses':
      return (
        <PublicLayout>
          <CoursesPage />
        </PublicLayout>
      );

    case 'course-detail':
      return (
        <PublicLayout>
          <CourseDetailPage />
        </PublicLayout>
      );

    case 'categories':
      return (
        <PublicLayout>
          <CategoriesPage />
        </PublicLayout>
      );

    case 'about':
      return (
        <PublicLayout>
          <AboutPage />
        </PublicLayout>
      );

    case 'contact':
      return (
        <PublicLayout>
          <ContactPage />
        </PublicLayout>
      );

    case 'login':
      return (
        <PublicLayout>
          <LoginPage />
        </PublicLayout>
      );

    case 'register':
      return (
        <PublicLayout>
          <RegisterPage />
        </PublicLayout>
      );

    case 'forgot-password':
      return (
        <PublicLayout>
          <ForgotPasswordPage />
        </PublicLayout>
      );

    case 'privacy-policy':
      return (
        <PublicLayout>
          <PrivacyPolicyPage />
        </PublicLayout>
      );

    case 'terms-conditions':
      return (
        <PublicLayout>
          <TermsConditionsPage />
        </PublicLayout>
      );

    case 'refund-policy':
      return (
        <PublicLayout>
          <RefundPolicyPage />
        </PublicLayout>
      );

    case 'course-player':
      if (!isAuthenticated || !user) {
        return (
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        );
      }
      return <CoursePlayerPage />;

    case 'certificate':
      return <CertificatePage />;

    case 'verify-certificate':
      return (
        <PublicLayout>
          <VerifyCertificatePage />
        </PublicLayout>
      );

    case 'checkout-success':
      return (
        <PublicLayout>
          <CheckoutSuccessPage />
        </PublicLayout>
      );

    // Digital Shop Routes
    case 'shop':
      return (
        <PublicLayout>
          <ShopPage />
        </PublicLayout>
      );

    case 'product-detail':
      return (
        <PublicLayout>
          <ProductDetailPage />
        </PublicLayout>
      );

    case 'cart':
      return (
        <PublicLayout>
          <CartPage />
        </PublicLayout>
      );

    case 'checkout':
      return (
        <PublicLayout>
          <CheckoutPage />
        </PublicLayout>
      );

    case 'invoice':
      return <InvoicePage />;

    case 'customer-orders':
      return (
        <PublicLayout>
          <CustomerOrdersPage />
        </PublicLayout>
      );

    case 'customer-downloads':
      return (
        <PublicLayout>
          <CustomerDownloadsPage />
        </PublicLayout>
      );

    // Admin Shop Routes
    case 'admin-products':
      if (!isAuthenticated || !user || user.role !== 'admin') {
        return <AccessDenied requiredRole="admin" />;
      }
      return <AdminProductsPage />;

    case 'admin-shop-orders':
      if (!isAuthenticated || !user || user.role !== 'admin') {
        return <AccessDenied requiredRole="admin" />;
      }
      return <AdminShopOrdersPage />;

    case 'admin-payment-settings':
      if (!isAuthenticated || !user || user.role !== 'admin') {
        return <AccessDenied requiredRole="admin" />;
      }
      return <AdminPaymentSettingsPage />;

    case 'admin-coupons':
      if (!isAuthenticated || !user || user.role !== 'admin') {
        return <AccessDenied requiredRole="admin" />;
      }
      return <AdminCouponsPage />;

    case 'track-order':
      return (
        <PublicLayout>
          <TrackOrderPage />
        </PublicLayout>
      );

    case 'student-dashboard':
      if (!isAuthenticated || !user) {
        return (
          <PublicLayout>
            <LoginPage />
          </PublicLayout>
        );
      }
      return <StudentDashboard />;

    case 'instructor-dashboard':
      // Only instructor or admin can access instructor dashboard
      if (!isAuthenticated || !user || (user.role !== 'instructor' && user.role !== 'admin')) {
        return <AccessDenied requiredRole="instructor" />;
      }
      return <InstructorDashboard />;

    case 'admin-dashboard':
      // Strictly admin (Wanky) can access admin dashboard
      if (!isAuthenticated || !user || user.role !== 'admin') {
        return <AccessDenied requiredRole="admin" />;
      }
      return <AdminDashboard />;

    default:
      return (
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      );
  }
};

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationProvider>
          <AppContent />
        </NavigationProvider>
      </CartProvider>
    </AuthProvider>
  );
}
