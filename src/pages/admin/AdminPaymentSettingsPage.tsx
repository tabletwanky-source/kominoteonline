import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { AdminPaymentSettingsView } from '../../components/admin/AdminPaymentSettingsView';
import { useNavigation } from '../../context/NavigationContext';

export const AdminPaymentSettingsPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <DashboardLayout
      activeSection="shop-payments"
      onSectionChange={(section) => {
        if (section === 'dashboard') navigate('admin');
        else if (section === 'shop-products') navigate('admin-products');
        else if (section === 'shop-orders') navigate('admin-shop-orders');
        else navigate('admin');
      }}
      title="Paramèt Peman Boutik la"
      subtitle="Konfigire enstriksyon Bank, PayPal, ak Cash pou acha dijital yo"
    >
      <AdminPaymentSettingsView />
    </DashboardLayout>
  );
};
