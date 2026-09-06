import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Course,
  CourseModule,
  Lesson,
  Category,
  Profile,
  Enrollment,
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
  PaymentSettings
} from '../types/database';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_COURSES,
  DEFAULT_INSTRUCTORS,
  DEFAULT_PRODUCT_CATEGORIES,
  DEFAULT_DIGITAL_PRODUCTS
} from '../data/defaultCatalog';
import { DEFAULT_PAYMENT_SETTINGS } from '../data/defaultPaymentSettings';
import { DEFAULT_FOUNDER_MEMBER, DEFAULT_TEAM_MEMBERS } from '../data/defaultTeamMembers';

// Helper to convert Firestore Timestamps to ISO strings
function sanitizeTimestamp(val: any): string {
  if (!val) return new Date().toISOString();
  if (val.toDate && typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

// ---------------------------------------------------------------------------
// 1. CATEGORIES SERVICE
// ---------------------------------------------------------------------------
export const categoriesService = {
  async getAll(): Promise<Category[]> {
    try {
      const colRef = collection(db, 'categories');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Category[];
      }
    } catch (err: any) {
      console.warn('Categories query from Firestore unavailable, utilizing default catalog:', err?.message || err);
    }

    try {
      const saved = localStorage.getItem('kominote_local_categories');
      if (saved) {
        return [...DEFAULT_CATEGORIES, ...JSON.parse(saved)];
      }
    } catch {
      // ignore
    }

    return DEFAULT_CATEGORIES;
  },

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    try {
      const colRef = collection(db, 'categories');
      const docRef = await addDoc(colRef, {
        ...data,
        created_at: new Date().toISOString(),
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      // If Firestore denies permission, store locally
      const localId = `cat-${Date.now()}`;
      const newCat: Category = { id: localId, ...data };
      try {
        const saved = localStorage.getItem('kominote_local_categories');
        const list = saved ? JSON.parse(saved) : [];
        list.push(newCat);
        localStorage.setItem('kominote_local_categories', JSON.stringify(list));
      } catch {
        // ignore
      }
      return newCat;
    }
  },

  async update(id: string, data: Partial<Category>): Promise<void> {
    try {
      const docRef = doc(db, 'categories', id);
      await updateDoc(docRef, data);
    } catch (err) {
      try {
        const saved = localStorage.getItem('kominote_local_categories');
        if (saved) {
          const list: Category[] = JSON.parse(saved);
          const idx = list.findIndex(c => c.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...data };
            localStorage.setItem('kominote_local_categories', JSON.stringify(list));
          }
        }
      } catch {}
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'categories', id);
      await deleteDoc(docRef);
    } catch (err) {
      try {
        const saved = localStorage.getItem('kominote_local_categories');
        if (saved) {
          const list: Category[] = JSON.parse(saved);
          const filtered = list.filter(c => c.id !== id);
          localStorage.setItem('kominote_local_categories', JSON.stringify(filtered));
        }
      } catch {}
    }
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
    let rawCourses: Course[] = [];

    try {
      const colRef = collection(db, 'courses');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        rawCourses = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          created_at: sanitizeTimestamp(d.data().created_at),
        })) as Course[];
      }
    } catch (err: any) {
      console.warn('Firestore courses query unavailable, utilizing default course catalog:', err?.message || err);
    }

    // Fallback to DEFAULT_COURSES + locally created courses if Firestore returned 0 items
    if (rawCourses.length === 0) {
      let localCourses: Course[] = [];
      try {
        const saved = localStorage.getItem('kominote_local_courses');
        if (saved) {
          localCourses = JSON.parse(saved);
        }
      } catch {
        // ignore
      }
      rawCourses = [...DEFAULT_COURSES, ...localCourses];
    }

    let courses = [...rawCourses];

    // Filter by published status if requested
    if (options?.publishedOnly) {
      courses = courses.filter((c) => c.status === 'published');
    }

    // Filter by category slug if provided
    if (options?.categorySlug && options.categorySlug !== 'tout' && options.categorySlug !== 'all') {
      const cats = await categoriesService.getAll();
      const matchedCat = cats.find((cat) => cat.slug === options.categorySlug || cat.id === options.categorySlug);
      if (matchedCat) {
        courses = courses.filter((c) => c.category_id === matchedCat.id || c.category?.slug === options.categorySlug);
      }
    }

    // Filter by instructor
    if (options?.instructorId) {
      courses = courses.filter((c) => c.instructor_id === options.instructorId);
    }

    // Filter by search query
    if (options?.searchQuery && options.searchQuery.trim() !== '') {
      const q = options.searchQuery.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.short_description?.toLowerCase().includes(q)
      );
    }

    // Join categories and instructors
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
      const colRef = collection(db, 'courses');
      const snap = await getDocs(colRef);
      const courseDoc = snap.docs.find((d) => d.id === slugOrId || d.data().slug === slugOrId);

      if (courseDoc) {
        const courseData = {
          id: courseDoc.id,
          ...courseDoc.data(),
          created_at: sanitizeTimestamp(courseDoc.data().created_at),
        } as Course;

        // Join Category
        if (courseData.category_id) {
          try {
            const catDoc = await getDoc(doc(db, 'categories', courseData.category_id));
            if (catDoc.exists()) {
              courseData.category = { id: catDoc.id, ...catDoc.data() } as Category;
            }
          } catch {
            // ignore join error
          }
        }

        // Join Instructor
        if (courseData.instructor_id) {
          try {
            const instDoc = await getDoc(doc(db, 'users', courseData.instructor_id));
            if (instDoc.exists()) {
              courseData.instructor = { id: instDoc.id, ...instDoc.data() } as Profile;
            }
          } catch {
            // ignore join error
          }
        }

        // Load Modules & Lessons
        const modules = await modulesService.getByCourseId(courseData.id);
        courseData.modules = modules;
        courseData.sections = modules; // compatibility alias

        const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);
        courseData.total_lessons = totalLessons || courseData.total_lessons || 0;

        return courseData;
      }
    } catch (err) {
      console.warn('Could not fetch course directly from Firestore, checking default catalog:', err);
    }

    // Fallback to default catalog + local storage
    let allCourses = [...DEFAULT_COURSES];
    try {
      const saved = localStorage.getItem('kominote_local_courses');
      if (saved) {
        allCourses = [...allCourses, ...JSON.parse(saved)];
      }
    } catch {
      // ignore
    }

    const found = allCourses.find((c) => c.id === slugOrId || c.slug === slugOrId);
    if (found) {
      const modules = await modulesService.getByCourseId(found.id);
      return {
        ...found,
        modules: modules.length > 0 ? modules : found.modules || [],
        sections: modules.length > 0 ? modules : found.modules || [],
        total_lessons: found.total_lessons || (found.modules ? found.modules.reduce((a, m) => a + (m.lessons?.length || 0), 0) : 0),
      };
    }

    return null;
  },

  async create(data: Omit<Course, 'id' | 'created_at' | 'students_count' | 'rating' | 'total_lessons'>): Promise<Course> {
    const newCourse = {
      ...data,
      rating: 5.0,
      students_count: 0,
      total_lessons: 0,
      duration_hours: data.duration_hours || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const colRef = collection(db, 'courses');
      const docRef = await addDoc(colRef, newCourse);
      return { id: docRef.id, ...newCourse };
    } catch (err) {
      const localId = `course-${Date.now()}`;
      const courseWithId = { id: localId, ...newCourse };
      try {
        const saved = localStorage.getItem('kominote_local_courses');
        const list = saved ? JSON.parse(saved) : [];
        list.push(courseWithId);
        localStorage.setItem('kominote_local_courses', JSON.stringify(list));
      } catch {
        // ignore
      }
      return courseWithId;
    }
  },

  async update(id: string, data: Partial<Course>): Promise<void> {
    try {
      const docRef = doc(db, 'courses', id);
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      try {
        const saved = localStorage.getItem('kominote_local_courses');
        if (saved) {
          const list: Course[] = JSON.parse(saved);
          const idx = list.findIndex(c => c.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() };
            localStorage.setItem('kominote_local_courses', JSON.stringify(list));
          }
        }
      } catch {}
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const modules = await modulesService.getByCourseId(id);
      for (const mod of modules) {
        await modulesService.delete(mod.id);
      }
      const docRef = doc(db, 'courses', id);
      await deleteDoc(docRef);
    } catch (err) {
      try {
        const saved = localStorage.getItem('kominote_local_courses');
        if (saved) {
          const list: Course[] = JSON.parse(saved);
          const filtered = list.filter(c => c.id !== id);
          localStorage.setItem('kominote_local_courses', JSON.stringify(filtered));
        }
      } catch {}
    }
  },

  async getCurriculum(courseId: string): Promise<{ module: CourseModule; lessons: Lesson[] }[]> {
    try {
      const modules = await modulesService.getByCourseId(courseId);
      return modules.map((m) => ({
        module: m,
        lessons: m.lessons || [],
      }));
    } catch {
      return [];
    }
  },
};

// ---------------------------------------------------------------------------
// 3. COURSE MODULES & LESSONS SERVICE
// ---------------------------------------------------------------------------
export const modulesService = {
  async getByCourseId(courseId: string): Promise<CourseModule[]> {
    try {
      const q = query(
        collection(db, 'courseModules'),
        where('course_id', '==', courseId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const modules = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as CourseModule[];

        // Sort modules by position
        modules.sort((a, b) => a.position - b.position);

        // Fetch lessons for each module
        for (const mod of modules) {
          mod.lessons = await lessonsService.getByModuleId(mod.id);
        }

        return modules;
      }
    } catch (err: any) {
      console.warn('Could not query courseModules from Firestore:', err?.message || err);
    }

    // Fallback to default catalog course modules if available
    const defaultCourse = DEFAULT_COURSES.find((c) => c.id === courseId || c.slug === courseId);
    if (defaultCourse?.modules && defaultCourse.modules.length > 0) {
      return defaultCourse.modules;
    }
    return [];
  },

  async create(courseId: string, title: string, position: number): Promise<CourseModule> {
    const data = {
      course_id: courseId,
      title,
      position,
      created_at: new Date().toISOString(),
    };
    try {
      const colRef = collection(db, 'courseModules');
      const docRef = await addDoc(colRef, data);
      return { id: docRef.id, ...data, lessons: [] };
    } catch (err) {
      return { id: `mod-${Date.now()}`, ...data, lessons: [] };
    }
  },

  async update(id: string, data: Partial<CourseModule>): Promise<void> {
    try {
      const docRef = doc(db, 'courseModules', id);
      await updateDoc(docRef, data);
    } catch (err) {
      // ignore
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const lessons = await lessonsService.getByModuleId(id);
      for (const les of lessons) {
        await lessonsService.delete(les.id);
      }
      const docRef = doc(db, 'courseModules', id);
      await deleteDoc(docRef);
    } catch (err) {
      // ignore
    }
  },

  async reorder(modules: { id: string; position: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of modules) {
        const docRef = doc(db, 'courseModules', item.id);
        batch.update(docRef, { position: item.position });
      }
      await batch.commit();
    } catch (err) {
      // ignore
    }
  },
};

export const lessonsService = {
  async getByModuleId(moduleId: string): Promise<Lesson[]> {
    try {
      const q = query(
        collection(db, 'lessons'),
        where('module_id', '==', moduleId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const lessons = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          is_preview: d.data().preview_enabled ?? d.data().is_preview ?? false,
        })) as Lesson[];

        lessons.sort((a, b) => a.position - b.position);
        return lessons;
      }
    } catch (err: any) {
      console.warn('Could not query lessons from Firestore:', err?.message || err);
    }

    // Fallback to default catalog lessons
    for (const c of DEFAULT_COURSES) {
      const mod = c.modules?.find((m) => m.id === moduleId);
      if (mod?.lessons && mod.lessons.length > 0) {
        return mod.lessons;
      }
    }
    return [];
  },

  async create(data: Omit<Lesson, 'id'>): Promise<Lesson> {
    const lessonData = {
      ...data,
      preview_enabled: data.preview_enabled ?? false,
      completion_required: data.completion_required ?? true,
      created_at: new Date().toISOString(),
    };
    try {
      const colRef = collection(db, 'lessons');
      const docRef = await addDoc(colRef, lessonData);
      return { id: docRef.id, ...data };
    } catch (err) {
      return { id: `les-${Date.now()}`, ...data };
    }
  },

  async update(id: string, data: Partial<Lesson>): Promise<void> {
    try {
      const docRef = doc(db, 'lessons', id);
      await updateDoc(docRef, data);
    } catch (err) {
      // ignore
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'lessons', id);
      await deleteDoc(docRef);
    } catch (err) {
      // ignore
    }
  },

  async reorder(lessons: { id: string; position: number }[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const item of lessons) {
        const docRef = doc(db, 'lessons', item.id);
        batch.update(docRef, { position: item.position });
      }
      await batch.commit();
    } catch (err) {
      // ignore
    }
  },
};

// ---------------------------------------------------------------------------
// 4. USERS & PROFILES SERVICE
// ---------------------------------------------------------------------------
export const usersService = {
  async getProfile(uid: string): Promise<Profile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Profile;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }
  },

  async createOrUpdateProfile(uid: string, data: Partial<Profile>): Promise<Profile> {
    try {
      const docRef = doc(db, 'users', uid);
      const newProfile: Profile = {
        id: uid,
        email: data.email || '',
        full_name: data.full_name || 'Itilizatè Kominote',
        role: data.role || 'student',
        avatar_url: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        headline: data.headline || '',
        bio: data.bio || '',
        created_at: new Date().toISOString(),
        ...data,
        updated_at: new Date().toISOString(),
      };
      await setDoc(docRef, newProfile, { merge: true });
      return newProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  },

  async getAll(): Promise<Profile[]> {
    try {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Profile[];
    } catch (err) {
      return [...DEFAULT_INSTRUCTORS];
    }
  },

  async getInstructors(): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'instructor'));
      const snap = await getDocs(q);
      const instructors = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Profile[];
      
      // Also include admin (Wanky) as instructor if not present
      const adminQ = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminSnap = await getDocs(adminQ);
      const admins = adminSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Profile[];

      const combined = [...instructors];
      for (const a of admins) {
        if (!combined.some((i) => i.id === a.id)) {
          combined.push(a);
        }
      }
      if (combined.length > 0) {
        return combined;
      }
    } catch (err: any) {
      console.warn('Listing instructors from Firestore unavailable, utilizing default instructors:', err?.message || err);
    }
    return DEFAULT_INSTRUCTORS;
  },

  async getStudents(): Promise<Profile[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Profile[];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users(role=student)');
    }
  },

  async createInstructor(data: {
    full_name: string;
    email: string;
    headline?: string;
    bio?: string;
    avatar_url?: string;
  }): Promise<Profile> {
    try {
      const customId = `inst-${Date.now()}`;
      const docRef = doc(db, 'users', customId);
      const profile: Profile = {
        id: customId,
        full_name: data.full_name,
        email: data.email,
        role: 'instructor',
        headline: data.headline || 'Enstriktè Otorize pa Wanky',
        bio: data.bio || 'Pwofesyonèl seleksyone pa administrasyon Kominote Online.',
        avatar_url:
          data.avatar_url ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      };
      await setDoc(docRef, profile);
      return profile;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users/instructor');
    }
  },
};

// ---------------------------------------------------------------------------
// 5. ENROLLMENTS & LESSON PROGRESS
// ---------------------------------------------------------------------------
export const enrollmentsService = {
  async getStudentEnrollments(studentId: string): Promise<Enrollment[]> {
    try {
      const q = query(
        collection(db, 'enrollments'),
        where('student_id', '==', studentId)
      );
      const snap = await getDocs(q);
      const enrollments = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Enrollment[];

      // Join courses
      for (const e of enrollments) {
        const c = await coursesService.getBySlugOrId(e.course_id);
        if (c) e.course = c;
      }
      return enrollments;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `enrollments(studentId=${studentId})`);
    }
  },

  async getEnrollment(studentId: string, courseId: string): Promise<Enrollment | null> {
    try {
      const q = query(
        collection(db, 'enrollments'),
        where('student_id', '==', studentId),
        where('course_id', '==', courseId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Enrollment;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `enrollments(${studentId}_${courseId})`);
    }
  },

  async enroll(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      const existing = await this.getEnrollment(studentId, courseId);
      if (existing) return existing;

      const docRef = await addDoc(collection(db, 'enrollments'), {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        completed_lessons_count: 0,
        total_required_lessons_count: 0,
      });

      // Increment student count on course
      try {
        const course = await coursesService.getBySlugOrId(courseId);
        if (course) {
          await coursesService.update(course.id, {
            students_count: (course.students_count || 0) + 1,
          });
        }
      } catch {
        // non-blocking
      }

      return {
        id: docRef.id,
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'enrollments');
    }
  },

  async getAll(): Promise<Enrollment[]> {
    try {
      const snap = await getDocs(collection(db, 'enrollments'));
      const enrollments = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Enrollment[];

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
      handleFirestoreError(err, OperationType.LIST, 'enrollments');
    }
  },

  async isEnrolled(studentId: string, courseId: string): Promise<boolean> {
    try {
      const enr = await this.getEnrollment(studentId, courseId);
      return enr !== null;
    } catch {
      return false;
    }
  },

  async unenroll(enrollmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'enrollments', enrollmentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `enrollments/${enrollmentId}`);
    }
  },
};

export const progressService = {
  async getStudentProgressForCourse(studentId: string, courseId: string): Promise<Record<string, LessonProgress>> {
    try {
      const q = query(
        collection(db, 'lessonProgress'),
        where('student_id', '==', studentId),
        where('course_id', '==', courseId)
      );
      const snap = await getDocs(q);
      const map: Record<string, LessonProgress> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as LessonProgress;
        map[data.lesson_id] = { id: d.id, ...data };
      });
      return map;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `lessonProgress(${studentId}_${courseId})`);
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
      const progressDocId = `${studentId}_${lessonId}`;
      const docRef = doc(db, 'lessonProgress', progressDocId);
      const existingSnap = await getDoc(docRef);

      const isCompleted = forceCompleted || watchPercentage >= 90;

      const progressData: Partial<LessonProgress> = {
        student_id: studentId,
        course_id: courseId,
        lesson_id: lessonId,
        watch_percentage: Math.min(100, Math.max(existingSnap.data()?.watch_percentage || 0, Math.round(watchPercentage))),
        completed: existingSnap.data()?.completed ? true : isCompleted,
        updated_at: new Date().toISOString(),
      };

      if (isCompleted && !existingSnap.data()?.completed) {
        progressData.completed_at = new Date().toISOString();
      }

      await setDoc(docRef, progressData, { merge: true });

      // Recalculate Course Progress
      // Fetch all required lessons in course
      const course = await coursesService.getBySlugOrId(courseId);
      const allLessons: Lesson[] = [];
      course?.modules?.forEach((m) => {
        m.lessons?.forEach((l) => {
          allLessons.push(l);
        });
      });

      const requiredLessons = allLessons.filter((l) => l.completion_required !== false);
      const totalRequired = requiredLessons.length > 0 ? requiredLessons.length : allLessons.length;

      // Fetch all student progress for this course
      const studentProgressMap = await this.getStudentProgressForCourse(studentId, courseId);
      let completedCount = 0;
      const targetLessons = requiredLessons.length > 0 ? requiredLessons : allLessons;
      for (const les of targetLessons) {
        if (studentProgressMap[les.id]?.completed || (les.id === lessonId && isCompleted)) {
          completedCount++;
        }
      }

      const calculatedPct = totalRequired > 0 ? Math.min(100, Math.round((completedCount / totalRequired) * 100)) : 100;

      // Update enrollment progress
      const enrollment = await enrollmentsService.getEnrollment(studentId, courseId);
      let certIssued = false;
      let certId: string | undefined = undefined;

      if (enrollment) {
        const updateData: Partial<Enrollment> = {
          progress_percentage: calculatedPct,
          completed_lessons_count: completedCount,
          total_required_lessons_count: totalRequired,
        };

        if (calculatedPct === 100 && enrollment.status !== 'completed') {
          updateData.status = 'completed';
          updateData.completed_at = new Date().toISOString();
        }

        await updateDoc(doc(db, 'enrollments', enrollment.id), updateData);

        // Check Certificate Trigger
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
      handleFirestoreError(err, OperationType.WRITE, `lessonProgress/${studentId}_${lessonId}`);
    }
  },
};

// ---------------------------------------------------------------------------
// 6. CERTIFICATES SERVICE
// ---------------------------------------------------------------------------
export const certificatesService = {
  async getByUniqueId(certIdOrDocId: string): Promise<Certificate | null> {
    try {
      // First try by doc id
      const docRef = doc(db, 'certificates', certIdOrDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Certificate;
      }

      // Then try query by certificate_id
      const q = query(
        collection(db, 'certificates'),
        where('certificate_id', '==', certIdOrDocId)
      );
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const d = qSnap.docs[0];
        return { id: d.id, ...d.data() } as Certificate;
      }

      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `certificates/${certIdOrDocId}`);
    }
  },

  async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    try {
      const q = query(
        collection(db, 'certificates'),
        where('student_id', '==', studentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Certificate[];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `certificates(studentId=${studentId})`);
    }
  },

  async getAll(): Promise<Certificate[]> {
    try {
      const snap = await getDocs(collection(db, 'certificates'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Certificate[];
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'certificates');
    }
  },

  async getOrCreateCertificate(studentId: string, course: Course): Promise<Certificate> {
    try {
      // Check if already exists
      const q = query(
        collection(db, 'certificates'),
        where('student_id', '==', studentId),
        where('course_id', '==', course.id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Certificate;
      }

      const studentProfile = await usersService.getProfile(studentId);
      const studentName = studentProfile?.full_name || 'Elèv Kominote Online';
      const instructorName = course.instructor?.full_name || 'Wanky';

      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueCertId = `KO-${new Date().getFullYear()}-${randomSuffix}`;
      const verificationUrl = `${window.location.origin}/verify/${uniqueCertId}`;

      const newCertData: Omit<Certificate, 'id'> = {
        certificate_id: uniqueCertId,
        student_id: studentId,
        student_name: studentName,
        course_id: course.id,
        course_title: course.title,
        instructor_name: instructorName,
        completion_date: new Date().toLocaleDateString('ht-HT', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        verification_url: verificationUrl,
        created_at: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'certificates'), newCertData);
      return { id: docRef.id, ...newCertData };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'certificates');
    }
  },
};

// ---------------------------------------------------------------------------
// 7. ABOUT PAGE CMS & TEAM MEMBERS
// ---------------------------------------------------------------------------
export const aboutService = {
  async getContent(): Promise<AboutPageCMS> {
    try {
      const docRef = doc(db, 'aboutPage', 'main');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as AboutPageCMS;
      }
    } catch (err: any) {
      console.warn('Could not read aboutPage from Firestore, using default content:', err?.message || err);
    }
    // Return default template
    return {
      id: 'main',
      title: 'About Us',
      description: 'Platfòm modèn dedye a fòmasyon pwofesyonèl ak pratik an Kreyòl Ayisyen, dirije pa Wanky.',
      mission: 'Bay tout Ayisyen nan peyi a ak nan dyaspora a aksè ak pi bon fòmasyon pwofesyonèl ak teknolojik nan pwòp lang manman yo pou yo ka ogmante revni yo epi bati karyè dirab.',
      vision: 'Vin pi gwo akademi fòmasyon sou entènèt an Kreyòl Ayisyen nan mond lan, kote konesans pratik transfòme an reyisit finansye ak endepandans pwofesyonèl.',
    };
  },

  async saveContent(data: Partial<AboutPageCMS>): Promise<void> {
    try {
      const docRef = doc(db, 'aboutPage', 'main');
      await setDoc(docRef, { ...data, updated_at: new Date().toISOString() }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'aboutPage/main');
    }
  },

  async getTeamMembers(onlyActive = true): Promise<TeamMember[]> {
    try {
      const snap = await getDocs(collection(db, 'teamMembers'));
      if (snap.empty) {
        // Automatically seed the real founder profile into Firestore so admin can edit it
        try {
          await setDoc(doc(db, 'teamMembers', DEFAULT_FOUNDER_MEMBER.id), DEFAULT_FOUNDER_MEMBER);
          return [DEFAULT_FOUNDER_MEMBER];
        } catch (seedErr) {
          // If Firestore direct write is restricted, try server API endpoint
          try {
            const res = await fetch(`/api/team-members${onlyActive ? '' : '?all=true'}`);
            if (res.ok) {
              const data = await res.json();
              if (data.members && data.members.length > 0) return data.members;
            }
          } catch (apiErr) {
            // ignore
          }
          return DEFAULT_TEAM_MEMBERS;
        }
      }
      let members = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TeamMember[];
      if (onlyActive) {
        members = members.filter((m) => m.is_active !== false);
      }
      members.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      return members.length > 0 ? members : (onlyActive ? [] : DEFAULT_TEAM_MEMBERS);
    } catch (err: any) {
      // Fallback to server API endpoint before static default
      try {
        const res = await fetch(`/api/team-members${onlyActive ? '' : '?all=true'}`);
        if (res.ok) {
          const data = await res.json();
          if (data.members && data.members.length > 0) return data.members;
        }
      } catch (apiErr) {
        // ignore
      }
      console.warn('Notice loading teamMembers from Firestore, using default profile:', err?.message || err);
      return DEFAULT_TEAM_MEMBERS;
    }
  },

  async createTeamMember(data: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    try {
      const docRef = await addDoc(collection(db, 'teamMembers'), {
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
      });
      const newMember = { id: docRef.id, ...data };
      // Sync with server
      fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member: newMember }),
      }).catch(() => {});
      return newMember;
    } catch (err) {
      // Try server endpoint if direct firestore fails
      try {
        const res = await fetch('/api/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member: data }),
        });
        if (res.ok) {
          const resData = await res.json();
          return resData.member;
        }
      } catch (apiErr) {
        // ignore
      }
      handleFirestoreError(err, OperationType.CREATE, 'teamMembers');
    }
  },

  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<void> {
    try {
      const docRef = doc(db, 'teamMembers', id);
      await updateDoc(docRef, data);
      // Sync with server
      fetch('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member: { id, ...data } }),
      }).catch(() => {});
    } catch (err) {
      try {
        await fetch('/api/team-members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member: { id, ...data } }),
        });
        return;
      } catch (apiErr) {
        // ignore
      }
      handleFirestoreError(err, OperationType.UPDATE, `teamMembers/${id}`);
    }
  },

  async deleteTeamMember(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teamMembers', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teamMembers/${id}`);
    }
  },
};

// ---------------------------------------------------------------------------
// 8. SITE SETTINGS SERVICE
// ---------------------------------------------------------------------------
export const siteSettingsService = {
  async getSettings(): Promise<SiteSettings> {
    try {
      const docRef = doc(db, 'siteSettings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as SiteSettings;
      }
    } catch (err: any) {
      console.warn('Could not read siteSettings from Firestore, using defaults:', err?.message || err);
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
    try {
      const docRef = doc(db, 'siteSettings', 'general');
      await setDoc(docRef, { ...data, updated_at: new Date().toISOString() }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'siteSettings/general');
    }
  },
};

// ----------------------------------------------------
// 9. ORDERS SERVICE (Stripe Orders in Firestore)
// ----------------------------------------------------
export const ordersService = {
  async getAll(): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: sanitizeTimestamp(d.data().createdAt),
      })) as Order[];
    } catch (err) {
      // Fallback if orderBy index is missing
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: sanitizeTimestamp(d.data().createdAt),
        })) as Order[];
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch (fallbackErr) {
        handleFirestoreError(fallbackErr, OperationType.LIST, 'orders');
        return [];
      }
    }
  },

  async getStudentOrders(studentId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'),
        where('studentId', '==', studentId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: sanitizeTimestamp(d.data().createdAt),
      })) as Order[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      return [];
    }
  },

  async getById(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return {
        id: snap.id,
        ...snap.data(),
        createdAt: sanitizeTimestamp(snap.data().createdAt),
      } as Order;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
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
  }
};

// ===========================================================================
// 12. DIGITAL PRODUCTS SERVICE
// ===========================================================================
export const productsService = {
  async getAll(publishedOnly = false): Promise<DigitalProduct[]> {
    let rawList: DigitalProduct[] = [];

    try {
      const colRef = collection(db, 'products');
      let q = publishedOnly
        ? query(colRef, where('status', '==', 'published'))
        : query(colRef);

      const snap = await getDocs(q);
      if (!snap.empty) {
        rawList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: sanitizeTimestamp(d.data().createdAt),
          updatedAt: sanitizeTimestamp(d.data().updatedAt),
        })) as DigitalProduct[];
      }
    } catch (err: any) {
      console.warn('Could not read products from Firestore, using default products catalog:', err?.message || err);
    }

    // Fallback: merge default digital products with any locally saved admin products
    if (rawList.length === 0) {
      let localProducts: DigitalProduct[] = [];
      try {
        const saved = localStorage.getItem('kominote_local_products');
        if (saved) {
          localProducts = JSON.parse(saved);
        }
      } catch {}

      rawList = [...DEFAULT_DIGITAL_PRODUCTS, ...localProducts];
      if (publishedOnly) {
        rawList = rawList.filter((p) => p.status === 'published');
      }
    }

    // Sort by creation date descending
    return rawList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getBySlug(slug: string): Promise<DigitalProduct | null> {
    try {
      const colRef = collection(db, 'products');
      const q = query(colRef, where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return {
          id: d.id,
          ...d.data(),
          createdAt: sanitizeTimestamp(d.data().createdAt),
          updatedAt: sanitizeTimestamp(d.data().updatedAt),
        } as DigitalProduct;
      }
    } catch (err: any) {
      console.warn(`Could not read product by slug "${slug}":`, err?.message || err);
    }

    // Fallback from full list
    const all = await this.getAll(false);
    return all.find((p) => p.slug === slug || p.id === slug) || null;
  },

  async getById(id: string): Promise<DigitalProduct | null> {
    try {
      const docRef = doc(db, 'products', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return {
          id: snap.id,
          ...snap.data(),
          createdAt: sanitizeTimestamp(snap.data().createdAt),
          updatedAt: sanitizeTimestamp(snap.data().updatedAt),
        } as DigitalProduct;
      }
    } catch (err: any) {
      console.warn(`Could not read product by id "${id}":`, err?.message || err);
    }

    // Fallback from full list
    const all = await this.getAll(false);
    return all.find((p) => p.id === id) || null;
  },

  async create(data: Omit<DigitalProduct, 'id'>): Promise<DigitalProduct> {
    const timestamp = new Date().toISOString();
    const docData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let createdId = `prod-${Date.now()}`;
    try {
      const colRef = collection(db, 'products');
      const docRef = await addDoc(colRef, docData);
      createdId = docRef.id;
    } catch (err) {
      console.warn('Notice saving product to Firestore, storing in local fallback:', err);
    }

    const createdProduct: DigitalProduct = {
      id: createdId,
      ...docData,
    } as DigitalProduct;

    // Always mirror to localStorage for resilience
    try {
      const saved = localStorage.getItem('kominote_local_products');
      const list: DigitalProduct[] = saved ? JSON.parse(saved) : [];
      list.unshift(createdProduct);
      localStorage.setItem('kominote_local_products', JSON.stringify(list));
    } catch {}

    return createdProduct;
  },

  async update(id: string, data: Partial<DigitalProduct>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Notice updating product in Firestore, updating local fallback:', err);
    }

    // Update in localStorage
    try {
      const saved = localStorage.getItem('kominote_local_products');
      if (saved) {
        let list: DigitalProduct[] = JSON.parse(saved);
        list = list.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
        localStorage.setItem('kominote_local_products', JSON.stringify(list));
      }
    } catch {}
  },

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Notice deleting product in Firestore, updating local fallback:', err);
    }

    // Remove from localStorage
    try {
      const saved = localStorage.getItem('kominote_local_products');
      if (saved) {
        const list: DigitalProduct[] = JSON.parse(saved);
        const filtered = list.filter((p) => p.id !== id);
        localStorage.setItem('kominote_local_products', JSON.stringify(filtered));
      }
    } catch {}
  },
};

// ===========================================================================
// 13. PRODUCT CATEGORIES SERVICE
// ===========================================================================
export const productCategoriesService = {
  async getAll(): Promise<ProductCategory[]> {
    let rawList: ProductCategory[] = [];

    try {
      const colRef = collection(db, 'productCategories');
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        rawList = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ProductCategory[];
      }
    } catch (err: any) {
      console.warn('Could not read productCategories from Firestore:', err?.message || err);
    }

    // Fallback: merge defaults with local categories
    if (rawList.length === 0) {
      let localCats: ProductCategory[] = [];
      try {
        const saved = localStorage.getItem('kominote_local_product_categories');
        if (saved) {
          localCats = JSON.parse(saved);
        }
      } catch {}
      rawList = [...DEFAULT_PRODUCT_CATEGORIES, ...localCats];
    }

    return rawList;
  },

  async create(data: Omit<ProductCategory, 'id'>): Promise<ProductCategory> {
    let createdId = `pcat-${Date.now()}`;
    const newCat = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    try {
      const colRef = collection(db, 'productCategories');
      const docRef = await addDoc(colRef, newCat);
      createdId = docRef.id;
    } catch (err) {
      console.warn('Notice creating product category in Firestore, storing in local fallback:', err);
    }

    const result: ProductCategory = { id: createdId, ...newCat };

    // Mirror to localStorage
    try {
      const saved = localStorage.getItem('kominote_local_product_categories');
      const list: ProductCategory[] = saved ? JSON.parse(saved) : [];
      list.push(result);
      localStorage.setItem('kominote_local_product_categories', JSON.stringify(list));
    } catch {}

    return result;
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'productCategories', id));
    } catch (err) {
      console.warn('Notice deleting category in Firestore, removing from local fallback:', err);
    }

    // Remove from localStorage
    try {
      const saved = localStorage.getItem('kominote_local_product_categories');
      if (saved) {
        const list: ProductCategory[] = JSON.parse(saved);
        const filtered = list.filter((c) => c.id !== id);
        localStorage.setItem('kominote_local_product_categories', JSON.stringify(filtered));
      }
    } catch {}
  },
};

// ===========================================================================
// 14. PRODUCT FILES SERVICE
// ===========================================================================
export const productFilesService = {
  async getByProductId(productId: string): Promise<ProductFile[]> {
    try {
      const colRef = collection(db, 'productFiles');
      const q = query(colRef, where('productId', '==', productId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ProductFile[];
    } catch (err) {
      console.warn('Error fetching product files:', err);
      return [];
    }
  },

  async create(data: Omit<ProductFile, 'id'>): Promise<ProductFile> {
    try {
      const colRef = collection(db, 'productFiles');
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...data };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'productFiles');
      throw err;
    }
  },

  async delete(fileId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'productFiles', fileId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `productFiles/${fileId}`);
      throw err;
    }
  },
};

// ===========================================================================
// 15. SHOP ORDERS SERVICE
// ===========================================================================
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
  }): Promise<{ success: boolean; orderId: string; orderNumber: string; invoiceId: string; total: number; message?: string }> {
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Erè nan kreyasyon kòmand lan.');
    }
    return data;
  },

  async getAll(): Promise<ShopOrder[]> {
    try {
      const colRef = collection(db, 'orders');
      const snap = await getDocs(colRef);
      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        // Filter for digital shop orders (which have orderNumber or items array)
        .filter((o: any) => o.orderNumber || o.items) as ShopOrder[];
      return orders.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      return [];
    }
  },

  async getUserOrders(userId: string): Promise<ShopOrder[]> {
    try {
      const colRef = collection(db, 'orders');
      const q = query(colRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ShopOrder[];
      return orders.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
      return [];
    }
  },

  async getById(orderId: string): Promise<ShopOrder | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ShopOrder;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
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

  async rejectOrder(orderId: string, adminNotes?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erè nan rejè kòmand lan.');
    return data;
  },

  async toggleDownload(orderId: string, enable: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/orders/${orderId}/toggle-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enable }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Erè chanjman aksè telechajman.');
    return data;
  },
};

// ===========================================================================
// 16. INVOICES SERVICE
// ===========================================================================
export const invoicesService = {
  async getById(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, 'invoices', invoiceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Invoice;
      }
      // Fallback: check via server endpoint
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        return data.invoice || null;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching invoice:', err);
      return null;
    }
  },
};

// ===========================================================================
// 17. DIGITAL ACCESS (ENTITLEMENTS) SERVICE
// ===========================================================================
export const digitalAccessService = {
  async getUserEntitlements(userId: string): Promise<DigitalAccess[]> {
    try {
      const colRef = collection(db, 'digitalAccess');
      const q = query(colRef, where('userId', '==', userId), where('active', '==', true));
      const snap = await getDocs(q);
      const entitlements = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as DigitalAccess[];

      // Join product details for each entitlement
      const enriched = await Promise.all(
        entitlements.map(async (ent) => {
          try {
            const prod = await productsService.getById(ent.productId);
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
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Aksè telechajman bloke.');
    }
    return data;
  },
};

// ===========================================================================
// 18. PAYMENT SETTINGS SERVICE
// ===========================================================================
export const paymentSettingsService = {
  async getSettings(): Promise<PaymentSettings> {
    try {
      const res = await fetch('/api/payment-settings');
      if (res.ok) {
        const data = await res.json();
        return data.settings;
      }
      throw new Error('Could not fetch payment settings');
    } catch (err) {
      console.warn('Fallback to direct firestore read for payment settings:', err);
      const docRef = doc(db, 'paymentSettings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as PaymentSettings;
      return DEFAULT_PAYMENT_SETTINGS;
    }
  },

  async saveSettings(settings: PaymentSettings): Promise<boolean> {
    const res = await fetch('/api/payment-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    return res.ok;
  },
};


