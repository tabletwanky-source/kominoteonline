import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { coursesService, enrollmentsService } from '../services/firebaseService';
import { Course, Module, Lesson } from '../types/database';
import { formatPrice } from '../lib/utils';
import {
  Star,
  Users,
  Clock,
  BookOpen,
  CheckCircle2,
  Play,
  Lock,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';
import { CourseManualPaymentModal } from '../components/CourseManualPaymentModal';
import { CoursePreviewModal } from '../components/CoursePreviewModal';
import {
  hasValidCoursePreview,
  isPlaceholderOrDemoUrl,
  extractYouTubeVideoId,
} from '../utils/coursePreview';

export const CourseDetailPage: React.FC = () => {
  const { params, navigate, goBack } = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<{ module: Module; lessons: Lesson[] }[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [canceledBanner, setCanceledBanner] = useState(false);
  const [stripeConfigModal, setStripeConfigModal] = useState<any | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [lessonPreviewVideo, setLessonPreviewVideo] = useState<{ title: string; url: string } | null>(null);
  const [openModuleIds, setOpenModuleIds] = useState<Record<string, boolean>>({});
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('canceled') === 'true') {
      setCanceledBanner(true);
    }
  }, []);

  useEffect(() => {
    async function loadCourseDetails() {
      try {
        setLoading(true);
        const slugOrId = params.slug || params.id;
        if (!slugOrId) {
          setCourse(null);
          return;
        }
        const found = await coursesService.getBySlugOrId(slugOrId);

        if (found) {
          setCourse(found);
          let curr = await coursesService.getCurriculum(found.id);
          if (!curr || curr.length === 0) {
            curr = (found.sections || found.modules || []).map((s) => ({
              module: s,
              lessons: s.lessons || [],
            }));
          }
          setCurriculum(curr);

          // Open the first module by default
          if (curr.length > 0) {
            setOpenModuleIds({ [curr[0].module.id]: true });
          }

          if (user) {
            const enrolled = await enrollmentsService.isEnrolled(user.id, found.id);
            setIsEnrolled(enrolled);
          }
        } else {
          setCourse(null);
        }
      } catch (err) {
        console.error('Error loading course details from Firestore:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    }

    loadCourseDetails();
  }, [params.slug, params.id, user]);

  const toggleModule = (modId: string) => {
    setOpenModuleIds((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleEnrollOrContinue = async () => {
    setCheckoutError(null);

    // 1. Verify the student is authenticated
    if (!isAuthenticated || !user) {
      navigate('login');
      return;
    }

    if (!course) return;

    // If student already owns the course: Never allow duplicate purchase. Redirect to course player.
    if (isEnrolled) {
      navigate('course-player', { courseId: course.id });
      return;
    }

    try {
      setEnrolling(true);

      // Server validates real course information and price directly from Firestore!
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course.id,
          studentId: user.id,
          studentEmail: user.email,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Stripe checkout returned non-JSON response', { status: res.status, contentType });
        throw new Error('Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
      }

      const data = await res.json();

      if (data.alreadyEnrolled) {
        setIsEnrolled(true);
        navigate('course-player', { courseId: course.id });
        return;
      }

      if (data.free && data.enrolled) {
        // Enrolled directly by backend for free courses
        setIsEnrolled(true);
        navigate('course-player', { courseId: course.id });
        return;
      }

      if (data.url) {
        // Redirect to Stripe-hosted Checkout
        window.location.href = data.url;
        return;
      }

      if (data.needsConfig) {
        setStripeConfigModal(data);
        return;
      }

      if (data.error) {
        const errorCode = data.error;
        console.error('Stripe checkout error code:', errorCode, { message: data.message, courseId: course.id });
        const errorMessages: Record<string, string> = {
          'STRIPE_NOT_CONFIGURED': 'Peman ak kat poko disponib. Tanpri itilize yon lòt metòd peman.',
          'Course not found': 'Kou sa a pa disponib ankò.',
          'Invalid price': 'Gen yon pwoblem ak pri kou a. Tanpri kontakte administrasyon an.',
          'Unauthenticated': 'Tanpri konekte oswa kreye yon kont anvan ou fè peman an.',
        };
        setCheckoutError(errorMessages[errorCode] || data.message || 'Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
      }
    } catch (err: any) {
      console.error('Enrollment / Checkout error:', err);
      setCheckoutError('Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSimulateTestPayment = async () => {
    if (!course || !user) return;
    try {
      setEnrolling(true);
      const res = await fetch('/api/checkout/simulate-test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          studentId: user.id,
          studentEmail: user.email,
          testType: 'success',
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Simulate test webhook returned non-JSON response', { status: res.status, contentType });
        throw new Error('Nou pa t kapab ouvri peman Stripe la. Tanpri eseye ankò.');
      }
      const data = await res.json();
      if (data.success) {
        navigate('checkout-success', { sessionId: data.sessionId });
      }
    } catch (e: any) {
      setCheckoutError('Erè tès: ' + e.message);
    } finally {
      setEnrolling(false);
      setStripeConfigModal(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center bg-slate-50 min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600">Chaje enfòmasyon fòmasyon an...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-24 text-center bg-slate-50 min-h-screen">
        <h2 className="text-xl font-bold text-slate-800">Kou a pa disponib oswa pa egziste.</h2>
        <button
          onClick={() => navigate('courses')}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Retounen nan lis kou yo
        </button>
      </div>
    );
  }

  const isFree = course.price === 0;
  const hasDiscount = course.sale_price !== undefined && course.sale_price < course.price;
  const totalLessons = curriculum.reduce((acc, curr) => acc + curr.lessons.length, 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Top Banner & Breadcrumb */}
      <div className="bg-slate-900 text-white pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => goBack()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retounen nan tout kou yo</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Info */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {course.category && (
                  <span className="px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold">
                    {course.category.name}
                  </span>
                )}
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium">
                  {course.level}
                </span>
                {course.featured && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kou Vedèt</span>
                  </span>
                )}
                {course.certificate_enabled && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>Sètifika Enkli</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl">
                {course.short_description || course.description}
              </p>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-300 pt-2">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-white">{(course.rating || 4.9).toFixed(1)}</span>
                  <span className="text-slate-400">({course.students_count || 320} elèv)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>{course.duration_hours || 10} èdtan</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>{totalLessons || course.total_lessons || 12} leson</span>
                </div>
              </div>

              {/* Instructor snippet */}
              <div className="flex items-center gap-3 pt-3">
                <img
                  src={course.instructor?.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150'}
                  alt={course.instructor?.full_name || 'Wanky'}
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <p className="text-xs text-slate-400">Fòmasyon kreye e dirije pa:</p>
                  <p className="text-sm font-bold text-white">{course.instructor?.full_name || 'Wanky (Admin)'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Sticky Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Description, Outcomes & Curriculum */}
          <div className="lg:col-span-8 space-y-8">
            {/* What you'll learn */}
            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="font-black text-lg text-slate-900">Kisa w ap aprann nan kou sa a:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learning_outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum Accordion */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900">Plan Pedagojik & Modil yo</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {curriculum.length} modil • {totalLessons} leson detaye
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {curriculum.map(({ module, lessons }, mIdx) => {
                  const isOpen = openModuleIds[module.id] ?? false;
                  return (
                    <div key={module.id} className="transition-colors">
                      <button
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        className="w-full px-5 py-4 text-left flex items-center justify-between bg-slate-50/70 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                            Modil {mIdx + 1}
                          </span>
                          <span className="font-bold text-sm text-slate-800">{module.title}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{lessons.length} leson</span>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-slate-100 bg-white">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {lesson.is_free_preview && lesson.video_url && !isPlaceholderOrDemoUrl(lesson.video_url) ? (
                                  <button
                                    onClick={() => setLessonPreviewVideo({ title: lesson.title, url: lesson.video_url! })}
                                    className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                                    title="Gade aperçu gratis"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-blue-600" />
                                  </button>
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span className="text-xs font-semibold text-slate-800">{lesson.title}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {lesson.is_free_preview && (
                                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                                    Aperçu Lib
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {lesson.duration_minutes || 10} min
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full Description */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-3">
              <h3 className="font-black text-lg text-slate-900">Deskripsyon Fòmasyon an</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Enrollment Box */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden p-6 space-y-5">
              {/* Thumbnail image with video preview play button (ONLY if real preview configured) */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 group">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                />
                {hasValidCoursePreview(course) && (
                  <button
                    id="btn-open-course-preview"
                    type="button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/45 transition-colors cursor-pointer group/btn"
                    title="Gade Apèsi Kou a"
                  >
                    <div className="w-14 h-14 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                      <Play className="w-6 h-6 ml-1 fill-blue-600" />
                    </div>
                    <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                      <Play className="w-3 h-3 fill-current text-blue-400" />
                      <span>Gade Apèsi Kou a</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Dedicated Preview Button (Only if valid preview is configured) */}
              {hasValidCoursePreview(course) && (
                <button
                  id="btn-course-preview-action"
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Gade Apèsi Kou a</span>
                </button>
              )}

              {/* Price Display */}
              <div className="pt-2">
                {isFree ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-600">Gratis</span>
                    <span className="text-xs text-slate-500">Aksè lib pou tout elèv</span>
                  </div>
                ) : hasDiscount ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatPrice(course.sale_price!)}
                    </span>
                    <span className="text-base text-slate-400 line-through">
                      {formatPrice(course.price)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-xs font-bold">
                      Rabè limite
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatPrice(course.price)}
                  </span>
                )}
              </div>

              {/* Cancellation Notice */}
              {canceledBanner && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <span>Peman an te anile sou Stripe. Ou ka eseye ankò lè w pare.</span>
                  <button onClick={() => setCanceledBanner(false)} className="text-amber-500 hover:text-amber-700 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Error Notice */}
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
                  <span>{checkoutError}</span>
                  <button onClick={() => setCheckoutError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Action Button */}
              <button
                id="btn-enroll-course-page"
                onClick={handleEnrollOrContinue}
                disabled={enrolling}
                className={`w-full py-4 rounded-xl font-extrabold text-sm sm:text-base text-white shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isEnrolled
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                }`}
              >
                {enrolling ? (
                  <span>Enskripsyon an kou...</span>
                ) : isEnrolled ? (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    <span>Kòmanse Kou a</span>
                  </>
                ) : isFree ? (
                  <span>Kòmanse Kou a (Gratis)</span>
                ) : (
                  <span>Achte ak Kat (Stripe)</span>
                )}
              </button>

              {!isFree && !isEnrolled && (
                <button
                  id="btn-manual-payment-course"
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated || !user) {
                      navigate('login');
                      return;
                    }
                    setShowManualPaymentModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Peye pa Bank / MonCash / NatCash / PayPal</span>
                </button>
              )}

              <p className="text-[11px] text-center text-slate-500">
                Peman an sekirite • Fòmasyon an Kreyòl Ayisyen
              </p>

              {/* Course Includes Checklist */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                <p className="font-bold text-slate-900 text-sm mb-2">Kou sa a gen ladan l:</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{course.duration_hours || 10} èdtan videyo sou demand</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{totalLessons || course.total_lessons || 12} leson estriktire</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Aksè a vi sou mobil ak òdinatè</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Sètifika finisman ofisyèl lè w rive 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Course Preview Modal (Public Marketing Media) */}
      {course && (
        <CoursePreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          course={course}
        />
      )}

      {/* Lesson Free Preview Modal (Real Lesson Media Only) */}
      {lessonPreviewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-blue-400 fill-current" />
                <span className="font-bold text-sm truncate">{lessonPreviewVideo.title}</span>
              </div>
              <button
                onClick={() => setLessonPreviewVideo(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fèmen
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {extractYouTubeVideoId(lessonPreviewVideo.url) ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeVideoId(lessonPreviewVideo.url)}?autoplay=1&rel=0&modestbranding=1`}
                  title={lessonPreviewVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={lessonPreviewVideo.url}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="w-full h-full"
                >
                  Navigatè w pa sipòte lekti videyo sa a.
                </video>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stripe Key Setup / Test Mode Modal */}
      {stripeConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                Entegrasyon Stripe Pare Pou Peman
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pou voye elèv la sou vrè paj Stripe Checkout la, ou ka ajoute kle <code>STRIPE_SECRET_KEY</code> ou nan anviwònman an (Settings).
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <div>Kou: {course?.title}</div>
                <div>Pri validé: ${stripeConfigModal.course?.effectivePrice || course?.price} USD</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                id="btn-simulate-test-checkout"
                onClick={handleSimulateTestPayment}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Simile Peman Stripe (Mòd Tès)</span>
              </button>

              <button
                onClick={() => setStripeConfigModal(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
              >
                Fèmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Payment Modal (Bank, PayPal, MonCash, NatCash) */}
      {showManualPaymentModal && course && (
        <CourseManualPaymentModal
          isOpen={showManualPaymentModal}
          onClose={() => setShowManualPaymentModal(false)}
          course={course}
          user={user}
          onSuccess={(invId) => {
            setShowManualPaymentModal(false);
            navigate('invoice', { invoiceId: invId });
          }}
        />
      )}
    </div>
  );
};
