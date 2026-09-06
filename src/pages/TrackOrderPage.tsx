import React, { useState } from 'react';
import { trackingService } from '../services/firebaseService';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Hash,
  CreditCard,
  Calendar,
  Tag,
  Copy,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';

interface TrackResult {
  trackingNumber: string;
  orderNumber: string | null;
  date: string | null;
  type: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  orderStatus: string | null;
  approvalStatus: string | null;
  publicStatusNote: string | null;
  couponCode: string | null;
  total: number | null;
  currency: string;
}

export const TrackOrderPage: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim() || !email.trim()) {
      setError('Tanpri antre nimewo swivi ou ak imèl ou.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const order = await trackingService.trackOrder(trackingNumber.trim(), email.trim());
      if (!order) {
        setError('Pa jwenn okenn kòmand ak nimewo swivi ak imèl sa yo. Tanpri verifye enfòmasyon ou yo.');
      } else {
        setResult(order);
      }
    } catch (err) {
      setError('Erè pandan rechèch la. Tanpri eseye ankò.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentStatusLabel = (status: string | null) => {
    switch (status) {
      case 'paid': return { label: 'Peman konfime', color: 'emerald' };
      case 'pending': return { label: 'Ap tann verifikasyon', color: 'amber' };
      case 'failed': return { label: 'Peman echwe', color: 'rose' };
      case 'refunded': return { label: 'Ranbouse', color: 'slate' };
      default: return { label: status || '—', color: 'slate' };
    }
  };

  const getOrderStatusLabel = (status: string | null) => {
    switch (status) {
      case 'approved': return { label: 'Konfime', color: 'emerald' };
      case 'pending': return { label: 'Ap tann verifikasyon', color: 'amber' };
      case 'rejected': return { label: 'Refize', color: 'rose' };
      default: return { label: status || '—', color: 'slate' };
    }
  };

  const getMethodLabel = (method: string | null) => {
    if (!method) return '—';
    const labels: Record<string, string> = {
      bankTransfer: 'Transfè oswa Depo Bank',
      bankDeposit: 'Depo nan Bank',
      paypal: 'PayPal',
      moncash: 'MonCash',
      natcash: 'NatCash',
      stripe: 'Kat Debi / Kredi (Stripe)',
      cash: 'Cash (Nan Biwo)',
    };
    return labels[method] || method;
  };

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/20">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Swiv Kòmand Ou
          </h1>
          <p className="text-sm text-slate-600">
            Antre nimewo swivi ou ak imèl ou pou w ka wè estati kòmand oswa enskripsyon ou an.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                Nimewo Swivi
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Egz: KO-TRK-2026-000001"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase tracking-wider"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Imèl
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="imelou@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verifye Estati</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4 animate-in fade-in">
              {/* Tracking Number Display */}
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Nimewo Swivi</p>
                    <p className="text-lg font-black text-slate-900 font-mono tracking-wider">{result.trackingNumber}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(result.trackingNumber)}
                    className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Kopye!' : 'Kopye'}</span>
                  </button>
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.orderNumber && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nimewo Kòmand</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{result.orderNumber}</p>
                  </div>
                )}

                {result.date && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dat Kòmand</p>
                    <p className="text-sm font-bold text-slate-900">
                      {new Date(result.date).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tip</p>
                  <p className="text-sm font-bold text-slate-900">
                    {result.type === 'course' ? 'Kou (Enskripsyon)' : result.type === 'shop' ? 'Boutik Dijital' : 'Kòmand'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Metòd Peman</p>
                  <p className="text-sm font-bold text-slate-900">{getMethodLabel(result.paymentMethod)}</p>
                </div>

                {result.total !== null && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-sm font-bold text-slate-900">
                      ${Number(result.total).toFixed(2)} {result.currency}
                    </p>
                  </div>
                )}

                {result.couponCode && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Kòd Rabè</p>
                    <p className="text-sm font-bold text-emerald-900 font-mono">{result.couponCode}</p>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const ps = getPaymentStatusLabel(result.paymentStatus);
                  return (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Estati Peman:</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${ps.color}-100 text-${ps.color}-800`}>
                        {ps.color === 'emerald' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {ps.color === 'amber' && <Clock className="w-3.5 h-3.5" />}
                        {ps.color === 'rose' && <XCircle className="w-3.5 h-3.5" />}
                        {ps.label}
                      </span>
                    </div>
                  );
                })()}

                {(() => {
                  const os = getOrderStatusLabel(result.orderStatus);
                  return (
                    <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Estati Kòmand:</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${os.color}-100 text-${os.color}-800`}>
                        {os.color === 'emerald' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {os.color === 'amber' && <Clock className="w-3.5 h-3.5" />}
                        {os.color === 'rose' && <XCircle className="w-3.5 h-3.5" />}
                        {os.label}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Public Status Note */}
              {result.publicStatusNote && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nòt Administrasyon:</span>
                  </p>
                  <p className="leading-relaxed">{result.publicStatusNote}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Pou sekirite, ou bezwen tou de nimewo swivi ak imèl ki koresponn pou wè estati kòmand ou.
        </p>
      </div>
    </div>
  );
};
