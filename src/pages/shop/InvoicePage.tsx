import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { invoicesService, shopOrdersService } from '../../services/firebaseService';
import { Invoice, ShopOrder } from '../../types/database';
import { BrandLogo } from '../../components/BrandLogo';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Mail,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';

export const InvoicePage: React.FC = () => {
  const { params, navigate } = useNavigation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const invoiceId = params.invoiceId || params.id;

  useEffect(() => {
    async function loadInvoice() {
      if (!invoiceId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const inv = await invoicesService.getById(invoiceId);
        setInvoice(inv);
        if (inv && inv.orderId) {
          const ord = await shopOrdersService.getById(inv.orderId);
          setOrder(ord);
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-vh-100 bg-slate-100 py-12 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-600">Fakti a ap chaje...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-vh-100 bg-slate-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fakti Pa Jwenn</h2>
          <p className="text-slate-600 text-sm mb-6">
            Nimewo fakti sa a pa egziste oswa li pa disponib.
          </p>
          <button
            onClick={() => navigate('shop')}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
          >
            Tounen nan Boutik la
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bankTransfer':
        return 'Transfè oswa Depo Bank';
      case 'bankDeposit':
        return 'Depo nan Bank';
      case 'paypal':
        return 'PayPal';
      case 'moncash':
        return 'MonCash';
      case 'natcash':
        return 'NatCash';
      case 'stripe':
        return 'Kat Debi / Kredi (Stripe)';
      case 'cash':
        return 'Cash (Nan Biwo)';
      default:
        return method;
    }
  };

  return (
    <div className="min-vh-100 bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <button
            onClick={() => navigate('shop')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tounen nan Boutik la</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              id="btn-view-customer-orders"
              onClick={() => navigate('customer-orders')}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Kòmand Mwen yo
            </button>
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Enprime / Telechaje PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-12 print:border-none print:shadow-none print:p-0 print:rounded-none">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div>
              <BrandLogo size="lg" />
              <p className="text-xs text-slate-500 mt-3 font-medium">
                Kominote Online &bull; Platfòm Fòmasyon &amp; Resous Dijital
              </p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>support@kominote.online</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>+509 34 56 7890</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pòtoprens, Ayiti</span>
                </p>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                Fakti Ofisyèl
              </span>
              <h1 className="text-2xl font-black text-slate-900">{invoice.invoiceNumber}</h1>
              <p className="text-xs text-slate-500">
                Nimewo Kòmand: <strong className="text-slate-800">{invoice.orderNumber}</strong>
              </p>
              {invoice.trackingNumber && (
                <p className="text-xs text-slate-500">
                  Nimewo Swivi: <strong className="text-blue-700 font-mono">{invoice.trackingNumber}</strong>
                </p>
              )}
              {invoice.couponCode && (
                <p className="text-xs text-slate-500">
                  Kòd Rabè: <strong className="text-emerald-700 font-mono">{invoice.couponCode}</strong>
                </p>
              )}
              <p className="text-xs text-slate-500">
                Dat: {new Date(invoice.issuedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
              </p>
            </div>
          </div>

          {/* Status & Customer info banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
            {/* Bill To */}
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Faktire Pou:
              </h2>
              <p className="text-base font-extrabold text-slate-900">{invoice.customerName}</p>
              <p className="text-slate-600 mt-0.5">{invoice.email}</p>
              <p className="text-slate-600">{invoice.phone}</p>
              <p className="text-slate-600">{invoice.city}, {invoice.country}</p>
            </div>

            {/* Payment & Order Status */}
            <div className="sm:text-right space-y-3">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                  Metòd Peman:
                </span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {getMethodLabel(invoice.paymentMethod)}
                </span>
              </div>

              {order?.bankSelected && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-0.5">
                    Bank Itilize:
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">{order.bankSelected}</span>
                </div>
              )}

              {order?.senderPhone && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-0.5">
                    Telefòn Transfè:
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">{order.senderPhone}</span>
                </div>
              )}

              {order?.paypalEmailUsed && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-0.5">
                    Imèl PayPal:
                  </span>
                  <span className="font-semibold text-slate-800 text-xs">{order.paypalEmailUsed}</span>
                </div>
              )}

              {order?.transactionReference && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-0.5">
                    Nimewo Tranzaksyon / Referans:
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {order.transactionReference}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                  Eta Peman an:
                </span>
                {invoice.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Peye &amp; Apwouve
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Ap tann verifikasyon (Pending)
                  </span>
                )}
              </div>

              {order?.paymentProofUrl && (
                <div className="pt-1">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px] block mb-1">
                    Prèv Peman Soumèt:
                  </span>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block"
                  >
                    <img
                      src={order.paymentProofUrl}
                      alt="Prèv Peman"
                      className="h-16 w-24 object-cover rounded-lg border border-slate-200 hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="py-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Detay Kòmand lan
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Deskripsyon Pwodwi</th>
                    <th className="py-3 px-2 text-center">Kalite</th>
                    <th className="py-3 px-2 text-right">Pri Inite</th>
                    <th className="py-3 px-2 text-center">Kantite</th>
                    <th className="py-3 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-3.5 px-2 font-bold text-slate-900">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-2 text-center uppercase text-[10px] text-slate-500 font-semibold">
                        {item.productType}
                      </td>
                      <td className="py-3.5 px-2 text-right font-medium">
                        ${item.price.toFixed(2)} USD
                      </td>
                      <td className="py-3.5 px-2 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-slate-900">
                        ${item.subtotal.toFixed(2)} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Computation */}
            <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col items-end text-xs space-y-1.5">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Sou-total:</span>
                <span className="font-semibold text-slate-900">${(invoice.originalSubtotal || invoice.subtotal).toFixed(2)} USD</span>
              </div>
              {invoice.discountAmount && invoice.discountAmount > 0 && (
                <div className="flex justify-between w-64 text-emerald-600">
                  <span>Rabè {invoice.couponCode ? `(${invoice.couponCode})` : ''}:</span>
                  <span className="font-semibold">-${invoice.discountAmount.toFixed(2)} USD</span>
                </div>
              )}
              <div className="flex justify-between w-64 text-slate-600">
                <span>Livrezon Dijital:</span>
                <span className="font-semibold text-emerald-600">Gratis ($0.00)</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-base font-black text-slate-900">
                <span>Total:</span>
                <span>${(invoice.finalTotal || invoice.total).toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          {/* Official Verification Notice / Download Access Banner */}
          {invoice.paymentStatus === 'paid' || order?.downloadStatus === 'enabled' ? (
            <div className="mt-6 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Aksè &amp; Telechajman Debloke!
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 font-extrabold text-[11px]">
                  Peman Apwouve
                </span>
              </div>
              <p className="leading-relaxed font-medium">
                Peman ou an te verifye epi apwouve avèk siksè pa administrasyon an. Ou gen aksè a tout fòmasyon ak resous dijital ou te achte yo kounye a.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  id="btn-invoice-go-downloads"
                  onClick={() => navigate('downloads')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ale nan Telechajman Mwen yo</span>
                </button>
                <button
                  id="btn-invoice-go-courses"
                  onClick={() => navigate('my-learning')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Ale nan Kou Mwen yo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
              <h3 className="font-bold flex items-center gap-1.5 text-amber-900">
                <Clock className="w-4 h-4 text-amber-600" />
                Nòt sou Aksè &amp; Telechajman (Ap Tann Verifikasyon)
              </h3>
              <p className="leading-relaxed font-medium">
                Nou resevwa demand kòmand ou a. Kòm se yon peman manyèl, aksè oswa telechajman pwodwi dijital la ap rete an attant (Pending) jiskaske administrasyon Kominote Online verifye fich depo oswa kòd tranzaksyon ou an.
              </p>
              <p className="text-[11px] text-amber-800 font-semibold pt-1">
                Pou akselere verifikasyon an, ou ka pataje nimewo fakti <strong>{invoice.invoiceNumber}</strong> sa a sou WhatsApp nou nan <strong>+509 34 56 7890</strong>.
              </p>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
            Mèsi paske w chwazi Kominote Online. Pou nenpòt kesyon sou fakti sa a, ekri nou sou <strong>support@kominote.online</strong>.
          </div>

        </div>

      </div>
    </div>
  );
};
