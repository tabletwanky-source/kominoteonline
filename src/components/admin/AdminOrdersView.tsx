import React, { useState, useEffect } from 'react';
import { ordersService, coursesService, usersService } from '../../services/firebaseService';
import { Order, Course, Profile, PaymentStatus } from '../../types/database';
import {
  ShoppingBag,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Shield,
  Sparkles,
  ChevronRight,
  User,
  BookOpen,
  Copy,
  Check,
  Zap,
  Info
} from 'lucide-react';

interface AdminOrdersViewProps {
  onNotify?: (msg: string) => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({ onNotify }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refund Modal State
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
  const [revokeAccess, setRevokeAccess] = useState(false);
  const [refundReason, setRefundReason] = useState('Demann kliyan');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Test Mode Simulation State
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orderList, courseList, userList] = await Promise.all([
        ordersService.getAll(),
        coursesService.getAll(),
        usersService.getAll(),
      ]);
      setOrders(orderList);
      setCourses(courseList);
      setProfiles(userList);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper lookups
  const getStudentInfo = (order: Order) => {
    const sId = order.studentId;
    const found = profiles.find((p) => p.id === sId);
    return {
      name: found?.full_name || order.customerEmail?.split('@')[0] || 'Elèv Kominote',
      email: found?.email || order.customerEmail || 'Pa gen imèl',
      phone: (found as any)?.phone || (order as any).phone || (order as any).customerPhone || '',
      id: sId,
    };
  };

  const getCourseInfo = (order: Order) => {
    const cId = order.courseId;
    const found = courses.find((c) => c.id === cId || c.slug === cId);
    return {
      title: found?.title || `Kou #${cId}`,
      thumbnail: found?.thumbnail,
      id: cId,
    };
  };

  // Execute Refund
  const handleExecuteRefund = async () => {
    if (!refundingOrder) return;
    try {
      setRefundSubmitting(true);
      const success = await ordersService.refundOrder(
        refundingOrder.id,
        revokeAccess,
        refundReason
      );

      if (success) {
        onNotify?.(`Kòmand ${refundingOrder.id} ranbouse avèk siksè nan Firestore.`);
        setRefundingOrder(null);
        await loadData();
      } else {
        alert('Erè pandan tretman ranbousman an.');
      }
    } catch (err: any) {
      alert('Erè: ' + err.message);
    } finally {
      setRefundSubmitting(false);
    }
  };

  // Test Mode Simulation Actions
  const runTestSimulation = async (testType: 'success' | 'canceled' | 'duplicate') => {
    try {
      setTestSubmitting(true);
      setTestResult(null);

      const targetCourse = courses[0] || { id: 'ai-prompt-engineering' };
      const targetStudent = profiles.find((p) => p.role === 'student') || profiles[0] || { id: 'test_student_123', email: 'test@kominote.ht' };

      const res = await fetch('/api/checkout/simulate-test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: targetCourse.id,
          studentId: targetStudent.id,
          studentEmail: targetStudent.email,
          testType,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Simulate test webhook returned non-JSON response', { status: res.status, contentType });
        setTestResult('Erè: Sèvè la pa reponn kòrèkteman.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setTestResult(`Test reyisi: ${data.message || 'Evènman anrejistre!'}`);
        await loadData();
      } else {
        setTestResult(`Erè tès: ${data.error || 'Erè'}`);
      }
    } catch (e: any) {
      setTestResult(`Erè: ${e.message}`);
    } finally {
      setTestSubmitting(false);
    }
  };

  // Metrics calculation
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  const paidCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingCount = orders.filter((o) => o.paymentStatus === 'pending').length;
  const failedCount = orders.filter((o) => o.paymentStatus === 'failed').length;
  const refundedCount = orders.filter((o) => o.paymentStatus === 'refunded').length;

  // Filtering
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (filterStatus !== 'all' && order.paymentStatus !== filterStatus) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const student = getStudentInfo(order);
      const course = getCourseInfo(order);
      const matchEmail = student.email.toLowerCase().includes(q);
      const matchName = student.name.toLowerCase().includes(q);
      const matchCourse = course.title.toLowerCase().includes(q);
      const matchSession = (order.stripeSessionId || order.id).toLowerCase().includes(q);
      const matchTracking = ((order as any).trackingNumber || '').toLowerCase().includes(q);
      const matchOrderNumber = ((order as any).orderNumber || '').toLowerCase().includes(q);
      const matchInvoice = ((order as any).invoiceNumber || (order as any).invoiceId || '').toLowerCase().includes(q);
      const matchRef = ((order as any).transactionReference || '').toLowerCase().includes(q);
      const matchPhone = (student.phone || (order as any).phone || '').toLowerCase().includes(q);
      return (
        matchEmail ||
        matchName ||
        matchCourse ||
        matchSession ||
        matchTracking ||
        matchOrderNumber ||
        matchInvoice ||
        matchRef ||
        matchPhone
      );
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>Kòmand & Peman Stripe ({orders.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Jere tranzaksyon Stripe Checkout, estati peman, ak ranbousman LMS Kominote Online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Rafrechi</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total Revni</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            ${totalRevenue.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-500">Tranzaksyon peye</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Peye (Paid)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{paidCount}</p>
          <span className="text-[10px] text-slate-500">Aksè kou debloke</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">An Atant</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{pendingCount}</p>
          <span className="text-[10px] text-slate-500">Kliyan nan checkout</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Ranbouse</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-600">{refundedCount}</p>
          <span className="text-[10px] text-slate-500">Ranbousman trete</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Echwe / Anile</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600">{failedCount}</p>
          <span className="text-[10px] text-slate-500">Pa gen aksè</span>
        </div>
      </div>

      {/* Interactive Stripe Test Mode Toolbar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-blue-200">
              Mòd Tès Stripe (Test Mode Sandbox)
            </span>
          </div>
          <span className="text-[11px] text-slate-300">
            Simile evènman Stripe ak Webhook pou verifye sekirite ak enskripsyon otomatik.
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => runTestSimulation('success')}
            disabled={testSubmitting}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Simile Peman Reyisi (Success)</span>
          </button>

          <button
            onClick={() => runTestSimulation('canceled')}
            disabled={testSubmitting}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
            <span>Simile Checkout Anile (Canceled)</span>
          </button>

          <button
            onClick={() => runTestSimulation('duplicate')}
            disabled={testSubmitting}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Simile Webhook Idempotency (Doublon)</span>
          </button>
        </div>

        {testResult && (
          <div className="p-2.5 bg-blue-950/80 border border-blue-400/40 rounded-xl text-xs text-blue-200">
            {testResult}
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `Tout (${orders.length})` },
                { id: 'paid', label: `Peye (${paidCount})` },
                { id: 'pending', label: `An Atant (${pendingCount})` },
                { id: 'failed', label: `Echwe (${failedCount})` },
                { id: 'refunded', label: `Ranbouse (${refundedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chèche pa elèv, kou, oswa session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Elèv (Student)</th>
                <th className="p-3.5">Kou (Course)</th>
                <th className="p-3.5">Montan</th>
                <th className="p-3.5">Estati Peman</th>
                <th className="p-3.5">Dat</th>
                <th className="p-3.5">Stripe Session ID</th>
                <th className="p-3.5 text-right">Aksyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <p className="font-semibold text-xs">Okenn kòmand pa koresponn ak filtè sa a.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const student = getStudentInfo(order);
                  const course = getCourseInfo(order);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Student */}
                      <td className="p-3.5">
                        <div>
                          <span className="font-extrabold text-slate-900 block">{student.name}</span>
                          <span className="text-[10px] text-slate-400 block">{student.email}</span>
                          {(order as any).trackingNumber && (
                            <span className="text-[10px] text-blue-700 font-mono font-bold block">
                              {(order as any).trackingNumber}
                            </span>
                          )}
                          {(order as any).couponCode && (
                            <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                              Kòd: {(order as any).couponCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Course */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800 line-clamp-1 max-w-[200px]" title={course.title}>
                          {course.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">#{course.id}</span>
                      </td>

                      {/* Amount */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 text-sm">
                          ${Number(order.amount || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">
                          {order.currency || 'USD'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {order.paymentStatus === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Paid (Peye)</span>
                          </span>
                        )}
                        {order.paymentStatus === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                        {order.paymentStatus === 'failed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        )}
                        {order.paymentStatus === 'refunded' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                            <RotateCcw className="w-3 h-3" />
                            <span>Refunded</span>
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Session ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]" title={order.stripeSessionId || order.id}>
                            {order.stripeSessionId || order.id}
                          </span>
                          <button
                            onClick={() => handleCopy(order.stripeSessionId || order.id)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            title="Kopye ID"
                          >
                            {copiedId === (order.stripeSessionId || order.id) ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        {order.paymentStatus === 'paid' && (
                          <button
                            onClick={() => {
                              setRefundingOrder(order);
                              setRevokeAccess(false);
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Ranbouse
                          </button>
                        )}
                        {order.paymentStatus === 'refunded' && (
                          <span className="text-[10px] text-slate-400 italic">
                            Ranbousman fèt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Confirmation Modal */}
      {refundingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Trete Ranbousman Kòmand la
              </h3>
              <p className="text-xs text-slate-500">
                Kòmand #{refundingOrder.id} • Montan: ${refundingOrder.amount} {refundingOrder.currency?.toUpperCase()}
              </p>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rezon Ranbousman an:
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Rezon pou dosye a..."
                />
              </div>

              {/* Admin Decision on Course Access Revocation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={revokeAccess}
                    onChange={(e) => setRevokeAccess(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Retire aksè kou a pou elèv la (Revoke Access)?
                    </span>
                    <span className="text-[11px] text-slate-500 leading-normal block">
                      Règ Kominote Online: Pwogrè elèv la nan leson yo pap janm efase, men estati enskripsyon an ap vin anile si w tcheke sa a.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleExecuteRefund}
                disabled={refundSubmitting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                {refundSubmitting ? 'Tretman an kou...' : 'Konfime Ranbousman'}
              </button>

              <button
                onClick={() => setRefundingOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Anile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
