import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { digitalAccessService } from '../../services/firebaseService';
import { DigitalAccess } from '../../types/database';
import {
  Download,
  FileText,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const CustomerDownloadsPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<DigitalAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntitlements() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await digitalAccessService.getUserEntitlements(user.id);
        setEntitlements(data);
      } catch (err) {
        console.error('Error loading downloads:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEntitlements();
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-vh-100 bg-slate-50 py-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md shadow-sm">
          <Download className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Konekte sou Kont Ou</h2>
          <p className="text-slate-600 text-sm mb-6">
            Ou dwe konekte pou w ka jwenn aksè ak telechaje fichye dijital ou yo.
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

  const handleDownload = async (entitlement: DigitalAccess) => {
    try {
      setDownloadingId(entitlement.productId);
      setErrorNotice(null);

      const res = await digitalAccessService.requestSecureDownload(
        entitlement.productId,
        user.id
      );

      if (res.fileUrl) {
        // Trigger browser download safely
        const a = document.createElement('a');
        a.href = res.fileUrl;
        a.download = res.fileName || 'kominote-download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Update local download counter
        setEntitlements((prev) =>
          prev.map((e) =>
            e.productId === entitlement.productId
              ? { ...e, downloadCount: (e.downloadCount || 0) + 1, lastDownloadedAt: new Date().toISOString() }
              : e
          )
        );
      } else {
        throw new Error('Fichye a pa disponib nan moman sa a.');
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setErrorNotice(err.message || 'Telechajman an bloke. Kontakte administrasyon an pou plis enfòmasyon.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-vh-100 bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate('customer-orders')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Gade Kòmand Mwen Yo</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Download className="w-7 h-7 text-blue-600" />
              <span>Telechajman Dijital Mwen Yo</span>
            </h1>
          </div>

          <button
            onClick={() => navigate('shop')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
          >
            Boutik Dijital
          </button>
        </div>

        {errorNotice && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5 mb-6 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorNotice}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-48"></div>
            ))}
          </div>
        ) : entitlements.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Ou poko gen okenn fichye ki debloke
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Lè w fin pase yon kòmand e administrasyon Kominote Online valide peman ou an, tout fichye dijital ou yo ap debloke e parèt la a imedyatman pou telechajman.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('customer-orders')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Gade Kòmand Mwen Yo
              </button>
              <button
                onClick={() => navigate('shop')}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Ale nan Boutik la</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entitlements.map((ent) => {
              const prod = ent.product;
              return (
                <div
                  key={ent.id}
                  id={`entitlement-card-${ent.id}`}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <img
                      src={
                        prod?.coverImage ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'
                      }
                      alt={prod?.title || 'Pwodwi'}
                      className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                    />

                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Aksè Debloke
                      </span>

                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {prod?.title || `Pwodwi #${ent.productId}`}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {prod?.shortDescription || `Kòmand: ${ent.orderNumber}`}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>Debloke le: {new Date(ent.enabledAt).toLocaleDateString('fr-FR')}</span>
                        <span>&bull;</span>
                        <span>{ent.downloadCount || 0} telechajman</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {ent.productId.slice(0, 10)}
                    </span>

                    <button
                      id={`btn-download-${ent.productId}`}
                      disabled={downloadingId === ent.productId}
                      onClick={() => handleDownload(ent)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      {downloadingId === ent.productId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Preparasyon...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Telechaje Fichye a</span>
                        </>
                      )}
                    </button>
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
