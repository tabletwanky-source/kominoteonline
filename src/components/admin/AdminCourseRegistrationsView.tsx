import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { courseRegistrationsService, coursesService } from '../../services/firebaseService';
import { CourseRegistration, Course } from '../../types/database';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  ExternalLink,
  DollarSign,
  User,
  BookOpen,
  Copy,
  Check,
  Receipt,
  Eye,
  X,
  AlertCircle,
  Phone,
  Mail,
  Building2,
  Globe,
  Loader2
} from 'lucide-react';

interface AdminCourseRegistrationsViewProps {
  onNotify?: (msg: string) => void;
}

export const AdminCourseRegistrationsView: React.FC<AdminCourseRegistrationsViewProps> = ({ onNotify }) => {
  const { user } = useAuth();
  const { navigate } = useNavigation();

  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal for viewing full proof image
  const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);

  // Modal for confirming approval
  const [confirmingReg, setConfirmingReg] = useState<CourseRegistration | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal for rejecting
  const [rejectingReg, setRejectingReg] = useState<CourseRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('Resi a pa koresponn ak montan an oswa nimewo tranzaksyon an pa valid.');

  const loadData = async () => {
    try {
      setLoading(true);
      const [regs, courseList] = await Promise.all([
        courseRegistrationsService.getAll(),
        coursesService.getAll(),
      ]);
      setRegistrations(regs);
      setCourses(courseList);
    } catch (err) {
      console.error('Error loading course registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Confirm Payment (Approve)
  const handleApprove = async () => {
    if (!confirmingReg || !user) return;
    try {
      setActionLoading(true);
      await courseRegistrationsService.approveRegistration(confirmingReg.id, user.id);
      onNotify?.(`Peman pou ${confirmingReg.studentName} konfime avèk siksè! Aksè nan kou a louvri.`);
      setConfirmingReg(null);
      await loadData();
    } catch (err: any) {
      alert('Erè pandan apwobasyon an: ' + (err?.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Payment
  const handleReject = async () => {
    if (!rejectingReg || !user) return;
    try {
      setActionLoading(true);
      await courseRegistrationsService.rejectRegistration(rejectingReg.id, user.id, rejectReason.trim());
      onNotify?.(`Enskripsyon ${rejectingReg.id} rejte.`);
      setRejectingReg(null);
      setRejectReason('Resi a pa koresponn ak montan an oswa nimewo tranzaksyon an pa valid.');
      await loadData();
    } catch (err: any) {
      alert('Erè pandan refi an: ' + (err?.message || err));
    } finally {
      setActionLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'bankTransfer':
        return { label: 'Bank', icon: <Building2 className="w-3 h-3 text-blue-600" />, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'paypal':
        return { label: 'PayPal', icon: <Globe className="w-3 h-3 text-indigo-600" />, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'moncash':
        return { label: 'MonCash', icon: <Phone className="w-3 h-3 text-red-600" />, bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'natcash':
        return { label: 'NatCash', icon: <Phone className="w-3 h-3 text-emerald-600" />, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: method, icon: <DollarSign className="w-3 h-3 text-slate-600" />, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter((reg) => {
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        if (reg.registrationStatus !== 'pending' && reg.paymentStatus !== 'pending') return false;
      } else if (filterStatus === 'approved') {
        if (reg.registrationStatus !== 'approved' && reg.paymentStatus !== 'paid') return false;
      } else if (filterStatus === 'rejected') {
        if (reg.registrationStatus !== 'rejected' && reg.paymentStatus !== 'failed') return false;
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (reg.studentName || '').toLowerCase().includes(q);
      const matchEmail = (reg.studentEmail || '').toLowerCase().includes(q);
      const matchPhone = (reg.studentPhone || '').toLowerCase().includes(q);
      const matchCourse = (reg.courseTitle || '').toLowerCase().includes(q);
      const matchRef = (reg.transactionReference || '').toLowerCase().includes(q);
      const matchId = reg.id.toLowerCase().includes(q);
      const matchInv = (reg.invoiceId || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchCourse || matchRef || matchId || matchInv;
    }

    return true;
  });

  const pendingCount = registrations.filter((r) => r.paymentStatus === 'pending' || r.registrationStatus === 'pending').length;
  const approvedCount = registrations.filter((r) => r.paymentStatus === 'paid' || r.registrationStatus === 'approved').length;
  const rejectedCount = registrations.filter((r) => r.paymentStatus === 'failed' || r.registrationStatus === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <FileCheck className="w-5 h-5" />
              </span>
              <span className="text-xs font-black text-blue-600 uppercase tracking-wider">
                Sistèm Peman Manyèl Kou
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Apwobasyon Enskripsyon Kou ({registrations.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Gade tout demann peman manyèl (Bank, PayPal, MonCash, NatCash). Konfime peman pou debloke aksè elèv la nan kou a otomatikman nan Firestore.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rafrechi lis la"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Rafrechi</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <button
            onClick={() => setFilterStatus('all')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 block">Total Demann</span>
            <span className="text-xl font-black">{registrations.length}</span>
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/50 hover:bg-amber-50 text-amber-900 border-amber-200'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              An Atant (Pending)
            </span>
            <span className="text-xl font-black">{pendingCount}</span>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Apwouve (Paid)
            </span>
            <span className="text-xl font-black">{approvedCount}</span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/50 hover:bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <span className="text-[11px] font-semibold opacity-80 block flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Rejte
            </span>
            <span className="text-xl font-black">{rejectedCount}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Chèche pa non, imèl, telefòn, kou..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                filterStatus === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tab === 'all' && `Tout (${registrations.length})`}
              {tab === 'pending' && `An Atant (${pendingCount})`}
              {tab === 'approved' && `Apwouve (${approvedCount})`}
              {tab === 'rejected' && `Rejte (${rejectedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Chajman enskripsyon yo nan Firestore...</p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-slate-800 text-sm">Pa gen enskripsyon nan kategori sa a</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? 'Okenn rezilta pa koresponn ak rechèch ou an.'
                : 'Tout demann yo ap parèt isit la depi yon elèv soumèt yon peman manyèl.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRegistrations.map((reg) => {
              const methodBadge = getMethodBadge(reg.paymentMethod);
              const isPending = reg.paymentStatus === 'pending' || reg.registrationStatus === 'pending';
              const isApproved = reg.paymentStatus === 'paid' || reg.registrationStatus === 'approved';
              const isRejected = reg.paymentStatus === 'failed' || reg.registrationStatus === 'rejected';

              return (
                <div
                  key={reg.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left Column: Student & Course */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">
                        {reg.studentName || 'Elèv'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${methodBadge.bg}`}>
                        {methodBadge.icon}
                        <span>{methodBadge.label}</span>
                      </span>
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-2.5 h-2.5" />
                          <span>An Atant</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Apwouve / Peye</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>Rejte</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-900">{reg.courseTitle}</span>
                        <span className="font-extrabold text-blue-700">(${Number(reg.coursePrice || 0).toFixed(2)} USD)</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {reg.studentEmail}
                        </span>
                        {reg.studentPhone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {reg.studentPhone}
                          </span>
                        )}
                        <span>
                          Dat: {new Date(reg.createdAt).toLocaleDateString()} {new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Payment Reference & Method Specific Info */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1">
                      {reg.transactionReference ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Ref:</span>
                          <span className="font-mono font-bold text-slate-900">{reg.transactionReference}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(reg.transactionReference!, `ref-${reg.id}`)}
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            title="Kopye nimewo referans"
                          >
                            {copiedKey === `ref-${reg.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">Pa gen nimewo referans</span>
                      )}

                      {reg.paymentMethodDetails?.senderPhone && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Telefòn Transfè:</span>
                          <span className="font-mono font-bold text-slate-900">{reg.paymentMethodDetails.senderPhone}</span>
                        </div>
                      )}

                      {reg.paymentMethodDetails?.paypalEmail && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">PayPal Imèl:</span>
                          <span className="font-semibold text-slate-900">{reg.paymentMethodDetails.paypalEmail}</span>
                        </div>
                      )}

                      {reg.paymentMethodDetails?.bankName && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Bank:</span>
                          <span className="font-semibold text-slate-900">{reg.paymentMethodDetails.bankName}</span>
                        </div>
                      )}

                      {reg.invoiceId && (
                        <div className="flex items-center gap-1 ml-auto">
                          <span className="text-slate-400">Fakti:</span>
                          <button
                            onClick={() => navigate('invoice', { invoiceId: reg.invoiceId! })}
                            className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{reg.invoiceId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notes if rejected */}
                    {isRejected && reg.notes && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                        <strong>Rezon refi:</strong> {reg.notes}
                      </div>
                    )}
                  </div>

                  {/* Middle Column: Payment Proof Image */}
                  <div className="flex items-center gap-3 shrink-0">
                    {reg.paymentProofUrl ? (
                      <div className="relative group">
                        <img
                          src={reg.paymentProofUrl}
                          alt="Prèv Peman"
                          onClick={() => setViewingProofUrl(reg.paymentProofUrl!)}
                          className="h-16 w-24 object-cover rounded-xl border border-slate-200 shadow-2xs cursor-pointer group-hover:opacity-90 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setViewingProofUrl(reg.paymentProofUrl!)}
                          className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity cursor-pointer"
                          title="Gade pi gwo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] text-slate-400 text-center p-1">
                        San foto resi
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    {isPending && (
                      <>
                        <button
                          onClick={() => setConfirmingReg(reg)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Konfime Peman</span>
                        </button>
                        <button
                          onClick={() => setRejectingReg(reg)}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejte Peman</span>
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aksè Aktif</span>
                      </span>
                    )}

                    {isRejected && (
                      <button
                        onClick={() => setConfirmingReg(reg)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Re-apwouve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW PROOF IN HIGH RES */}
      {viewingProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">Resi / Prèv Peman</h4>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-2xl p-2">
              <img
                src={viewingProofUrl}
                alt="Prèv Peman Gran Fòma"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={viewingProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvri foto nan nouvo onglet</span>
              </a>
              <button
                onClick={() => setViewingProofUrl(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fèmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM APPROVAL */}
      {confirmingReg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-lg text-slate-900">Konfime Peman Kou Sa a?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lè w konfime, estati peman an ap vin <strong className="text-emerald-700">"Peye"</strong> epi aksè kou <strong className="text-slate-900">"{confirmingReg.courseTitle}"</strong> ap louvri imedyatman pou <strong className="text-slate-900">{confirmingReg.studentName}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Montan:</span>
                <span className="font-extrabold text-slate-900">${confirmingReg.coursePrice} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metòd:</span>
                <span className="font-bold text-slate-900 capitalize">{confirmingReg.paymentMethod}</span>
              </div>
              {confirmingReg.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nimewo Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{confirmingReg.transactionReference}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingReg(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Anile
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Apwobasyon an kou...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Wi, Konfime Peman</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT REGISTRATION */}
      {rejectingReg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-lg text-slate-900">Rejte Demann Peman an?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Elèv la p ap jwenn aksè nan kou a. Tanpri mete yon rezon pou elèv la ka konprann sa ki te manke nan peman an.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Rezon Refi a *
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                placeholder="Mete rezon refi a..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingReg(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Anile
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Tretman an kou...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Rejte Peman Sa a</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
