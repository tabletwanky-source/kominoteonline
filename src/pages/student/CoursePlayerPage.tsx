import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { coursesService, enrollmentsService, progressService } from '../../services/firebaseService';
import { Course, CourseModule, Lesson, LessonProgress } from '../../types/database';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  Download,
  Award,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Lock,
  ExternalLink,
  ShieldCheck,
  Video
} from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const CoursePlayerPage: React.FC = () => {
  const { params, navigate } = useNavigation();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
  const [courseProgressPct, setCourseProgressPct] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [watchPercentage, setWatchPercentage] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);
  const [celebrateCompletion, setCelebrateCompletion] = useState(false);
  const [issuedCertId, setIssuedCertId] = useState<string | null>(null);

  // YouTube player reference
  const ytPlayerRef = useRef<any>(null);
  const ytIntervalRef = useRef<any>(null);

  // Load Course, Modules, Lessons, Enrollment, and Progress
  useEffect(() => {
    async function loadCourseAndProgress() {
      if (!params.slug) {
        navigate('courses');
        return;
      }

      try {
        setLoading(true);
        const fetchedCourse = await coursesService.getBySlugOrId(params.slug);
        if (!fetchedCourse) {
          navigate('courses');
          return;
        }
        setCourse(fetchedCourse);

        // Determine first lesson
        let firstLesson: Lesson | null = null;
        if (fetchedCourse.modules && fetchedCourse.modules.length > 0) {
          for (const mod of fetchedCourse.modules) {
            if (mod.lessons && mod.lessons.length > 0) {
              if (params.lessonId) {
                const found = mod.lessons.find((l) => l.id === params.lessonId);
                if (found) {
                  firstLesson = found;
                  break;
                }
              }
              if (!firstLesson) {
                firstLesson = mod.lessons[0];
              }
            }
          }
        }
        setCurrentLesson(firstLesson);

        // Check Enrollment
        if (user) {
          const isAdmin = user.role === 'admin';
          const isInstructor = user.role === 'instructor' && user.id === fetchedCourse.instructor_id;

          if (isAdmin || isInstructor) {
            setIsEnrolled(true);
          } else {
            const enrollment = await enrollmentsService.getEnrollment(user.id, fetchedCourse.id);
            if (enrollment) {
              setIsEnrolled(true);
              setCourseProgressPct(enrollment.progress_percentage || 0);
            } else {
              setIsEnrolled(false);
            }
          }

          // Fetch student progress
          const pMap = await progressService.getStudentProgressForCourse(user.id, fetchedCourse.id);
          setProgressMap(pMap);
        }
      } catch (err) {
        console.error('Failed to load course for learning player:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourseAndProgress();
  }, [params.slug, user]);

  // Set watch percentage from stored progress when switching lessons
  useEffect(() => {
    if (currentLesson && progressMap[currentLesson.id]) {
      setWatchPercentage(progressMap[currentLesson.id].watch_percentage || 0);
    } else {
      setWatchPercentage(0);
    }
  }, [currentLesson, progressMap]);

  // Handle YouTube IFrame API Initialization
  useEffect(() => {
    if (!currentLesson || currentLesson.content_type !== 'youtube' || !currentLesson.video_url) {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
      return;
    }

    // Extract video ID
    const videoId = extractYouTubeId(currentLesson.video_url);
    if (!videoId) return;

    function initPlayer() {
      if (!window.YT || !window.YT.Player) return;

      const container = document.getElementById('youtube-iframe-player');
      if (!container) return;

      // Clean old player
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
      }

      ytPlayerRef.current = new window.YT.Player('youtube-iframe-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onStateChange: (event: any) => {
            // Playing state is 1
            if (event.data === window.YT.PlayerState.PLAYING) {
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
              ytIntervalRef.current = setInterval(() => {
                if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime && ytPlayerRef.current.getDuration) {
                  const current = ytPlayerRef.current.getCurrentTime();
                  const duration = ytPlayerRef.current.getDuration();
                  if (duration > 0) {
                    const pct = Math.min(100, Math.round((current / duration) * 100));
                    setWatchPercentage((prev) => Math.max(prev, pct));

                    // Check if reached >= 90%
                    if (pct >= 90 && user && course && currentLesson) {
                      if (!progressMap[currentLesson.id]?.completed) {
                        handleCompleteLesson(currentLesson.id, pct);
                      }
                    }
                  }
                }
              }, 1000);
            } else {
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
            }
          },
        },
      });
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => initPlayer();
    } else {
      initPlayer();
    }

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [currentLesson, user, course]);

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  // Handle uploaded video onTimeUpdate
  const handleUploadedVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration > 0) {
      const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      setWatchPercentage((prev) => Math.max(prev, pct));

      if (pct >= 90 && user && course && currentLesson) {
        if (!progressMap[currentLesson.id]?.completed) {
          handleCompleteLesson(currentLesson.id, pct);
        }
      }
    }
  };

  // Record lesson completion
  const handleCompleteLesson = async (lessonId: string, customWatchPct?: number) => {
    if (!user || !course) return;

    setSavingProgress(true);
    try {
      const finalWatchPct = customWatchPct !== undefined ? customWatchPct : 100;
      const res = await progressService.recordProgress(user.id, course.id, lessonId, finalWatchPct, true);

      // Update local state
      setProgressMap((prev) => ({
        ...prev,
        [lessonId]: {
          id: `${user.id}_${lessonId}`,
          student_id: user.id,
          course_id: course.id,
          lesson_id: lessonId,
          completed: true,
          watch_percentage: finalWatchPct,
          updated_at: new Date().toISOString(),
        },
      }));

      setCourseProgressPct(res.courseProgressPercentage);

      if (res.courseProgressPercentage === 100) {
        setCelebrateCompletion(true);
        if (res.certificateId) {
          setIssuedCertId(res.certificateId);
        }
      }
    } catch (err) {
      console.error('Failed to complete lesson:', err);
    } finally {
      setSavingProgress(false);
    }
  };

  // Navigate between lessons
  const getAllLessonsInOrder = (): Lesson[] => {
    const list: Lesson[] = [];
    course?.modules?.forEach((m) => {
      m.lessons?.forEach((l) => list.push(l));
    });
    return list;
  };

  const allLessons = getAllLessonsInOrder();
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chaje sal kou a...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  // If user is not enrolled and not admin/instructor
  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 text-center border border-slate-700 shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Aksè Rezève pou Elèv Enskri</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Ou dwe enskri nan kou <span className="font-bold text-white">"{course.title}"</span> pou w ka jwenn aksè nan leson, videyo, ak sètifika a.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            {isAuthenticated && user ? (
              <button
                onClick={async () => {
                  await enrollmentsService.enroll(user.id, course.id);
                  setIsEnrolled(true);
                }}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                Enskri Kou Sa a Kounye a
              </button>
            ) : (
              <button
                onClick={() => navigate('login')}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                Konekte pou w Enskri
              </button>
            )}

            <button
              onClick={() => navigate('course-detail', { slug: course.slug })}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Retounen sou paj prezantasyon kou a
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = currentLesson ? !!progressMap[currentLesson.id]?.completed : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Learning Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('student-dashboard')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Retounen nan Tablodbò"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white truncate max-w-md">{course.title}</h1>
            <p className="text-xs text-slate-400">
              {course.instructor?.full_name || 'Wanky'} • {course.category?.name || 'Kominote Online'}
            </p>
          </div>
        </div>

        {/* Course Progress Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-300">{courseProgressPct}% konplete</span>
              <p className="text-[10px] text-slate-400">
                {courseProgressPct === 100 ? 'Kou a fini avèk siksè!' : 'Avansman nan kou a'}
              </p>
            </div>
            <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${courseProgressPct}%` }}
              />
            </div>
          </div>

          {courseProgressPct === 100 && (
            <button
              onClick={() => {
                if (issuedCertId) {
                  navigate('certificate', { id: issuedCertId });
                } else {
                  navigate('student-dashboard');
                }
              }}
              className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Sètifika Ou</span>
            </button>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* 100% Completion Celebration Banner */}
      {celebrateCompletion && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 border-b border-emerald-700/60 p-4 text-white flex items-center justify-between px-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Felisitasyon! Ou konplete tout leson nan kou sa a 100%!</h3>
              <p className="text-xs text-emerald-200">
                Sètifika ofisyèl Kominote Online ou disponib kounye a pou verifye ak telechaje.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (issuedCertId) {
                  navigate('certificate', { id: issuedCertId });
                } else {
                  navigate('student-dashboard');
                }
              }}
              className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span>Gade Sètifika a</span>
            </button>
            <button
              onClick={() => setCelebrateCompletion(false)}
              className="text-emerald-300 hover:text-white p-1.5 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Learning Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Video / Content Player Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full space-y-6">
            
            {/* LESSON CONTENT PLAYER CANVAS */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-video relative flex items-center justify-center">
              {currentLesson ? (
                <>
                  {/* YouTube Player */}
                  {currentLesson.content_type === 'youtube' && (
                    <div className="w-full h-full">
                      <div id="youtube-iframe-player" className="w-full h-full" />
                    </div>
                  )}

                  {/* Vimeo Player */}
                  {currentLesson.content_type === 'vimeo' && (
                    <iframe
                      src={`https://player.vimeo.com/video/${currentLesson.video_url?.split('/').pop()}?autoplay=0`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}

                  {/* Uploaded HTML5 Video */}
                  {currentLesson.content_type === 'uploaded_video' && currentLesson.video_url && (
                    <video
                      controls
                      controlsList="nodownload"
                      src={currentLesson.video_url}
                      onTimeUpdate={handleUploadedVideoTimeUpdate}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* PDF Document Viewer */}
                  {currentLesson.content_type === 'pdf' && (
                    <div className="w-full h-full bg-slate-900 p-6 flex flex-col items-center justify-center text-center space-y-4">
                      <FileText className="w-16 h-16 text-blue-400" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-base">{currentLesson.file_name || currentLesson.title}</h4>
                        <p className="text-xs text-slate-400">Dokiman PDF leson sa a pare pou etidye oswa telechaje.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={currentLesson.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Louvri PDF la nan yon nouvo onglet</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Downloadable File */}
                  {currentLesson.content_type === 'file' && (
                    <div className="w-full h-full bg-slate-900 p-6 flex flex-col items-center justify-center text-center space-y-4">
                      <Download className="w-16 h-16 text-emerald-400" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-base">{currentLesson.file_name || currentLesson.title}</h4>
                        <p className="text-xs text-slate-400">Fichye egzèsis ak materyèl pratik pou telechaje sou machin ou.</p>
                      </div>
                      <a
                        href={currentLesson.file_url}
                        download
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Telechaje Fichye a</span>
                      </a>
                    </div>
                  )}

                  {/* Text / Markdown Lesson */}
                  {currentLesson.content_type === 'text' && (
                    <div className="w-full h-full bg-slate-900 p-8 overflow-y-auto text-left flex flex-col justify-between">
                      <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                        <div className="whitespace-pre-line">
                          {currentLesson.text_content || currentLesson.description || 'Kontni tèks leson an ap pare...'}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm">Chwazi yon leson nan meni an</p>
              )}
            </div>

            {/* Video Watch Progress & Validation Indicator */}
            {currentLesson && (currentLesson.content_type === 'youtube' || currentLesson.content_type === 'uploaded_video' || currentLesson.content_type === 'vimeo') && (
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300">Objektif Vizyonaj:</span>
                    <span className="text-xs text-blue-400 font-semibold">{watchPercentage}% gade (Bezwen 90% pou valide otomatikman)</span>
                  </div>
                  <div className="w-full sm:w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        watchPercentage >= 90 ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${watchPercentage}%` }}
                    />
                  </div>
                </div>

                {isCurrentCompleted ? (
                  <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Leson Sa a Valide</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gade omwen 90% pou make kòm fini</span>
                  </span>
                )}
              </div>
            )}

            {/* Lesson Title & Actions */}
            {currentLesson && (
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{currentLesson.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Dire: {currentLesson.duration || 'N/A'} • Tip: {currentLesson.content_type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>

                  {/* Manual / Non-video Mark Complete Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCompleteLesson(currentLesson.id, 100)}
                      disabled={savingProgress}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        isCurrentCompleted
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCurrentCompleted ? 'Make Kòm Fini (Deja Valide)' : 'Make Kòm Fini'}</span>
                    </button>
                  </div>
                </div>

                {currentLesson.description && (
                  <div className="pt-4 border-t border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <p>{currentLesson.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Lesson Navigation (Previous / Next) */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                disabled={!prevLesson}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-800 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Leson Presedan</span>
              </button>

              <button
                onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                disabled={!nextLesson}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <span>Pwochen Leson</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Right: Modules & Lessons Sidebar */}
        <aside
          className={`w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 transition-all duration-300 fixed lg:static inset-y-16 right-0 z-20 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Kou a</h3>
              <p className="text-xs text-white font-medium">
                {course.modules?.length || 0} modil • {allLessons.length} leson
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modules Accordion & Lesson List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
            {course.modules && course.modules.length > 0 ? (
              course.modules.map((mod, mIdx) => (
                <div key={mod.id} className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                  <div className="p-3 bg-slate-850 flex items-center justify-between font-bold text-xs text-slate-200">
                    <span className="truncate pr-2">{mod.title}</span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                      {mod.lessons?.length || 0} leson
                    </span>
                  </div>

                  {/* Lessons in Module */}
                  <div className="divide-y divide-slate-900">
                    {mod.lessons && mod.lessons.length > 0 ? (
                      mod.lessons.map((les) => {
                        const isActive = currentLesson?.id === les.id;
                        const isDone = !!progressMap[les.id]?.completed;

                        return (
                          <button
                            key={les.id}
                            onClick={() => {
                              setCurrentLesson(les);
                              if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`w-full p-3 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-blue-600/20 border-l-4 border-blue-500 text-white'
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isActive ? (
                                <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold leading-snug truncate ${isActive ? 'text-blue-300' : ''}`}>
                                {les.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>{les.duration || '05:00'}</span>
                                <span>•</span>
                                <span className="capitalize">{les.content_type.replace('_', ' ')}</span>
                                {les.preview_enabled && (
                                  <span className="text-amber-400 font-bold bg-amber-500/10 px-1 rounded">Previzyon</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-[11px] text-slate-500 p-3 italic">Poko gen leson nan modil sa a.</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Poko gen modil ki kreye pou kou sa a.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
