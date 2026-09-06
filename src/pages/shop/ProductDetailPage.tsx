import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { productsService } from '../../services/firebaseService';
import { DigitalProduct } from '../../types/database';
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  Lock,
  Download,
  ShieldCheck,
  FileText,
  Clock,
  HelpCircle,
  Share2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { params, navigate, goBack } = useNavigation();
  const { addToCart, isInCart } = useCart();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedNotification, setAddedNotification] = useState(false);

  const slugOrId = params.slug || params.id;

  useEffect(() => {
    async function loadProduct() {
      if (!slugOrId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await productsService.getBySlug(slugOrId);
        setProduct(data);
      } catch (err) {
        console.error('Error loading product details:', err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slugOrId]);

  if (loading) {
    return (
      <div className="min-vh-100 bg-slate-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-8">
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 aspect-16/10 bg-slate-200 rounded-3xl"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-vh-100 bg-slate-50 py-16 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full border border-slate-200 text-center shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Pwodwi Sa a Pa Egziste</h2>
          <p className="text-slate-600 text-sm mb-6">
            Pwodwi ou mande a pa jwenn oswa li ka pa disponib ankò nan boutik la.
          </p>
          <button
            id="back-to-shop-btn"
            onClick={() => navigate('shop')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Tounen nan Boutik la
          </button>
        </div>
      </div>
    );
  }

  const isOnSale =
    product.salePrice !== undefined &&
    product.salePrice !== null &&
    product.salePrice < product.price;

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 2500);
  };

  const handleBuyNow = () => {
    addToCart(product, 1);
    navigate('checkout');
  };

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <button
            onClick={() => navigate('home')}
            className="hover:text-blue-600 transition-colors"
          >
            Akèy
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => navigate('shop')}
            className="hover:text-blue-600 transition-colors"
          >
            Shop
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 truncate max-w-[200px]">{product.title}</span>
        </div>

        {/* Back Button */}
        <button
          onClick={() => goBack()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tounen dèyè</span>
        </button>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Image & Description */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Product Image */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative aspect-16/10 bg-slate-100">
                <img
                  src={
                    product.coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80'
                  }
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                    {product.productType}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                    {product.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Deskripsyon Konplè</h2>
              <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                {product.description || product.shortDescription}
              </div>

              {/* What's Included */}
              {product.files && product.files.length > 0 && (
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    Fichye ki enkli nan pake sa a
                  </h3>
                  <div className="space-y-2">
                    {product.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          <span className="font-medium truncate">{file.name}</span>
                        </div>
                        <span className="text-slate-400 text-[11px] shrink-0 font-mono">
                          {file.size}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements if any */}
              {product.requirements && product.requirements.length > 0 && (
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Kisa w bezwen pou itilize fichye a
                  </h3>
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-slate-600">
                    {product.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Workflow / Security Steps */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Pwosesis Apwobasyon &amp; Telechajman Sekirize
              </h3>
              <p className="text-xs text-blue-900/80 leading-relaxed">
                Pou pwoteje pwodwi dijital yo e garanti sekirite chak tranzaksyon:
              </p>
              <ol className="text-xs text-blue-950 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                <li>Ou chwazi pwodwi a epi soumèt kòmand lan avèk prèv peman ou.</li>
                <li>Administrasyon Kominote Online verifye peman an (Cash, Depo, Transfè oswa PayPal).</li>
                <li>Depi admin konfime, fichye a deboke otomatikman nan seksyon <strong>Telechajman Mwen yo</strong>.</li>
              </ol>
            </div>

          </div>

          {/* Right Column: Buy Box (Sticky) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Category & Title */}
              <div>
                <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                  {product.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {product.title}
                </h1>
              </div>

              {/* Short summary */}
              <p className="text-slate-600 text-sm leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Pricing Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Pri total</p>
                  <div className="flex items-baseline gap-2">
                    {isOnSale ? (
                      <>
                        <span className="text-3xl font-black text-slate-900">
                          ${product.salePrice}
                        </span>
                        <span className="text-base text-slate-400 line-through font-semibold">
                          ${product.price}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">USD</span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-black text-slate-900">
                          ${product.price}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">USD</span>
                      </>
                    )}
                  </div>
                </div>

                {isOnSale && (
                  <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-extrabold">
                    Ekonomize ${(product.price - (product.salePrice || 0)).toFixed(0)}
                  </span>
                )}
              </div>

              {/* Added to Cart Feedback */}
              {addedNotification && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pwodwi a ajoute nan panye w avèk siksè!</span>
                </div>
              )}

              {/* Call to Actions */}
              <div className="space-y-3">
                <button
                  id="btn-product-buy-now"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Achte Kounye a</span>
                </button>

                <button
                  id="btn-product-add-cart"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-slate-600" />
                  <span>{isInCart(product.id) ? 'Ajoute Yon Lòt Fwa' : 'Ajoute nan Panye'}</span>
                </button>
              </div>

              {/* Guarantees / Highlights */}
              <div className="pt-6 border-t border-slate-100 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Aksè pèmanan apre apwobasyon admin</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Fakti ofisyèl Kominote Online disponib</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Sipò teknik rapid sou WhatsApp oswa Imèl</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
