import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { enrollmentsService, certificatesService, ordersService } from '../../services/firebaseService';
import { Enrollment, Certificate, Order } from '../../types/database';
import {
  BookOpen,
  Play,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  User,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentData() {
      if (!user) return;
      try {
        setLoading(true);
        const [enrList, certList, orderList] = await Promise.all([
          enrollmentsService.getStudentEnrollments(user.id),
          certificatesService.getStudentCertificates(user.id),
          ordersService.getStudentOrders(user.id),
        ]);
        setEnrollments(enrList);
        setCertificates(certList);
        setOrders(orderList);
      } catch (err) {
        console.error('Error loading student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentData();
  }, [user]);

  const completedCount = enrollments.filter((e) => e.status === 'completed' || e.progress_percentage === 100).length;
  const inProgressCount = enrollments.length - completedCount;

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Tablodbò Elèv';
      case 'my-courses':
        return 'Kou Mwen yo';
      case 'certificates':
        return 'Sètifika Mwen yo';
      case 'orders':
        return 'Kòmand ak Resi Stripe Mwen yo';
      case 'profile':
        return 'Profil Mwen';
      default:
        return 'Tablodbò Elèv';
    }
  };

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={(sec) => {
        if (sec === 'customer-downloads') {
          navigate('customer-downloads');
        } else if (sec === 'customer-orders') {
          navigate('customer-orders');
        } else {
          setActiveSection(sec);
        }
      }}
      title={getSectionTitle()}
      subtitle={`Byenvini ankò, ${user?.full_name || 'Elèv'}! Men yon rezime sou fòmasyon ak pwogrè ou nan Kominote Online.`}
    >
      {/* SECTION 1: MAIN DASHBOARD OVERVIEW */}
      {activeSection === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Kou Enskri</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{enrollments.length}</p>
              <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{inProgressCount} aktif, {completedCount} fini</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Sètifika Reyalize</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{certificates.length}</p>
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>Verifyab sou entènèt</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Kou Konplete</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{completedCount}</p>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% leson gade</span>
              </span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase">Estati Kont</span>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">Elèv Ofisyèl</p>
              <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kominote Online</span>
              </span>
            </div>
          </div>

          {/* Enrolled Courses Progress */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Fòmasyon w ap Suiv Kounye a</h3>
                <p className="text-xs text-slate-500 mt-0.5">Kontinye aprann kote w te rete a.</p>
              </div>
              <button
                onClick={() => navigate('courses')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Dekouvri Plis Kou</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs">Chaje fòmasyon ou yo...</span>
              </div>
            ) : enrollments.length > 0 ? (
              <div className="space-y-4">
                {enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          enr.course?.thumbnail ||
                          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'
                        }
                        alt=""
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {enr.course?.title || 'Fòmasyon Kominote'}
                        </h4>
                        <span className="text-xs text-slate-500 block">
                          Enstriktè: {enr.course?.instructor?.full_name || 'Wanky'}
                        </span>

                        {/* Progress Bar */}
                        <div className="pt-2 flex items-center gap-3">
                          <div className="w-32 sm:w-44 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${enr.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {enr.progress_percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-end gap-2 pt-2 md:pt-0">
                      <button
                        onClick={() => navigate('course-player', { courseId: enr.course_id })}
                        className="w-full md:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Kontinye Aprann</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">Ou poko enskri nan okenn kou</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Eksplore katalòg Kominote Online la epi chwazi yon fòmasyon pratik an Kreyòl pou kòmanse jodi a.
                </p>
                <button
                  onClick={() => navigate('courses')}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                >
                  Gade Katalòg Kou yo
                </button>
              </div>
            )}
          </div>

          {/* Certificates Earned Banner */}
          {certificates.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                <Award className="w-5 h-5 text-amber-600" />
                <span>Sètifika Ou Resevwa ({certificates.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-xl p-4 border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{cert.course_title}</h5>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ID: {cert.certificate_id}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate('certificate', { id: cert.certificate_id })}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Gade</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MY COURSES */}
      {activeSection === 'my-courses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr) => (
              <div
                key={enr.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={enr.course?.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'}
                    alt=""
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-5 space-y-3">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {enr.course?.level || 'Tout Nivo'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                      {enr.course?.title}
                    </h4>

                    {/* Progress */}
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Pwogrè</span>
                        <span className="font-bold text-slate-900">{enr.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${enr.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => navigate('course-player', { courseId: enr.course_id })}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Louvri Kou a</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: CERTIFICATES */}
      {activeSection === 'certificates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6" />
                  </span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{cert.course_title}</h4>
                    <span className="text-xs text-slate-500">Dat: {cert.completion_date}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex justify-between items-center">
                  <span className="text-slate-500 font-mono text-[11px]">{cert.certificate_id}</span>
                  <span className="text-emerald-600 font-bold text-[10px]">Ofisyèl & Verifye</span>
                </div>

                <button
                  onClick={() => navigate('certificate', { id: cert.certificate_id })}
                  className="w-full py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Afiche Sètifika a
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: STRIPE ORDERS & RECEIPTS */}
      {activeSection === 'orders' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-extrabold text-base text-slate-900">Istorik Peman & Resi Stripe Ou yo</h3>
              <p className="text-xs text-slate-500">Tout peman ou fè pou kou nan Kominote Online ak nimewo resi yo.</p>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-semibold text-xs text-slate-500">Ou poko gen okenn kòmand oswa peman sou kont sa a.</p>
                <button
                  onClick={() => navigate('courses')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Gade Katalòg Kou yo
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">Kou</th>
                      <th className="p-4">Montan</th>
                      <th className="p-4">Estati</th>
                      <th className="p-4">Dat Peman</th>
                      <th className="p-4">Resi Stripe ID</th>
                      <th className="p-4 text-right">Aksyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{o.courseId}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900">${Number(o.amount || 0).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono ml-1">{o.currency || 'USD'}</span>
                        </td>
                        <td className="p-4">
                          {o.paymentStatus === 'paid' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Peye (Paid)</span>
                            </span>
                          )}
                          {o.paymentStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              <span>An Atant</span>
                            </span>
                          )}
                          {o.paymentStatus === 'refunded' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                              <RotateCcw className="w-3 h-3" />
                              <span>Ranbouse</span>
                            </span>
                          )}
                          {o.paymentStatus === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                              <span>Echwe</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 text-[11px]">
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500 truncate max-w-[150px]" title={o.stripeSessionId || o.id}>
                          {o.stripeSessionId || o.id}
                        </td>
                        <td className="p-4 text-right">
                          {o.paymentStatus === 'paid' && (
                            <button
                              onClick={() => navigate('course-player', { courseId: o.courseId })}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Louvri Kou a
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: PROFILE */}
      {activeSection === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs max-w-xl space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Enfòmasyon Profil Elèv</h3>
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border border-slate-200"
            />
            <div>
              <h4 className="font-bold text-sm text-slate-900">{user?.full_name}</h4>
              <span className="text-xs text-slate-500">{user?.email}</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded block w-fit mt-1">
                Wòl: Elèv (Student)
              </span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
