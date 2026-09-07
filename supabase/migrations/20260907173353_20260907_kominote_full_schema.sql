/*
# Kominote Online — Full Database Schema Migration

## Overview
This migration creates the complete relational database schema for the Kominote Online LMS + digital shop platform, replacing Firebase Firestore. All tables, indexes, and row-level security policies are defined here.

## Tables Created

### Authentication & User Management
1. **profiles** — User profiles linked to Supabase auth.users. Stores role (student/instructor/admin), full name, avatar, bio, headline.

### Course Management (LMS)
2. **categories** — Course categories (name, slug, description, icon).
3. **courses** — Course catalog with title, slug, description, thumbnail, instructor, category, pricing, level, status, featured, certificate, preview video settings, requirements, learning outcomes.
4. **course_modules** — Modules/sections within a course (title, position).
5. **lessons** — Lessons within modules (title, content type, video URL, file URL, text content, duration, position, preview flag).
6. **enrollments** — Student-course enrollment records with status, progress tracking.
7. **lesson_progress** — Per-lesson completion tracking (watch percentage, completed flag).
8. **certificates** — Completion certificates with unique public verification code.

### Digital Shop
9. **product_categories** — Shop product categories.
10. **products** — Digital/physical products with title, slug, description, image, category, pricing, type, status, download settings.
11. **product_files** — Files attached to digital products (secure download references).

### Orders & Payments
12. **orders** — Unified orders table for both course and shop purchases. Stores customer info, payment method, Stripe session, payment status, approval status, tracking, coupon data.
13. **order_items** — Line items for shop orders (product, quantity, unit price, total).
14. **course_registrations** — Manual payment course registration records with payment proof.
15. **invoices** — Customer invoices linked to orders.
16. **digital_access** — Download entitlements granting access to purchased product files.

### Coupons
17. **coupons** — Discount codes with type (percentage/fixed), limits, validity windows.
18. **coupon_usage** — Records of each coupon redemption.

### CMS & Settings
19. **about_page** — About page CMS content (single row, id='main').
20. **team_members** — Team/founder profiles for the about page.
21. **site_settings** — Global site settings (single row, id='general').
22. **payment_settings** — Payment method configuration (single row, id='general', stored as JSONB).

### Reviews
23. **reviews** — Course reviews/ratings.

## Security Model
- All tables have RLS enabled.
- Profiles: users read/update own profile; admins read/update all.
- Public content (courses, categories, products, about, team, settings, certificates, reviews): readable by anon+authenticated.
- Owner-scoped data (enrollments, lesson_progress, orders, digital_access, course_registrations, invoices): users read own, admin reads all.
- Admin-only writes for CMS, courses, products, coupons, payment settings.
- Admin role is determined by the `role` column in `profiles` — users cannot self-assign admin.
- A SECURITY DEFINER function `is_admin()` safely checks the current user's role.
- A trigger auto-creates a profile row when a new auth user signs up.
- A trigger prevents users from escalating their own role.

## Notes
- Uses `gen_random_uuid()` for primary keys (UUID-based, matching the previous Firebase UID pattern).
- Timestamps use `timestamptz DEFAULT now()`.
- JSONB columns used for flexible nested data (payment method details, social links, requirements, learning outcomes, order items).
- Existing Stripe tables (stripe_customers, stripe_subscriptions, stripe_orders) are left untouched.
*/

-- ============================================================
-- HELPER FUNCTION: is_admin()
-- ============================================================
-- Safely checks if the current authenticated user has admin role.
-- SECURITY DEFINER so it can read profiles regardless of RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- ============================================================
-- HELPER FUNCTION: is_instructor_or_admin()
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_instructor_or_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role IN ('admin', 'instructor');
END;
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  avatar_url text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  headline text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
CREATE POLICY "profiles_insert_self"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id AND role = 'student');

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: prevent self-role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can change roles; non-admins cannot change their own role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'You are not authorized to change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- Trigger: update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 2. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon text,
  course_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
ON public.categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
CREATE POLICY "categories_insert_admin"
ON public.categories FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
CREATE POLICY "categories_update_admin"
ON public.categories FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;
CREATE POLICY "categories_delete_admin"
ON public.categories FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 3. courses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  short_description text,
  thumbnail text NOT NULL DEFAULT '',
  instructor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  is_free boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'USD',
  level text NOT NULL DEFAULT 'Tout Nivo' CHECK (level IN ('Kòmansan', 'Entèmedyè', 'Avanse', 'Tout Nivo')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured boolean NOT NULL DEFAULT false,
  certificate_enabled boolean NOT NULL DEFAULT false,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  learning_outcomes jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric(3,1) NOT NULL DEFAULT 5.0,
  students_count integer NOT NULL DEFAULT 0,
  duration_hours numeric(5,1) NOT NULL DEFAULT 10,
  total_lessons integer NOT NULL DEFAULT 0,
  preview_enabled boolean NOT NULL DEFAULT false,
  preview_type text CHECK (preview_type IN ('youtube', 'vimeo', 'upload') OR preview_type IS NULL),
  preview_video_url text,
  preview_storage_path text,
  preview_thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_published" ON public.courses;
CREATE POLICY "courses_select_published"
ON public.courses FOR SELECT
TO anon, authenticated
USING (status = 'published' OR public.is_admin() OR instructor_id = auth.uid());

DROP POLICY IF EXISTS "courses_insert_admin_instructor" ON public.courses;
CREATE POLICY "courses_insert_admin_instructor"
ON public.courses FOR INSERT
TO authenticated WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "courses_update_admin_instructor" ON public.courses;
CREATE POLICY "courses_update_admin_instructor"
ON public.courses FOR UPDATE
TO authenticated
USING (public.is_admin() OR instructor_id = auth.uid())
WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;
CREATE POLICY "courses_delete_admin"
ON public.courses FOR DELETE
TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses(featured);

-- ============================================================
-- 4. course_modules
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "modules_select_all" ON public.course_modules;
CREATE POLICY "modules_select_all"
ON public.course_modules FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "modules_insert_admin_instructor" ON public.course_modules;
CREATE POLICY "modules_insert_admin_instructor"
ON public.course_modules FOR INSERT
TO authenticated WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "modules_update_admin_instructor" ON public.course_modules;
CREATE POLICY "modules_update_admin_instructor"
ON public.course_modules FOR UPDATE
TO authenticated USING (public.is_instructor_or_admin()) WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "modules_delete_admin_instructor" ON public.course_modules;
CREATE POLICY "modules_delete_admin_instructor"
ON public.course_modules FOR DELETE
TO authenticated USING (public.is_instructor_or_admin());

CREATE INDEX IF NOT EXISTS idx_modules_course ON public.course_modules(course_id);

-- ============================================================
-- 5. lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'youtube' CHECK (content_type IN ('youtube', 'vimeo', 'uploaded_video', 'pdf', 'file', 'text')),
  video_url text,
  file_url text,
  file_name text,
  file_size bigint,
  text_content text,
  duration text,
  duration_minutes integer,
  duration_seconds integer,
  position integer NOT NULL DEFAULT 0,
  preview_enabled boolean NOT NULL DEFAULT false,
  is_free_preview boolean NOT NULL DEFAULT false,
  completion_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_all" ON public.lessons;
CREATE POLICY "lessons_select_all"
ON public.lessons FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "lessons_insert_admin_instructor" ON public.lessons;
CREATE POLICY "lessons_insert_admin_instructor"
ON public.lessons FOR INSERT
TO authenticated WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "lessons_update_admin_instructor" ON public.lessons;
CREATE POLICY "lessons_update_admin_instructor"
ON public.lessons FOR UPDATE
TO authenticated USING (public.is_instructor_or_admin()) WITH CHECK (public.is_instructor_or_admin());

DROP POLICY IF EXISTS "lessons_delete_admin_instructor" ON public.lessons;
CREATE POLICY "lessons_delete_admin_instructor"
ON public.lessons FOR DELETE
TO authenticated USING (public.is_instructor_or_admin());

CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);

-- ============================================================
-- 6. enrollments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  progress_percentage numeric(5,2) NOT NULL DEFAULT 0,
  completed_lessons_count integer NOT NULL DEFAULT 0,
  total_required_lessons_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own_admin" ON public.enrollments;
CREATE POLICY "enrollments_select_own_admin"
ON public.enrollments FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "enrollments_insert_self_admin" ON public.enrollments;
CREATE POLICY "enrollments_insert_self_admin"
ON public.enrollments FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "enrollments_update_admin" ON public.enrollments;
CREATE POLICY "enrollments_update_admin"
ON public.enrollments FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "enrollments_delete_admin" ON public.enrollments;
CREATE POLICY "enrollments_delete_admin"
ON public.enrollments FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- ============================================================
-- 7. lesson_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  watch_percentage numeric(5,2) NOT NULL DEFAULT 0,
  seconds_watched integer,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select_own_admin" ON public.lesson_progress;
CREATE POLICY "progress_select_own_admin"
ON public.lesson_progress FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "progress_insert_own_admin" ON public.lesson_progress;
CREATE POLICY "progress_insert_own_admin"
ON public.lesson_progress FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "progress_update_own_admin" ON public.lesson_progress;
CREATE POLICY "progress_update_own_admin"
ON public.lesson_progress FOR UPDATE
TO authenticated USING (student_id = auth.uid() OR public.is_admin()) WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "progress_delete_admin" ON public.lesson_progress;
CREATE POLICY "progress_delete_admin"
ON public.lesson_progress FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_course ON public.lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON public.lesson_progress(lesson_id);

-- ============================================================
-- 8. certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title text NOT NULL,
  instructor_name text,
  completion_date timestamptz NOT NULL DEFAULT now(),
  verification_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_select_all" ON public.certificates;
CREATE POLICY "certificates_select_all"
ON public.certificates FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "certificates_insert_admin_self" ON public.certificates;
CREATE POLICY "certificates_insert_admin_self"
ON public.certificates FOR INSERT
TO authenticated WITH CHECK (public.is_admin() OR student_id = auth.uid());

DROP POLICY IF EXISTS "certificates_update_admin" ON public.certificates;
CREATE POLICY "certificates_update_admin"
ON public.certificates FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "certificates_delete_admin" ON public.certificates;
CREATE POLICY "certificates_delete_admin"
ON public.certificates FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_certs_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certs_course ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certs_code ON public.certificates(certificate_id);

-- ============================================================
-- 9. product_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prodcat_select_all" ON public.product_categories;
CREATE POLICY "prodcat_select_all"
ON public.product_categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "prodcat_insert_admin" ON public.product_categories;
CREATE POLICY "prodcat_insert_admin"
ON public.product_categories FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "prodcat_update_admin" ON public.product_categories;
CREATE POLICY "prodcat_update_admin"
ON public.product_categories FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "prodcat_delete_admin" ON public.product_categories;
CREATE POLICY "prodcat_delete_admin"
ON public.product_categories FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 10. products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  cover_image text,
  category_id uuid REFERENCES public.product_categories(id) ON DELETE SET NULL,
  category_name text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  sale_price numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  product_type text NOT NULL DEFAULT 'other' CHECK (product_type IN ('pdf', 'ebook', 'template', 'zip', 'software', 'guide', 'training', 'document', 'other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured boolean NOT NULL DEFAULT false,
  downloadable boolean NOT NULL DEFAULT false,
  download_file_url text,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb,
  included_files jsonb NOT NULL DEFAULT '[]'::jsonb,
  purchase_instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_published" ON public.products;
CREATE POLICY "products_select_published"
ON public.products FOR SELECT
TO anon, authenticated
USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
CREATE POLICY "products_insert_admin"
ON public.products FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON public.products;
CREATE POLICY "products_update_admin"
ON public.products FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON public.products;
CREATE POLICY "products_delete_admin"
ON public.products FOR DELETE
TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- ============================================================
-- 11. product_files
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT '',
  file_size bigint NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;

-- Admin-only: product files contain private download URLs
DROP POLICY IF EXISTS "product_files_select_admin" ON public.product_files;
CREATE POLICY "product_files_select_admin"
ON public.product_files FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "product_files_insert_admin" ON public.product_files;
CREATE POLICY "product_files_insert_admin"
ON public.product_files FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_files_update_admin" ON public.product_files;
CREATE POLICY "product_files_update_admin"
ON public.product_files FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "product_files_delete_admin" ON public.product_files;
CREATE POLICY "product_files_delete_admin"
ON public.product_files FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_product_files_product ON public.product_files(product_id);

-- ============================================================
-- 12. orders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id text,
  course_id text,
  product_id text,
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text,
  country text,
  city text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_provider text NOT NULL DEFAULT 'manual' CHECK (payment_provider IN ('stripe', 'manual')),
  payment_method text,
  bank_selected text,
  sender_phone text,
  paypal_email_used text,
  transaction_reference text,
  payment_proof_url text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'approved', 'rejected')),
  invoice_id text,
  tracking_number text,
  public_status_note text,
  admin_notes text,
  notes text,
  approved_at timestamptz,
  approved_by text,
  refunded_at timestamptz,
  refund_reason text,
  access_revoked boolean NOT NULL DEFAULT false,
  is_test_mode boolean NOT NULL DEFAULT false,
  coupon_code text,
  coupon_id text,
  discount_type text,
  discount_value numeric(10,2),
  discount_amount numeric(10,2),
  original_subtotal numeric(10,2),
  final_total numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_select_own_admin" ON public.orders;
CREATE POLICY "orders_select_own_admin"
ON public.orders FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_self_admin" ON public.orders;
CREATE POLICY "orders_insert_self_admin"
ON public.orders FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin"
ON public.orders FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;
CREATE POLICY "orders_delete_admin"
ON public.orders FOR DELETE
TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- ============================================================
-- 13. order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text,
  product_title text,
  product_image text,
  product_type text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_own_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_admin"
ON public.order_items FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND (orders.user_id = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS "order_items_insert_admin" ON public.order_items;
CREATE POLICY "order_items_insert_admin"
ON public.order_items FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;
CREATE POLICY "order_items_delete_admin"
ON public.order_items FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- 14. course_registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.course_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  course_title text NOT NULL DEFAULT '',
  course_price numeric(10,2) NOT NULL DEFAULT 0,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT '',
  student_email text NOT NULL DEFAULT '',
  student_phone text NOT NULL DEFAULT '',
  payment_method text NOT NULL DEFAULT 'bankTransfer',
  payment_method_details jsonb,
  transaction_reference text,
  payment_proof_url text,
  payment_proof_path text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'failed', 'refunded')),
  registration_status text NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected')),
  invoice_id text,
  approved_at timestamptz,
  approved_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations_select_own_admin" ON public.course_registrations;
CREATE POLICY "registrations_select_own_admin"
ON public.course_registrations FOR SELECT
TO authenticated USING (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "registrations_insert_self" ON public.course_registrations;
CREATE POLICY "registrations_insert_self"
ON public.course_registrations FOR INSERT
TO authenticated WITH CHECK (student_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "registrations_update_admin" ON public.course_registrations;
CREATE POLICY "registrations_update_admin"
ON public.course_registrations FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "registrations_delete_admin" ON public.course_registrations;
CREATE POLICY "registrations_delete_admin"
ON public.course_registrations FOR DELETE
TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS registrations_updated_at ON public.course_registrations;
CREATE TRIGGER registrations_updated_at
BEFORE UPDATE ON public.course_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_registrations_student ON public.course_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course ON public.course_registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.course_registrations(registration_status);

-- ============================================================
-- 15. invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  order_id text NOT NULL,
  order_number text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text,
  customer_country text,
  customer_city text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_method text,
  bank_selected text,
  payment_status text NOT NULL DEFAULT 'pending',
  order_status text NOT NULL DEFAULT 'pending',
  tracking_number text,
  coupon_code text,
  coupon_id text,
  discount_type text,
  discount_value numeric(10,2),
  discount_amount numeric(10,2),
  original_subtotal numeric(10,2),
  final_total numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_select_own_admin" ON public.invoices;
CREATE POLICY "invoices_select_own_admin"
ON public.invoices FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "invoices_insert_self_admin" ON public.invoices;
CREATE POLICY "invoices_insert_self_admin"
ON public.invoices FOR INSERT
TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
CREATE POLICY "invoices_update_admin"
ON public.invoices FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;
CREATE POLICY "invoices_delete_admin"
ON public.invoices FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);

-- ============================================================
-- 16. digital_access
-- ============================================================
CREATE TABLE IF NOT EXISTS public.digital_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  order_id text NOT NULL,
  active boolean NOT NULL DEFAULT false,
  enabled_at timestamptz,
  enabled_by text,
  download_count integer NOT NULL DEFAULT 0,
  last_downloaded_at timestamptz
);

ALTER TABLE public.digital_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "digital_access_select_own_admin" ON public.digital_access;
CREATE POLICY "digital_access_select_own_admin"
ON public.digital_access FOR SELECT
TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "digital_access_insert_admin" ON public.digital_access;
CREATE POLICY "digital_access_insert_admin"
ON public.digital_access FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "digital_access_update_admin" ON public.digital_access;
CREATE POLICY "digital_access_update_admin"
ON public.digital_access FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "digital_access_delete_admin" ON public.digital_access;
CREATE POLICY "digital_access_delete_admin"
ON public.digital_access FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_digital_access_user ON public.digital_access(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_access_product ON public.digital_access(product_id);

-- ============================================================
-- 17. coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  minimum_purchase numeric(10,2),
  maximum_discount numeric(10,2),
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'courses', 'products', 'categories')),
  course_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  category_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  usage_limit_per_user integer,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons_select_admin" ON public.coupons;
CREATE POLICY "coupons_select_admin"
ON public.coupons FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "coupons_insert_admin" ON public.coupons;
CREATE POLICY "coupons_insert_admin"
ON public.coupons FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coupons_update_admin" ON public.coupons;
CREATE POLICY "coupons_update_admin"
ON public.coupons FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coupons_delete_admin" ON public.coupons;
CREATE POLICY "coupons_delete_admin"
ON public.coupons FOR DELETE
TO authenticated USING (public.is_admin());

DROP TRIGGER IF EXISTS coupons_updated_at ON public.coupons;
CREATE TRIGGER coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active);

-- ============================================================
-- 18. coupon_usage
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_id text,
  course_id text,
  product_id text,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_usage_select_admin" ON public.coupon_usage;
CREATE POLICY "coupon_usage_select_admin"
ON public.coupon_usage FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "coupon_usage_insert_admin" ON public.coupon_usage;
CREATE POLICY "coupon_usage_insert_admin"
ON public.coupon_usage FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "coupon_usage_delete_admin" ON public.coupon_usage;
CREATE POLICY "coupon_usage_delete_admin"
ON public.coupon_usage FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage(user_id);

-- ============================================================
-- 19. about_page
-- ============================================================
CREATE TABLE IF NOT EXISTS public.about_page (
  id text PRIMARY KEY DEFAULT 'main',
  title text NOT NULL DEFAULT 'About Us',
  description text NOT NULL DEFAULT '',
  mission text NOT NULL DEFAULT '',
  vision text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.about_page ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "about_select_all" ON public.about_page;
CREATE POLICY "about_select_all"
ON public.about_page FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "about_insert_admin" ON public.about_page;
CREATE POLICY "about_insert_admin"
ON public.about_page FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "about_update_admin" ON public.about_page;
CREATE POLICY "about_update_admin"
ON public.about_page FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "about_delete_admin" ON public.about_page;
CREATE POLICY "about_delete_admin"
ON public.about_page FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 20. team_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  professional_title text,
  organizations jsonb NOT NULL DEFAULT '[]'::jsonb,
  photo text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_select_all" ON public.team_members;
CREATE POLICY "team_select_all"
ON public.team_members FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_insert_admin" ON public.team_members;
CREATE POLICY "team_insert_admin"
ON public.team_members FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "team_update_admin" ON public.team_members;
CREATE POLICY "team_update_admin"
ON public.team_members FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "team_delete_admin" ON public.team_members;
CREATE POLICY "team_delete_admin"
ON public.team_members FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 21. site_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'general',
  site_name text NOT NULL DEFAULT 'Kominote Online',
  contact_email text NOT NULL DEFAULT 'support@kominote.online',
  contact_phone text,
  announcement text,
  is_maintenance boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_all" ON public.site_settings;
CREATE POLICY "site_settings_select_all"
ON public.site_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "site_settings_insert_admin" ON public.site_settings;
CREATE POLICY "site_settings_insert_admin"
ON public.site_settings FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_update_admin" ON public.site_settings;
CREATE POLICY "site_settings_update_admin"
ON public.site_settings FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_settings_delete_admin" ON public.site_settings;
CREATE POLICY "site_settings_delete_admin"
ON public.site_settings FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 22. payment_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id text PRIMARY KEY DEFAULT 'general',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_settings_select_all" ON public.payment_settings;
CREATE POLICY "payment_settings_select_all"
ON public.payment_settings FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "payment_settings_insert_admin" ON public.payment_settings;
CREATE POLICY "payment_settings_insert_admin"
ON public.payment_settings FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payment_settings_update_admin" ON public.payment_settings;
CREATE POLICY "payment_settings_update_admin"
ON public.payment_settings FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payment_settings_delete_admin" ON public.payment_settings;
CREATE POLICY "payment_settings_delete_admin"
ON public.payment_settings FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- 23. reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_location text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all"
ON public.reviews FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_admin" ON public.reviews;
CREATE POLICY "reviews_insert_admin"
ON public.reviews FOR INSERT
TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_update_admin" ON public.reviews;
CREATE POLICY "reviews_update_admin"
ON public.reviews FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_delete_admin" ON public.reviews;
CREATE POLICY "reviews_delete_admin"
ON public.reviews FOR DELETE
TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_reviews_course ON public.reviews(course_id);

-- ============================================================
-- 24. contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_insert_all" ON public.contact_messages;
CREATE POLICY "contact_insert_all"
ON public.contact_messages FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_select_admin" ON public.contact_messages;
CREATE POLICY "contact_select_admin"
ON public.contact_messages FOR SELECT
TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "contact_update_admin" ON public.contact_messages;
CREATE POLICY "contact_update_admin"
ON public.contact_messages FOR UPDATE
TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "contact_delete_admin" ON public.contact_messages;
CREATE POLICY "contact_delete_admin"
ON public.contact_messages FOR DELETE
TO authenticated USING (public.is_admin());

-- ============================================================
-- Seed: default payment settings
-- ============================================================
INSERT INTO public.payment_settings (id, settings)
VALUES ('general', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (id)
VALUES ('general')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.about_page (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;