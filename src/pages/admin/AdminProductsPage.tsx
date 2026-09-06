import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { AdminProductsView } from '../../components/admin/AdminProductsView';
import { useNavigation } from '../../context/NavigationContext';

export const AdminProductsPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <DashboardLayout
      activeSection="shop-products"
      onSectionChange={(section) => {
        if (section === 'dashboard') navigate('admin');
        else if (section === 'shop-orders') navigate('admin-shop-orders');
        else if (section === 'shop-payments') navigate('admin-payment-settings');
        else navigate('admin');
      }}
      title="Pwodwi Dijital Boutik"
      subtitle="Jere tout fichye ak liv elektwonik ki sou boutik la"
    >
      <AdminProductsView />
    </DashboardLayout>
  );
};
