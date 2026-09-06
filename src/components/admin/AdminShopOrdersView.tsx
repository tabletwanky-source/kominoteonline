import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { shopOrdersService } from '../../services/firebaseService';
import { ShopOrder } from '../../types/database';
import {
  Package,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  Lock,
  Unlock,
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  X,
  Mail,
  Phone,
} from 'lucide-react';

export const AdminShopOrdersView: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const list = await shopOrdersService.getAll();
      setOrders(list);
    } catch (err) {
      console.error('Error loading shop orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleApprove = async (order: ShopOrder) => {
    if (!window.confirm(`Èske ou vle konfime peman pou kòmand ${order.orderNumber} epi debloke telechajman an?`)) {
      return;
    }

    try {
      setActionLoadingId(order.id);
      setFeedback(null);

      const res = await shopOrdersService.approveOrder(order.id, user?.id || 'Admin');
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Kòmand ${order.orderNumber} apwouve! Aksè telechajman debloke e imèl konfimasyon voye bay kliyan an.`,
        });
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  paymentStatus: 'paid',
                  orderStatus: 'approved',
                  downloadStatus: 'enabled',
                  approvedAt: new Date().toISOString(),
                }
              : o
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Erè pandan apwobasyon an.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (order: ShopOrder) => {
    const reason = window.prompt('Poukisa ou vle refize kòmand sa a? (Opsyonèl):');
    if (reason === null) return; // cancelled

    try {
      setActionLoadingId(order.id);
      setFeedback(null);

      const res = await shopOrdersService.rejectOrder(order.id, reason);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Kòmand ${order.orderNumber} make kòm refize.`,
        });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  orderStatus: 'rejected',
                  downloadStatus: 'locked',
                  adminNotes: reason || o.adminNotes,
                }
              : o
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Erè pandan rejè kòmand lan.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleDownload = async (order: ShopOrder) => {
    const shouldEnable = order.downloadStatus !== 'enabled';
    try {
      setActionLoadingId(order.id);
      const res = await shopOrdersService.toggleDownload(order.id, shouldEnable);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? { ...o, downloadStatus: shouldEnable ? 'enabled' : 'locked' }
              : o
          )
        );
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Erè chanjman aksè telechajman.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && o.orderStatus === 'pending') ||
      (statusFilter === 'approved' && o.orderStatus === 'approved') ||
      (statusFilter === 'rejected' && o.orderStatus === 'rejected') ||
      (statusFilter === 'paid' && o.paymentStatus === 'paid');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-blue-600" />
            <span>Kòmand Boutik &amp; Apwobasyon</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Valide peman kliyan yo (Cash, Transfè, Depo, PayPal) epi debloke aksè pou yo ka telechaje resous yo.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          Rafrechi Lis la
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chèche pa nimewo kòmand, non kliyan, imèl, oswa telefòn..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Tout Kòmand</option>
          <option value="pending">Ap Tann Apwobasyon</option>
          <option value="approved">Apwouve (Approved)</option>
          <option value="rejected">Refize (Rejected)</option>
          <option value="paid">Peye (Paid)</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Kòmand yo ap chaje...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 mb-1">Pa gen kòmand ki matche</h4>
            <p className="text-xs text-slate-500">
              Kòmand kliyan yo pase nan boutik la ap parèt la a pou validation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Kòmand</th>
                  <th className="py-3.5 px-3">Kliyan</th>
                  <th className="py-3.5 px-3">Peman &amp; Prèv</th>
                  <th className="py-3.5 px-3">Montan</th>
                  <th className="py-3.5 px-3 text-center">Estati</th>
                  <th className="py-3.5 px-3 text-center">Telechajman</th>
                  <th className="py-3.5 px-4 text-right">Aksyon Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const isProcessing = actionLoadingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Order info */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 block text-xs">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(order.submittedAt).toLocaleDateString('fr-FR', { dateStyle: 'short' })}
                        </span>
                      </td>

                      {/* Customer info */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">{order.email}</p>
                        <p className="text-[11px] text-slate-400">{order.phone}</p>
                      </td>

                      {/* Payment & Proof */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 capitalize block">
                          {order.paymentMethod}
                        </span>
                        {order.transactionReference && (
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Ref: {order.transactionReference}
                          </span>
                        )}
                        {order.paymentProofUrl ? (
                          <button
                            onClick={() => setSelectedProofUrl(order.paymentProofUrl!)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Gade Prèv</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Pa gen prèv</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ${order.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">USD</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {order.orderStatus === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Apwouve
                          </span>
                        ) : order.orderStatus === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                            <XCircle className="w-3 h-3" />
                            Refize
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            Ap Tann
                          </span>
                        )}
                      </td>

                      {/* Download Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleDownload(order)}
                          title="Klike pou aktive/bloke telechajman"
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                            order.downloadStatus === 'enabled'
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {order.downloadStatus === 'enabled' ? (
                            <>
                              <Unlock className="w-3 h-3 text-blue-600" />
                              <span>Debloke</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Bloke</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.orderStatus !== 'approved' && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApprove(order)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Apwouve kòmand & Debloke telechajman"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Apwouve</span>
                            </button>
                          )}

                          {order.orderStatus !== 'rejected' && order.orderStatus !== 'approved' && (
                            <button
                              disabled={isProcessing}
                              onClick={() => handleReject(order)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Refize kòmand"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refize</span>
                            </button>
                          )}

                          {order.invoiceId && (
                            <button
                              onClick={() => navigate('invoice', { invoiceId: order.invoiceId! })}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Wè Fakti"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proof of Payment Lightbox Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-base">Prèv Peman Kliyan an</h3>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <img
                src={selectedProofUrl}
                alt="Prèv Peman"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
