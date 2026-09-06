import React, { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { productsService, productCategoriesService } from '../../services/firebaseService';
import { DigitalProduct, ProductCategory } from '../../types/database';
import {
  Search,
  Filter,
  ShoppingBag,
  ShoppingCart,
  FileText,
  BookOpen,
  Code,
  Layers,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { addToCart, isInCart } = useCart();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadShopData() {
      try {
        setLoading(true);
        const [prods, cats] = await Promise.all([
          productsService.getAll(true),
          productCategoriesService.getAll(),
        ]);
        setProducts(prods || []);
        setCategories(cats || []);
      } catch (err) {
        console.error('Error loading shop products:', err);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    loadShopData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      case 'ebook':
        return <BookOpen className="w-3.5 h-3.5 text-indigo-600" />;
      case 'template':
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
      case 'software':
      case 'code':
        return <Code className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'all' ||
          p.category === selectedCategory ||
          (p as any).categoryId === selectedCategory;

        const matchesType =
          selectedType === 'all' || p.productType.toLowerCase() === selectedType.toLowerCase();

        const matchesSearch =
          searchQuery.trim() === '' ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesType && matchesSearch;
      })
      .sort((a, b) => {
        const priceA = a.salePrice !== undefined && a.salePrice < a.price ? a.salePrice : a.price;
        const priceB = b.salePrice !== undefined && b.salePrice < b.price ? b.salePrice : b.price;

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, selectedCategory, selectedType, searchQuery, sortBy]);

  const handleAddToCart = (product: DigitalProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1800);
  };

  const handleBuyNow = (product: DigitalProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    navigate('checkout');
  };

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-4 border border-blue-400/20">
              <ShoppingBag className="w-3.5 h-3.5" />
              Boutik Dijital Kominote
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
              Fichye, Gid &amp; Resous Dijital Pou Fòmasyon Ou
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-6 leading-relaxed">
              Dekouvri liv elektwonik, modèl dokiman, kòd sous, ak resous pwofesyonèl pou akselere pwojè w. Chak acha sekirize e valide pa ekip nou an.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Peman Fasil (Cash, Transfè, Depo, PayPal)</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Validasyon &amp; Telechajman Sekirize</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="shop-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chèche yon liv, modèl, gid..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="shop-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full lg:w-48 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tout Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="w-full lg:w-auto">
              <select
                id="shop-type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full lg:w-44 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all">Tout Tip Fichye</option>
                <option value="pdf">PDF / Gid</option>
                <option value="ebook">E-Book (Liv)</option>
                <option value="template">Modèl / Template</option>
                <option value="software">Lojisyèl / Kòd</option>
                <option value="zip">Fichye Konprese (ZIP)</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="w-full lg:w-auto ml-auto">
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full lg:w-44 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="newest">Ki Pi Resan</option>
                <option value="price-asc">Pri Pi Ba</option>
                <option value="price-desc">Pri Pi Wo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid / States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse shadow-sm h-96"
              >
                <div className="h-48 bg-slate-200"></div>
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-8 bg-slate-200 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty State - REAL clean empty state */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Poko gen pwodwi dijital ki pibliye
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Administrasyon Kominote Online an ap prepare resous dijital eksklizif pou ou. Tounen talè oswa kontakte nou si w bezwen yon resous patikilye.
            </p>
            <button
              id="shop-empty-contact-btn"
              onClick={() => navigate('courses')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>Eksplore Kou Nou Yo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isOnSale =
                product.salePrice !== undefined &&
                product.salePrice !== null &&
                product.salePrice < product.price;

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  onClick={() => navigate('product-detail', { slug: product.slug || product.id })}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                    <img
                      src={
                        product.coverImage ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'
                      }
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-semibold shadow-xs">
                        {getTypeIcon(product.productType)}
                        <span className="uppercase">{product.productType}</span>
                      </span>

                      {isOnSale && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                          Rabè
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Category */}
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
                      {product.category}
                    </p>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                      {product.title}
                    </h3>

                    {/* Short Description */}
                    <p className="text-slate-600 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
                      {product.shortDescription}
                    </p>

                    {/* Pricing */}
                    <div className="pt-3 border-t border-slate-100 flex items-baseline gap-2 mb-4">
                      {isOnSale ? (
                        <>
                          <span className="text-xl font-black text-slate-900">
                            ${product.salePrice}
                          </span>
                          <span className="text-sm font-semibold text-slate-400 line-through">
                            ${product.price}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">USD</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl font-black text-slate-900">
                            ${product.price}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">USD</span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id={`btn-add-cart-${product.id}`}
                        onClick={(e) => handleAddToCart(product, e)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          justAddedId === product.id
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : isInCart(product.id)
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {justAddedId === product.id ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ajoute!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{isInCart(product.id) ? 'Nan Panye' : 'Panye'}</span>
                          </>
                        )}
                      </button>

                      <button
                        id={`btn-buy-now-${product.id}`}
                        onClick={(e) => handleBuyNow(product, e)}
                        className="py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Achte</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
