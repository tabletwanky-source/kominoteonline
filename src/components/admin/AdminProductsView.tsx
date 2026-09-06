import React, { useState, useEffect } from 'react';
import { productsService, productCategoriesService } from '../../services/firebaseService';
import { DigitalProduct, ProductCategory } from '../../types/database';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  ShoppingBag,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Upload,
  Layers,
  Sparkles,
  DollarSign,
  Loader2,
} from 'lucide-react';

export const AdminProductsView: React.FC = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    description: '',
    category: 'Liv & Gid',
    price: 15,
    salePrice: '',
    productType: 'pdf' as 'pdf' | 'ebook' | 'template' | 'software' | 'zip',
    coverImage: '',
    downloadFileUrl: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    featured: false,
  });

  // Category creation inline
  const [newCatName, setNewCatName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, cList] = await Promise.all([
        productsService.getAll(false),
        productCategoriesService.getAll(),
      ]);
      setProducts(pList);
      setCategories(cList);
    } catch (err) {
      console.error('Error loading products for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      slug: '',
      shortDescription: '',
      description: '',
      category: categories[0]?.name || 'Liv & Gid',
      price: 15,
      salePrice: '',
      productType: 'pdf',
      coverImage: '',
      downloadFileUrl: '',
      status: 'published',
      featured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: DigitalProduct) => {
    setEditingProduct(p);
    setFormData({
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      category: p.category || p.categoryName || 'Liv & Gid',
      price: p.price,
      salePrice: p.salePrice !== undefined && p.salePrice !== null ? String(p.salePrice) : '',
      productType: p.productType as any,
      coverImage: p.coverImage || p.imageUrl || '',
      downloadFileUrl: p.downloadFileUrl || (p.files && p.files[0]?.fileUrl) || '',
      status: p.status,
      featured: p.featured || false,
    });
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingProduct ? prev.slug : slugified,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.slug.trim()) {
      setActionError('Tit ak Slug obligatwa.');
      return;
    }

    try {
      setSaving(true);
      setActionError(null);

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        category: formData.category,
        categoryId: formData.category,
        categoryName: formData.category,
        price: Number(formData.price) || 0,
        salePrice: formData.salePrice ? Number(formData.salePrice) : undefined,
        productType: formData.productType,
        imageUrl:
          formData.coverImage.trim() ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        coverImage:
          formData.coverImage.trim() ||
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
        downloadFileUrl: formData.downloadFileUrl.trim(),
        downloadable: true,
        status: formData.status,
        featured: formData.featured,
        currency: 'USD',
      };

      if (editingProduct) {
        await productsService.update(editingProduct.id, payload);
        setActionSuccess('Pwodwi a modifye avèk siksè!');
      } else {
        await productsService.create(payload as any);
        setActionSuccess('Nouvo pwodwi a kreye avèk siksè!');
      }

      setIsModalOpen(false);
      await loadData();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setActionError(err.message || 'Erè pandan anrejistreman pwodwi a.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Èske ou sèten ou vle efase "${title}"?`)) return;
    try {
      await productsService.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setActionSuccess('Pwodwi a efase.');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error(err);
      setActionError('Erè pandan efasman pwodwi a.');
    }
  };

  const handleToggleStatus = async (p: DigitalProduct) => {
    const nextStatus = p.status === 'published' ? 'draft' : 'published';
    try {
      await productsService.update(p.id, { status: nextStatus });
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const slug = newCatName.toLowerCase().replace(/\s+/g, '-');
      const cat = await productCategoriesService.create({ name: newCatName.trim(), slug });
      setCategories((prev) => [...prev, cat]);
      setFormData((prev) => ({ ...prev, category: cat.name }));
      setNewCatName('');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const cat = p.category || p.categoryName || '';
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Notification */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
            <span>Katalòg Pwodwi Dijital</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jere liv elektwonik, modèl, gid PDF, ak kòd sous ki disponib nan Boutik Kominote Online la.
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajoute Nouvo Pwodwi</span>
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
            placeholder="Chèche pa tit, kategori oswa slug..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Tout Estati</option>
          <option value="published">Pibliye (Published)</option>
          <option value="draft">Brouyon (Draft)</option>
          <option value="archived">Achive (Archived)</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Chajman pwodwi yo ap fèt...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 mb-1">Pa gen pwodwi ki matche</h4>
            <p className="text-xs text-slate-500 mb-4">
              Klike sou &quot;Ajoute Nouvo Pwodwi&quot; pou pibliye premye pwodwi dijital ou nan Firestore.
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              Kreye Premye Pwodwi
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="py-3.5 px-4">Pwodwi</th>
                  <th className="py-3.5 px-3">Kategori &amp; Tip</th>
                  <th className="py-3.5 px-3">Pri</th>
                  <th className="py-3.5 px-3 text-center">Estati</th>
                  <th className="py-3.5 px-4 text-right">Aksyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const hasDiscount =
                    prod.salePrice !== undefined &&
                    prod.salePrice !== null &&
                    prod.salePrice < prod.price;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              prod.coverImage ||
                              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80'
                            }
                            alt={prod.title}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-bold text-slate-900 truncate text-sm">{prod.title}</p>
                            <p className="text-[11px] text-slate-400 truncate font-mono">/shop/{prod.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">{prod.category}</span>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          {prod.productType}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3">
                        {hasDiscount ? (
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">${prod.salePrice}</span>{' '}
                            <span className="text-slate-400 line-through text-[11px]">${prod.price}</span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-sm">${prod.price} USD</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(prod)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors ${
                            prod.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Klike pou chanje estati"
                        >
                          {prod.status === 'published' ? 'Pibliye' : 'Brouyon'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifye"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.title)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Efase"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Product Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">
                {editingProduct ? 'Modifye Pwodwi Dijital' : 'Kreye Nouvo Pwodwi Dijital'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Title & Slug */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tit Pwodwi a *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Egzanp: Gid Konplè Pou Lanse Yon Biznis An Liy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="gid-konple-biznis-an-liy"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Category & Product Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Liv & Gid">Liv &amp; Gid</option>
                    <option value="Modèl Dokiman">Modèl Dokiman</option>
                    <option value="Devlopman & Kòd">Devlopman &amp; Kòd</option>
                    <option value="Biznis & Maketing">Biznis &amp; Maketing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tip Fichye Dijital *</label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="pdf">PDF (Dokiman / Gid)</option>
                    <option value="ebook">E-Book (Liv Elektwonik)</option>
                    <option value="template">Template / Modèl</option>
                    <option value="software">Lojisyèl / Kòd Sous</option>
                    <option value="zip">ZIP (Fichye konprese)</option>
                  </select>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pri Estanda ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pri Rabè ($ USD - Si aplikab)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    placeholder="Kite vid si pa gen rabè"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kout Deskripsyon (Rezime)</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Yon fraz oswa de ki prezante pwodwi a byen vit"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsyon Konplè</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Eksplike tout detay, kisa ki enkli ladan l, benefis yo..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Imaj Kouvèti (URL Imaj)</label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Secure Download File URL */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block font-bold text-slate-900">
                  Lyen Fichye Telechajab (Download URL)
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fichye sa a pwoteje sou sèvè a. Se sèlman kliyan ki gen kòmand apwouve pa admin ki ka telechaje l.
                </p>
                <input
                  type="text"
                  value={formData.downloadFileUrl}
                  onChange={(e) => setFormData({ ...formData, downloadFileUrl: e.target.value })}
                  placeholder="https://storage.googleapis.com/... oswa /downloads/fichye.pdf"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Status and Featured */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estati Piblikasyon</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="published">Pibliye (Vizib nan Boutik)</option>
                    <option value="draft">Brouyon (Kache)</option>
                    <option value="archived">Achive</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-700">Mete an vedèt (Featured)</span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Anrejistreman...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Mete a Jou' : 'Kreye Pwodwi'}</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
