import React, { useState, useEffect } from 'react';
import { Course, PaymentSettings, BankAccount, CourseRegistration } from '../types/database';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaultPaymentSettings';
import { paymentSettingsService, courseRegistrationsService } from '../services/firebaseService';
import {
  X,
  Building2,
  Globe,
  Phone,
  Upload,
  FileCheck,
  Loader2,
  Copy,
  Check,
  Lock,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Clock,
  Receipt,
  AlertCircle,
  FileText,
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
  const [paymentMethod, setPaymentMethod] = useState<'bankTransfer' | 'paypal' | 'moncash' | 'natcash'>('bankTransfer');

  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [country, setCountry] = useState(user?.country || 'Ayiti');
  const [city, setCity] = useState(user?.city || 'Pòtoprens');

  const [selectedBankId, setSelectedBankId] = useState<string>('bank-banreservas');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [paypalEmailUsed, setPaypalEmailUsed] = useState('');

  // Proof File & Preview state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Registration & Duplicate checks state
  const [checkingState, setCheckingState] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<CourseRegistration | null>(null);

  // Submission & Success state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedReg, setSubmittedReg] = useState<CourseRegistration | null>(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.full_name || '');
      if (!email) setEmail(user.email || '');
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Load payment settings and check existing registration/enrollment state
  useEffect(() => {
    async function loadData() {
      if (!isOpen) return;
      setErrorMsg(null);
      setSubmittedReg(null);

      // Load Settings
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
          });
        }
      } catch (e) {
        console.warn('Could not load payment settings for modal:', e);
      }

      // Check existing enrollment & pending registration
      if (user?.id && course?.id) {
        setCheckingState(true);
        try {
          const state = await courseRegistrationsService.checkRegistrationState(user.id, course.id);
          setIsEnrolled(state.isEnrolled);
          setPendingRegistration(state.pendingRegistration || null);
        } catch (e) {
          console.warn('Error checking existing registration state:', e);
        } finally {
          setCheckingState(false);
        }
      }
    }

    loadData();
  }, [isOpen, user?.id, course?.id]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size limit check: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Fichye a twò gwo. Gwosè maksimòm se 10MB.');
      return;
    }

    // Format validation
    const validExtensions = /\.(jpg|jpeg|png|webp|pdf)$/i;
    const isValidMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'].includes(file.type.toLowerCase());
    if (!isValidMime && !validExtensions.test(file.name)) {
      setErrorMsg('Fòma fichye a dwe yon imaj (JPG, PNG) oswa yon dokiman PDF.');
      return;
    }

    setProofFile(file);
    setErrorMsg(null);

    // Create preview if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const finalPrice =
    course.sale_price !== undefined && course.sale_price !== null && course.sale_price < course.price
      ? course.sale_price
      : course.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user || !user.id) {
      setErrorMsg('Tanpri konekte pou w ka soumèt peman an.');
      return;
    }

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

    if (!transactionRef.trim() && !proofFile) {
      setErrorMsg(
        'Tanpri antre nimewo tranzaksyon an oswa telechaje yon foto/resi prèv peman an pou nou ka verifye li.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      let uploadedProofUrl = '';
      let uploadedProofPath = '';

      // Direct upload to storage if proof file provided
      if (proofFile) {
        const uploadRes = await courseRegistrationsService.uploadPaymentProof(
          user.id,
          course.id,
          proofFile,
          (pct) => setUploadProgress(pct)
        );
        uploadedProofUrl = uploadRes.downloadUrl;
        uploadedProofPath = uploadRes.storagePath;
      }

      const banksList = paymentSettings.bankTransfer?.banks || [];
      const chosenBank = banksList.find((b) => b.id === selectedBankId) || banksList[0];

      // Submit course registration via direct database SDK
      const newReg = await courseRegistrationsService.createRegistration({
        courseId: course.id,
        courseTitle: course.title,
        coursePrice: finalPrice,
        studentId: user.id,
        studentName: customerName.trim(),
        studentEmail: email.trim().toLowerCase(),
        studentPhone: phone.trim(),
        paymentMethod,
        paymentMethodDetails: {
          bankName: paymentMethod === 'bankTransfer' && chosenBank ? chosenBank.bankName : undefined,
          accountHolder: paymentMethod === 'bankTransfer' && chosenBank ? chosenBank.accountHolder : undefined,
          accountNumber: paymentMethod === 'bankTransfer' && chosenBank ? chosenBank.accountNumber : undefined,
          paypalEmail: paymentMethod === 'paypal' ? (paypalEmailUsed || paymentSettings.paypal?.paypalEmail) : undefined,
          moncashNumber: paymentMethod === 'moncash' ? (paymentSettings.moncash?.phone) : undefined,
          natcashNumber: paymentMethod === 'natcash' ? (paymentSettings.natcash?.phone) : undefined,
          senderPhone: senderPhone || undefined,
        },
        transactionReference: transactionRef.trim() || undefined,
        paymentProofUrl: uploadedProofUrl || undefined,
        paymentProofPath: uploadedProofPath || undefined,
        notes: `Enskripsyon manyèl nan kou "${course.title}" pa ${customerName.trim()}`,
      });

      setSubmittedReg(newReg);
    } catch (err: any) {
      console.error('Manual payment submission error:', err);
      const msg = String(err.message || '');
      if (msg.includes('deja enskri')) {
        setErrorMsg('Ou deja enskri nan kou sa a.');
      } else if (msg.includes('deja soumèt') || msg.includes('atant')) {
        setErrorMsg('Ou deja soumèt yon demann pou kou sa a ki an attant verifikasyon.');
      } else if (msg.includes('konekte')) {
        setErrorMsg('Tanpri konekte pou w ka soumèt peman an.');
      } else if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setErrorMsg('Tanpri verifye si w byen konekte epi eseye ankò.');
      } else {
        setErrorMsg('Nou pa t kapab anrejistre demann lan. Tanpri eseye ankò.');
      }
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

        {/* STATE 1: ALREADY ENROLLED */}
        {isEnrolled && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900">Ou deja enskri nan kou sa a!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ou deja gen aksè konplè nan tout leson ak videyo kou <span className="font-bold text-slate-800">"{course.title}"</span>.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Fèmen Fenèt la
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: ALREADY PENDING REGISTRATION */}
        {!isEnrolled && pendingRegistration && !submittedReg && (
          <div className="p-8 space-y-5">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h4 className="text-lg font-black text-slate-900">Demann ou an an attant verifikasyon</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Ou deja soumèt yon demann pou kou sa a ki an attant verifikasyon pa administrasyon an. Depi peman an konfime, aksè nan kou a ap louvri otomatikman.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nimewo Fakti / Ref:</span>
                <span className="font-mono font-bold text-slate-900">{pendingRegistration.invoiceId || pendingRegistration.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metòd Peman:</span>
                <span className="font-bold text-slate-900 capitalize">{pendingRegistration.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montan:</span>
                <span className="font-extrabold text-slate-900">${pendingRegistration.coursePrice} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estati:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3" />
                  An atant (Pending)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {pendingRegistration.invoiceId && (
                <button
                  type="button"
                  onClick={() => onSuccess(pendingRegistration.invoiceId!)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Wè Fakti Ou</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Fèmen
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: SUBMITTED SUCCESSFULLY IN THIS SESSION */}
        {submittedReg && (
          <div className="p-8 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="text-xl font-black text-slate-900">Demann Enskripsyon Voye avèk Siksè!</h4>
              <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                Nou resevwa demann enskripsyon ou an. Depi nou verifye peman an, aksè nan kou a ap louvri otomatikman.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Kou:</span>
                <span className="font-bold text-slate-900 text-right">{course.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nimewo Fakti / Ref:</span>
                <span className="font-mono font-bold text-slate-900">{submittedReg.invoiceId || submittedReg.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Metòd Peman:</span>
                <span className="font-bold text-slate-900 capitalize">{submittedReg.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Montan:</span>
                <span className="font-extrabold text-slate-900">${finalPrice} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estati:</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3" />
                  An atant verifikasyon (Pending)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onSuccess(submittedReg.invoiceId || submittedReg.id)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>Wè Fakti / Resi</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Fèmen
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: PAYMENT FORM */}
        {!isEnrolled && !pendingRegistration && !submittedReg && (
          <>
            {errorMsg && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
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
                        ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900 ring-1 ring-blue-500'
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
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 ring-1 ring-indigo-500'
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
                        ? 'border-red-600 bg-red-50/60 font-bold text-red-900 ring-1 ring-red-500'
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
                        ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-900 ring-1 ring-emerald-500'
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
                          onClick={() => setSelectedBankId(b.id || '')}
                          className={`p-3 bg-white rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            selectedBankId === b.id ? 'border-blue-600 ring-1 ring-blue-500 bg-blue-50/20' : 'border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-slate-900">{b.bankName} ({b.accountType || 'Kont Epay'})</div>
                            <div className="text-[11px] text-slate-600">Titilè: {b.accountHolder}</div>
                            <div className="font-mono font-bold text-slate-900">{b.accountNumber}</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(b.accountNumber, `bank-modal-${idx}`);
                            }}
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
                          {paymentSettings.paypal?.paypalEmail || 'Pa konfigire'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            paymentSettings.paypal?.paypalEmail || 'Pa konfigire',
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
                    {paymentSettings.paypal?.paymentLink && (
                      <a
                        href={paymentSettings.paypal.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvri paj PayPal la</span>
                      </a>
                    )}
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
                          {paymentSettings.moncash?.phone || 'Pa konfigire'}
                        </span>
                        <p className="text-[11px] text-slate-600">
                          Titilè: {paymentSettings.moncash?.accountName || 'Pa konfigire'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            paymentSettings.moncash?.phone || 'Pa konfigire',
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
                          {paymentSettings.natcash?.phone || 'Pa konfigire'}
                        </span>
                        <p className="text-[11px] text-slate-600">
                          Titilè: {paymentSettings.natcash?.accountName || 'Pa konfigire'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            paymentSettings.natcash?.phone || 'Pa konfigire',
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
                    Nimewo Tranzaksyon / Referans Resi
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
                      <span>{proofFile ? 'Chanje Fichye' : 'Chwazi Foto Resi a'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {proofFile && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <FileCheck className="w-4 h-4" />
                        <span className="truncate max-w-[200px]">{proofFile.name}</span>
                      </span>
                    )}
                  </div>

                  {proofPreview && (
                    <div className="mt-2.5">
                      <img
                        src={proofPreview}
                        alt="Prèv peman"
                        className="h-24 w-36 object-cover rounded-xl border border-slate-200 shadow-2xs"
                      />
                    </div>
                  )}

                  {proofFile && !proofPreview && (
                    <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-slate-700 text-xs font-semibold">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Dokiman PDF: {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Apre w fin soumèt, demann lan ap anrejistre nan sitiyasyon &quot;an attant&quot; (Pending). Depi administrasyon an valide peman ou an, aksè nan kou a ap louvri otomatikman.
                </p>
              </div>

              {/* Progress indicator during upload */}
              {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                    <span>Telechaje resi a nan stockaj la...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Anile
                </button>
                <button
                  type="submit"
                  disabled={submitting || checkingState}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-98"
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
          </>
        )}
      </div>
    </div>
  );
};

