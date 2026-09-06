import React from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import {
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Package,
} from 'lucide-react';

export const CartPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { cart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-vh-100 bg-slate-50 py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Panye Ou Vid</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              Ou poko mete okenn pwodwi dijital nan panye w la. Eksplore boutik nou an pou jwenn gid, liv, oswa resous pwofesyonèl.
            </p>
            <button
              id="btn-empty-cart-shop"
              onClick={() => navigate('shop')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              <span>Ale nan Boutik la</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('shop')}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kontinye Acha nan Boutik la</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <span>Panye Kòmand Ou</span>
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                {cartCount} {cartCount === 1 ? 'atik' : 'atik'}
              </span>
            </h1>
          </div>

          <button
            id="btn-clear-cart"
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline self-start sm:self-auto cursor-pointer"
          >
            Vide Panye a
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map(({ product, quantity }) => {
              const activePrice =
                product.salePrice !== undefined &&
                product.salePrice !== null &&
                product.salePrice < product.price
                  ? product.salePrice
                  : product.price;

              return (
                <div
                  key={product.id}
                  id={`cart-item-${product.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                >
                  {/* Thumbnail */}
                  <img
                    src={
                      product.coverImage ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'
                    }
                    alt={product.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover bg-slate-100 shrink-0 cursor-pointer"
                    onClick={() => navigate('product-detail', { slug: product.slug || product.id })}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {product.category} &bull; {product.productType}
                    </span>
                    <h3
                      onClick={() => navigate('product-detail', { slug: product.slug || product.id })}
                      className="text-base font-bold text-slate-900 truncate hover:text-blue-600 cursor-pointer transition-colors mt-0.5"
                    >
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {product.shortDescription}
                    </p>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-base font-extrabold text-slate-900">
                        ${activePrice} USD
                      </span>
                      {product.salePrice && product.salePrice < product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="self-end sm:self-center">
                    <button
                      id={`btn-remove-${product.id}`}
                      onClick={() => removeFromCart(product.id)}
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Retire nan panye a"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Rezime Kòmand la
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Sou-total</span>
                  <span className="font-semibold text-slate-900">${cartTotal.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Frè livrezon (dijital)</span>
                  <span className="font-semibold text-emerald-600">$0.00 (Gratis)</span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-base">Total Pou Peye</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${cartTotal.toFixed(2)} <span className="text-xs text-slate-500 font-semibold">USD</span>
                  </span>
                </div>
              </div>

              <button
                id="btn-proceed-to-checkout"
                onClick={() => navigate('checkout')}
                className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Kontinye pou Peye</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Peman verifye ak apwouve pa Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Fakti &amp; resi telechajab otomatikman</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
