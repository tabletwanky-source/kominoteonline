import React, { useState, useEffect } from 'react';
import {
  couponsService,
  coursesService,
  productsService,
  categoriesService,
} from '../../services/firebaseService';
import { Coupon, CouponDiscountType, CouponAppliesTo, Course, Category, DigitalProduct } from '../../types/database';
import {
  Tag,
  Plus,
  Search,
  Edit3,
  Trash2,
  Power,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  TrendingUp,
  Users,
  Percent,
  DollarSign,
  BarChart3,
  BookOpen,
  ShoppingBag,
  Layers,
} from 'lucide-react';

interface CouponFormData {
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  currency: string;
  minimumPurchase: number;
  maximumDiscount: number;
  appliesTo: CouponAppliesTo;
  courseIds: string;
  productIds: string;
  categoryIds: string;
  usageLimit: number;
  usageLimitPerUser: number;
  startsAt: string;
  expiresAt: string;
  active: boolean;
}

const emptyForm: CouponFormData = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  currency: 'USD',
  minimumPurchase: 0,
  maximumDiscount: 0,
  appliesTo: 'all',
  courseIds: '',
  productIds: '',
  categoryIds: '',
  usageLimit: 0,
  usageLimitPerUser: 0,
  startsAt: '',
  expiresAt: '',
  active: true,
};

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});

  // Catalog items for easy picker
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [availableProducts, setAvailableProducts] = useState<DigitalProduct[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);

  // Detailed Usage Statistics Modal State
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsCoupon, setStatsCoupon] = useState<Coupon | null>(null);
  const [statsRecords, setStatsRecords] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const [list, courses, products, categories] = await Promise.all([
        couponsService.getAll(),
        coursesService.getAll().catch(() => []),
        productsService.getAll().catch(() => []),
        categoriesService.getAll().catch(() => []),
      ]);
      setCoupons(list);
      setAvailableCourses(courses);
      setAvailableProducts(products);
      setAvailableCategories(categories);

      // Load usage stats
      const stats: Record<string, number> = {};
      for (const c of list) {
        stats[c.id] = c.usageCount || 0;
      }
      setUsageStats(stats);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStats = async (coupon: Coupon) => {
    setStatsCoupon(coupon);
    setStatsModalOpen(true);
    setLoadingStats(true);
    setStatsRecords([]);
    try {
      const usage = await couponsService.getUsage(coupon.id);
      setStatsRecords(usage);
    } catch (err) {
      console.error('Error fetching coupon usage stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      currency: coupon.currency || 'USD',
      minimumPurchase: coupon.minimumPurchase || 0,
      maximumDiscount: coupon.maximumDiscount || 0,
      appliesTo: coupon.appliesTo,
      courseIds: (coupon.courseIds || []).join(', '),
      productIds: (coupon.productIds || []).join(', '),
      categoryIds: (coupon.categoryIds || []).join(', '),
      usageLimit: coupon.usageLimit || 0,
      usageLimitPerUser: coupon.usageLimitPerUser || 0,
      startsAt: coupon.startsAt ? coupon.startsAt.split('T')[0] : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      active: coupon.active,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFeedback({ type: 'error', message: 'Tanpri antre yon kòd rabè.' });
      return;
    }
    if (formData.discountValue <= 0) {
      setFeedback({ type: 'error', message: 'Valè rabè a dwe pi gran pase zewo.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        currency: formData.currency,
        minimumPurchase: Number(formData.minimumPurchase) || 0,
        maximumDiscount: Number(formData.maximumDiscount) || 0,
        appliesTo: formData.appliesTo,
        courseIds: formData.courseIds ? formData.courseIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
        productIds: formData.productIds ? formData.productIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
        categoryIds: formData.categoryIds ? formData.categoryIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
        usageLimit: Number(formData.usageLimit) || 0,
        usageLimitPerUser: Number(formData.usageLimitPerUser) || 0,
        startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        active: formData.active,
      };

      if (editingCoupon) {
        const success = await couponsService.update(editingCoupon.id, payload);
        if (!success) throw new Error('Erè nan modifikasyon kòd rabè a.');
        setFeedback({ type: 'success', message: 'Kòd rabè modifye avèk siksè!' });
      } else {
        const created = await couponsService.create(payload as any);
        if (!created) throw new Error('Erè nan kreyasyon kòd rabè a.');
        setFeedback({ type: 'success', message: 'Kòd rabè kreye avèk siksè!' });
      }

      setShowModal(false);
      await loadCoupons();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erè nan operasyon an.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await couponsService.update(coupon.id, { active: !coupon.active });
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, active: !c.active } : c));
    } catch (err) {
      console.error('Error toggling coupon:', err);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Èske ou vle efase kòd rabè "${coupon.code}"?`)) return;
    try {
      await couponsService.delete(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      setFeedback({ type: 'success', message: 'Kòd rabè efase avèk siksè.' });
    } catch (err) {
      setFeedback({ type: 'error', message: 'Erè nan efase kòd rabè a.' });
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase();
    return c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { dateStyle: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-blue-600" />
            <span>Kòd Rabè (Koupon)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kreye, modifye, ak jere kòd rabè pou kou ak pwodwi dijital yo.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Kreye Kòd Rabè</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Chèche pa kòd oswa deskripsyon..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Kòd rabè yo ap chaje...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 mb-1">Pa gen kòd rabè</h4>
            <p className="text-xs text-slate-500">Klike sou "Kreye Kòd Rabè" pou kreye premye kòd ou a.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Kòd</th>
                  <th className="py-3.5 px-3">Deskripsyon</th>
                  <th className="py-3.5 px-3">Tip Rabè</th>
                  <th className="py-3.5 px-3">Aplike A</th>
                  <th className="py-3.5 px-3 text-center">Itilizasyon</th>
                  <th className="py-3.5 px-3">Ekspirasyon</th>
                  <th className="py-3.5 px-3 text-center">Estati</th>
                  <th className="py-3.5 px-4 text-right">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 font-mono text-sm tracking-wider">{coupon.code}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600 text-[11px]">{coupon.description || '—'}</span>
                    </td>
                    <td className="py-3 px-3">
                      {coupon.discountType === 'percentage' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          <Percent className="w-3 h-3" />
                          {coupon.discountValue}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          <DollarSign className="w-3 h-3" />
                          ${coupon.discountValue.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600 text-[11px] capitalize">
                        {coupon.appliesTo === 'all' ? 'Tout' : coupon.appliesTo === 'courses' ? 'Kou' : coupon.appliesTo === 'products' ? 'Pwodwi' : 'Kategori'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-800">{coupon.usageCount || 0}</span>
                      {coupon.usageLimit && coupon.usageLimit > 0 ? (
                        <span className="text-slate-400 text-[10px]"> / {coupon.usageLimit}</span>
                      ) : null}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-slate-600 text-[11px]">{formatDate(coupon.expiresAt)}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {coupon.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                          <Power className="w-3 h-3" />
                          Pa Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenStats(coupon)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Wè Estatistik Itilizasyon"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Modifye"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(coupon)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title={coupon.active ? 'Dezaktive' : 'Aktive'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Efase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" />
                {editingCoupon ? 'Modifye Kòd Rabè' : 'Kreye Kòd Rabè Nouvo'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kòd Rabè *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Egz: KOMINOTE10"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsyon</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Egz: 10% rabè pou tout nouvo elèv"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tip Rabè *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as CouponDiscountType })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="percentage">Pousantaj (%)</option>
                    <option value="fixed">Montan Fiks ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Valè Rabè * {formData.discountType === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={formData.discountType === 'percentage' ? '1' : '0.01'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    placeholder={formData.discountType === 'percentage' ? '10' : '10.00'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Achte Minimòm ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimumPurchase}
                    onChange={(e) => setFormData({ ...formData, minimumPurchase: Number(e.target.value) })}
                    placeholder="0 (pa gen minimòm)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rabè Maksimòm ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maximumDiscount}
                    onChange={(e) => setFormData({ ...formData, maximumDiscount: Number(e.target.value) })}
                    placeholder="0 (pa gen maksimòm)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Aplike A *</label>
                  <select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as CouponAppliesTo })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="all">Tout (Kou ak Pwodwi)</option>
                    <option value="courses">Kou Sèlman</option>
                    <option value="products">Pwodwi Sèlman</option>
                    <option value="categories">Kategori Sèlman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Limit Itilizasyon Total</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    placeholder="0 (pa gen limit)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Limit pa Itilizatè</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })}
                    placeholder="0 (pa gen limit)"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dak Kòmanse</label>
                  <input
                    type="date"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Dak Ekspirasyon</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {formData.appliesTo === 'courses' && (
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Chwazi Kou Ki Konsène (oswa antre ID)</label>
                      <span className="text-[10px] text-slate-400">Klike pou chwazi / retire</span>
                    </div>
                    {availableCourses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {availableCourses.map((c) => {
                          const ids = formData.courseIds.split(',').map((s) => s.trim()).filter(Boolean);
                          const isSelected = ids.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected ? ids.filter((x) => x !== c.id) : [...ids, c.id];
                                setFormData({ ...formData, courseIds: next.join(', ') });
                              }}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{c.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.courseIds}
                      onChange={(e) => setFormData({ ...formData, courseIds: e.target.value })}
                      placeholder="kou-id-1, kou-id-2"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {formData.appliesTo === 'products' && (
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Chwazi Pwodwi Dijital (oswa antre ID)</label>
                      <span className="text-[10px] text-slate-400">Klike pou chwazi / retire</span>
                    </div>
                    {availableProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {availableProducts.map((p) => {
                          const ids = formData.productIds.split(',').map((s) => s.trim()).filter(Boolean);
                          const isSelected = ids.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected ? ids.filter((x) => x !== p.id) : [...ids, p.id];
                                setFormData({ ...formData, productIds: next.join(', ') });
                              }}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <ShoppingBag className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{p.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.productIds}
                      onChange={(e) => setFormData({ ...formData, productIds: e.target.value })}
                      placeholder="pwodwi-id-1, pwodwi-id-2"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {formData.appliesTo === 'categories' && (
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Chwazi Kategori (oswa antre ID)</label>
                      <span className="text-[10px] text-slate-400">Klike pou chwazi / retire</span>
                    </div>
                    {availableCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                        {availableCategories.map((cat) => {
                          const ids = formData.categoryIds.split(',').map((s) => s.trim()).filter(Boolean);
                          const isSelected = ids.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                const next = isSelected ? ids.filter((x) => x !== cat.id) : [...ids, cat.id];
                                setFormData({ ...formData, categoryIds: next.join(', ') });
                              }}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <Layers className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.categoryIds}
                      onChange={(e) => setFormData({ ...formData, categoryIds: e.target.value })}
                      placeholder="kategori-id-1, kategori-id-2"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">Kòd rabè sa a aktif</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Annile
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingCoupon ? 'Modifye' : 'Kreye'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Statistics Modal */}
      {statsModalOpen && statsCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>Estatistik Itilizasyon: <span className="font-mono text-blue-600">{statsCoupon.code}</span></span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{statsCoupon.description || 'Kòd Rabè Kominote Online'}</p>
              </div>
              <button
                onClick={() => setStatsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Itilize</span>
                <span className="text-lg font-black text-slate-900">{statsCoupon.usageCount || 0}</span>
                {statsCoupon.usageLimit ? (
                  <span className="text-[10px] text-slate-500 block">sou {statsCoupon.usageLimit}</span>
                ) : (
                  <span className="text-[10px] text-slate-500 block">San limit</span>
                )}
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Valè Rabè</span>
                <span className="text-lg font-black text-emerald-600">
                  {statsCoupon.discountType === 'percentage' ? `${statsCoupon.discountValue}%` : `$${statsCoupon.discountValue.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-slate-500 block">{statsCoupon.discountType}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Estati</span>
                <span className={`text-xs font-extrabold inline-block px-2.5 py-1 rounded-full mt-1 ${statsCoupon.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {statsCoupon.active ? 'Aktif' : 'Pa aktif'}
                </span>
              </div>
            </div>

            {/* Table of Usages */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Istorik Tranzaksyon ki te Itilize Kòd la ({statsRecords.length})
              </h4>
              {loadingStats ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Chaje done estatistik...</p>
                </div>
              ) : statsRecords.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-medium text-slate-500">Kòd rabè sa a poko janm itilize nan okenn kòmand.</p>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Dat</th>
                        <th className="py-2.5 px-3">Kliyan / ID</th>
                        <th className="py-2.5 px-3 text-right">Rabè Aplike</th>
                        <th className="py-2.5 px-3 text-right">Total Kòmand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statsRecords.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {r.usedAt ? new Date(r.usedAt).toLocaleDateString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-[160px]">
                            {r.userEmail || r.userId || 'Kliyan'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {r.discountAmount ? `-$${Number(r.discountAmount).toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {r.finalTotal ? `$${Number(r.finalTotal).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatsModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fèmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
