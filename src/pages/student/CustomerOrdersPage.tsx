import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { shopOrdersService } from '../../services/firebaseService';
import { ShopOrder } from '../../types/database';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

export const CustomerOrdersPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserOrders() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const list = await shopOrdersService.getUserOrders(user.id);
        setOrders(list);
      } catch (err) {
        console.error('Error loading customer orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserOrders();
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-vh-100 bg-slate-50 py-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <Package className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Konekte sou Kont Ou</h2>
          <p className="text-slate-600 text-sm mb-6">
            Ou dwe konekte pou w ka wè lis kòmand ak fakti w yo.
          </p>
          <button
            onClick={() => navigate('login')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm"
          >
            Konekte Kounye a
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (order: ShopOrder) => {
    if (order.orderStatus === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Apwouve
        </span>
      );
    }
    if (order.orderStatus === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Refize
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Ap tann verifikasyon
      </span>
    );
  };

  const getDownloadBadge = (order: ShopOrder) => {
    if (order.downloadStatus === 'enabled') {
      return (
        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold">
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          Disponib
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-bold">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Bloke (Ap tann admin)
      </span>
    );
  };

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('shop')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tounen nan Boutik la</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Package className="w-7 h-7 text-blue-600" />
              <span>Kòmand Dijital Mwen Yo</span>
            </h1>
          </div>

          <button
            id="btn-goto-downloads"
            onClick={() => navigate('customer-downloads')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ale nan Telechajman</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-32"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Ou poko pase okenn kòmand</h3>
            <p className="text-xs text-slate-500 mb-6">
              Lè w achte yon resous dijital, w ap wè detay yo, fakti w, ak eta telechajman an la a.
            </p>
            <button
              onClick={() => navigate('shop')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <span>Vizite Boutik la</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                id={`customer-order-${order.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-blue-200 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      Nimewo Kòmand
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {order.orderNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Soumèt le: {new Date(order.submittedAt).toLocaleDateString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order)}
                  </div>
                </div>

                {/* Items & details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-xs">
                  <div className="md:col-span-6 space-y-1.5">
                    <span className="font-bold text-slate-700 block">Pwodwi Kòmande:</span>
                    {order.items && order.items.map((it, idx) => (
                      <p key={idx} className="text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
                        <span className="font-semibold">{it.title}</span>
                        <span className="text-slate-400">({it.productType}, Qte: {it.quantity})</span>
                      </p>
                    ))}
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <span className="font-bold text-slate-700 block">Aksè Telechajman:</span>
                    {getDownloadBadge(order)}
                    {order.orderStatus !== 'approved' && (
                      <p className="text-[11px] text-slate-400">
                        Aksè a ap ouvri otomatikman lè admin fin valide peman an.
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-3 flex sm:flex-col sm:items-end justify-between gap-2">
                    <div className="sm:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Montan Total:</span>
                      <span className="text-lg font-black text-slate-900">${order.total.toFixed(2)} USD</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.invoiceId && (
                        <button
                          id={`btn-order-invoice-${order.id}`}
                          onClick={() => navigate('invoice', { invoiceId: order.invoiceId! })}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Fakti</span>
                        </button>
                      )}

                      {order.downloadStatus === 'enabled' && (
                        <button
                          id={`btn-order-download-${order.id}`}
                          onClick={() => navigate('customer-downloads')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Telechaje</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
