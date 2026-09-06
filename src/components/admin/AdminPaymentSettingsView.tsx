import React, { useState, useEffect } from 'react';
import { paymentSettingsService } from '../../services/firebaseService';
import { PaymentSettings, BankAccount } from '../../types/database';
import { DEFAULT_PAYMENT_SETTINGS } from '../../data/defaultPaymentSettings';
import {
  DollarSign,
  Building2,
  Banknote,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  CreditCard,
  Phone,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react';

export const AdminPaymentSettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_PAYMENT_SETTINGS);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await paymentSettingsService.getSettings();
        if (data) {
          setSettings({
            ...DEFAULT_PAYMENT_SETTINGS,
            ...data,
            bankTransfer: {
              ...DEFAULT_PAYMENT_SETTINGS.bankTransfer,
              ...(data.bankTransfer || {}),
              banks:
                data.bankTransfer?.banks && data.bankTransfer.banks.length > 0
                  ? data.bankTransfer.banks
                  : DEFAULT_PAYMENT_SETTINGS.bankTransfer.banks,
            },
            paypal: {
              ...DEFAULT_PAYMENT_SETTINGS.paypal,
              ...(data.paypal || {}),
            },
            moncash: {
              ...DEFAULT_PAYMENT_SETTINGS.moncash,
              ...(data.moncash || {}),
            },
            natcash: {
              ...DEFAULT_PAYMENT_SETTINGS.natcash,
              ...(data.natcash || {}),
            },
            stripe: {
              ...DEFAULT_PAYMENT_SETTINGS.stripe,
              ...(data.stripe || {}),
            },
            cash: {
              ...DEFAULT_PAYMENT_SETTINGS.cash,
              ...(data.cash || {}),
            },
          });
        }
      } catch (err) {
        console.error('Error loading payment settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddBank = () => {
    const newBank: BankAccount = {
      id: `bank-${Date.now()}`,
      bankName: '',
      accountType: 'Kont Epay',
      accountNumber: '',
      accountHolder: '',
    };
    const currentBanks = settings.bankTransfer?.banks || [];
    setSettings({
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        banks: [...currentBanks, newBank],
      },
    });
  };

  const handleRemoveBank = (index: number) => {
    const currentBanks = [...(settings.bankTransfer?.banks || [])];
    currentBanks.splice(index, 1);
    setSettings({
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        banks: currentBanks,
      },
    });
  };

  const handleBankChange = (index: number, field: keyof BankAccount, value: string) => {
    const currentBanks = [...(settings.bankTransfer?.banks || [])];
    currentBanks[index] = {
      ...currentBanks[index],
      [field]: value,
    };
    setSettings({
      ...settings,
      bankTransfer: {
        ...settings.bankTransfer,
        banks: currentBanks,
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await paymentSettingsService.saveSettings(settings);
      setSuccessMsg('Paramèt peman yo anrejistre avèk siksè nan baz done Firebase!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erè pandan anrejistreman paramèt peman yo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-semibold">Paramèt peman yo ap chaje...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Paramèt Metòd Peman (Payment Gateway & Manual Methods)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigirasyon enfòmasyon peman reyèl pou tout sit Kominote Online la (Kou ak Pwodwi Dijital).
              </p>
            </div>
          </div>
        </div>

        <button
          id="btn-save-payment-settings-top"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Anrejistre Tout Chanjman Yo</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. BANK TRANSFER / BANK DEPOSIT */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  1. Transfè oswa Depo Bank (Bank Transfer / Deposit)
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd manyèl: Kliyan an voye lajan an sou kont bank sa yo epi telechaje resi a pou apwobasyon Admin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.bankTransferEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, bankTransferEnabled: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Aktive Metòd Sa a</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tit pou Elèv yo (Student-facing Title)
            </label>
            <input
              type="text"
              value={settings.bankTransfer?.title || 'Transfè oswa Depo Bank'}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, title: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsyon / Enstriksyon pou Elèv yo
            </label>
            <textarea
              rows={2}
              value={
                settings.bankTransfer?.description ||
                'Fè peman ou sou youn nan kont sa yo. Apre peman an, telechaje resi oswa prèv peman an pou administrasyon an ka verifye li.'
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  bankTransfer: { ...settings.bankTransfer, description: e.target.value },
                })
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          {/* Bank Accounts List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Kont Bankè yo (Reyèl)
              </h4>
              <button
                type="button"
                onClick={handleAddBank}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajoute yon Lòt Kont Bank</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(settings.bankTransfer?.banks || []).map((bank, index) => (
                <div
                  key={bank.id || index}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 relative space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-700">Kont #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBank(index)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Retire kont sa a"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Non Bank la</label>
                      <input
                        type="text"
                        value={bank.bankName}
                        onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                        placeholder="Banreservas oswa Banco BHD"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Tip Kont</label>
                        <input
                          type="text"
                          value={bank.accountType || ''}
                          onChange={(e) => handleBankChange(index, 'accountType', e.target.value)}
                          placeholder="Kont Epay"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-0.5">Titilè Kont</label>
                        <input
                          type="text"
                          value={bank.accountHolder}
                          onChange={(e) => handleBankChange(index, 'accountHolder', e.target.value)}
                          placeholder="Wanky Massenat"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5">Nimewo Kont</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={bank.accountNumber}
                          onChange={(e) => handleBankChange(index, 'accountNumber', e.target.value)}
                          placeholder="960-469-7671"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy(bank.accountNumber, `bank-${index}`)}
                          className="px-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-colors"
                          title="Kopi nimewo a"
                        >
                          {copiedId === `bank-${index}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. PAYPAL */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  2. PayPal
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd manyèl: Kliyan an voye peman an sou imèl PayPal la epi telechaje resi a oswa antre nimewo tranzaksyon an.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.paypalEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, paypalEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Aktive Metòd Sa a</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tit pou Elèv yo</label>
              <input
                type="text"
                value={settings.paypal?.title || 'PayPal'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paypal: { ...settings.paypal, title: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PayPal Email (Reyèl)</label>
              <div className="flex gap-1.5">
                <input
                  type="email"
                  value={settings.paypal?.paypalEmail || 'wankymassenat@gmail.com'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paypal: { ...settings.paypal, paypalEmail: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.paypal?.paypalEmail || 'wankymassenat@gmail.com', 'paypal-email')}
                  className="px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer transition-colors"
                  title="Kopi imèl la"
                >
                  {copiedId === 'paypal-email' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Deskripsyon / Enstriksyon pou Elèv yo</label>
              <textarea
                rows={2}
                value={
                  settings.paypal?.instructions ||
                  'Fè peman an atravè PayPal epi antre nimewo tranzaksyon an oswa telechaje prèv peman an.'
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paypal: { ...settings.paypal, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* 3. MONCASH */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                <Phone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  3. MonCash (Digicel Ayiti)
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd manyèl: Kliyan an fè transfè MonCash sou nimewo a epi voye prèv la oswa antre nimewo tranzaksyon an.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.moncashEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, moncashEnabled: e.target.checked })
                  }
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Aktive MonCash</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nimewo Telefòn MonCash</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={settings.moncash?.phone || '+509 34 56 7890'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      moncash: { ...settings.moncash, phone: e.target.value },
                    })
                  }
                  placeholder="+509 34 56 7890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.moncash?.phone || '+509 34 56 7890', 'moncash-phone')}
                  className="px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer transition-colors"
                  title="Kopi nimewo MonCash"
                >
                  {copiedId === 'moncash-phone' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Non Titilè Kont MonCash la</label>
              <input
                type="text"
                value={settings.moncash?.accountName || 'Wanky Massenat'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    moncash: { ...settings.moncash, accountName: e.target.value },
                  })
                }
                placeholder="Wanky Massenat"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Enstriksyon MonCash pou Kliyan an</label>
              <textarea
                rows={2}
                value={
                  settings.moncash?.instructions ||
                  'Voye montan an sou nimewo MonCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.'
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    moncash: { ...settings.moncash, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>
        </div>

        {/* 4. NATCASH */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Phone className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  4. NatCash (Natcom Ayiti)
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd manyèl: Kliyan an fè transfè NatCash sou nimewo a epi voye prèv la oswa antre nimewo tranzaksyon an.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.natcashEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, natcashEnabled: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Aktive NatCash</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nimewo Telefòn NatCash</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={settings.natcash?.phone || '+509 40 12 3456'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      natcash: { ...settings.natcash, phone: e.target.value },
                    })
                  }
                  placeholder="+509 40 12 3456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => handleCopy(settings.natcash?.phone || '+509 40 12 3456', 'natcash-phone')}
                  className="px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 cursor-pointer transition-colors"
                  title="Kopi nimewo NatCash"
                >
                  {copiedId === 'natcash-phone' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Non Titilè Kont NatCash la</label>
              <input
                type="text"
                value={settings.natcash?.accountName || 'Wanky Massenat'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    natcash: { ...settings.natcash, accountName: e.target.value },
                  })
                }
                placeholder="Wanky Massenat"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Enstriksyon NatCash pou Kliyan an</label>
              <textarea
                rows={2}
                value={
                  settings.natcash?.instructions ||
                  'Voye montan an sou nimewo NatCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.'
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    natcash: { ...settings.natcash, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* 5. STRIPE CHECKOUT (AUTOMATED) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  5. Stripe (Kat Kredi oswa Debi)
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd Otomatik: Lè kliyan an peye sou Stripe, aksè a aktive otomatikman san apwobasyon Admin manyèl pa nesesè.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.stripeEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, stripeEnabled: e.target.checked })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Aktive Stripe</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-slate-900 mb-0.5">Sekirite ak Pwoteksyon Done Kat:</p>
              <p>
                Kominote Online pa janm stoke nimewo kat, CVV oswa dat ekspirasyon sou sèvè a. Peman yo redireksyone sou paj ofisyèl Stripe Checkout ki pwoteje ak chifreman SSL 256-bit. Konfigire kle <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">STRIPE_SECRET_KEY</code> nan paramèt sèvè an.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tit Metòd la</label>
              <input
                type="text"
                value={settings.stripe?.title || 'Kat Debi oswa Kat Kredi'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, title: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Soutit / Deskripsyon Kout</label>
              <input
                type="text"
                value={settings.stripe?.subtitle || 'Peye an sekirite ak Stripe'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    stripe: { ...settings.stripe, subtitle: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* 6. CASH IN OFFICE */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Banknote className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  6. Peman Cash (Nan Biwo)
                </h3>
                <p className="text-xs text-slate-500">
                  Metòd manyèl: Kliyan an deplase vin depoze lajan an dirèkteman nan biwo a.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.cashEnabled !== false}
                  onChange={(e) =>
                    setSettings({ ...settings, cashEnabled: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>Aktive Peman nan Biwo</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Adrès Fizik Biwo a</label>
              <input
                type="text"
                value={settings.cash?.location || 'Delmas 75, Pòtoprens, Ayiti'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cash: { ...settings.cash, location: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefòn pou Kontak / Randevou</label>
              <input
                type="text"
                value={settings.cash?.phone || '+509 34 56 7890'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cash: { ...settings.cash, phone: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Lè Ouvèti / Enstriksyon pou Kliyan an</label>
              <textarea
                rows={2}
                value={
                  settings.cash?.instructions ||
                  'Pase nan biwo nou an lendi rive vandredi ant 9:00 AM ak 4:00 PM pou depoze kòb la dirèkteman.'
                }
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    cash: { ...settings.cash, instructions: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Done sa yo estoke nan koleksyon <code className="font-mono font-bold text-slate-700">paymentSettings/general</code> nan Firebase Firestore.
          </div>
          <button
            type="submit"
            id="btn-save-payment-settings-bottom"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-sm font-extrabold transition-all shadow-md cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Anrejistre Paramèt Peman yo</span>
          </button>
        </div>
      </form>
    </div>
  );
};
