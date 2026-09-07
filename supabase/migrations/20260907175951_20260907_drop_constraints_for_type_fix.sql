-- Step 1: Drop all constraints and policies that will conflict with type changes

-- Drop policies on order_items
DROP POLICY IF EXISTS "order_items_select_own_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete_admin" ON public.order_items;

-- Drop policies on orders
DROP POLICY IF EXISTS "orders_select_own_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_self_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

-- Drop policies on enrollments
DROP POLICY IF EXISTS "enrollments_select_own_admin" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_self_admin" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_admin" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_delete_admin" ON public.enrollments;

-- Drop policies on digital_access
DROP POLICY IF EXISTS "digital_access_select_own_admin" ON public.digital_access;
DROP POLICY IF EXISTS "digital_access_insert_admin" ON public.digital_access;
DROP POLICY IF EXISTS "digital_access_update_admin" ON public.digital_access;
DROP POLICY IF EXISTS "digital_access_delete_admin" ON public.digital_access;

-- Drop policies on invoices
DROP POLICY IF EXISTS "invoices_select_own_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_self_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_admin" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_admin" ON public.invoices;

-- Drop foreign key constraints
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_order_id_fkey;