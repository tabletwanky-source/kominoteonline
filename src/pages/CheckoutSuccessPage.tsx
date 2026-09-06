import React, { useEffect, useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Play,
  GraduationCap,
  Loader2,
  AlertCircle,
  Clock,
  ShieldCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Order, Course } from '../types/database';

export const CheckoutSuccessPage: React.FC = () => {
  const { params, navigate } = useNavigation();
  const { user } = useAuth();
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [order, setOrder] = useState<Order | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Extract session ID from navigation params or URL
  const sessionId =
    params.sessionId ||
    new URLSearchParams(window.location.search).get('session_id') ||
    '';

  useEffect(() => {
    if (!sessionId) {
      setStatus('failed');
      return;
    }

    let isMounted = true;
    let timer: any = null;

    const verifySession = async () => {
      try {
        const res = await fetch(`/api/checkout/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          console.error('Verify-session returned non-JSON response');
          return;
        }
        const data = await res.json();

        if (!isMounted) return;

        if (data.status === 'completed') {
          setStatus('completed');
          setOrder(data.order);
          setCourse(data.course);
        } else if (data.status === 'failed') {
          setStatus('failed');
        } else {
          // Still processing webhook
          if (pollCount < 12) {
            timer = setTimeout(() => {
              setPollCount((prev) => prev + 1);
            }, 2000);
          } else {
            // Keep status processing or allow manual refresh
            setStatus('processing');
          }
        }
      } catch (err) {
        console.error('Error verifying session:', err);
      }
    };

    verifySession();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, pollCount]);

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {status === 'processing' && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                N ap verifye peman an ak Stripe...
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Nou resevwa enfòmasyon peman w lan. Webhook sekirite a ap finalize enskripsyon an nan Firestore nan kèk segonn.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Sesyon Stripe:</span>
                <span className="font-mono text-slate-700 text-[11px] truncate max-w-[200px]">
                  {sessionId}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Verifikasyon otomatik an kou ({pollCount}/12)...</span>
              </div>
            </div>

            <button
              onClick={() => setPollCount((c) => c + 1)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
            >
              Rechaje estati a manyèlman
            </button>
          </div>
        )}

        {status === 'completed' && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-8 animate-fadeIn">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            {/* Success Heading */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">
                Peman an reyisi!
              </h2>
              <p className="text-base text-emerald-700 font-bold">
                “Ou enskri nan kou sa a avèk siksè.”
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Felisitasyon! Tout leson, materyèl, ak sètifika kou sa a debloke pou ou nan LMS Kominote Online.
              </p>
            </div>

            {/* Course & Receipt Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Resi Peman Stripe
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase">
                  Peye (Paid)
                </span>
              </div>

              {course && (
                <div className="flex items-center gap-4">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                      {course.title}
                    </h4>
                    <span className="text-xs font-semibold text-slate-500 block mt-0.5">
                      Montan: ${order?.amount || course.price} {order?.currency?.toUpperCase() || 'USD'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>
                  <span className="block text-slate-400 font-mono">Dat Peman:</span>
                  <span className="font-semibold text-slate-700">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Jodi a'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-mono">Id Sesyon:</span>
                  <span className="font-mono text-slate-700 truncate block">
                    {order?.stripeSessionId || sessionId}
                  </span>
                </div>
              </div>
            </div>

            {/* Mandatory Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                id="btn-start-course-after-checkout"
                onClick={() => {
                  const targetCourseId = order?.courseId || course?.id || course?.slug;
                  if (targetCourseId) {
                    navigate('course-player', { courseId: targetCourseId });
                  } else {
                    navigate('courses');
                  }
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-extrabold text-sm sm:text-base shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Kòmanse Kou a</span>
              </button>

              <button
                id="btn-goto-my-courses"
                onClick={() => navigate('student-dashboard')}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-slate-600" />
                <span>Ale nan Kou Mwen yo</span>
              </button>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">
                Peman an pa fin fèt oswa anile
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                Nou pa t ka verifye peman an. Si w te anile tranzaksyon an, okenn lajan pa debouse epi kou a pa debloke.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={() => navigate('courses')}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
              >
                Retounen nan Katalòg Kou yo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
