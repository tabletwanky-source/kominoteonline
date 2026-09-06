import React from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { AdminShopOrdersView } from '../../components/admin/AdminShopOrdersView';
import { useNavigation } from '../../context/NavigationContext';

export const AdminShopOrdersPage: React.FC = () => {
  const { navigate } = useNavigation();

  return (
    <DashboardLayout
      activeSection="shop-orders"
      onSectionChange={(section) => {
        if (section === 'dashboard') navigate('admin');
        else if (section === 'shop-products') navigate('admin-products');
        else if (section === 'shop-payments') navigate('admin-payment-settings');
        else navigate('admin');
      }}
      title="Kòmand Dijital & Apwobasyon"
      subtitle="Verifye prèv peman yo epi aktive aksè telechajman pou kliyan yo"
    >
      <AdminShopOrdersView />
    </DashboardLayout>
  );
};
