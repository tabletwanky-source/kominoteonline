import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { SEOHead } from '../components/seo/SEOHead';
import { enrollmentsService, coursesService } from '../services/firebaseService';
import { Course } from '../types/database';
import { BookOpen, Clock, Play, Lock } from 'lucide-react';

export const MyCoursesPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('login');
      return;
    }
    async function loadEnrolledCourses() {
      if (!user) return;
      try {
        setLoading(true);
        const enrollments = await enrollmentsService.getByStudent(user.id);
        const courseIds = enrollments.map((e: any) => e.course_id || e.courseId);
        const courses: Course[] = [];
        for (const id of courseIds) {
          const c = await coursesService.getById(id);
          if (c) courses.push(c);
        }
        setEnrolledCourses(courses);
      } catch (err) {
        console.error('Error loading enrolled courses:', err);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    }
    loadEnrolledCourses();
  }, [user, isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <SEOHead title="Kou Mwen yo" description="Gade tout kou ou enskri ladan yo sou Kominote Online." canonical="/my-courses" noindex />
      <div className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Kou Mwen yo</h1>
            <p className="text-sm text-slate-500 mt-1">Tout kou ou enskri ladan yo.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Ou poko enskri nan okenn kou</h2>
              <p className="text-sm text-slate-500 mb-6">Eksplore katalòg kou nou yo epi kòmanse aprann jodi a.</p>
              <button
                onClick={() => navigate('courses')}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Eksplore Kou yo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('course-player', { courseId: course.id })}
                >
                  <div className="aspect-16/9 bg-slate-100 relative">
                    {course.thumbnail_url || course.cover_image ? (
                      <img
                        src={course.thumbnail_url || course.cover_image}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-blue-700" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{course.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {course.level && (
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          {course.level}
                        </span>
                      )}
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
