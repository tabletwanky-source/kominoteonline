-- Step 2: Alter column types from uuid to text

-- orders: id is used as Stripe session ID or custom order ID (not a UUID)
ALTER TABLE public.orders ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.orders ALTER COLUMN id DROP DEFAULT;

-- enrollments: id is used as composite "studentId_courseId"
ALTER TABLE public.enrollments ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.enrollments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.enrollments ALTER COLUMN order_id TYPE text USING order_id::text;

-- digital_access: id is used as composite "userId_productId"
ALTER TABLE public.digital_access ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.digital_access ALTER COLUMN id DROP DEFAULT;

-- invoices: id is used as custom "invoice_..." ID
ALTER TABLE public.invoices ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.invoices ALTER COLUMN id DROP DEFAULT;

-- order_items.order_id references orders.id (now text)
ALTER TABLE public.order_items ALTER COLUMN order_id TYPE text USING order_id::text;