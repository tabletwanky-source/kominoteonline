import React, { useState, useEffect } from 'react';
import { Course } from '../types/database';
import { PaymentSettings, BankAccount } from '../types/database';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaultPaymentSettings';
import { paymentSettingsService } from '../services/firebaseService';
import {
  X,
  Building2,
  Globe,
  Phone,
  Banknote,
  Upload,
  FileCheck,
  Loader2,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';

interface CourseManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  user: any;
  onSuccess: (invoiceId: string) => void;
}

export const CourseManualPaymentModal: React.FC<CourseManualPaymentModalProps> = ({
  isOpen,
  onClose,
  course,
  user,
  onSuccess,
}) => {
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [paymentMethod, setPaymentMethod] = useState<'bankTransfer' | 'paypal' | 'moncash' | 'natcash' | 'cash'>(
    'bankTransfer'
  );

  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Ayiti');
  const [city, setCity] = useState(user?.city || 'Pòtoprens');

  const [selectedBankId, setSelectedBankId] = useState<string>('bank-banreservas');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [paypalEmailUsed, setPaypalEmailUsed] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name || '');
      if (!email) setEmail(user.email || '');
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await paymentSettingsService.getSettings();
        if (settings) {
          setPaymentSettings({
            ...DEFAULT_PAYMENT_SETTINGS,
            ...settings,
            bankTransfer: {
              ...DEFAULT_PAYMENT_SETTINGS.bankTransfer,
              ...(settings.bankTransfer || {}),
              banks:
                settings.bankTransfer?.banks && settings.bankTransfer.banks.length > 0
                  ? settings.bankTransfer.banks
                  : DEFAULT_PAYMENT_SETTINGS.bankTransfer.banks,
            },
            paypal: {
              ...DEFAULT_PAYMENT_SETTINGS.paypal,
              ...(settings.paypal || {}),
            },
            moncash: {
              ...DEFAULT_PAYMENT_SETTINGS.moncash,
              ...(settings.moncash || {}),
            },
            natcash: {
              ...DEFAULT_PAYMENT_SETTINGS.natcash,
              ...(settings.natcash || {}),
            },
            cash: {
              ...DEFAULT_PAYMENT_SETTINGS.cash,
              ...(settings.cash || {}),
            },
          });
        }
      } catch (e) {
        console.warn('Could not load payment settings for modal:', e);
      }
    }
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Fichye a twò gwo (maksimòm 5MB).');
      return;
    }

    setUploadingProof(true);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
      setUploadingProof(false);
    };
    reader.onerror = () => {
      setErrorMsg('Erè nan lekti fichye a.');
      setUploadingProof(false);
    };
    reader.readAsDataURL(file);
  };

  const finalPrice =
    course.sale_price !== undefined && course.sale_price !== null && course.sale_price < course.price
      ? course.sale_price
      : course.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg('Tanpri antre non konplè ou.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Tanpri antre yon adrès imèl valid.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Tanpri antre nimewo telefòn ou.');
      return;
    }

    if (paymentMethod !== 'cash' && !transactionRef.trim() && !paymentProofUrl) {
      setErrorMsg(
        'Tanpri antre nimewo tranzaksyon an oswa telechaje yon foto/resi prèv peman an pou nou ka verifye li.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const banksList = paymentSettings.bankTransfer?.banks || [];
      const chosenBank = banksList.find((b) => b.id === selectedBankId) || banksList[0];

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          customerName: customerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          country: country.trim(),
          city: city.trim(),
          items: [
            {
              courseId: course.id,
              productId: course.id,
              quantity: 1,
            },
          ],
          paymentMethod,
          bankSelected:
            paymentMethod === 'bankTransfer' && chosenBank
              ? `${chosenBank.bankName} (${chosenBank.accountNumber})`
              : undefined,
          senderPhone:
            paymentMethod === 'moncash' || paymentMethod === 'natcash' ? senderPhone.trim() : undefined,
          paypalEmailUsed: paymentMethod === 'paypal' ? paypalEmailUsed.trim() : undefined,
          transactionReference: transactionRef.trim() || undefined,
          paymentProofUrl: paymentProofUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.invoiceId) {
        onSuccess(data.invoiceId);
      } else {
        throw new Error(data.message || data.error || 'Erè pandan kreyasyon kòmand lan.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Yon erè rive pandan nou tap soumèt kòmand lan.');
    } finally {
      setSubmitting(false);
    }
  };

  const banksList: BankAccount[] =
    paymentSettings.bankTransfer?.banks && paymentSettings.bankTransfer.banks.length > 0
      ? paymentSettings.bankTransfer.banks
      : DEFAULT_PAYMENT_SETTINGS.bankTransfer.banks;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              Enskripsyon Manyèl nan Kou
            </span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{course.title}</h3>
            <p className="text-xs text-slate-500">
              Pri: <strong className="text-slate-900 font-extrabold">${finalPrice} USD</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Method Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Chwazi Metòd Peman Ou:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bankTransfer')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'bankTransfer'
                    ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-xs block">Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'paypal'
                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-xs block">PayPal</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('moncash')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'moncash'
                    ? 'border-red-600 bg-red-50/60 font-bold text-red-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4 text-red-600 mb-1" />
                <span className="text-xs block">MonCash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('natcash')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  paymentMethod === 'natcash'
                    ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="text-xs block">NatCash</span>
              </button>
            </div>
          </div>

          {/* Payment Account Details Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
            {paymentMethod === 'bankTransfer' && (
              <div className="space-y-3">
                <div>
                  <h4 className="font-extrabold text-slate-900">Transfè oswa Depo Bank</h4>
                  <p className="text-slate-600 mt-0.5">
                    Fè peman ou sou youn nan kont sa yo. Apre peman an, telechaje resi oswa prèv peman an pou administrasyon an ka verifye li.
                  </p>
                </div>

                <div className="space-y-2">
                  {banksList.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-2 ${
                        selectedBankId === b.id ? 'border-blue-600 ring-1 ring-blue-500' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.bankName} ({b.accountType || 'Kont Epay'})</div>
                        <div className="text-[11px] text-slate-600">Titilè: {b.accountHolder}</div>
                        <div className="font-mono font-bold text-slate-900">{b.accountNumber}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(b.accountNumber, `bank-modal-${idx}`)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `bank-modal-${idx}` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Kopye!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Kopi</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900">PayPal</h4>
                <p className="text-slate-600">
                  Fè peman an atravè PayPal epi antre nimewo tranzaksyon an oswa telechaje prèv peman an.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Imèl PayPal:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {paymentSettings.paypal?.paypalEmail || 'wankymassenat@gmail.com'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        paymentSettings.paypal?.paypalEmail || 'wankymassenat@gmail.com',
                        'paypal-modal'
                      )
                    }
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'paypal-modal' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Kopye!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'moncash' && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900">MonCash</h4>
                <p className="text-slate-600">
                  Voye montan an sou nimewo MonCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nimewo MonCash:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {paymentSettings.moncash?.phone || '+509 34 56 7890'}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Titilè: {paymentSettings.moncash?.accountName || 'Wanky Massenat'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        paymentSettings.moncash?.phone || '+509 34 56 7890',
                        'moncash-modal'
                      )
                    }
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'moncash-modal' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Kopye!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'natcash' && (
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900">NatCash</h4>
                <p className="text-slate-600">
                  Voye montan an sou nimewo NatCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Nimewo NatCash:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {paymentSettings.natcash?.phone || '+509 40 12 3456'}
                    </span>
                    <p className="text-[11px] text-slate-600">
                      Titilè: {paymentSettings.natcash?.accountName || 'Wanky Massenat'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        paymentSettings.natcash?.phone || '+509 40 12 3456',
                        'natcash-modal'
                      )
                    }
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'natcash-modal' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Kopye!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Non Konplè *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Adrès Imèl *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefòn / WhatsApp *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono text-slate-900"
              />
            </div>

            {(paymentMethod === 'moncash' || paymentMethod === 'natcash') && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nimewo Telefòn ou itilize pou transfè a *
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  placeholder="+509 xx xx xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono text-slate-900"
                />
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Imèl PayPal ou itilize a (Opsyonèl)
                </label>
                <input
                  type="email"
                  value={paypalEmailUsed}
                  onChange={(e) => setPaypalEmailUsed(e.target.value)}
                  placeholder="oumenm@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Nimewo Tranzaksyon / Referans Resi *
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Egzanp: TR-12345 oswa nimewo konfimasyon"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Telechaje Fich / Foto Resi Depo a (Prèv peman)
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-600" />
                  <span>Chwazi Foto Resi a</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadingProof && (
                  <span className="text-slate-500 flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Chajman...
                  </span>
                )}
                {paymentProofUrl && !uploadingProof && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <FileCheck className="w-4 h-4" />
                    Fichye anrejistre!
                  </span>
                )}
              </div>
              {paymentProofUrl && (
                <div className="mt-2">
                  <img
                    src={paymentProofUrl}
                    alt="Prèv peman"
                    className="h-20 w-32 object-cover rounded-xl border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Apre w fin soumèt, kòmand lan ap anrejistre nan sitiyasyon &quot;an attant&quot; (Pending). Depi administrasyon an valide peman ou an, aksè nan kou a ap louvri otomatikman.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Anile
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Soumèt an kou...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Soumèt Peman Manyèl (${finalPrice})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
