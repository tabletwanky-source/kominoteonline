import { supabase } from '../lib/supabase';
import {
  Course,
  CourseModule,
  Lesson,
  Category,
  Profile,
  Enrollment,
  CourseRegistration,
  RegistrationStatus,
  LessonProgress,
  Certificate,
  AboutPageCMS,
  TeamMember,
  SiteSettings,
  UserRole,
  Order,
  DigitalProduct,
  ProductFile,
  ProductCategory,
  ShopOrder,
  Invoice,
  DigitalAccess,
  PaymentSettings,
  Coupon,
  CouponValidationResult,
} from '../types/database';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaultPaymentSettings';
import { createDigitalShopOrder } from './firebaseFunctions';

function sanitizeTimestamp(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val.toISOString === 'function') return val.toISOString();
  return String(val);
}

function stripNulls<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value === undefined ? null : value;
    }
  }
  return result as Partial<T>;
}

// ---------------------------------------------------------------------------
// 1. CATEGORIES SERVICE
// ---------------------------------------------------------------------------
export const categoriesService = {
  async getAll(): Promise<Category[]> {
    try {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      return (data || []) as Category[];
    } catch (err: any) {
      console.error('Could not load categories:', err?.message || err);
      return [];
    }
  },

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const { data: result, error } = await supabase.from('categories').insert({
      ...stripNulls(data),
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return result as Category;
  },

  async update(id: string, data: Partial<Category>): Promise<void> {
    const { error } = await supabase.from('categories').update(stripNulls(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 2. COURSES SERVICE
// ---------------------------------------------------------------------------
export const coursesService = {
  async getAll(options?: {
    categorySlug?: string;
    searchQuery?: string;
    publishedOnly?: boolean;
    instructorId?: string;
  }): Promise<Course[]> {
    try {
      let query = supabase.from('courses').select('*');
      if (options?.publishedOnly !== false) {
        query = query.eq('status', 'published');
      }
      const { data, error } = await query;
      if (error) throw error;

      let courses = (data || []) as Course[];

      if (options?.categorySlug && options.categorySlug !== 'tout' && options.categorySlug !== 'all') {
        const cats = await categoriesService.getAll();
        const matchedCat = cats.find((cat) => cat.slug === options.categorySlug || cat.id === options.categorySlug);
        if (matchedCat) {
          courses = courses.filter((c) => c.category_id === matchedCat.id);
        }
      }

      if (options?.instructorId) {
        courses = courses.filter((c) => c.instructor_id === options.instructorId);
      }

      if (options?.searchQuery && options.searchQuery.trim() !== '') {
        const q = options.searchQuery.toLowerCase();
        courses = courses.filter(
          (c) =>
            c.title?.toLowerCase().includes(q) ||
            c.description?.toLowerCase().includes(q) ||
            c.short_description?.toLowerCase().includes(q)
        );
      }

      const [categories, instructors] = await Promise.all([
        categoriesService.getAll(),
        usersService.getInstructors(),
      ]);

      const catMap = new Map(categories.map((c) => [c.id, c]));
      const instMap = new Map(instructors.map((i) => [i.id, i]));

      return courses.map((course) => ({
        ...course,
        category: catMap.get(course.category_id) || course.category,
        instructor: instMap.get(course.instructor_id) || course.instructor,
      }));
    } catch (err: any) {
      console.error('Could not load courses:', err?.message || err);
      return [];
    }
  },

  async getFeatured(): Promise<Course[]> {
    const all = await this.getAll({ publishedOnly: true });
    return all.filter((c) => c.featured);
  },

  async getPopular(limitCount = 6): Promise<Course[]> {
    const all = await this.getAll({ publishedOnly: true });
    return all.sort((a, b) => (b.students_count || 0) - (a.students_count || 0)).slice(0, limitCount);
  },

  async getNew(limitCount = 6): Promise<Course[]> {
    const all = await this.getAll({ publishedOnly: true });
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limitCount);
  },

  async getBySlugOrId(slugOrId: string): Promise<Course | null> {
    try {
      let courseData: any = null;

      // Try by ID first
      const { data: byId } = await supabase.from('courses').select('*').eq('id', slugOrId).maybeSingle();
      if (byId) {
        courseData = byId;
      } else {
        // Try by slug
        const { data: bySlug, error: slugError } = await supabase.from('courses').select('*').eq('slug', slugOrId).maybeSingle();
        if (slugError) throw slugError;
        if (bySlug) courseData = bySlug;
      }

      if (!courseData) return null;

      const course = {
        ...courseData,
        created_at: sanitizeTimestamp(courseData.created_at),
      } as Course;

      // Join Category
      if (course.category_id) {
        const { data: cat } = await supabase.from('categories').select('*').eq('id', course.category_id).maybeSingle();
        if (cat) course.category = cat as Category;
      }

      // Join Instructor
      if (course.instructor_id) {
        const { data: inst } = await supabase.from('profiles').select('*').eq('id', course.instructor_id).maybeSingle();
        if (inst) course.instructor = inst as Profile;
      }

      // Load Modules & Lessons
      const modules = await modulesService.getByCourseId(course.id);
      course.modules = modules;
      course.sections = modules;

      const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
      course.total_lessons = totalLessons || course.total_lessons || 0;

      return course;
    } catch (err) {
      console.error('Could not fetch course:', err);
      return null;
    }
  },

  async create(data: Omit<Course, 'id' | 'created_at' | 'students_count' | 'rating' | 'total_lessons'>): Promise<Course> {
    const newCourse = {
      ...stripNulls(data),
      rating: 5.0,
      students_count: 0,
      total_lessons: 0,
      duration_hours: data.duration_hours || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: result, error } = await supabase.from('courses').insert(newCourse).select().single();
    if (error) throw new Error(error.message);
    return result as Course;
  },

  async update(id: string, data: Partial<Course>): Promise<void> {
    const { error } = await supabase.from('courses').update({
      ...stripNulls(data),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const modules = await modulesService.getByCourseId(id);
    for (const mod of modules) {
      await modulesService.delete(mod.id);
    }
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getCurriculum(courseId: string): Promise<{ module: CourseModule; lessons: Lesson[] }[]> {
    const modules = await modulesService.getByCourseId(courseId);
    return modules.map((m) => ({ module: m, lessons: m.lessons || [] }));
  },
};

// ---------------------------------------------------------------------------
// 3. COURSE MODULES & LESSONS SERVICE
// ---------------------------------------------------------------------------
export const modulesService = {
  async getByCourseId(courseId: string): Promise<CourseModule[]> {
    try {
      const { data, error } = await supabase.from('course_modules').select('*').eq('course_id', courseId);
      if (error) throw error;

      const modules = (data || []) as CourseModule[];
      modules.sort((a, b) => (a.position || 0) - (b.position || 0));

      for (const mod of modules) {
        mod.lessons = await lessonsService.getByModuleId(mod.id);
      }

      return modules;
    } catch (err: any) {
      console.error('Could not load modules:', err?.message || err);
      return [];
    }
  },

  async create(courseId: string, title: string, position: number): Promise<CourseModule> {
    const data = { course_id: courseId, title, position, created_at: new Date().toISOString() };
    const { data: result, error } = await supabase.from('course_modules').insert(data).select().single();
    if (error) throw new Error(error.message);
    return { ...result, lessons: [] } as CourseModule;
  },

  async update(id: string, data: Partial<CourseModule>): Promise<void> {
    const { error } = await supabase.from('course_modules').update(stripNulls(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const lessons = await lessonsService.getByModuleId(id);
    for (const les of lessons) {
      await lessonsService.delete(les.id);
    }
    const { error } = await supabase.from('course_modules').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async reorder(modules: { id: string; position: number }[]): Promise<void> {
    for (const item of modules) {
      await supabase.from('course_modules').update({ position: item.position }).eq('id', item.id);
    }
  },
};

export const lessonsService = {
  async getByModuleId(moduleId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase.from('lessons').select('*').eq('module_id', moduleId);
      if (error) throw error;

      const lessons = (data || []) as Lesson[];
      lessons.sort((a, b) => (a.position || 0) - (b.position || 0));
      return lessons;
    } catch (err: any) {
      console.error('Could not load lessons:', err?.message || err);
      return [];
    }
  },

  async create(data: Omit<Lesson, 'id'>): Promise<Lesson> {
    const lessonData = {
      ...stripNulls(data),
      preview_enabled: data.preview_enabled ?? false,
      completion_required: data.completion_required ?? true,
      created_at: new Date().toISOString(),
    };
    const { data: result, error } = await supabase.from('lessons').insert(lessonData).select().single();
    if (error) throw new Error(error.message);
    return result as Lesson;
  },

  async update(id: string, data: Partial<Lesson>): Promise<void> {
    const { error } = await supabase.from('lessons').update(stripNulls(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async reorder(lessons: { id: string; position: number }[]): Promise<void> {
    for (const item of lessons) {
      await supabase.from('lessons').update({ position: item.position }).eq('id', item.id);
    }
  },
};

// ---------------------------------------------------------------------------
// 4. USERS & PROFILES SERVICE
// ---------------------------------------------------------------------------
export const usersService = {
  async getProfile(uid: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, created_at: sanitizeTimestamp(data.created_at) } as Profile;
    } catch (err: any) {
      console.warn(`Could not fetch profile ${uid}:`, err?.message || err);
      return null;
    }
  },

  async createOrUpdateProfile(uid: string, data: Partial<Profile>): Promise<Profile> {
    const now = new Date().toISOString();
    const profile: Partial<Profile> = {
      id: uid,
      email: data.email || '',
      full_name: data.full_name || 'Elèv Kominote',
      role: data.role || 'student',
      avatar_url: data.avatar_url || '',
      headline: data.headline || '',
      bio: data.bio || '',
      created_at: data.created_at || now,
      updated_at: now,
      ...data,
    };

    try {
      const { data: result, error } = await supabase.from('profiles').upsert(profile).select().single();
      if (error) throw error;
      return result as Profile;
    } catch (err: any) {
      console.warn(`Could not upsert profile ${uid}:`, err?.message || err);
      return profile as Profile;
    }
  },

  async getAll(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return (data || []) as Profile[];
    } catch (err) {
      console.error('Could not load users:', err);
      return [];
    }
  },

  async getInstructors(): Promise<Profile[]> {
    try {
      const { data: instructors, error: err1 } = await supabase.from('profiles').select('*').eq('role', 'instructor');
      if (err1) throw err1;

      const { data: admins, error: err2 } = await supabase.from('profiles').select('*').eq('role', 'admin');
      if (err2) throw err2;

      const combined = [...(instructors || [])];
      for (const a of (admins || [])) {
        if (!combined.some((i) => i.id === a.id)) {
          combined.push(a);
        }
      }
      return combined as Profile[];
    } catch (err: any) {
      console.error('Could not load instructors:', err?.message || err);
      return [];
    }
  },

  async getStudents(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student');
      if (error) throw error;
      return (data || []) as Profile[];
    } catch (err) {
      console.error('Could not load students:', err);
      return [];
    }
  },

  async createInstructor(data: {
    full_name: string;
    email: string;
    headline?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<Profile> {
    const profile = {
      full_name: data.full_name,
      email: data.email,
      role: 'instructor',
      headline: data.headline || 'Enstriktè Otorize pa Wanky',
      bio: data.bio || 'Pwofesyonèl seleksyone pa administrasyon Kominote Online.',
      avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };
    const { data: result, error } = await supabase.from('profiles').insert(profile).select().single();
    if (error) throw new Error(error.message);
    return result as Profile;
  },
};

// ---------------------------------------------------------------------------
// 5. ENROLLMENTS & LESSON PROGRESS
// ---------------------------------------------------------------------------
export const enrollmentsService = {
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase.from('enrollments').select('*').eq('student_id', studentId);
      if (error) throw error;

      const enrollments = (data || []) as Enrollment[];
      for (const e of enrollments) {
        const c = await coursesService.getBySlugOrId(e.course_id);
        if (c) e.course = c;
      }
      return enrollments;
    } catch (err) {
      console.error('Could not load enrollments:', err);
      return [];
    }
  },

  async getEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();
      if (error) throw error;
      return data as Enrollment | null;
    } catch (err) {
      console.error('Could not check enrollment:', err);
      return null;
    }
  },

  async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      const existing = await this.getEnrollment(studentId, courseId);
      if (existing) return existing;

      const { data, error } = await supabase.from('enrollments').insert({
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        completed_lessons_count: 0,
        total_required_lessons_count: 0,
      }).select().single();

      if (error) throw error;

      try {
        const course = await coursesService.getBySlugOrId(courseId);
        if (course) {
          await coursesService.update(course.id, {
            students_count: (course.students_count || 0) + 1,
          });
        }
      } catch { /* non-blocking */ }

      return data as Enrollment;
    } catch (err: any) {
      console.error('Enrollment error:', err);
      throw err;
    }
  },

  async getAll(): Promise<Enrollment[]> {
    try {
      const { data, error } = await supabase.from('enrollments').select('*');
      if (error) throw error;

      const enrollments = (data || []) as Enrollment[];
      const [allCourses, allUsers] = await Promise.all([
        coursesService.getAll(),
        usersService.getAll(),
      ]);

      const courseMap = new Map(allCourses.map((c) => [c.id, c]));
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      return enrollments.map((e) => ({
        ...e,
        course: courseMap.get(e.course_id),
        student: userMap.get(e.student_id),
      }));
    } catch (err) {
      console.error('Could not load all enrollments:', err);
      return [];
    }
  },

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    const enr = await this.getEnrollment(studentId, courseId);
    return enr !== null;
  },

  async unenroll(enrollmentId: string): Promise<void> {
    const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
    if (error) throw new Error(error.message);
  },
};

export const progressService = {
  async getStudentProgressForCourse(studentId: string, courseId: string): Promise<Record<string, LessonProgress>> {
    try {
      const { data, error } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId);
      if (error) throw error;

      const map: Record<string, LessonProgress> = {};
      (data || []).forEach((d: any) => {
        map[d.lesson_id] = d as LessonProgress;
      });
      return map;
    } catch (err) {
      console.error('Could not load progress:', err);
      return {};
    }
  },

  async recordProgress(
    studentId: string,
    courseId: string,
    lessonId: string,
    watchPercentage: number,
    forceCompleted = false
  ): Promise<{
    completed: boolean;
    courseProgressPercentage: number;
    certificateIssued: boolean;
    certificateId?: string;
  }> {
    try {
      const isCompleted = forceCompleted || watchPercentage >= 90;

      // Check existing progress
      const { data: existing } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('student_id', studentId)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const prevWatch = existing?.watch_percentage || 0;
      const prevCompleted = existing?.completed || false;
      const newWatch = Math.min(100, Math.max(prevWatch, Math.round(watchPercentage)));
      const nowCompleted = prevCompleted || isCompleted;

      const progressData = {
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        watch_percentage: newWatch,
        completed: nowCompleted,
        completed_at: (isCompleted && !prevCompleted) ? new Date().toISOString() : existing?.completed_at || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from('lesson_progress').update(progressData).eq('id', existing.id);
      } else {
        await supabase.from('lesson_progress').insert(progressData);
      }

      // Recalculate course progress
      const course = await coursesService.getBySlugOrId(courseId);
      const allLessons: Lesson[] = [];
      course?.modules?.forEach((m) => {
        m.lessons?.forEach((l) => allLessons.push(l));
      });

      const requiredLessons = allLessons.filter((l) => l.completion_required !== false);
      const totalRequired = requiredLessons.length > 0 ? requiredLessons.length : allLessons.length;
      const studentProgressMap = await this.getStudentProgressForCourse(studentId, courseId);
      let completedCount = 0;
      const targetLessons = requiredLessons.length > 0 ? requiredLessons : allLessons;
      for (const les of targetLessons) {
        if (studentProgressMap[les.id]?.completed || (les.id === lessonId && isCompleted)) {
          completedCount++;
        }
      }

      const calculatedPct = totalRequired > 0 ? Math.min(100, Math.round((completedCount / totalRequired) * 100)) : 100;

      const enrollment = await enrollmentsService.getEnrollment(studentId, courseId);
      let certIssued = false;
      let certId: string | undefined;

      if (enrollment) {
        const updateData: any = {
          progress_percentage: calculatedPct,
          completed_lessons_count: completedCount,
          total_required_lessons_count: totalRequired,
        };

        if (calculatedPct === 100 && enrollment.status !== 'completed') {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        }

        await supabase.from('enrollments').update(updateData).eq('id', enrollment.id);

        if (calculatedPct === 100 && course?.certificate_enabled !== false) {
          const cert = await certificatesService.getOrCreateCertificate(studentId, course);
          certIssued = true;
          certId = cert.certificate_id;
        }
      }

      return {
        completed: isCompleted,
        courseProgressPercentage: calculatedPct,
        certificateIssued: certIssued,
        certificateId: certId,
      };
    } catch (err) {
      console.error('Could not record progress:', err);
      throw err;
    }
  },
};

// ---------------------------------------------------------------------------
// 6. CERTIFICATES SERVICE
// ---------------------------------------------------------------------------
export const certificatesService = {
  async getByUniqueId(certIdOrDocId: string): Promise<Certificate | null> {
    try {
      const { data: byId, error: err1 } = await supabase.from('certificates').select('*').eq('id', certIdOrDocId).maybeSingle();
      if (err1) throw err1;
      if (byId) return byId as Certificate;

      const { data: byCode, error: err2 } = await supabase.from('certificates').select('*').eq('certificate_id', certIdOrDocId).maybeSingle();
      if (err2) throw err2;
      return byCode as Certificate | null;
    } catch (err) {
      console.error('Could not fetch certificate:', err);
      return null;
    }
  },

  async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase.from('certificates').select('*').eq('student_id', studentId);
      if (error) throw error;
      return (data || []) as Certificate[];
    } catch (err) {
      console.error('Could not load certificates:', err);
      return [];
    }
  },

  async getAll(): Promise<Certificate[]> {
    try {
      const { data, error } = await supabase.from('certificates').select('*');
      if (error) throw error;
      return (data || []) as Certificate[];
    } catch (err) {
      console.error('Could not load certificates:', err);
      return [];
    }
  },

  async getOrCreateCertificate(studentId: string, course: Course): Promise<Certificate> {
    try {
      const { data: existing, error: err1 } = await supabase
        .from('certificates')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', course.id)
        .maybeSingle();
      if (err1) throw err1;
      if (existing) return existing as Certificate;

      const studentProfile = await usersService.getProfile(studentId);
      const studentName = studentProfile?.full_name || 'Elèv Kominote Online';
      const instructorName = course.instructor?.full_name || 'Wanky';

      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueCertId = `KO-${new Date().getFullYear()}-${randomSuffix}`;
      const verificationUrl = `${window.location.origin}/verify/${uniqueCertId}`;

      const newCertData = {
        certificate_id: uniqueCertId,
        student_id: studentId,
        student_name: studentName,
        course_id: course.id,
        course_title: course.title,
        instructor_name: instructorName,
        completion_date: new Date().toLocaleDateString('ht-HT', { year: 'numeric', month: 'long', day: 'numeric' }),
        verification_url: verificationUrl,
        created_at: new Date().toISOString(),
      };

      const { data: result, error: err2 } = await supabase.from('certificates').insert(newCertData).select().single();
      if (err2) throw err2;
      return result as Certificate;
    } catch (err) {
      console.error('Could not create certificate:', err);
      throw err;
    }
  },
};

// ---------------------------------------------------------------------------
// 7. ABOUT PAGE CMS & TEAM MEMBERS
// ---------------------------------------------------------------------------
export const aboutService = {
  async getContent(): Promise<AboutPageCMS> {
    try {
      const { data, error } = await supabase.from('about_page').select('*').eq('id', 'main').maybeSingle();
      if (error) throw error;
      if (data) return data as AboutPageCMS;
    } catch (err: any) {
      console.error('Could not read about page:', err?.message || err);
    }
    return {
      id: 'main',
      title: 'About Us',
      description: '',
      mission: '',
      vision: '',
    };
  },

  async saveContent(data: Partial<AboutPageCMS>): Promise<void> {
    const { error } = await supabase.from('about_page').upsert({
      id: 'main',
      ...stripNulls(data),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },

  async getTeamMembers(onlyActive = true): Promise<TeamMember[]> {
    try {
      let query = supabase.from('team_members').select('*');
      if (onlyActive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;

      const members = (data || []) as TeamMember[];
      members.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      return members;
    } catch (err: any) {
      console.error('Could not load team members:', err?.message || err);
      return [];
    }
  },

  async createTeamMember(data: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    const { data: result, error } = await supabase.from('team_members').insert({
      ...stripNulls(data),
      is_active: data.is_active ?? true,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return result as TeamMember;
  },

  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<void> {
    const { error } = await supabase.from('team_members').update(stripNulls(data)).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteTeamMember(id: string): Promise<void> {
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 8. SITE SETTINGS SERVICE
// ---------------------------------------------------------------------------
export const siteSettingsService = {
  async getSettings(): Promise<SiteSettings> {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').eq('id', 'general').maybeSingle();
      if (error) throw error;
      if (data) return data as SiteSettings;
    } catch (err: any) {
      console.warn('Could not read site settings:', err?.message || err);
    }
    return {
      id: 'general',
      site_name: 'Kominote Online',
      contact_email: 'support@kominote.online',
      contact_phone: '+509 3700-0000',
      announcement: 'Byenvini sou Kominote Online — Platfòm prive Wanky pou fòmasyon gran nivo!',
    };
  },

  async saveSettings(data: Partial<SiteSettings>): Promise<void> {
    const { error } = await supabase.from('site_settings').upsert({
      id: 'general',
      ...stripNulls(data),
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 9. ORDERS SERVICE
// ---------------------------------------------------------------------------
export const ordersService = {
  async getAll(): Promise<Order[]> {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      console.error('Could not load orders:', err);
      return [];
    }
  },

  async getStudentOrders(studentId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', studentId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Order[];
    } catch (err) {
      console.error('Could not load student orders:', err);
      return [];
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (error) throw error;
      return data as Order | null;
    } catch (err) {
      console.error('Could not fetch order:', err);
      return null;
    }
  },

  async refundOrder(orderId: string, revokeAccess: boolean = false, reason?: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAccess, refundReason: reason }),
      });
      const data = await response.json();
      return !!data.success;
    } catch (err) {
      console.error('Error issuing refund:', err);
      return false;
    }
  },
};

// ---------------------------------------------------------------------------
// 12. DIGITAL PRODUCTS SERVICE
// ---------------------------------------------------------------------------
export const productsService = {
  async getAll(publishedOnly = false): Promise<DigitalProduct[]> {
    try {
      let query = supabase.from('products').select('*');
      if (publishedOnly) query = query.eq('status', 'published');
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DigitalProduct[];
    } catch (err: any) {
      console.error('Could not load products:', err?.message || err);
      return [];
    }
  },

  async getBySlug(slug: string): Promise<DigitalProduct | null> {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as DigitalProduct | null;
    } catch (err: any) {
      console.error(`Could not read product by slug "${slug}":`, err?.message || err);
      return null;
    }
  },

  async getById(id: string): Promise<DigitalProduct | null> {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as DigitalProduct | null;
    } catch (err: any) {
      console.error(`Could not read product by id "${id}":`, err?.message || err);
      return null;
    }
  },

  async create(data: Omit<DigitalProduct, 'id'>): Promise<DigitalProduct> {
    const timestamp = new Date().toISOString();
    const { data: result, error } = await supabase.from('products').insert({
      ...stripNulls(data),
      created_at: timestamp,
      updated_at: timestamp,
    }).select().single();
    if (error) throw new Error(error.message);
    return result as DigitalProduct;
  },

  async update(id: string, data: Partial<DigitalProduct>): Promise<void> {
    const { error } = await supabase.from('products').update({
      ...stripNulls(data),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 13. PRODUCT CATEGORIES SERVICE
// ---------------------------------------------------------------------------
export const productCategoriesService = {
  async getAll(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase.from('product_categories').select('*');
      if (error) throw error;
      return (data || []) as ProductCategory[];
    } catch (err: any) {
      console.error('Could not load product categories:', err?.message || err);
      return [];
    }
  },

  async create(data: Omit<ProductCategory, 'id'>): Promise<ProductCategory> {
    const { data: result, error } = await supabase.from('product_categories').insert({
      ...stripNulls(data),
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return result as ProductCategory;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 14. PRODUCT FILES SERVICE
// ---------------------------------------------------------------------------
export const productFilesService = {
  async getByProductId(productId: string): Promise<ProductFile[]> {
    try {
      const { data, error } = await supabase.from('product_files').select('*').eq('product_id', productId);
      if (error) throw error;
      return (data || []) as ProductFile[];
    } catch (err) {
      console.warn('Error fetching product files:', err);
      return [];
    }
  },

  async create(data: Omit<ProductFile, 'id'>): Promise<ProductFile> {
    const { data: result, error } = await supabase.from('product_files').insert({
      ...stripNulls(data),
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw new Error(error.message);
    return result as ProductFile;
  },

  async delete(fileId: string): Promise<void> {
    const { error } = await supabase.from('product_files').delete().eq('id', fileId);
    if (error) throw new Error(error.message);
  },
};

// ---------------------------------------------------------------------------
// 15. SHOP ORDERS SERVICE
// ---------------------------------------------------------------------------
export const shopOrdersService = {
  async createOrder(payload: {
    userId: string;
    customerName: string;
    email: string;
    phone: string;
    country: string;
    city: string;
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: string;
    transactionReference?: string;
    paymentProofUrl?: string;
    couponCode?: string;
  }): Promise<{ success: boolean; orderId: string; orderNumber: string; trackingNumber?: string; invoiceId: string; total: number; message?: string }> {
    return createDigitalShopOrder(payload);
  },

  async getAll(): Promise<ShopOrder[]> {
    try {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ShopOrder[];
    } catch (err) {
      console.error('Could not load shop orders:', err);
      return [];
    }
  },

  async getUserOrders(userId: string): Promise<ShopOrder[]> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ShopOrder[];
    } catch (err) {
      console.error('Could not load user orders:', err);
      return [];
    }
  },

  async getById(orderId: string): Promise<ShopOrder | null> {
    try {
      const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      if (error) throw error;
      return data as ShopOrder | null;
    } catch (err) {
      console.error('Could not fetch order:', err);
      return null;
    }
  },

  async approveOrder(orderId: string, adminId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId, adminNotes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erè nan apwobasyon kòmand lan.');
    return data;
  },

  async rejectOrder(orderId: string, adminNotes?: string, adminId?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes, adminId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erè nan rejè kòmand lan.');
    return data;
  },

  async toggleDownload(orderId: string, enable: boolean, adminId?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/toggle-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable, adminId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erè chanjman aksè telechajman.');
    return data;
  },
};

// ---------------------------------------------------------------------------
// 16. INVOICES SERVICE
// ---------------------------------------------------------------------------
export const invoicesService = {
  async getById(invoiceId: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase.from('invoices').select('*').eq('invoice_number', invoiceId).maybeSingle();
      if (error) throw error;
      if (data) return data as Invoice;

      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const resData = await res.json();
        return resData.invoice || null;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching invoice:', err);
      return null;
    }
  },
};

// ---------------------------------------------------------------------------
// 17. DIGITAL ACCESS (ENTITLEMENTS) SERVICE
// ---------------------------------------------------------------------------
export const digitalAccessService = {
  async getUserEntitlements(userId: string): Promise<DigitalAccess[]> {
    try {
      const { data, error } = await supabase.from('digital_access').select('*').eq('user_id', userId).eq('active', true);
      if (error) throw error;

      const entitlements = (data || []) as DigitalAccess[];
      const enriched = await Promise.all(
        entitlements.map(async (ent) => {
          try {
            const prod = await productsService.getById((ent as any).product_id || (ent as any).productId);
            return { ...ent, product: prod || undefined };
          } catch {
            return ent;
          }
        })
      );
      return enriched;
    } catch (err) {
      console.warn('Error fetching digital entitlements:', err);
      return [];
    }
  },

  async requestSecureDownload(productId: string, userId: string): Promise<{ success: boolean; fileUrl?: string; fileName?: string; error?: string }> {
    const res = await fetch(`/api/downloads/${productId}?userId=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Aksè telechajman bloke.');
    return data;
  },
};

// ---------------------------------------------------------------------------
// 18. PAYMENT SETTINGS SERVICE
// ---------------------------------------------------------------------------
export const paymentSettingsService = {
  async getSettings(): Promise<PaymentSettings> {
    try {
      const { data, error } = await supabase.from('payment_settings').select('*').eq('id', 'general').maybeSingle();
      if (error) throw error;

      if (data?.settings) {
        const stored = data.settings as PaymentSettings;
        return {
          ...DEFAULT_PAYMENT_SETTINGS,
          ...stored,
          id: 'general',
          bankTransfer: {
            ...DEFAULT_PAYMENT_SETTINGS.bankTransfer,
            ...(stored.bankTransfer || {}),
            banks:
              stored.bankTransfer?.banks && stored.bankTransfer.banks.length > 0
                ? stored.bankTransfer.banks
                : DEFAULT_PAYMENT_SETTINGS.bankTransfer.banks,
          },
          paypal: { ...DEFAULT_PAYMENT_SETTINGS.paypal, ...(stored.paypal || {}) },
          moncash: { ...DEFAULT_PAYMENT_SETTINGS.moncash, ...(stored.moncash || {}) },
          natcash: { ...DEFAULT_PAYMENT_SETTINGS.natcash, ...(stored.natcash || {}) },
          cash: { ...DEFAULT_PAYMENT_SETTINGS.cash, ...(stored.cash || {}) },
          stripe: { ...DEFAULT_PAYMENT_SETTINGS.stripe, ...(stored.stripe || {}) },
        };
      }
      return DEFAULT_PAYMENT_SETTINGS;
    } catch {
      return DEFAULT_PAYMENT_SETTINGS;
    }
  },

  async saveSettings(settings: PaymentSettings): Promise<boolean> {
    try {
      const { error } = await supabase.from('payment_settings').upsert({
        id: 'general',
        settings: settings,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return true;
    } catch {
      const res = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      return res.ok;
    }
  },
};

// ---------------------------------------------------------------------------
// 19. COUPONS SERVICE
// ---------------------------------------------------------------------------
export const couponsService = {
  async getAll(): Promise<Coupon[]> {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        return data.coupons || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching coupons:', err);
      return [];
    }
  },

  async create(data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon | null> {
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erè nan kreyasyon kòd rabè a.');
      return result.coupon || null;
    } catch (err) {
      console.error('Error creating coupon:', err);
      throw err;
    }
  },

  async update(id: string, data: Partial<Coupon>): Promise<boolean> {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.error('Error updating coupon:', err);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (err) {
      console.error('Error deleting coupon:', err);
      return false;
    }
  },

  async validate(code: string, subtotal: number, userId: string, itemIds: string[], itemCategoryIds: string[]): Promise<CouponValidationResult> {
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, userId, itemIds, itemCategoryIds }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Error validating coupon:', err);
      return { valid: false, discountAmount: 0, originalSubtotal: subtotal, finalTotal: subtotal, message: 'Erè nan validasyon kòd rabè a.' };
    }
  },

  async getUsage(couponId: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/coupons/${couponId}/usage`);
      if (res.ok) {
        const data = await res.json();
        return data.usage || [];
      }
      return [];
    } catch (err) {
      console.error('Error fetching coupon usage:', err);
      return [];
    }
  },
};

// ---------------------------------------------------------------------------
// 20. ORDER TRACKING SERVICE
// ---------------------------------------------------------------------------
export const trackingService = {
  async trackOrder(trackingNumber: string, email: string): Promise<any | null> {
    try {
      const res = await fetch(`/api/track-order?trackingNumber=${encodeURIComponent(trackingNumber)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) return null;
      return data.order || null;
    } catch (err) {
      console.error('Error tracking order:', err);
      return null;
    }
  },

  async updateStatusNotes(orderId: string, publicStatusNote: string, adminNotes: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicStatusNote, adminNotes }),
      });
      return res.ok;
    } catch (err) {
      console.error('Error updating status notes:', err);
      return false;
    }
  },
};

// ---------------------------------------------------------------------------
// 20. COURSE REGISTRATIONS SERVICE (MANUAL PAYMENTS)
// ---------------------------------------------------------------------------
export interface CreateCourseRegistrationInput {
  courseId: string;
  courseTitle: string;
  coursePrice: number;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  paymentMethod: 'bank' | 'paypal' | 'moncash' | 'natcash' | 'bankTransfer';
  paymentMethodDetails?: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    paypalEmail?: string;
    moncashNumber?: string;
    natcashNumber?: string;
    senderPhone?: string;
  };
  transactionReference?: string;
  paymentProofUrl?: string;
  paymentProofPath?: string;
  notes?: string;
}

export const courseRegistrationsService = {
  async checkRegistrationState(studentId: string, courseId: string): Promise<{
    isEnrolled: boolean;
    hasPendingRegistration: boolean;
    pendingRegistration?: CourseRegistration;
  }> {
    try {
      const enrollment = await enrollmentsService.getEnrollment(studentId, courseId);
      const isEnrolled = !!(enrollment && enrollment.status !== 'cancelled');

      const { data: pending } = await supabase
        .from('course_registrations')
        .select('*')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .eq('payment_status', 'pending')
        .maybeSingle();

      return {
        isEnrolled,
        hasPendingRegistration: !!pending,
        pendingRegistration: pending as CourseRegistration | undefined,
      };
    } catch (err) {
      console.warn('Error checking registration state:', err);
      return { isEnrolled: false, hasPendingRegistration: false };
    }
  },

  async uploadPaymentProof(
    studentId: string,
    courseId: string,
    file: File,
    onProgress?: (percentage: number) => void
  ): Promise<{ downloadUrl: string; storagePath: string }> {
    if (!file) throw new Error('Tanpri chwazi yon fichye resi oswa prèv peman.');

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) throw new Error('Fichye a twò gwo. Gwosè maksimòm se 10MB.');

    const validExtensions = /\.(jpg|jpeg|png|webp|pdf)$/i;
    const isValidMime = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'].includes(file.type.toLowerCase());
    if (!isValidMime && !validExtensions.test(file.name)) {
      throw new Error('Fòma fichye a dwe yon imaj (JPG, PNG) oswa yon dokiman PDF.');
    }

    const cleanFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `payment-proofs/${studentId}/${courseId}/${cleanFileName}`;

    if (onProgress) onProgress(10);

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(storagePath, file, { contentType: file.type || 'application/octet-stream' });

    if (error) throw new Error('Nou pa t kapab telechaje resi a. Tanpri verifye koneksyon w epi eseye ankò.');

    if (onProgress) onProgress(80);

    const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(data.path);

    if (onProgress) onProgress(100);

    return { downloadUrl: urlData.publicUrl, storagePath: data.path };
  },

  async createRegistration(input: CreateCourseRegistrationInput): Promise<CourseRegistration> {
    const existingEnrollment = await enrollmentsService.getEnrollment(input.studentId, input.courseId);
    if (existingEnrollment && existingEnrollment.status !== 'cancelled') {
      throw new Error('Ou deja enskri nan kou sa a.');
    }

    const { data: pending } = await supabase
      .from('course_registrations')
      .select('id')
      .eq('student_id', input.studentId)
      .eq('course_id', input.courseId)
      .eq('payment_status', 'pending')
      .maybeSingle();

    if (pending) {
      throw new Error('Ou gen yon demann pou kou sa a ki deja soumèt epi k ap tann verifikasyon pa administrasyon an.');
    }

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;

    const regData = {
      course_id: input.courseId,
      course_title: input.courseTitle,
      course_price: Number(input.coursePrice) || 0,
      student_id: input.studentId,
      student_name: input.studentName || 'Elèv',
      student_email: input.studentEmail || '',
      student_phone: input.studentPhone || '',
      payment_method: input.paymentMethod,
      payment_method_details: input.paymentMethodDetails || {},
      transaction_reference: input.transactionReference || null,
      payment_proof_url: input.paymentProofUrl || null,
      payment_proof_path: input.paymentProofPath || null,
      payment_status: 'pending',
      registration_status: 'pending',
      invoice_id: invoiceId,
      notes: input.notes || null,
    };

    const { data: result, error } = await supabase.from('course_registrations').insert(regData).select().single();
    if (error) throw new Error(error.message);

    try {
      await supabase.from('invoices').insert({
        invoice_number: invoiceId,
        order_id: result.id,
        user_id: input.studentId,
        customer_name: input.studentName,
        customer_email: input.studentEmail,
        customer_phone: input.studentPhone,
        items: [{
          id: input.courseId,
          title: input.courseTitle,
          price: Number(input.coursePrice) || 0,
          quantity: 1,
          total: Number(input.coursePrice) || 0,
        }],
        subtotal: Number(input.coursePrice) || 0,
        total: Number(input.coursePrice) || 0,
        currency: 'USD',
        payment_method: input.paymentMethod,
        payment_status: 'pending',
      });
    } catch (invErr) {
      console.warn('Could not auto-create invoice:', invErr);
    }

    return result as unknown as CourseRegistration;
  },

  async getAll(): Promise<CourseRegistration[]> {
    try {
      const { data, error } = await supabase.from('course_registrations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CourseRegistration[];
    } catch (err) {
      console.error('Could not load registrations:', err);
      return [];
    }
  },

  async getStudentRegistrations(studentId: string): Promise<CourseRegistration[]> {
    try {
      const { data, error } = await supabase.from('course_registrations').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CourseRegistration[];
    } catch (err) {
      console.error('Could not load student registrations:', err);
      return [];
    }
  },

  async getById(registrationId: string): Promise<CourseRegistration | null> {
    try {
      const { data, error } = await supabase.from('course_registrations').select('*').eq('id', registrationId).maybeSingle();
      if (error) throw error;
      return data as unknown as CourseRegistration | null;
    } catch (err) {
      console.error('Could not fetch registration:', err);
      return null;
    }
  },

  async approveRegistration(registrationId: string, adminUid: string): Promise<{ success: boolean; enrollmentId: string }> {
    const { data: reg, error: regErr } = await supabase.from('course_registrations').select('*').eq('id', registrationId).maybeSingle();
    if (regErr) throw regErr;
    if (!reg) throw new Error('Enskripsyon sa a pa egziste.');

    await supabase.from('course_registrations').update({
      payment_status: 'paid',
      registration_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUid,
      updated_at: new Date().toISOString(),
    }).eq('id', registrationId);

    if (reg.invoice_id) {
      try {
        await supabase.from('invoices').update({
          payment_status: 'paid',
        }).eq('invoice_number', reg.invoice_id);
      } catch { /* non-blocking */ }
    }

    const existingEnrollment = await enrollmentsService.getEnrollment(reg.student_id, reg.course_id);
    let enrollmentId = '';

    if (existingEnrollment) {
      enrollmentId = existingEnrollment.id;
      await supabase.from('enrollments').update({
        status: 'active',
      }).eq('id', existingEnrollment.id);
    } else {
      const { data: newEnr, error: enrErr } = await supabase.from('enrollments').insert({
        student_id: reg.student_id,
        course_id: reg.course_id,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        completed_lessons_count: 0,
        total_required_lessons_count: 0,
      }).select().single();

      if (enrErr) throw enrErr;
      enrollmentId = newEnr.id;

      try {
        const course = await coursesService.getBySlugOrId(reg.course_id);
        if (course) {
          await coursesService.update(course.id, {
            students_count: (course.students_count || 0) + 1,
          });
        }
      } catch { /* non-blocking */ }
    }

    return { success: true, enrollmentId };
  },

  async rejectRegistration(registrationId: string, adminUid: string, reason?: string): Promise<void> {
    await supabase.from('course_registrations').update({
      payment_status: 'failed',
      registration_status: 'rejected',
      notes: reason || 'Rejte pa administrasyon an',
      updated_at: new Date().toISOString(),
    }).eq('id', registrationId);

    const { data: reg } = await supabase.from('course_registrations').select('invoice_id').eq('id', registrationId).maybeSingle();
    if (reg?.invoice_id) {
      try {
        await supabase.from('invoices').update({ payment_status: 'failed' }).eq('invoice_number', reg.invoice_id);
      } catch { /* non-blocking */ }
    }
  },
};
