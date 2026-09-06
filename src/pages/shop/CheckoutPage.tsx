import React, { useState, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { shopOrdersService, paymentSettingsService, couponsService } from '../../services/firebaseService';
import { createDigitalShopOrder } from '../../services/firebaseFunctions';
import { PaymentSettings, BankAccount, CouponValidationResult } from '../../types/database';
import { DEFAULT_PAYMENT_SETTINGS } from '../../data/defaultPaymentSettings';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  Building2,
  Banknote,
  Globe,
  Upload,
  FileCheck,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  CreditCard,
  Phone,
  ShieldCheck,
  ExternalLink,
  Package,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const { cart, cartTotal, clearCart } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Ayiti');
  const [city, setCity] = useState(user?.city || 'Pòtoprens');

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState<
    'bankTransfer' | 'paypal' | 'moncash' | 'natcash' | 'stripe' | 'cash'
  >('bankTransfer');

  // Settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);

  // Manual payment specific fields
  const [selectedBankId, setSelectedBankId] = useState<string>('bank-banreservas');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [paypalEmailUsed, setPaypalEmailUsed] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<CouponValidationResult | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [showTrackingSuccess, setShowTrackingSuccess] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync with user auth if user loads later
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name || '');
      if (!email) setEmail(user.email || '');
      if (!phone && user.phone) setPhone(user.phone);
      if (user.country) setCountry(user.country);
      if (user.city) setCity(user.city);
    }
  }, [user]);

  // Load payment settings dynamically from backend / Firestore
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
            stripe: {
              ...DEFAULT_PAYMENT_SETTINGS.stripe,
              ...(settings.stripe || {}),
            },
            cash: {
              ...DEFAULT_PAYMENT_SETTINGS.cash,
              ...(settings.cash || {}),
            },
          });
        }
      } catch (err) {
        console.warn('Could not load payment settings from Firestore:', err);
      }
    }
    loadSettings();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponResult({ valid: false, discountAmount: 0, originalSubtotal: cartTotal, finalTotal: cartTotal, message: 'Tanpri antre yon kòd rabè.' });
      return;
    }
    setCouponLoading(true);
    try {
      const itemIds = cart.map((c) => c.product.id);
      const result = await couponsService.validate(couponCode, cartTotal, user?.id || '', itemIds, []);
      setCouponResult(result);
    } catch (err) {
      setCouponResult({ valid: false, discountAmount: 0, originalSubtotal: cartTotal, finalTotal: cartTotal, message: 'Erè nan validasyon kòd rabè a.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const effectiveTotal = couponResult?.valid ? couponResult.finalTotal : cartTotal;
  const discountAmount = couponResult?.valid ? couponResult.discountAmount : 0;

  const handleCopyTracking = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Panye Ou Vid</h2>
          <p className="text-slate-600 text-sm mb-6">
            Ou dwe genyen omwen yon pwodwi dijital nan panye w la pou fè yon kòmand.
          </p>
          <button
            id="btn-return-shop-checkout"
            onClick={() => navigate('shop')}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Tounen nan Boutik la
          </button>
        </div>
      </div>
    );
  }

  // Handle file upload for payment proof (base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Fichye a twò gwo (maksimòm 5MB). Tanpri chwazi yon fichye pi lejè.');
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!customerName.trim()) {
      setErrorMsg('Tanpri antre non konplè ou.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Tanpri antre yon adrès imèl valid.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Tanpri antre nimewo telefòn oswa WhatsApp ou.');
      return;
    }

    // STRIPE FLOW (Hosted Checkout, Automated Access)
    if (paymentMethod === 'stripe') {
      try {
        setSubmitting(true);
        const res = await fetch('/api/checkout/create-shop-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || `guest_${Date.now()}`,
            customerName: customerName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            country: country.trim(),
            city: city.trim(),
            items: cart.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.error('Stripe shop checkout returned non-JSON response', { status: res.status, contentType });
          throw new Error('Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
        }

        const data = await res.json();
        if (data.url) {
          clearCart();
          window.location.href = data.url;
          return;
        }

        if (data.error) {
          console.error('Stripe shop checkout error:', data.error, { message: data.message });
          if (data.error === 'STRIPE_NOT_CONFIGURED') {
            throw new Error('Peman ak kat poko disponib. Tanpri itilize yon lòt metòd peman.');
          }
          throw new Error(data.message || 'Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
        }
      } catch (err: any) {
        console.error('Stripe checkout error:', err);
        setErrorMsg(err.message || 'Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // MANUAL METHODS FLOW: Require reference or proof (except cash in person)
    if (paymentMethod !== 'cash' && !transactionRef.trim() && !paymentProofUrl) {
      setErrorMsg(
        'Tanpri bay nimewo referans/tranzaksyon an oswa telechaje yon foto/resi prèv peman an pou administrasyon an ka verifye li.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const banksList = paymentSettings.bankTransfer?.banks || [];
      const chosenBank = banksList.find((b) => b.id === selectedBankId) || banksList[0];

      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Submit digital shop order via Firebase Callable Cloud Function / unified backend
      const result = await createDigitalShopOrder({
        userId: user?.id || `guest_${Date.now()}`,
        customerName: customerName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        country: country.trim(),
        city: city.trim(),
        items: itemsPayload,
        paymentMethod,
        bankSelected: paymentMethod === 'bankTransfer' && chosenBank ? `${chosenBank.bankName} (${chosenBank.accountNumber})` : undefined,
        senderPhone: (paymentMethod === 'moncash' || paymentMethod === 'natcash') ? senderPhone.trim() : undefined,
        paypalEmailUsed: paymentMethod === 'paypal' ? paypalEmailUsed.trim() : undefined,
        transactionReference: transactionRef.trim() || undefined,
        paymentProofUrl: paymentProofUrl || undefined,
        couponCode: couponResult?.valid ? couponResult.coupon?.code : undefined,
      });

      if (result.success && result.invoiceId) {
        if (result.trackingNumber) {
          setTrackingNumber(result.trackingNumber);
          setShowTrackingSuccess(true);
        }
        clearCart();
        if (!result.trackingNumber) {
          navigate('invoice', { invoiceId: result.invoiceId });
        }
      } else {
        throw new Error(result.message || result.error || 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const isPermission = String(err.message || '').toLowerCase().includes('permission');
      setErrorMsg(isPermission ? 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.' : (err.message || 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.'));
    } finally {
      setSubmitting(false);
    }
  };

  const banksList: BankAccount[] =
    paymentSettings.bankTransfer?.banks && paymentSettings.bankTransfer.banks.length > 0
      ? paymentSettings.bankTransfer.banks
      : [
          {
            id: 'bank-banreservas',
            bankName: 'Banreservas',
            accountType: 'Kont Epay',
            accountNumber: '960-469-7671',
            accountHolder: 'Wanky Massenat',
          },
          {
            id: 'bank-bhd',
            bankName: 'Banco BHD',
            accountType: 'Kont Epay',
            accountNumber: '36-475-68-0012',
            accountHolder: 'Wanky Massenat',
          },
        ];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <button
          onClick={() => navigate('cart')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tounen nan Panye a</span>
        </button>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          Peman &amp; Konfimasyon Kòmand
        </h1>
        <p className="text-sm text-slate-600 mb-8">
          Ranpli enfòmasyon w yo, chwazi metòd peman ou a, epi soumèt prèv la pou administrasyon Kominote Online ka valide kòmand ou.
        </p>

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-start gap-3 mb-6 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form & Payment Methods */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Customer Information Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-extrabold">
                    1
                  </span>
                  Enfòmasyon Kliyan
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Non Konplè *
                    </label>
                    <input
                      id="checkout-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Egzanp: Jean Baptiste"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Adrès Imèl *
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="oumenm@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Telefòn / WhatsApp *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+509 34 56 7890"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Peyi *
                    </label>
                    <input
                      id="checkout-country"
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ayiti, Etazini, Repiblik Dominikèn..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Vil *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Pòtoprens, Delmas, Santo Domingo..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-extrabold">
                    2
                  </span>
                  Chwazi Metòd Peman Ou
                </h2>

                {/* Method Radio Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Bank Transfer / Deposit */}
                  {paymentSettings.bankTransferEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'bankTransfer'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bankTransfer"
                        checked={paymentMethod === 'bankTransfer'}
                        onChange={() => setPaymentMethod('bankTransfer')}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>{paymentSettings.bankTransfer?.title || 'Transfè oswa Depo Bank'}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Banreservas, Banco BHD
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 2. PayPal */}
                  {paymentSettings.paypalEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={() => setPaymentMethod('paypal')}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Globe className="w-4 h-4 text-indigo-600" />
                          <span>{paymentSettings.paypal?.title || 'PayPal'}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Peman entènasyonal sou PayPal
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 3. MonCash */}
                  {paymentSettings.moncashEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'moncash'
                          ? 'border-red-600 bg-red-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="moncash"
                        checked={paymentMethod === 'moncash'}
                        onChange={() => setPaymentMethod('moncash')}
                        className="mt-1 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-red-600" />
                          <span>{paymentSettings.moncash?.title || 'MonCash'}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Digicel Ayiti (+509)
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 4. NatCash */}
                  {paymentSettings.natcashEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'natcash'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="natcash"
                        checked={paymentMethod === 'natcash'}
                        onChange={() => setPaymentMethod('natcash')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-emerald-600" />
                          <span>{paymentSettings.natcash?.title || 'NatCash'}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Natcom Ayiti (+509)
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 5. Stripe (Credit / Debit Card) */}
                  {paymentSettings.stripeEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={() => setPaymentMethod('stripe')}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>{paymentSettings.stripe?.title || 'Kat Debi oswa Kat Kredi'}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Stripe (Aksè otomatik enstantane)
                        </p>
                      </div>
                    </label>
                  )}

                  {/* 6. Cash in Office */}
                  {paymentSettings.cashEnabled !== false && (
                    <label
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="mt-1 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-amber-600" />
                          <span>Peman Cash (Nan Biwo)</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Depoze lajan an nan biwo nou
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {/* Dynamic Instructions Panel per Method */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-4">
                  {/* --- 1. BANK TRANSFER / DEPOSIT INSTRUCTIONS --- */}
                  {paymentMethod === 'bankTransfer' && (
                    <div className="space-y-3.5">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {paymentSettings.bankTransfer?.title || 'Transfè oswa Depo Bank'}
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {paymentSettings.bankTransfer?.description ||
                            'Fè peman ou sou youn nan kont sa yo. Apre peman an, telechaje resi oswa prèv peman an pou administrasyon an ka verifye li.'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {banksList.map((bank, idx) => (
                          <div
                            key={bank.id || idx}
                            className={`p-4 rounded-xl border bg-white transition-all ${
                              selectedBankId === bank.id
                                ? 'border-blue-600 ring-2 ring-blue-600/20'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-900 text-sm">
                                    {bank.bankName}
                                  </span>
                                  {bank.accountType && (
                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                      {bank.accountType}
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-600">
                                  <span>Titilè Kont: </span>
                                  <strong className="text-slate-900 font-bold">{bank.accountHolder}</strong>
                                </div>
                                <div className="text-slate-600 flex items-center gap-2 flex-wrap">
                                  <span>Nimewo Kont: </span>
                                  <code className="px-2 py-0.5 bg-slate-100 rounded text-slate-900 font-mono font-bold text-xs tracking-wider">
                                    {bank.accountNumber}
                                  </code>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(bank.accountNumber, `bank-${idx}`)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                >
                                  {copiedKey === `bank-${idx}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700">Kopye!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Kopi Nimewo Kont</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- 2. PAYPAL INSTRUCTIONS --- */}
                  {paymentMethod === 'paypal' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {paymentSettings.paypal?.title || 'PayPal'}
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {paymentSettings.paypal?.instructions ||
                            'Fè peman an atravè PayPal epi antre nimewo tranzaksyon an oswa telechaje prèv peman an.'}
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-slate-500 font-semibold block text-[11px]">Adrès Imèl PayPal:</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {paymentSettings.paypal?.paypalEmail || 'wankymassenat@gmail.com'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                paymentSettings.paypal?.paypalEmail || 'wankymassenat@gmail.com',
                                'paypal-email'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto"
                          >
                            {copiedKey === 'paypal-email' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Kopye!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Kopi Imèl</span>
                              </>
                            )}
                          </button>
                        </div>

                        {paymentSettings.paypal?.paymentLink && (
                          <div className="pt-2">
                            <a
                              href={paymentSettings.paypal.paymentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-colors"
                            >
                              <span>Klike la pou ale dirèkteman sou paj PayPal la</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- 3. MONCASH INSTRUCTIONS --- */}
                  {paymentMethod === 'moncash' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {paymentSettings.moncash?.title || 'MonCash'}
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {paymentSettings.moncash?.instructions ||
                            'Voye montan an sou nimewo MonCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.'}
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-slate-500 font-semibold block text-[11px]">Nimewo Kont MonCash:</span>
                          <span className="font-mono font-bold text-slate-900 text-base">
                            {paymentSettings.moncash?.phone || '+509 34 56 7890'}
                          </span>
                          <p className="text-[11px] text-slate-600">
                            Titilè Kont: <strong>{paymentSettings.moncash?.accountName || 'Wanky Massenat'}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              paymentSettings.moncash?.phone || '+509 34 56 7890',
                              'moncash-phone'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto"
                        >
                          {copiedKey === 'moncash-phone' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Kopye!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopi Nimewo MonCash</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 4. NATCASH INSTRUCTIONS --- */}
                  {paymentMethod === 'natcash' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {paymentSettings.natcash?.title || 'NatCash'}
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          {paymentSettings.natcash?.instructions ||
                            'Voye montan an sou nimewo NatCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.'}
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-slate-500 font-semibold block text-[11px]">Nimewo Kont NatCash:</span>
                          <span className="font-mono font-bold text-slate-900 text-base">
                            {paymentSettings.natcash?.phone || '+509 40 12 3456'}
                          </span>
                          <p className="text-[11px] text-slate-600">
                            Titilè Kont: <strong>{paymentSettings.natcash?.accountName || 'Wanky Massenat'}</strong>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              paymentSettings.natcash?.phone || '+509 40 12 3456',
                              'natcash-phone'
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto"
                        >
                          {copiedKey === 'natcash-phone' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Kopye!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Kopi Nimewo NatCash</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* --- 5. STRIPE NOTICE --- */}
                  {paymentMethod === 'stripe' && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <span>{paymentSettings.stripe?.title || 'Kat Debi oswa Kat Kredi (Stripe)'}</span>
                        </h4>
                        <p className="text-slate-600 mt-1 leading-relaxed">
                          Lè w klike sou bouton ki anba a, w ap redireksyone sou platfòm ofisyèl sekirize Stripe pou w ka antre enfòmasyon kat ou.
                        </p>
                      </div>

                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-slate-600 space-y-1">
                          <p className="font-bold text-slate-900">
                            Sekirite Garanti • Aksè Otomatik Imedyat
                          </p>
                          <p>
                            Kominote Online pa janm stoke nimewo kat ou, CVV oswa dat ekspirasyon sou sit la. Tout tranzaksyon yo trete sou sèvè Stripe ki gen chifreman 256-bit. Depi peman an valide, aksè w ap debloke otomatikman san ou pa bezwen tann apwobasyon.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- 6. CASH IN OFFICE INSTRUCTIONS --- */}
                  {paymentMethod === 'cash' && (
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        Peman nan Biwo Kominote Online
                      </h4>
                      <p className="text-slate-600">
                        <strong>Adrès:</strong> {paymentSettings.cash?.location || 'Delmas 75, Pòtoprens, Ayiti'}
                      </p>
                      <p className="text-slate-600">
                        <strong>Telefòn:</strong> {paymentSettings.cash?.phone || '+509 34 56 7890'}
                      </p>
                      <p className="text-slate-500 italic mt-1">
                        {paymentSettings.cash?.instructions ||
                          'Pase nan biwo nou an lendi rive vandredi ant 9:00 AM ak 4:00 PM pou depoze kòb la dirèkteman.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Proof of Payment & Reference Fields (FOR MANUAL METHODS ONLY) */}
                {paymentMethod !== 'stripe' && (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    {/* Specific field for MonCash / NatCash: Sender Phone */}
                    {(paymentMethod === 'moncash' || paymentMethod === 'natcash') && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Nimewo Telefòn ou itilize pou voye lajan an *
                        </label>
                        <input
                          type="text"
                          value={senderPhone}
                          onChange={(e) => setSenderPhone(e.target.value)}
                          placeholder="+509 xx xx xxxx"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                        />
                      </div>
                    )}

                    {/* Specific field for PayPal: Sender Email */}
                    {paymentMethod === 'paypal' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Adrès Imèl PayPal ou itilize a (Opsyonèl)
                        </label>
                        <input
                          type="email"
                          value={paypalEmailUsed}
                          onChange={(e) => setPaypalEmailUsed(e.target.value)}
                          placeholder="imelou@example.com"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nimewo Tranzaksyon / Referans Resi *
                      </label>
                      <input
                        id="checkout-transaction-ref"
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="Egzanp: TR-98234, 09823412 oswa Kòd Konfimasyon SMS"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Telechaje Prèv Peman (Foto resi depo, ekran konfimasyon oswa fich bank)
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                          <Upload className="w-4 h-4 text-slate-600" />
                          <span>Chwazi Fichye</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        {uploadingProof && (
                          <span className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Chajman an kou...
                          </span>
                        )}
                        {paymentProofUrl && !uploadingProof && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                            Prèv peman anrejistre!
                          </span>
                        )}
                      </div>
                      {paymentProofUrl && (
                        <div className="mt-2.5">
                          <img
                            src={paymentProofUrl}
                            alt="Prèv peman"
                            className="h-24 w-36 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary & Submit Button */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Atik Kòmand Ou ({cart.length})
                </h2>

                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
                  {cart.map(({ product, quantity }) => {
                    const price =
                      product.salePrice !== undefined &&
                      product.salePrice !== null &&
                      product.salePrice < product.price
                        ? product.salePrice
                        : product.price;

                    return (
                      <div key={product.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <p className="font-bold text-slate-900 truncate">{product.title}</p>
                          <p className="text-slate-500 uppercase text-[10px]">
                            {product.productType} &bull; Qte: {quantity}
                          </p>
                        </div>
                        <span className="font-bold text-slate-900 shrink-0">
                          ${(price * quantity).toFixed(2)} USD
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Field */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kòd Rabè</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Antre kòd rabè ou"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplike'}
                      </button>
                    </div>
                    {couponResult && (
                      <p className={`text-xs font-bold mt-2 ${couponResult.valid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {couponResult.valid ? (
                          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> {couponResult.message}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {couponResult.message}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Sou-total</span>
                    <span className="font-semibold text-slate-900">${cartTotal.toFixed(2)} USD</span>
                  </div>
                  {couponResult?.valid && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Rabè ({couponResult.coupon?.code})</span>
                      <span className="font-semibold">-${discountAmount.toFixed(2)} USD</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Livrezon Dijital</span>
                    <span className="font-semibold text-emerald-600">Gratis ($0.00)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-sm">Total Pou Peye</span>
                    <span className="text-2xl font-black text-slate-900">
                      ${effectiveTotal.toFixed(2)} <span className="text-xs text-slate-500 font-semibold">USD</span>
                    </span>
                  </div>
                </div>

                {/* Submit Order Button */}
                <button
                  type="submit"
                  id="btn-submit-order"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {paymentMethod === 'stripe'
                          ? 'Koneksyon ak Stripe an kou...'
                          : 'Kòmand lan ap anrejistre...'}
                      </span>
                    </>
                  ) : paymentMethod === 'stripe' ? (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Peye ak Stripe (${effectiveTotal.toFixed(2)})</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Konfime &amp; Soumèt Kòmand</span>
                    </>
                  )}
                </button>

                {/* Status Notice depending on method */}
                {paymentMethod === 'stripe' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Deblokaj Otomatik Enstantane</span>
                    </div>
                    <p className="leading-relaxed">
                      Peman ak kat sou Stripe pa bezwen apwobasyon manyèl. Aksè telechajman ou ap debloke otomatikman depi tranzaksyon an fin valide.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Verifikasyon Manyèl pa Administrasyon an</span>
                    </div>
                    <p className="leading-relaxed">
                      Metòd manyèl sa a mande verifikasyon pa administrasyon Kominote Online anvan telechajman an ka debloke. Yon fakti ap pwodui imedyatman pou swiv kòmand ou.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Tracking Number Success Modal */}
      {showTrackingSuccess && trackingNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Demand ou resevwa avèk siksè.</h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mb-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nimewo Swivi:</p>
              <p className="text-lg font-black text-slate-900 font-mono tracking-wider mb-3">{trackingNumber}</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kenbe nimewo sa a. Ou ka itilize li pou verifye estati kòmand oswa enskripsyon ou.
              </p>
            </div>
            <button
              onClick={handleCopyTracking}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mb-3"
            >
              {copiedTracking ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedTracking ? 'Kopye!' : 'Kopye Nimewo Swivi'}</span>
            </button>
            <button
              onClick={() => { setShowTrackingSuccess(false); navigate('track-order'); }}
              className="w-full py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Kontinye
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


