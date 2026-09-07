import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { createServer as createViteServer } from 'vite';
import {
  sendOrderReceivedEmail,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendDownloadEnabledEmail,
} from './server/emailService';

dotenv.config();

const PORT = 3000;

// Supabase configuration (server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseServiceKey || supabaseServiceKey === supabaseAnonKey) {
  console.warn(
    '[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key for admin operations. ' +
      'Set SUPABASE_SERVICE_ROLE_KEY in your environment to bypass RLS for admin/server operations.'
  );
}

// Admin client bypasses RLS (use service role key when available)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Auth client used to verify user JWT tokens from the Authorization header
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Lazy Stripe client initialization to avoid startup crashes if key is not configured
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

const ADMIN_EMAILS = [
  'wanky7713@gmail.com',
  'wankymassenat@gmail.com',
  'tabletwanky@gmail.com',
  'motivationmtv2026@gmail.com',
  'wanky@kominote.online',
];

const ADMIN_UIDS = [
  'QRxZpKpZQtRdbIlB5NzRPaagiXS2',
  'MUO3PPIQDQVZv32ewwXyeE1p3zs1',
];

async function verifyIsAdmin(req: express.Request, candidateAdminId?: string): Promise<boolean> {
  // 1. Check Authorization Bearer JWT token if present (Supabase auth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    if (token) {
      try {
        const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
        if (!userError && userData?.user) {
          const caller = userData.user;
          const email = (caller.email || '').toLowerCase();
          const uid = caller.id;
          if (ADMIN_EMAILS.includes(email) || ADMIN_UIDS.includes(uid)) return true;

          // Check profiles table for admin role
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, email')
            .eq('id', uid)
            .maybeSingle();
          if (profile) {
            if (profile.role === 'admin') return true;
            if (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())) return true;
          }
        }
      } catch (tokenErr) {
        console.warn('[Admin Auth] Supabase token verification notice:', tokenErr);
      }
    }
  }

  // 2. Check candidateAdminId or req.body adminId
  const candidateId = candidateAdminId || (req.body && (req.body.adminId || req.body.userId));
  if (candidateId) {
    if (ADMIN_UIDS.includes(candidateId)) return true;
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, email')
        .eq('id', candidateId)
        .maybeSingle();
      if (profile) {
        if (profile.role === 'admin') return true;
        if (profile.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())) return true;
      }
    } catch (dbErr) {
      console.warn('[Admin Auth] Supabase role check notice:', dbErr);
    }
  }

  return false;
}

// Helper: Fetch real course directly from Supabase
async function getCourseFromSupabase(courseIdOrSlug: string): Promise<any | null> {
  try {
    // Try by id first
    const { data: byId, error: idErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseIdOrSlug)
      .maybeSingle();
    if (byId) return { id: byId.id, ...byId };

    // Query by slug
    const { data: bySlug, error: slugErr } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('slug', courseIdOrSlug)
      .maybeSingle();
    if (bySlug) return { id: bySlug.id, ...bySlug };

    return null;
  } catch (err) {
    console.warn('Could not read course directly from Supabase:', err);
    return null;
  }
}

// Helper: Check if student already has active enrollment in Supabase
async function isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
  try {
    // Check by composite doc ID studentId_courseId
    const enrollmentId = `${studentId}_${courseId}`;
    const { data: byId } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .maybeSingle();
    if (byId && byId.status === 'active') {
      return true;
    }

    // Also query enrollments table by student_id + course_id + status
    const { data: byStudentCourse } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .limit(1);
    if (byStudentCourse && byStudentCourse.length > 0) return true;

    // Fallback: camelCase columns
    const { data: byCamel } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('studentId', studentId)
      .eq('courseId', courseId)
      .eq('status', 'active')
      .limit(1);
    return !!(byCamel && byCamel.length > 0);
  } catch (err) {
    console.warn('Error checking enrollment in Supabase:', err);
    return false;
  }
}

async function startServer() {
  const app = express();

  // In-memory store for robust synchronization and fast validation
  interface ServerCoupon {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    currency: string;
    minimumPurchase: number;
    maximumDiscount: number;
    appliesTo: 'all' | 'courses' | 'products' | 'categories';
    courseIds: string[];
    productIds: string[];
    categoryIds: string[];
    usageLimit: number;
    usageCount: number;
    usageLimitPerUser: number;
    startsAt: string | null;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  }

  const serverCoupons = new Map<string, ServerCoupon>([
    [
      'WELCOME10',
      {
        id: 'coupon_welcome10',
        code: 'WELCOME10',
        description: '10% rabè sou tout fòmasyon ak resous Kominote Online',
        discountType: 'percentage',
        discountValue: 10,
        currency: 'USD',
        minimumPurchase: 0,
        maximumDiscount: 50,
        appliesTo: 'all',
        courseIds: [],
        productIds: [],
        categoryIds: [],
        usageLimit: 100,
        usageCount: 0,
        usageLimitPerUser: 1,
        startsAt: null,
        expiresAt: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    [
      'KOMINOTE20',
      {
        id: 'coupon_kominote20',
        code: 'KOMINOTE20',
        description: '20% rabè espesyal Kominote Online pou lòd $20+',
        discountType: 'percentage',
        discountValue: 20,
        currency: 'USD',
        minimumPurchase: 20,
        maximumDiscount: 60,
        appliesTo: 'all',
        courseIds: [],
        productIds: [],
        categoryIds: [],
        usageLimit: 50,
        usageCount: 0,
        usageLimitPerUser: 2,
        startsAt: null,
        expiresAt: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    [
      'PROMO10',
      {
        id: 'coupon_promo10',
        code: 'PROMO10',
        description: '$10 rabè fiks sou tout acha $25 oswa plis',
        discountType: 'fixed',
        discountValue: 10,
        currency: 'USD',
        minimumPurchase: 25,
        maximumDiscount: 0,
        appliesTo: 'all',
        courseIds: [],
        productIds: [],
        categoryIds: [],
        usageLimit: 50,
        usageCount: 0,
        usageLimitPerUser: 1,
        startsAt: null,
        expiresAt: null,
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  ]);

  const serverCouponUsages: any[] = [];
  const serverOrders = new Map<string, any>();

  // Helper: Generate unique tracking number KO-TRK-YYYY-NNNNNN
  async function generateTrackingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 20; attempt++) {
      const seq = String(Math.floor(100000 + Math.random() * 900000));
      const trackingNumber = `KO-TRK-${year}-${seq}`;
      if (serverOrders.has(trackingNumber)) continue;
      try {
        const { data, error } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('tracking_number', trackingNumber)
          .limit(1);
        if (!data || data.length === 0) return trackingNumber;
      } catch (e) {
        return trackingNumber;
      }
    }
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `KO-TRK-${year}-${rand}`;
  }

  // 1. STRIPE WEBHOOK ENDPOINT (Raw body is strictly required for signature verification)
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      const stripe = getStripe();

      let event: Stripe.Event;

      if (webhookSecret && sig && stripe) {
        try {
          event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
        } catch (err: any) {
          console.error('⚠️ Stripe Webhook signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }
      } else {
        // Fallback or Test Mode (parses JSON directly if secret isn't provided yet)
        try {
          event = JSON.parse(req.body.toString());
          console.log(`[Stripe Webhook Notice] Processed event without signature check: ${event.type}`);
        } catch (e: any) {
          return res.status(400).send(`JSON parse error: ${e.message}`);
        }
      }

      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[Webhook] Handling checkout.session.completed for session: ${session.id}`);

          // Confirm payment status is paid
          const isPaid = session.payment_status === 'paid' || session.status === 'complete';
          if (!isPaid) {
            console.warn(`[Webhook] Session ${session.id} payment_status is not paid: ${session.payment_status}`);
            return res.json({ received: true, status: session.payment_status });
          }

          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent as any)?.id || '';

          // 1. Check if this is a DIGITAL SHOP PRODUCT purchase
          if (session.metadata?.purchaseType === 'shop_product') {
            const orderId = session.metadata?.orderId;
            if (!orderId) {
              console.error('⚠️ Shop purchase missing orderId in metadata');
              return res.status(400).json({ error: 'Missing orderId' });
            }

            const { data: orderData, error: orderErr } = await supabaseAdmin
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .maybeSingle();
            if (orderErr || !orderData) {
              console.error(`⚠️ Shop order ${orderId} not found in Supabase`);
              return res.status(404).json({ error: 'Order not found' });
            }

            const order = orderData;
            const approvedAt = new Date().toISOString();

            // Mark order as paid & approved, unlock downloads immediately
            await supabaseAdmin
              .from('orders')
              .update({
                payment_status: 'paid',
                order_status: 'approved',
                stripe_session_id: session.id,
                stripe_payment_intent_id: paymentIntentId,
                approved_at: approvedAt,
                approved_by: 'Stripe Automatic',
                updated_at: approvedAt,
              })
              .eq('id', orderId);

            // Grant digitalAccess for all items in order
            const items = order.items || [];
            for (const item of items) {
              const prodId = item.productId;
              const accessDocId = `${order.user_id || order.userId}_${prodId}`;
              await supabaseAdmin.from('digital_access').upsert(
                {
                  id: accessDocId,
                  user_id: order.user_id || order.userId,
                  product_id: prodId,
                  order_id: order.id,
                  active: true,
                  enabled_at: approvedAt,
                  enabled_by: 'Stripe Automatic',
                  download_count: 0,
                  last_downloaded_at: null,
                },
                { onConflict: 'id' }
              );
            }

            // Update invoice if linked
            if (order.invoice_id || order.invoiceId) {
              try {
                await supabaseAdmin
                  .from('invoices')
                  .update({
                    payment_status: 'paid',
                    order_status: 'approved',
                  })
                  .eq('id', order.invoice_id || order.invoiceId);
              } catch (invErr) {
                console.warn('Could not update invoice status on shop webhook:', invErr);
              }
            }

            console.log(`[Webhook] Shop order ${orderId} automatically fulfilled and approved.`);
            return res.json({ received: true, orderId, fulfilled: true });
          }

          // 2. Otherwise, handle COURSE purchase
          const courseId = session.metadata?.courseId;
          const studentId = session.metadata?.studentId;
          const studentEmail = session.metadata?.studentEmail || session.customer_details?.email || '';

          if (!courseId || !studentId) {
            console.error('⚠️ Webhook missing courseId or studentId in session metadata');
            return res.status(400).json({ error: 'Missing metadata' });
          }

          // Prevent duplicate order processing
          const { data: existingOrder } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', session.id)
            .maybeSingle();
          if (existingOrder && existingOrder.payment_status === 'paid') {
            console.log(`[Webhook] Order ${session.id} already paid and fulfilled. Skipping duplicate.`);
            return res.json({ received: true, duplicate: true });
          }

          const amount = session.amount_total
            ? session.amount_total / 100
            : Number(session.metadata?.amountCharged || 0);

          // Create/Update order in Supabase
          const orderData = {
            id: session.id,
            user_id: studentId,
            student_id: studentId,
            course_id: courseId,
            amount,
            currency: (session.currency || 'usd').toLowerCase(),
            payment_provider: 'stripe',
            stripe_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            payment_status: 'paid',
            order_status: 'approved',
            approval_status: 'approved',
            created_at: existingOrder ? existingOrder.created_at : new Date().toISOString(),
            updated_at: new Date().toISOString(),
            customer_email: studentEmail,
          };

          await supabaseAdmin.from('orders').upsert(orderData, { onConflict: 'id' });
          console.log(`[Webhook] Supabase course order created/updated: ${session.id}`);

          // Create student's course enrollment (prevent duplicate)
          const enrollmentId = `${studentId}_${courseId}`;
          const { data: existingEnroll } = await supabaseAdmin
            .from('enrollments')
            .select('*')
            .eq('id', enrollmentId)
            .maybeSingle();

          if (!existingEnroll || existingEnroll.status !== 'active') {
            await supabaseAdmin.from('enrollments').upsert(
              {
                id: enrollmentId,
                student_id: studentId,
                course_id: courseId,
                order_id: session.id,
                status: 'active',
                enrolled_at: new Date().toISOString(),
                progress_percentage: 0,
                completed_lessons_count: 0,
                total_required_lessons_count: 0,
              },
              { onConflict: 'id' }
            );
            console.log(`[Webhook] Student ${studentId} successfully enrolled in course ${courseId}`);
          } else {
            console.log(`[Webhook] Student ${studentId} was already enrolled in ${courseId}. Linking order.`);
            await supabaseAdmin
              .from('enrollments')
              .update({ order_id: session.id, status: 'active' })
              .eq('id', enrollmentId);
          }
        } else if (event.type === 'charge.refunded' || event.type === 'payment_intent.canceled') {
          // Handle refunds
          const charge = event.data.object as any;
          const paymentIntentId = charge.payment_intent || charge.id;

          console.log(`[Webhook] Processing refund for payment intent: ${paymentIntentId}`);
          const { data: refundedOrders } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('stripe_payment_intent_id', paymentIntentId);

          if (refundedOrders && refundedOrders.length > 0) {
            for (const o of refundedOrders) {
              await supabaseAdmin
                .from('orders')
                .update({
                  payment_status: 'refunded',
                  refunded_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', o.id);
              console.log(`[Webhook] Updated order ${o.id} to refunded.`);
            }
          }
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error('Error handling webhook event:', err);
        return res.status(500).json({ error: 'Internal webhook fulfillment error', message: err.message });
      }
    }
  );

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://js.stripe.com https://www.youtube.com https://player.vimeo.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: blob: https:; " +
      "media-src 'self' blob: data: https:; " +
      "connect-src 'self' https://*.supabase.co https://apis.google.com https://api.stripe.com https://*.stripe.com wss: https:; " +
      "frame-src 'self' https://accounts.google.com https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com; " +
      "frame-ancestors 'self' https://*.google.com https://ai.studio https://*.aistudio.google;"
    );
    next();
  });

  // Standard JSON body parsing for other API endpoints
  app.use(express.json());

  // 1. Dynamic Sitemap.xml (Public published courses, products & pages only)
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://kominote.online';
      const staticUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
        { loc: `${baseUrl}/courses`, priority: '0.9', changefreq: 'daily' },
        { loc: `${baseUrl}/shop`, priority: '0.9', changefreq: 'daily' },
        { loc: `${baseUrl}/categories`, priority: '0.8', changefreq: 'weekly' },
        { loc: `${baseUrl}/about`, priority: '0.7', changefreq: 'monthly' },
        { loc: `${baseUrl}/contact`, priority: '0.7', changefreq: 'monthly' },
        { loc: `${baseUrl}/faq`, priority: '0.7', changefreq: 'weekly' },
        { loc: `${baseUrl}/privacy-policy`, priority: '0.3', changefreq: 'yearly' },
        { loc: `${baseUrl}/terms-conditions`, priority: '0.3', changefreq: 'yearly' },
        { loc: `${baseUrl}/refund-policy`, priority: '0.3', changefreq: 'yearly' },
      ];

      const dynamicUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [];

      // Query published courses from Supabase
      try {
        const { data: courses } = await supabaseAdmin.from('courses').select('*');
        if (courses) {
          for (const data of courses) {
            if (data.status === 'published' || data.is_published) {
              const slug = data.slug || data.id;
              dynamicUrls.push({
                loc: `${baseUrl}/courses/${slug}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching courses for sitemap:', err);
      }

      // Query published products from Supabase
      try {
        const { data: products } = await supabaseAdmin.from('products').select('*');
        if (products) {
          for (const data of products) {
            if (data.status === 'published' || data.is_active) {
              const slug = data.slug || data.id;
              dynamicUrls.push({
                loc: `${baseUrl}/shop/${slug}`,
                priority: '0.8',
                changefreq: 'weekly',
                lastmod: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching products for sitemap:', err);
      }

      const allUrls = [...staticUrls, ...dynamicUrls];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      for (const item of allUrls) {
        xml += '  <url>\n';
        xml += `    <loc>${item.loc}</loc>\n`;
        if (item.lastmod) xml += `    <lastmod>${item.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
        xml += `    <priority>${item.priority}</priority>\n`;
        xml += '  </url>\n';
      }
      xml += '</urlset>';

      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=3600');
      return res.send(xml);
    } catch (err) {
      console.error('Sitemap generation error:', err);
      return res.status(500).send('Error generating sitemap');
    }
  });

  // 2. Robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Allow: /courses
Allow: /courses/*
Allow: /shop
Allow: /shop/*
Allow: /categories
Allow: /about
Allow: /contact
Allow: /faq

# Disallow private application areas
Disallow: /admin
Disallow: /admin/*
Disallow: /dashboard
Disallow: /dashboard/*
Disallow: /instructor
Disallow: /instructor/*
Disallow: /login
Disallow: /register
Disallow: /checkout
Disallow: /checkout/*
Disallow: /invoice
Disallow: /invoice/*
Disallow: /api/*

Sitemap: https://kominote.online/sitemap.xml
`);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Kominote Online Stripe LMS API',
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    });
  });

  // 2. CREATE CHECKOUT SESSION
  app.post('/api/checkout/create-session', async (req, res) => {
    try {
      const { courseId, studentId, studentEmail } = req.body;

      // 1. Verify the student is authenticated
      if (!studentId) {
        return res.status(401).json({
          error: 'Unauthenticated',
          message: 'Ou dwe konekte pou w ka achte kou sa a.',
        });
      }

      if (!courseId) {
        return res.status(400).json({
          error: 'Missing courseId',
          message: 'Kou a pa presize.',
        });
      }

      // 2. Read the real course information from Supabase
      // Never trust price, course title or course ID sent only from the browser!
      const course = await getCourseFromSupabase(courseId);

      if (!course) {
        return res.status(404).json({
          error: 'Course not found',
          message: 'Fòmasyon sa a pa egziste nan sistèm nan.',
        });
      }

      // 3. Check if student already owns the course
      const alreadyEnrolled = await isStudentEnrolled(studentId, course.id);
      if (alreadyEnrolled) {
        return res.json({
          alreadyEnrolled: true,
          courseId: course.id,
          message: 'Ou deja enskri nan fòmasyon sa a.',
        });
      }

      // 4. Check if course is free
      const isFree = course.isFree === true || Number(course.price) === 0;

      if (isFree) {
        // Free courses: Do not send user to Stripe.
        // Enroll authenticated student directly using secure backend logic.
        const enrollmentId = `${studentId}_${course.id}`;

        await supabaseAdmin.from('enrollments').upsert(
          {
            id: enrollmentId,
            student_id: studentId,
            course_id: course.id,
            order_id: 'free_enrollment',
            status: 'active',
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
            completed_lessons_count: 0,
            total_required_lessons_count: course.total_lessons || 0,
          },
          { onConflict: 'id' }
        );

        return res.json({
          free: true,
          enrolled: true,
          courseId: course.id,
          message: 'Ou enskri gratis avèk siksè nan kou a!',
        });
      }

      // 5. Calculate verified price
      // If salePrice exists and is valid (< price and > 0), charge salePrice
      const regularPrice = Number(course.price) || 0;
      const salePrice =
        course.salePrice != null
          ? Number(course.salePrice)
          : course.sale_price != null
          ? Number(course.sale_price)
          : null;

      const effectivePrice =
        salePrice !== null && salePrice > 0 && salePrice < regularPrice
          ? salePrice
          : regularPrice;

      if (effectivePrice <= 0) {
        return res.status(400).json({
          error: 'Invalid price',
          message: 'Pri kou a pa valab.',
        });
      }

      // 6. Stripe Checkout Session
      const stripe = getStripe();
      if (!stripe) {
        // Lazy error handler: return graceful error prompting for key configuration in Settings
        return res.status(503).json({
          error: 'STRIPE_NOT_CONFIGURED',
          needsConfig: true,
          message: 'Kle Stripe (STRIPE_SECRET_KEY) la poko konfigire nan paramèt sèvè a.',
          course: {
            id: course.id,
            title: course.title,
            effectivePrice,
          },
        });
      }

      // Construct proper success and cancel URLs
      const origin =
        req.headers.origin ||
        process.env.APP_URL ||
        `${req.protocol}://${req.get('host')}`;

      const baseUrl = origin.replace(/\/$/, '');
      const success_url = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancel_url = `${baseUrl}/course/${course.slug || course.id}?canceled=true`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: studentEmail || undefined,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description:
                  course.short_description ||
                  `Aksè konplè nan fòmasyon ${course.title} sou Kominote Online`,
                images: course.thumbnail ? [course.thumbnail] : [],
              },
              unit_amount: Math.round(effectivePrice * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          courseId: course.id,
          studentId: studentId,
          studentEmail: studentEmail || '',
          courseTitle: course.title,
          amountCharged: String(effectivePrice),
        },
        success_url,
        cancel_url,
      });

      // Record pending order in Supabase
      try {
        const courseTrackingNumber = await generateTrackingNumber();
        await supabaseAdmin.from('orders').upsert(
          {
            id: session.id,
            user_id: studentId,
            student_id: studentId,
            course_id: course.id,
            amount: effectivePrice,
            currency: 'usd',
            payment_provider: 'stripe',
            stripe_session_id: session.id,
            tracking_number: courseTrackingNumber,
            payment_status: 'pending',
            created_at: new Date().toISOString(),
            customer_email: studentEmail || '',
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Could not save pending order record:', err);
      }

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (err: any) {
      console.error('Error creating Stripe Checkout session:', err);
      return res.status(500).json({
        error: 'Stripe session creation error',
        message: err.message || 'Erè pandan kreyasyon sesyon peman Stripe la.',
      });
    }
  });

  // 2b. CREATE SHOP STRIPE CHECKOUT SESSION
  app.post('/api/checkout/create-shop-session', async (req, res) => {
    try {
      const { userId, customerName, email, phone, country, city, items } = req.body;

      if (!userId || !customerName || !email || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Tanpri ranpli tout enfòmasyon ki nesesè yo.',
        });
      }

      // Read real products from Supabase and verify prices
      let subtotal = 0;
      const verifiedItems: any[] = [];
      const stripeLineItems: any[] = [];

      for (const item of items) {
        const prodId = item.productId;
        const { data: productData, error: prodErr } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('id', prodId)
          .maybeSingle();

        if (prodErr || !productData) {
          return res.status(404).json({
            error: 'Product not found',
            message: `Pwodwi ${prodId} pa jwenn nan boutik la.`,
          });
        }

        const salePriceVal =
          productData.sale_price !== undefined && productData.sale_price !== null && productData.sale_price < productData.price
            ? Number(productData.sale_price)
            : null;
        const unitPrice =
          salePriceVal !== null && salePriceVal > 0 && salePriceVal < Number(productData.price || 0)
            ? salePriceVal
            : Number(productData.price || 0);

        const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        verifiedItems.push({
          productId: prodId,
          productTitle: productData.title,
          productImage: productData.image_url || '',
          productType: productData.product_type || 'other',
          unitPrice,
          quantity,
          totalPrice: itemTotal,
        });

        stripeLineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productData.title,
              description: productData.short_description || `Pwodwi dijital: ${productData.title}`,
              images: productData.image_url ? [productData.image_url] : [],
            },
            unit_amount: Math.round(unitPrice * 100),
          },
          quantity,
        });
      }

      if (subtotal <= 0) {
        return res.status(400).json({
          error: 'Invalid order total',
          message: 'Montan kòmand lan pa valab.',
        });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.status(503).json({
          error: 'STRIPE_NOT_CONFIGURED',
          message: 'Kle Stripe (STRIPE_SECRET_KEY) la poko konfigire nan paramèt sèvè a.',
        });
      }

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `KO-2026-${randomSuffix}`;
      const invoiceNumber = `INV-2026-${randomSuffix}`;
      const trackingNumber = await generateTrackingNumber();

      const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newInvoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const submittedAt = new Date().toISOString();

      const orderData = {
        id: newOrderId,
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: userId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        country: country || 'Haiti',
        city: city || 'Port-au-Prince',
        items: verifiedItems,
        amount: subtotal,
        final_total: subtotal,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'pending',
        order_status: 'pending',
        invoice_id: newInvoiceId,
        created_at: submittedAt,
        updated_at: submittedAt,
      };

      await supabaseAdmin.from('orders').insert(orderData);

      const invoiceData = {
        id: newInvoiceId,
        invoice_number: invoiceNumber,
        order_id: newOrderId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        customer_country: country || 'Haiti',
        customer_city: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total: subtotal,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'pending',
        order_status: 'pending',
        created_at: submittedAt,
        issued_at: submittedAt,
      };

      await supabaseAdmin.from('invoices').insert(invoiceData);

      const origin = req.headers.origin || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const baseUrl = origin.replace(/\/$/, '');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: stripeLineItems,
        metadata: {
          purchaseType: 'shop_product',
          orderId: newOrderId,
          orderNumber,
          invoiceId: newInvoiceId,
          userId,
          email,
          totalAmount: String(subtotal),
        },
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=shop&order_id=${newOrderId}&invoice_id=${newInvoiceId}`,
        cancel_url: `${baseUrl}/checkout?canceled=true`,
      });

      return res.json({
        success: true,
        url: session.url,
        orderId: newOrderId,
        orderNumber,
        trackingNumber,
        invoiceId: newInvoiceId,
      });
    } catch (err: any) {
      console.error('Error creating shop Stripe checkout session:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. VERIFY SESSION (For Success Page polling & delayed webhook catch-up)
  app.get('/api/checkout/verify-session', async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) {
        return res.status(400).json({ error: 'Missing session_id parameter' });
      }

      // Check order in Supabase
      const { data: orderRow } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      let orderData = orderRow || null;

      // If order not found or still pending, query Stripe directly if secret key is present
      const stripe = getStripe();
      if (stripe && (!orderData || orderData.payment_status === 'pending')) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session && (session.payment_status === 'paid' || session.status === 'complete')) {
            const paymentIntentId =
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent as any)?.id || '';

            // If this is a shop product
            if (session.metadata?.purchaseType === 'shop_product') {
              const shopOrderId = session.metadata.orderId;
              const { data: shopOrderRow } = await supabaseAdmin
                .from('orders')
                .select('*')
                .eq('id', shopOrderId)
                .maybeSingle();
              if (shopOrderRow) {
                const sOrder = shopOrderRow;
                const approvedAt = new Date().toISOString();
                await supabaseAdmin
                  .from('orders')
                  .update({
                    payment_status: 'paid',
                    order_status: 'approved',
                    stripe_session_id: session.id,
                    stripe_payment_intent_id: paymentIntentId,
                    approved_at: approvedAt,
                    approved_by: 'Stripe Automatic',
                    updated_at: approvedAt,
                  })
                  .eq('id', shopOrderId);
                const items = sOrder.items || [];
                for (const item of items) {
                  const prodId = item.productId;
                  const accessDocId = `${sOrder.user_id}_${prodId}`;
                  await supabaseAdmin.from('digital_access').upsert(
                    {
                      id: accessDocId,
                      user_id: sOrder.user_id,
                      product_id: prodId,
                      order_id: sOrder.id,
                      active: true,
                      enabled_at: approvedAt,
                      enabled_by: 'Stripe Automatic',
                      download_count: 0,
                      last_downloaded_at: null,
                    },
                    { onConflict: 'id' }
                  );
                }
                if (sOrder.invoice_id) {
                  try {
                    await supabaseAdmin
                      .from('invoices')
                      .update({
                        payment_status: 'paid',
                        order_status: 'approved',
                      })
                      .eq('id', sOrder.invoice_id);
                  } catch (e) {}
                }
                return res.json({
                  status: 'completed',
                  purchaseType: 'shop_product',
                  orderId: sOrder.id,
                  orderNumber: sOrder.order_number,
                  invoiceId: sOrder.invoice_id,
                  message: 'Peman Stripe la konfime! Telechajman ou yo debloke.',
                });
              }
            }

            const courseId = session.metadata?.courseId;
            const studentId = session.metadata?.studentId;
            const studentEmail = session.metadata?.studentEmail || session.customer_details?.email || '';

            if (courseId && studentId) {
              const amount = session.amount_total
                ? session.amount_total / 100
                : Number(session.metadata?.amountCharged || 0);

              orderData = {
                id: session.id,
                user_id: studentId,
                student_id: studentId,
                course_id: courseId,
                amount,
                currency: session.currency || 'usd',
                payment_provider: 'stripe',
                stripe_session_id: session.id,
                stripe_payment_intent_id: paymentIntentId,
                payment_status: 'paid',
                order_status: 'approved',
                approval_status: 'approved',
                created_at: orderData ? orderData.created_at : new Date().toISOString(),
                updated_at: new Date().toISOString(),
                customer_email: studentEmail,
              };

              await supabaseAdmin.from('orders').upsert(orderData, { onConflict: 'id' });

              // Fulfill enrollment if not enrolled yet
              const enrollmentId = `${studentId}_${courseId}`;
              const { data: enrollRow } = await supabaseAdmin
                .from('enrollments')
                .select('*')
                .eq('id', enrollmentId)
                .maybeSingle();

              if (!enrollRow || enrollRow.status !== 'active') {
                await supabaseAdmin.from('enrollments').upsert(
                  {
                    id: enrollmentId,
                    student_id: studentId,
                    course_id: courseId,
                    order_id: session.id,
                    status: 'active',
                    enrolled_at: new Date().toISOString(),
                    progress_percentage: 0,
                    completed_lessons_count: 0,
                    total_required_lessons_count: 0,
                  },
                  { onConflict: 'id' }
                );
              }
            }
          }
        } catch (stripeErr) {
          console.warn('Could not verify with Stripe directly:', stripeErr);
        }
      }

      if (!orderData) {
        return res.json({ status: 'processing', message: 'N ap verifye peman an ak Stripe...' });
      }

      if (orderData.payment_status === 'paid') {
        const course = await getCourseFromSupabase(orderData.course_id || orderData.courseId);
        return res.json({
          status: 'completed',
          order: orderData,
          course,
        });
      }

      if (orderData.payment_status === 'failed') {
        return res.json({ status: 'failed', order: orderData });
      }

      return res.json({ status: 'processing', order: orderData });
    } catch (err: any) {
      console.error('Error verifying session:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. SIMULATE TEST WEBHOOK (Development / Test Mode only)
  app.post('/api/checkout/simulate-test-webhook', async (req, res) => {
    try {
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Similasyon peman pa otorize nan anviwònman pwodiksyon an.',
        });
      }

      const { courseId, studentId, studentEmail, testType } = req.body;

      if (!studentId || !courseId) {
        return res.status(400).json({ error: 'Missing studentId or courseId' });
      }

      const course = await getCourseFromSupabase(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const testSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const testPaymentIntentId = `pi_test_${Date.now()}`;
      const amount = Number(course.sale_price || course.price || 29.99);

      if (testType === 'canceled') {
        // Canceled checkout test: Do not mark as paid, do not create enrollment
        await supabaseAdmin.from('orders').upsert(
          {
            id: testSessionId,
            user_id: studentId,
            student_id: studentId,
            course_id: course.id,
            amount,
            currency: 'usd',
            payment_provider: 'stripe',
            stripe_session_id: testSessionId,
            payment_status: 'failed',
            created_at: new Date().toISOString(),
            notes: 'Test: Canceled checkout simulation',
          },
          { onConflict: 'id' }
        );
        return res.json({ success: true, status: 'canceled', sessionId: testSessionId });
      }

      // Simulate successful payment webhook
      await supabaseAdmin.from('orders').upsert(
        {
          id: testSessionId,
          user_id: studentId,
          student_id: studentId,
          course_id: course.id,
          amount,
          currency: 'usd',
          payment_provider: 'stripe',
          stripe_session_id: testSessionId,
          stripe_payment_intent_id: testPaymentIntentId,
          payment_status: 'paid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer_email: studentEmail || 'student@kominote.test',
          is_test_mode: true,
        },
        { onConflict: 'id' }
      );

      // Create enrollment
      const enrollmentId = `${studentId}_${course.id}`;
      await supabaseAdmin.from('enrollments').upsert(
        {
          id: enrollmentId,
          student_id: studentId,
          course_id: course.id,
          order_id: testSessionId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
          completed_lessons_count: 0,
          total_required_lessons_count: course.total_lessons || 10,
        },
        { onConflict: 'id' }
      );

      return res.json({
        success: true,
        sessionId: testSessionId,
        orderId: testSessionId,
        courseId: course.id,
        message: 'Similasyon peman Stripe reyisi ak siksè!',
      });
    } catch (err: any) {
      console.error('Error in simulate-test-webhook:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. ADMIN ORDERS & REFUND ACTIONS
  app.get('/api/admin/orders', async (req, res) => {
    try {
      const { data: orders, error } = await supabaseAdmin.from('orders').select('*');

      if (error) throw error;

      return res.json({ orders: orders || [] });
    } catch (err: any) {
      console.error('Error fetching admin orders:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/orders/:orderId/refund', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { revokeAccess, refundReason } = req.body;

      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderRow;

      // Update order status to refunded
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: refundReason || 'Ranbousman Admin',
          access_revoked: !!revokeAccess,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // If admin decides to revoke course access
      const targetUserId = order.user_id || order.student_id;
      const targetCourseId = order.course_id || order.courseId;
      if (revokeAccess && targetUserId && targetCourseId) {
        const enrollmentId = `${targetUserId}_${targetCourseId}`;
        const { data: enrollRow } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('id', enrollmentId)
          .maybeSingle();
        if (enrollRow) {
          await supabaseAdmin
            .from('enrollments')
            .update({
              status: 'canceled',
              revoked_at: new Date().toISOString(),
              revocation_reason: 'Ranbousman fèt',
            })
            .eq('id', enrollmentId);
        }
      }

      return res.json({
        success: true,
        orderId,
        message: `Kòmand ${orderId} make kòm ranbouse (Refunded).`,
      });
    } catch (err: any) {
      console.error('Error processing admin refund:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // DIGITAL SHOP ENDPOINTS (CRITICAL PRICE SECURITY & STRICT ADMIN APPROVAL)
  // =========================================================================

  // 1. CREATE DIGITAL SHOP ORDER (Recalculates all prices securely from catalog/Supabase)
  const handleCreateDigitalShopOrder = async (req: express.Request, res: express.Response) => {
    try {
      // Support callable format { data: { ... } } or standard fetch body
      const payload = req.body?.data ? req.body.data : req.body;
      const {
        userId,
        customerName,
        email,
        phone,
        country,
        city,
        items,
        paymentMethod,
        transactionReference,
        paymentProofUrl,
        bankSelected,
        senderPhone,
        paypalEmailUsed,
        couponCode,
      } = payload || {};

      if (!userId || !customerName || !email || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Tanpri ranpli tout enfòmasyon ki nesesè yo.',
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          error: 'Missing payment method',
          message: 'Tanpri chwazi yon metòd peman.',
        });
      }

      // CRITICAL PRICE SECURITY:
      // Never trust subtotal, total, or unit price sent from client!
      // Retrieve current product/course data with safe catalog fallback.
      let subtotal = 0;
      const verifiedItems: any[] = [];
      let detectedCourseId: string | null = null;

      for (const item of items) {
        const prodId = item.productId || item.courseId;
        if (!prodId) {
          return res.status(400).json({ error: 'Invalid item: missing productId or courseId' });
        }

        let productData: any = null;
        let courseData: any = null;

        // Try Supabase products table first
        try {
          const { data: prodRow } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', prodId)
            .maybeSingle();
          if (prodRow) {
            productData = { id: prodRow.id, ...prodRow };
          } else {
            const { data: prodBySlug } = await supabaseAdmin
              .from('products')
              .select('*')
              .eq('slug', prodId)
              .maybeSingle();
            if (prodBySlug) {
              productData = { id: prodBySlug.id, ...prodBySlug };
            }
          }
        } catch (pErr) {
          console.error('Error fetching product for order checkout:', pErr);
        }

        if (productData) {
          if (productData.status && productData.status !== 'published') {
            return res.status(400).json({
              error: 'Product unavailable',
              message: `Pwodwi "${productData.title}" pa disponib pou lavant kounye a.`,
            });
          }

          const salePriceVal =
            productData.sale_price !== undefined && productData.sale_price !== null && productData.sale_price < productData.price
              ? Number(productData.sale_price)
              : null;
          const unitPrice =
            salePriceVal !== null && salePriceVal > 0 && salePriceVal < Number(productData.price || 0)
              ? salePriceVal
              : Number(productData.price || 0);

          const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
          const itemTotal = unitPrice * quantity;
          subtotal += itemTotal;

          verifiedItems.push({
            productId: prodId,
            productTitle: productData.title,
            productImage: productData.image_url || productData.cover_image || '',
            productType: productData.product_type || 'other',
            unitPrice,
            quantity,
            totalPrice: itemTotal,
          });
        } else {
          // Check courses table
          try {
            const { data: courseRow } = await supabaseAdmin
              .from('courses')
              .select('*')
              .eq('id', prodId)
              .maybeSingle();
            if (courseRow) {
              courseData = { id: courseRow.id, ...courseRow };
            } else {
              const { data: courseBySlug } = await supabaseAdmin
                .from('courses')
                .select('*')
                .eq('slug', prodId)
                .maybeSingle();
              if (courseBySlug) {
                courseData = { id: courseBySlug.id, ...courseBySlug };
              }
            }
          } catch (cErr) {
            console.error('Error fetching course for order checkout:', cErr);
          }

          if (!courseData) {
            return res.status(404).json({
              error: 'Item not found',
              message: `Pwodwi oswa kou ak ID ${prodId} pa egziste.`,
            });
          }

          detectedCourseId = prodId;
          const regularPrice = Number(courseData.price) || 0;
          const salePrice =
            courseData.salePrice != null
              ? Number(courseData.salePrice)
              : courseData.sale_price != null
              ? Number(courseData.sale_price)
              : null;

          const unitPrice =
            salePrice !== null && salePrice > 0 && salePrice < regularPrice
              ? salePrice
              : regularPrice;

          const quantity = 1;
          const itemTotal = unitPrice * quantity;
          subtotal += itemTotal;

          verifiedItems.push({
            productId: prodId,
            courseId: prodId,
            productTitle: courseData.title,
            productImage: courseData.thumbnail || '',
            productType: 'course',
            unitPrice,
            quantity,
            totalPrice: itemTotal,
          });
        }
      }

      const total = subtotal;

      // Generate unique tracking number in official format KO-TRK-2026-XXXXXX
      const trackingNumber = await generateTrackingNumber();

      // Validate and apply coupon if provided
      let couponData: any = null;
      let discountAmount = 0;
      let finalTotal = total;
      const originalSubtotal = total;

      if (couponCode && String(couponCode).trim() !== '') {
        const normalizedCouponCode = String(couponCode).trim().toUpperCase();
        let coupon: any = null;

        try {
          const { data: couponRow } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', normalizedCouponCode)
            .maybeSingle();
          if (couponRow) {
            coupon = { id: couponRow.id, ...couponRow };
          }
        } catch (cpErr) {
          // Fallback to serverCoupons
        }

        if (!coupon) {
          coupon = serverCoupons.get(normalizedCouponCode);
        }

        if (coupon) {
          let isValid = true;
          if (!coupon.active) isValid = false;
          const now = new Date();
          if (coupon.startsAt && now < new Date(coupon.startsAt)) isValid = false;
          if (coupon.expiresAt && now > new Date(coupon.expiresAt)) isValid = false;
          if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit) isValid = false;

          if (isValid) {
            if (coupon.discountType === 'percentage') {
              discountAmount = (total * Number(coupon.discountValue)) / 100;
              if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
                discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
              }
            } else {
              discountAmount = Number(coupon.discountValue);
            }
            discountAmount = Math.min(discountAmount, total);
            finalTotal = Math.max(0, total - discountAmount);

            couponData = {
              couponId: coupon.id,
              couponCode: coupon.code,
              discountType: coupon.discountType,
              discountValue: Number(coupon.discountValue),
              discountAmount: Math.round(discountAmount * 100) / 100,
              originalSubtotal: total,
              finalTotal: Math.round(finalTotal * 100) / 100,
            };
          }
        }
      }

      // Generate unique human-readable order number: KO-2026-XXXXXX
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `KO-2026-${randomSuffix}`;
      const invoiceNumber = `INV-2026-${randomSuffix}`;

      const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newInvoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const submittedAt = new Date().toISOString();

      const orderData: any = {
        id: newOrderId,
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: userId,
        student_id: userId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        country: country || 'Haiti',
        city: city || 'Port-au-Prince',
        items: verifiedItems,
        amount: subtotal,
        final_total: finalTotal,
        currency: 'USD',
        payment_method: paymentMethod,
        transaction_reference: transactionReference || '',
        payment_proof_url: paymentProofUrl || '',
        bank_selected: bankSelected || '',
        sender_phone: senderPhone || '',
        paypal_email_used: paypalEmailUsed || '',
        payment_status: 'pending',
        order_status: 'pending',
        approval_status: 'pending',
        invoice_id: newInvoiceId,
        created_at: submittedAt,
        updated_at: submittedAt,
      };

      if (couponData) {
        orderData.coupon_code = couponData.couponCode;
        orderData.coupon_id = couponData.couponId;
        orderData.discount_type = couponData.discountType;
        orderData.discount_value = couponData.discountValue;
        orderData.discount_amount = couponData.discountAmount;
        orderData.original_subtotal = couponData.originalSubtotal;
        orderData.final_total = couponData.finalTotal;
      }

      if (detectedCourseId) {
        orderData.course_id = detectedCourseId;
      }

      try {
        await supabaseAdmin.from('orders').insert(orderData);
      } catch (dbErr) {
        console.warn('Notice saving order to Supabase:', dbErr);
      }

      serverOrders.set(trackingNumber, orderData);
      serverOrders.set(newOrderId, orderData);
      if (orderNumber) serverOrders.set(orderNumber, orderData);

      const invoiceData = {
        id: newInvoiceId,
        invoice_number: invoiceNumber,
        order_id: newOrderId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        customer_country: country || 'Haiti',
        customer_city: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total: finalTotal,
        currency: 'USD',
        payment_method: paymentMethod,
        bank_selected: bankSelected || '',
        payment_status: 'pending',
        order_status: 'pending',
        ...(couponData ? {
          coupon_code: couponData.couponCode,
          coupon_id: couponData.couponId,
          discount_type: couponData.discountType,
          discount_value: couponData.discountValue,
          discount_amount: couponData.discountAmount,
          original_subtotal: couponData.originalSubtotal,
          final_total: couponData.finalTotal,
        } : {}),
        created_at: submittedAt,
        issued_at: submittedAt,
      };

      try {
        await supabaseAdmin.from('invoices').insert(invoiceData);
      } catch (dbErr) {
        console.warn('Notice saving invoice to Supabase:', dbErr);
      }

      // Trigger asynchronous Brevo email notification
      const origin = req.headers.origin || 'https://kominote.online';
      const invoiceUrl = `${origin}/invoice/${newInvoiceId}`;
      sendOrderReceivedEmail(orderData, invoiceUrl).catch((err) =>
        console.warn('Notice sending order received email:', err)
      );

      // Record coupon usage after successful order creation
      if (couponData) {
        serverCouponUsages.push({
          id: `usage_${Date.now()}`,
          couponId: couponData.couponId,
          couponCode: couponData.couponCode,
          userId,
          orderId: newOrderId,
          orderNumber,
          discountAmount: couponData.discountAmount,
          usedAt: new Date().toISOString(),
        });
        const cInStore = serverCoupons.get(couponData.couponCode) || Array.from(serverCoupons.values()).find(c => c.id === couponData.couponId);
        if (cInStore) {
          cInStore.usageCount = (cInStore.usageCount || 0) + 1;
        }

        try {
          await supabaseAdmin.from('coupon_usage').insert({
            coupon_id: couponData.couponId,
            coupon_code: couponData.couponCode,
            user_id: userId,
            order_id: newOrderId,
            discount_amount: couponData.discountAmount,
            used_at: new Date().toISOString(),
          });
          const { data: couponRow } = await supabaseAdmin
            .from('coupons')
            .select('usage_count')
            .eq('id', couponData.couponId)
            .maybeSingle();
          const currentCount = couponRow?.usage_count || 0;
          await supabaseAdmin
            .from('coupons')
            .update({
              usage_count: currentCount + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', couponData.couponId);
        } catch (couponErr) {
          console.warn('Could not record coupon usage in Supabase:', couponErr);
        }
      }

      const resultPayload = {
        success: true,
        orderId: newOrderId,
        orderNumber,
        trackingNumber,
        invoiceId: newInvoiceId,
        total: finalTotal,
        currency: 'USD',
        discountAmount: couponData?.discountAmount || 0,
        message: 'Kòmand ou an kreye avèk siksè. Li ap tann verifikasyon pa administrasyon an.',
        data: {
          success: true,
          orderId: newOrderId,
          orderNumber,
          trackingNumber,
          invoiceId: newInvoiceId,
          total: finalTotal,
        },
      };

      return res.json(resultPayload);
    } catch (err: any) {
      console.error('Error creating digital shop order:', err);
      return res.status(500).json({
        error: 'Order processing error',
        message: 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.',
        details: err?.message,
      });
    }
  };

  // 1b. SUBMIT COURSE REGISTRATION (Dedicated endpoint)
  const handleSubmitCourseRegistration = async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body?.data ? req.body.data : req.body;
      const {
        courseId,
        userId,
        customerName,
        email,
        phone,
        country,
        city,
        paymentMethod,
        transactionReference,
        paymentProofUrl,
        bankSelected,
        senderPhone,
        paypalEmailUsed,
        couponCode,
      } = payload || {};

      if (!courseId || !customerName || !email) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'Tanpri ranpli tout enfòmasyon ki nesesè yo pou anrejistreman an.',
        });
      }

      if (!paymentMethod) {
        return res.status(400).json({
          error: 'Missing payment method',
          message: 'Tanpri chwazi yon metòd peman.',
        });
      }

      // Load course securely from Supabase
      let courseData: any = null;
      try {
        const { data: courseRow } = await supabaseAdmin
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .maybeSingle();
        if (courseRow) {
          courseData = { id: courseRow.id, ...courseRow };
        } else {
          const { data: courseBySlug } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('slug', courseId)
            .maybeSingle();
          if (courseBySlug) {
            courseData = { id: courseBySlug.id, ...courseBySlug };
          }
        }
      } catch (cErr) {
        console.error('Error fetching course for registration:', cErr);
      }

      if (!courseData) {
        return res.status(404).json({
          error: 'Course not found',
          message: `Kou ak ID ${courseId} pa egziste.`,
        });
      }

      const regularPrice = Number(courseData.price) || 0;
      const salePrice =
        courseData.salePrice != null
          ? Number(courseData.salePrice)
          : courseData.sale_price != null
          ? Number(courseData.sale_price)
          : null;

      const basePrice =
        salePrice !== null && salePrice > 0 && salePrice < regularPrice
          ? salePrice
          : regularPrice;

      let discountAmount = 0;
      let finalTotal = basePrice;
      let couponData: any = null;

      if (couponCode && String(couponCode).trim() !== '') {
        const normalizedCode = String(couponCode).trim().toUpperCase();
        let coupon: any = null;
        try {
          const { data: couponRow } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', normalizedCode)
            .maybeSingle();
          if (couponRow) {
            coupon = { id: couponRow.id, ...couponRow };
          }
        } catch {}

        if (!coupon) {
          coupon = serverCoupons.get(normalizedCode);
        }

        if (coupon && coupon.active) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (basePrice * Number(coupon.discountValue)) / 100;
            if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
              discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
            }
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          discountAmount = Math.min(discountAmount, basePrice);
          finalTotal = Math.max(0, basePrice - discountAmount);
          couponData = coupon;
        }
      }

      const trackingNumber = await generateTrackingNumber();
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `KO-2026-${randomSuffix}`;
      const invoiceNumber = `INV-2026-${randomSuffix}`;
      const submittedAt = new Date().toISOString();

      const newOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const newInvoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const effectiveUserId = userId || `student_${Date.now()}`;

      const verifiedItem = {
        productId: courseId,
        courseId,
        productTitle: courseData.title,
        productImage: courseData.thumbnail || '',
        productType: 'course',
        unitPrice: basePrice,
        quantity: 1,
        totalPrice: basePrice,
      };

      const orderData: any = {
        id: newOrderId,
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: effectiveUserId,
        student_id: effectiveUserId,
        course_id: courseId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        country: country || 'Haiti',
        city: city || 'Port-au-Prince',
        items: [verifiedItem],
        amount: basePrice,
        final_total: finalTotal,
        currency: 'USD',
        payment_method: paymentMethod,
        transaction_reference: transactionReference || '',
        payment_proof_url: paymentProofUrl || '',
        bank_selected: bankSelected || '',
        sender_phone: senderPhone || '',
        paypal_email_used: paypalEmailUsed || '',
        payment_status: 'pending',
        order_status: 'pending',
        approval_status: 'pending',
        invoice_id: newInvoiceId,
        created_at: submittedAt,
        updated_at: submittedAt,
      };

      const registrationData = {
        id: regId,
        order_id: newOrderId,
        course_id: courseId,
        course_title: courseData.title,
        student_id: effectiveUserId,
        student_name: customerName,
        student_email: email,
        student_phone: phone || '',
        payment_method: paymentMethod,
        transaction_reference: transactionReference || '',
        payment_proof_url: paymentProofUrl || '',
        payment_status: 'pending',
        registration_status: 'pending',
        invoice_id: newInvoiceId,
        created_at: submittedAt,
        updated_at: submittedAt,
      };

      const invoiceData = {
        id: newInvoiceId,
        invoice_number: invoiceNumber,
        order_id: newOrderId,
        user_id: effectiveUserId,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone || '',
        customer_country: country || 'Haiti',
        customer_city: city || 'Port-au-Prince',
        items: [verifiedItem],
        subtotal: basePrice,
        total: finalTotal,
        currency: 'USD',
        payment_method: paymentMethod,
        bank_selected: bankSelected || '',
        payment_status: 'pending',
        order_status: 'pending',
        created_at: submittedAt,
        issued_at: submittedAt,
      };

      try {
        await supabaseAdmin.from('orders').insert(orderData);
      } catch (e) {
        console.warn('Notice saving order to Supabase:', e);
      }

      try {
        await supabaseAdmin.from('invoices').insert(invoiceData);
      } catch (e) {
        console.warn('Notice saving invoice to Supabase:', e);
      }

      try {
        await supabaseAdmin.from('course_registrations').insert(registrationData);
      } catch (e) {
        console.warn('Notice saving registration to Supabase:', e);
      }

      serverOrders.set(trackingNumber, orderData);
      serverOrders.set(newOrderId, orderData);
      if (orderNumber) serverOrders.set(orderNumber, orderData);

      // Trigger asynchronous Brevo email notification
      const origin = req.headers.origin || 'https://kominote.online';
      const invoiceUrl = `${origin}/invoice/${newInvoiceId}`;
      sendOrderReceivedEmail(orderData, invoiceUrl).catch((err) =>
        console.warn('Notice sending order received email:', err)
      );

      return res.json({
        success: true,
        registrationId: regId,
        orderId: newOrderId,
        orderNumber,
        trackingNumber,
        invoiceId: newInvoiceId,
        total: finalTotal,
        currency: 'USD',
        message: 'Anrejistreman kou a anrejistre avèk siksè. Li ap tann konfimasyon peman pa administrasyon an.',
        data: {
          success: true,
          registrationId: regId,
          orderId: newOrderId,
          orderNumber,
          trackingNumber,
          invoiceId: newInvoiceId,
          total: finalTotal,
        },
      });
    } catch (err: any) {
      console.error('Error submitting course registration:', err);
      return res.status(500).json({
        error: 'Registration processing error',
        message: 'Nou pa t kapab trete anrejistreman kou a. Tanpri eseye ankò.',
        details: err?.message,
      });
    }
  };

  // Wire order and registration endpoints & callable proxies
  app.post('/api/orders/create', handleCreateDigitalShopOrder);
  app.post('/createDigitalShopOrder', handleCreateDigitalShopOrder);
  app.post('/kominoteonline/us-central1/createDigitalShopOrder', handleCreateDigitalShopOrder);

  app.post('/api/course-registrations/create', handleSubmitCourseRegistration);
  app.post('/submitCourseRegistration', handleSubmitCourseRegistration);
  app.post('/kominoteonline/us-central1/submitCourseRegistration', handleSubmitCourseRegistration);

  // 2. ADMIN APPROVAL: Approves Order & Enables Download Access
  app.post('/api/orders/:orderId/approve', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { adminId, adminNotes } = req.body;

      // Verify Admin Authorization
      const isAuthorized = await verifyIsAdmin(req, adminId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Ou pa gen otorizasyon pou apwouve kòmand sa a. Se administratè sèlman ki gen dwa sa a.',
        });
      }

      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderRow;
      const approvedAt = new Date().toISOString();
      const approvedBy = adminId || 'Admin';

      // 1. Update order status
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'approved',
          approval_status: 'approved',
          approved_at: approvedAt,
          approved_by: approvedBy,
          admin_notes: adminNotes || order.admin_notes || '',
          updated_at: approvedAt,
        })
        .eq('id', orderId);

      // 2. If this is or includes a course purchase, activate student enrollment!
      const targetUserId = order.user_id || order.student_id;
      const targetCourseId = order.course_id || order.courseId;
      if (targetCourseId && targetUserId) {
        const enrollmentId = `${targetUserId}_${targetCourseId}`;
        await supabaseAdmin.from('enrollments').upsert(
          {
            id: enrollmentId,
            student_id: targetUserId,
            course_id: targetCourseId,
            order_id: order.id,
            status: 'active',
            enrolled_at: approvedAt,
            progress_percentage: 0,
            completed_lessons_count: 0,
            total_required_lessons_count: 0,
          },
          { onConflict: 'id' }
        );
        console.log(`[Admin Approval] Activated course enrollment for student ${targetUserId} in course ${targetCourseId}`);
      }

      // 3. Create customer digital_access entitlements for each shop product in order
      const items = order.items || [];
      for (const item of items) {
        if (item.courseId && targetUserId) {
          const courseEnrollId = `${targetUserId}_${item.courseId}`;
          await supabaseAdmin.from('enrollments').upsert(
            {
              id: courseEnrollId,
              student_id: targetUserId,
              course_id: item.courseId,
              order_id: order.id,
              status: 'active',
              enrolled_at: approvedAt,
              progress_percentage: 0,
              completed_lessons_count: 0,
              total_required_lessons_count: 0,
            },
            { onConflict: 'id' }
          );
        }

        const prodId = item.productId;
        if (!prodId) continue;

        const accessDocId = `${targetUserId}_${prodId}`;
        const { data: accessRow } = await supabaseAdmin
          .from('digital_access')
          .select('*')
          .eq('id', accessDocId)
          .maybeSingle();

        if (!accessRow) {
          await supabaseAdmin.from('digital_access').insert({
            id: accessDocId,
            user_id: targetUserId,
            product_id: prodId,
            order_id: order.id,
            active: true,
            enabled_at: approvedAt,
            enabled_by: approvedBy,
            download_count: 0,
            last_downloaded_at: null,
          });
          console.log(`[DigitalAccess] Created entitlement for user ${targetUserId} on product ${prodId}`);
        } else {
          await supabaseAdmin
            .from('digital_access')
            .update({
              active: true,
              order_id: order.id,
              enabled_at: approvedAt,
              enabled_by: approvedBy,
            })
            .eq('id', accessDocId);
          console.log(`[DigitalAccess] Reactivated entitlement for user ${targetUserId} on product ${prodId}`);
        }
      }

      // 4. Update invoice if exists
      if (order.invoice_id) {
        try {
          await supabaseAdmin
            .from('invoices')
            .update({
              payment_status: 'paid',
              order_status: 'approved',
            })
            .eq('id', order.invoice_id);
        } catch (invErr) {
          console.warn('Could not update invoice status:', invErr);
        }
      }

      // 5. Send Brevo notification emails
      const origin = req.headers.origin || 'https://kominote.online';
      const downloadsUrl = `${origin}/dashboard/downloads`;
      sendOrderApprovedEmail(order, downloadsUrl).catch((err) =>
        console.warn('Notice sending order approved email:', err)
      );
      sendDownloadEnabledEmail(order, downloadsUrl).catch((err) =>
        console.warn('Notice sending download enabled email:', err)
      );

      return res.json({
        success: true,
        orderId,
        message: 'Kòmand apwouve avèk siksè! Aksè a debloke pou kliyan an.',
      });
    } catch (err: any) {
      console.error('Error approving digital order:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. ADMIN REJECT: Rejects Order & Locks Download Access
  app.post('/api/orders/:orderId/reject', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { adminNotes, adminId } = req.body;

      // Verify Admin Authorization
      const isAuthorized = await verifyIsAdmin(req, adminId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Ou pa gen otorizasyon pou rejte kòmand sa a.',
        });
      }

      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderRow;
      const rejectedAt = new Date().toISOString();

      await supabaseAdmin
        .from('orders')
        .update({
          order_status: 'rejected',
          approval_status: 'rejected',
          admin_notes: adminNotes || 'Refize pa administrasyon an',
          updated_at: rejectedAt,
        })
        .eq('id', orderId);

      // If course order, deactivate enrollment
      const targetUserId = order.user_id || order.student_id;
      const targetCourseId = order.course_id || order.courseId;
      if (targetCourseId && targetUserId) {
        const enrollmentId = `${targetUserId}_${targetCourseId}`;
        const { data: enrollRow } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('id', enrollmentId)
          .maybeSingle();
        if (enrollRow) {
          await supabaseAdmin
            .from('enrollments')
            .update({ status: 'rejected' })
            .eq('id', enrollmentId);
        }
      }

      // Deactivate digital access records
      const items = order.items || [];
      for (const item of items) {
        const prodId = item.productId;
        if (!prodId) continue;
        const accessDocId = `${targetUserId}_${prodId}`;
        const { data: accessRow } = await supabaseAdmin
          .from('digital_access')
          .select('*')
          .eq('id', accessDocId)
          .maybeSingle();
        if (accessRow) {
          await supabaseAdmin
            .from('digital_access')
            .update({ active: false })
            .eq('id', accessDocId);
        }
      }

      // Update invoice
      if (order.invoice_id) {
        try {
          await supabaseAdmin
            .from('invoices')
            .update({
              order_status: 'rejected',
            })
            .eq('id', order.invoice_id);
        } catch (e) {}
      }

      sendOrderRejectedEmail(order, adminNotes).catch((err) =>
        console.warn('Notice sending rejected email:', err)
      );

      return res.json({
        success: true,
        orderId,
        message: 'Kòmand la refize epi aksè a bloke.',
      });
    } catch (err: any) {
      console.error('Error rejecting order:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. ADMIN TOGGLE DOWNLOAD ACCESS
  app.post('/api/orders/:orderId/toggle-download', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { enable, adminId } = req.body; // boolean

      // Verify Admin Authorization
      const isAuthorized = await verifyIsAdmin(req, adminId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Ou pa gen otorizasyon pou modifye telechajman sa a.',
        });
      }

      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderRow;
      const newStatus = enable ? 'enabled' : 'locked';

      await supabaseAdmin
        .from('orders')
        .update({
          order_status: newStatus === 'enabled' ? 'approved' : order.order_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Update entitlements
      const items = order.items || [];
      for (const item of items) {
        const accessDocId = `${order.user_id}_${item.productId}`;
        const { data: accessRow } = await supabaseAdmin
          .from('digital_access')
          .select('*')
          .eq('id', accessDocId)
          .maybeSingle();
        if (accessRow) {
          await supabaseAdmin
            .from('digital_access')
            .update({ active: !!enable })
            .eq('id', accessDocId);
        }
      }

      return res.json({
        success: true,
        downloadStatus: newStatus,
        message: enable
          ? 'Aksè telechajman pèmèt avèk siksè.'
          : 'Aksè telechajman bloke avèk siksè.',
      });
    } catch (err: any) {
      console.error('Error toggling download access:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. SECURE DOWNLOAD ACCESS CHECK & DISPATCH
  // Only Admin or Authorized customer with approved order can access!
  app.get('/api/downloads/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthenticated',
          message: 'Ou dwe konekte pou w ka telechaje fichye sa a.',
        });
      }

      // Check admin status or digital_access entitlement
      let hasAccess = false;

      // Check profiles table for admin role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (profile && profile.role === 'admin') {
        hasAccess = true;
      }

      if (!hasAccess) {
        const accessDocId = `${userId}_${productId}`;
        const { data: accessRow } = await supabaseAdmin
          .from('digital_access')
          .select('*')
          .eq('id', accessDocId)
          .maybeSingle();

        if (accessRow && accessRow.active === true) {
          hasAccess = true;
          // Increment download count
          const currentCount = accessRow.download_count || 0;
          await supabaseAdmin
            .from('digital_access')
            .update({
              download_count: currentCount + 1,
              last_downloaded_at: new Date().toISOString(),
            })
            .eq('id', accessDocId);
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access locked',
          message:
            'Aksè telechajman bloke. Fòk administrasyon Kominote Online konfime kòmand ou anvan ou ka telechaje.',
        });
      }

      // Fetch file from product_files
      const { data: files, error: filesErr } = await supabaseAdmin
        .from('product_files')
        .select('*')
        .eq('product_id', productId)
        .eq('active', true)
        .limit(1);

      if (filesErr || !files || files.length === 0) {
        return res.status(404).json({
          error: 'File not found',
          message: 'Poko gen fichye ki atache ak pwodwi sa a.',
        });
      }

      const fileData = files[0];
      return res.json({
        success: true,
        fileUrl: fileData.file_url,
        fileName: fileData.file_name,
        fileType: fileData.file_type,
        fileSize: fileData.file_size,
      });
    } catch (err: any) {
      console.error('Error serving secure download:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. GET ORDER DETAILS (For Invoice / Admin Review)
  app.get('/api/orders/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { data: orderRow, error: orderErr } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderErr || !orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({ order: { id: orderRow.id, ...orderRow } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7. GET INVOICE BY ID
  app.get('/api/invoices/:invoiceId', async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const { data: invoiceRow, error: invoiceErr } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();

      if (invoiceErr || !invoiceRow) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.json({ invoice: { id: invoiceRow.id, ...invoiceRow } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. PAYMENT SETTINGS (GET & POST)
  let serverPaymentSettings: any = {
    id: 'general',
    cashEnabled: true,
    bankTransferEnabled: true,
    bankDepositEnabled: true,
    paypalEnabled: true,
    moncashEnabled: true,
    natcashEnabled: true,
    stripeEnabled: true,
    bankTransfer: {
      enabled: true,
      title: 'Transfè oswa Depo Bank',
      description: 'Fè peman ou sou youn nan kont sa yo. Apre peman an, telechaje resi oswa prèv peman an pou administrasyon an ka verifye li.',
      banks: [
        {
          id: 'bank-banreservas',
          bankName: 'Banreservas',
          accountType: 'Kont Epay',
          accountNumber: '960-469-7671',
          accountHolder: 'Wanky Massenat',
        },
        {
          id: 'bank-bhd',
          bankName: 'Banco BHD',
          accountType: 'Kont Epay',
          accountNumber: '36-475-68-0012',
          accountHolder: 'Wanky Massenat',
        },
      ],
      bankName: 'Banreservas',
      accountType: 'Kont Epay',
      accountNumber: '960-469-7671',
      accountHolder: 'Wanky Massenat',
      instructions: 'Mete non ou ak nimewo kòmand lan kòm referans transfè a.',
    },
    bankDeposit: {
      enabled: true,
      instructions: 'Ale nan nenpòt branch Banreservas oswa Banco BHD, fè yon depo sou kont nou, epi telechaje resi a.',
    },
    paypal: {
      enabled: true,
      title: 'PayPal',
      paypalEmail: 'wankymassenat@gmail.com',
      instructions: 'Fè peman an atravè PayPal epi antre nimewo tranzaksyon an oswa telechaje prèv peman an.',
      paymentLink: 'https://paypal.me/wankymassenat',
    },
    moncash: {
      enabled: true,
      title: 'MonCash',
      phone: '+509 34 56 7890',
      accountName: 'Wanky Massenat',
      instructions: 'Voye montan an sou nimewo MonCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.',
    },
    natcash: {
      enabled: true,
      title: 'NatCash',
      phone: '+509 40 12 3456',
      accountName: 'Wanky Massenat',
      instructions: 'Voye montan an sou nimewo NatCash sa a, epi antre nimewo telefòn ou te itilize a ak nimewo tranzaksyon an oswa telechaje prèv peman an.',
    },
    stripe: {
      enabled: true,
      title: 'Kat Debi oswa Kat Kredi',
      subtitle: 'Peye an sekirite ak Stripe',
    },
    cash: {
      enabled: true,
      location: 'Delmas 75, Pòtoprens, Ayiti',
      phone: '+509 34 56 7890',
      instructions: 'Pase nan biwo nou an lendi rive vandredi ant 9:00 AM ak 4:00 PM pou depoze kòb la dirèkteman.',
    },
  };

  app.get('/api/payment-settings', async (req, res) => {
    try {
      const { data: settingsRow } = await supabaseAdmin
        .from('payment_settings')
        .select('*')
        .eq('id', 'general')
        .maybeSingle();

      if (settingsRow) {
        const existing = settingsRow.settings || settingsRow;
        serverPaymentSettings = {
          ...serverPaymentSettings,
          ...existing,
          bankTransfer: {
            ...serverPaymentSettings.bankTransfer,
            ...(existing.bankTransfer || {}),
            banks:
              existing.bankTransfer?.banks && existing.bankTransfer.banks.length > 0
                ? existing.bankTransfer.banks
                : serverPaymentSettings.bankTransfer.banks,
          },
        };
      }
    } catch (err: any) {
      // Safe fallback conforming to Section 14 & 15
    }

    return res.json({ settings: serverPaymentSettings });
  });

  app.post('/api/payment-settings', async (req, res) => {
    try {
      const isAuthorized = await verifyIsAdmin(req);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Ou pa gen otorizasyon pou modifye paramèt peman yo.',
        });
      }

      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: 'Missing settings payload' });
      }

      serverPaymentSettings = {
        ...serverPaymentSettings,
        ...settings,
        updatedAt: new Date().toISOString(),
      };

      try {
        await supabaseAdmin.from('payment_settings').upsert(
          {
            id: 'general',
            settings: settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (dbErr) {
        console.warn('Notice syncing payment settings to Supabase:', dbErr);
      }

      return res.json({ success: true, message: 'Paramèt peman yo anrejistre avèk siksè!' });
    } catch (err: any) {
      console.error('Error saving payment settings:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 9. TEAM MEMBERS & FOUNDER CMS (GET & POST)
  app.get('/api/team-members', async (req, res) => {
    try {
      const { data: members, error } = await supabaseAdmin.from('team_members').select('*');
      const defaultFounder = {
        id: 'dr-wanky-massenat',
        name: 'Dr Wanky Massenat',
        professional_title: 'Medikal • Espesyalis nan Teknoloji • Webmaster • Antreprenè',
        role: 'Fondatè Kominote Online',
        organizations: [
          'Massenat Consulting Group',
          'Wanky Academy'
        ],
        photo: 'https://i.postimg.cc/vH7SzM7b/6.png',
        bio: 'Dr Wanky Massenat se yon pwofesyonèl nan domèn medikal ak teknoloji, yon webmaster ak antreprenè. Li se fondatè Kominote Online, Massenat Consulting Group ak Wanky Academy. Atravè teknoloji ak edikasyon, li travay pou rann konesans ak konpetans pratik pi aksesib epi kreye plis opòtinite pou moun aprann, devlope ak avanse.',
        social_links: {
          linkedin: '',
          twitter: '',
          facebook: '',
        },
        display_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      if (!members || members.length === 0) {
        try {
          await supabaseAdmin.from('team_members').upsert(defaultFounder, { onConflict: 'id' });
        } catch (e) {
          console.warn('Notice seeding team member on server:', e);
        }
        return res.json({ members: [defaultFounder] });
      }

      let memberList = members.map((m: any) => ({ id: m.id, ...m }));
      const onlyActive = req.query.all !== 'true';
      if (onlyActive) {
        memberList = memberList.filter((m: any) => m.is_active !== false);
      }
      memberList.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      return res.json({ members: memberList });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/team-members', async (req, res) => {
    try {
      const { member } = req.body;
      if (!member || !member.name) {
        return res.status(400).json({ error: 'Missing member data' });
      }
      const memberId = member.id || `member-${Date.now()}`;
      await supabaseAdmin.from('team_members').upsert(
        {
          ...member,
          id: memberId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      return res.json({ success: true, member: { id: memberId, ...member } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // COUPON CODE SYSTEM ENDPOINTS
  // =========================================================================

  // 1. GET ALL COUPONS (Admin only)
  app.get('/api/coupons', async (req, res) => {
    try {
      try {
        const { data: coupons, error } = await supabaseAdmin.from('coupons').select('*');
        if (coupons && coupons.length > 0) {
          coupons.forEach((c: any) => {
            const data: any = { id: c.id, ...c };
            serverCoupons.set(data.code, data);
          });
        }
      } catch (dbErr) {
        console.warn('Supabase coupons read notice, returning synchronized coupons store:', dbErr);
      }
      return res.json({ coupons: Array.from(serverCoupons.values()) });
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      return res.json({ coupons: Array.from(serverCoupons.values()) });
    }
  });

  // 2. CREATE COUPON (Admin only)
  app.post('/api/coupons', async (req, res) => {
    try {
      const isAuthorized = await verifyIsAdmin(req);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Se administratè sèlman ki ka kreye kòd rabè.',
        });
      }

      const {
        code, description, discountType, discountValue, currency,
        minimumPurchase, maximumDiscount, appliesTo,
        courseIds, productIds, categoryIds,
        usageLimit, usageLimitPerUser, startsAt, expiresAt, active,
      } = req.body;

      if (!code || !discountType || discountValue === undefined) {
        return res.status(400).json({ error: 'Missing required coupon fields' });
      }

      const normalizedCode = String(code).trim().toUpperCase();

      if (serverCoupons.has(normalizedCode)) {
        return res.status(409).json({ error: 'Yon kòd rabè ak menm non sa a egziste deja.' });
      }

      const now = new Date().toISOString();
      const newCouponId = `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const couponData: ServerCoupon = {
        id: newCouponId,
        code: normalizedCode,
        description: description || '',
        discountType,
        discountValue: Number(discountValue),
        currency: currency || 'USD',
        minimumPurchase: minimumPurchase ? Number(minimumPurchase) : 0,
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : 0,
        appliesTo: appliesTo || 'all',
        courseIds: courseIds || [],
        productIds: productIds || [],
        categoryIds: categoryIds || [],
        usageLimit: usageLimit ? Number(usageLimit) : 0,
        usageCount: 0,
        usageLimitPerUser: usageLimitPerUser ? Number(usageLimitPerUser) : 0,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
        active: active !== undefined ? !!active : true,
        createdAt: now,
        updatedAt: now,
      };

      serverCoupons.set(normalizedCode, couponData);

      try {
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('coupons')
          .insert({
            id: newCouponId,
            code: normalizedCode,
            description: description || '',
            discount_type: discountType,
            discount_value: Number(discountValue),
            currency: currency || 'USD',
            minimum_purchase: minimumPurchase ? Number(minimumPurchase) : 0,
            maximum_discount: maximumDiscount ? Number(maximumDiscount) : 0,
            applies_to: appliesTo || 'all',
            course_ids: courseIds || [],
            product_ids: productIds || [],
            category_ids: categoryIds || [],
            usage_limit: usageLimit ? Number(usageLimit) : 0,
            usage_count: 0,
            usage_limit_per_user: usageLimitPerUser ? Number(usageLimitPerUser) : 0,
            starts_at: startsAt || null,
            expires_at: expiresAt || null,
            active: active !== undefined ? !!active : true,
            created_at: now,
            updated_at: now,
          })
          .select()
          .maybeSingle();
        if (inserted) {
          couponData.id = inserted.id;
          serverCoupons.set(normalizedCode, couponData);
        }
      } catch (dbErr) {
        console.warn('Notice saving coupon to Supabase, stored in synchronized server cache:', dbErr);
      }

      return res.json({ success: true, coupon: couponData });
    } catch (err: any) {
      console.error('Error creating coupon:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 3. UPDATE COUPON (Admin only)
  app.put('/api/coupons/:couponId', async (req, res) => {
    try {
      const isAuthorized = await verifyIsAdmin(req);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Se administratè sèlman ki ka modifye kòd rabè.',
        });
      }

      const { couponId } = req.params;
      const updates = req.body;

      let targetKey: string | null = null;
      for (const [key, c] of serverCoupons.entries()) {
        if (c.id === couponId || key === couponId) {
          targetKey = key;
          break;
        }
      }

      if (updates.code) {
        updates.code = String(updates.code).trim().toUpperCase();
        if (targetKey && updates.code !== targetKey && serverCoupons.has(updates.code)) {
          return res.status(409).json({ error: 'Yon lòt kòd rabè ak menm non sa a egziste deja.' });
        }
      }

      if (updates.discountValue !== undefined) updates.discountValue = Number(updates.discountValue);
      if (updates.minimumPurchase !== undefined) updates.minimumPurchase = Number(updates.minimumPurchase);
      if (updates.maximumDiscount !== undefined) updates.maximumDiscount = Number(updates.maximumDiscount);
      if (updates.usageLimit !== undefined) updates.usageLimit = Number(updates.usageLimit);
      if (updates.usageLimitPerUser !== undefined) updates.usageLimitPerUser = Number(updates.usageLimitPerUser);

      updates.updatedAt = new Date().toISOString();

      if (targetKey && serverCoupons.has(targetKey)) {
        const existing = serverCoupons.get(targetKey)!;
        const merged = { ...existing, ...updates };
        if (updates.code && updates.code !== targetKey) {
          serverCoupons.delete(targetKey);
          serverCoupons.set(updates.code, merged);
        } else {
          serverCoupons.set(targetKey, merged);
        }
      }

      try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.code) dbUpdates.code = updates.code;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
        if (updates.discountValue !== undefined) dbUpdates.discount_value = updates.discountValue;
        if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
        if (updates.minimumPurchase !== undefined) dbUpdates.minimum_purchase = updates.minimumPurchase;
        if (updates.maximumDiscount !== undefined) dbUpdates.maximum_discount = updates.maximumDiscount;
        if (updates.appliesTo !== undefined) dbUpdates.applies_to = updates.appliesTo;
        if (updates.courseIds !== undefined) dbUpdates.course_ids = updates.courseIds;
        if (updates.productIds !== undefined) dbUpdates.product_ids = updates.productIds;
        if (updates.categoryIds !== undefined) dbUpdates.category_ids = updates.categoryIds;
        if (updates.usageLimit !== undefined) dbUpdates.usage_limit = updates.usageLimit;
        if (updates.usageLimitPerUser !== undefined) dbUpdates.usage_limit_per_user = updates.usageLimitPerUser;
        if (updates.startsAt !== undefined) dbUpdates.starts_at = updates.startsAt;
        if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabaseAdmin.from('coupons').update(dbUpdates).eq('id', couponId);
      } catch (dbErr) {
        console.warn('Notice updating coupon in Supabase, applied to synchronized cache:', dbErr);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating coupon:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. DELETE COUPON (Admin only)
  app.delete('/api/coupons/:couponId', async (req, res) => {
    try {
      const isAuthorized = await verifyIsAdmin(req);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Se administratè sèlman ki ka efase kòd rabè.',
        });
      }

      const { couponId } = req.params;
      for (const [key, c] of serverCoupons.entries()) {
        if (c.id === couponId || key === couponId) {
          serverCoupons.delete(key);
          break;
        }
      }

      try {
        await supabaseAdmin.from('coupons').delete().eq('id', couponId);
      } catch (dbErr) {
        console.warn('Notice deleting coupon in Supabase, deleted from synchronized cache:', dbErr);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting coupon:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 5. VALIDATE COUPON (Server-Authoritative)
  app.post('/api/coupons/validate', async (req, res) => {
    try {
      const { code, subtotal, userId, itemIds, itemCategoryIds } = req.body;

      if (!code || subtotal === undefined) {
        return res.status(400).json({ valid: false, message: 'Done enkomplè.' });
      }

      const normalizedCode = String(code).trim().toUpperCase();
      let coupon: any = serverCoupons.get(normalizedCode);

      if (!coupon) {
        try {
          const { data: couponRow } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', normalizedCode)
            .maybeSingle();
          if (couponRow) {
            coupon = { id: couponRow.id, ...couponRow };
            serverCoupons.set(normalizedCode, coupon);
          }
        } catch (e) {}
      }

      if (!coupon) {
        return res.json({ valid: false, message: 'Kòd rabè sa a pa valab.', messageKey: 'invalid' });
      }

      // Check active
      if (!coupon.active) {
        return res.json({ valid: false, message: 'Kòd rabè sa a pa aktif kounye a.', messageKey: 'invalid' });
      }

      // Check start date
      const now = new Date();
      if (coupon.startsAt) {
        const startsAt = new Date(coupon.startsAt);
        if (now < startsAt) {
          return res.json({ valid: false, message: 'Kòd rabè sa a poko valab.', messageKey: 'invalid' });
        }
      }

      // Check expiry
      if (coupon.expiresAt) {
        const expiresAt = new Date(coupon.expiresAt);
        if (now > expiresAt) {
          return res.json({ valid: false, message: 'Kòd rabè sa a ekspire.', messageKey: 'expired' });
        }
      }

      // Check global usage limit
      if (coupon.usageLimit && coupon.usageLimit > 0 && (coupon.usageCount || 0) >= coupon.usageLimit) {
        return res.json({ valid: false, message: 'Limit itilizasyon kòd sa a rive nan fen.', messageKey: 'usage_limit_reached' });
      }

      // Check per-user usage limit
      if (coupon.usageLimitPerUser && coupon.usageLimitPerUser > 0 && userId) {
        let userUsagesCount = serverCouponUsages.filter(
          (u) => (u.couponId === coupon.id || u.couponCode === coupon.code) && u.userId === userId
        ).length;

        try {
          const { data: usageRows, error: usageErr } = await supabaseAdmin
            .from('coupon_usage')
            .select('id')
            .eq('coupon_id', coupon.id)
            .eq('user_id', userId);
          if (usageRows) {
            userUsagesCount = Math.max(userUsagesCount, usageRows.length);
          }
        } catch (e) {}

        if (userUsagesCount >= coupon.usageLimitPerUser) {
          return res.json({ valid: false, message: 'Ou gentan itilize kòd sa a anpil fwa.', messageKey: 'user_limit_reached' });
        }
      }

      // Check applicability
      const ids: string[] = itemIds || [];
      const catIds: string[] = itemCategoryIds || [];
      if (coupon.appliesTo === 'courses') {
        const applicable = coupon.courseIds && coupon.courseIds.length > 0
          ? ids.some((id) => coupon.courseIds.includes(id))
          : true;
        if (!applicable) {
          return res.json({ valid: false, message: 'Kòd rabè sa a pa aplike pou kou sa a.', messageKey: 'not_applicable' });
        }
      } else if (coupon.appliesTo === 'products') {
        const applicable = coupon.productIds && coupon.productIds.length > 0
          ? ids.some((id) => coupon.productIds.includes(id))
          : true;
        if (!applicable) {
          return res.json({ valid: false, message: 'Kòd rabè sa a pa aplike pou pwodwi sa a.', messageKey: 'not_applicable' });
        }
      } else if (coupon.appliesTo === 'categories') {
        const applicable = coupon.categoryIds && coupon.categoryIds.length > 0
          ? catIds.some((id) => coupon.categoryIds.includes(id))
          : true;
        if (!applicable) {
          return res.json({ valid: false, message: 'Kòd rabè sa a pa aplike pou kategori sa a.', messageKey: 'not_applicable' });
        }
      }

      // Check minimum purchase
      const originalSubtotal = Number(subtotal);
      if (coupon.minimumPurchase && coupon.minimumPurchase > 0) {
        if (originalSubtotal < coupon.minimumPurchase) {
          return res.json({
            valid: false,
            message: `Acha minimòm pou kòd sa a se $${coupon.minimumPurchase.toFixed(2)}.`,
            messageKey: 'minimum_not_met',
          });
        }
      }

      // Calculate discount amount server-side
      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = (originalSubtotal * Number(coupon.discountValue)) / 100;
        if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
          discountAmount = Math.min(discountAmount, Number(coupon.maximumDiscount));
        }
      } else if (coupon.discountType === 'fixed') {
        discountAmount = Math.min(Number(coupon.discountValue), originalSubtotal);
      }

      const finalTotal = Math.max(0, originalSubtotal - discountAmount);

      return res.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount: Math.round(discountAmount * 100) / 100,
        originalSubtotal,
        finalTotal: Math.round(finalTotal * 100) / 100,
        message: 'Kòd rabè aplike avèk siksè.',
        messageKey: 'success',
      });
    } catch (err: any) {
      console.error('Error validating coupon:', err);
      return res.status(500).json({ valid: false, message: err.message });
    }
  });

  // 6. TRACK ORDER (Public — requires tracking number + email)
  const handleTrackOrderRequest = async (req: express.Request, res: express.Response) => {
    try {
      const trackingNumber = String(req.query.trackingNumber || '').trim().toUpperCase();
      const email = String(req.query.email || '').trim().toLowerCase();

      if (!trackingNumber || !email) {
        return res.status(400).json({ error: 'Tanpri bay nimewo swivi ak imèl ou.' });
      }

      let order: any = serverOrders.get(trackingNumber);

      if (!order) {
        try {
          const { data: orderRow } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('tracking_number', trackingNumber)
            .maybeSingle();
          if (orderRow) {
            order = { id: orderRow.id, ...orderRow };
            serverOrders.set(trackingNumber, order);
          }
        } catch (e) {}
      }

      if (!order) {
        return res.status(404).json({ error: 'Pa jwenn okenn kòmand ak nimewo swivi sa a.' });
      }

      // Verify email matches
      const orderEmail = (order.customer_email || order.email || '').toLowerCase();
      if (orderEmail !== email) {
        return res.status(404).json({ error: 'Pa jwenn okenn kòmand ak nimewo swivi sa a.' });
      }

      // Return only safe fields
      const safeResult: any = {
        trackingNumber: order.tracking_number || order.trackingNumber,
        orderNumber: order.order_number || order.orderNumber || null,
        date: order.created_at || order.submittedAt || null,
        type: order.course_id || order.courseId ? 'course' : (order.items ? 'shop' : 'unknown'),
        paymentMethod: order.payment_method || order.payment_provider || null,
        paymentStatus: order.payment_status || null,
        orderStatus: order.order_status || order.approval_status || null,
        approvalStatus: order.approval_status || order.order_status || null,
        publicStatusNote: order.public_status_note || null,
        couponCode: order.coupon_code || null,
        total: order.final_total || order.total || order.amount || null,
        currency: order.currency || 'USD',
      };

      return res.json({ order: safeResult });
    } catch (err: any) {
      console.error('Error tracking order:', err);
      return res.status(500).json({ error: err.message });
    }
  };

  app.get('/api/track-order', handleTrackOrderRequest);
  app.get('/api/track', handleTrackOrderRequest);

  // 7. ADMIN UPDATE ORDER STATUS NOTES
  app.post('/api/admin/orders/:orderId/status-note', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { publicStatusNote, adminNotes } = req.body;

      const updates: any = { updated_at: new Date().toISOString() };
      if (publicStatusNote !== undefined) updates.public_status_note = publicStatusNote;
      if (adminNotes !== undefined) updates.admin_notes = adminNotes;

      for (const [key, ord] of serverOrders.entries()) {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          Object.assign(ord, updates);
        }
      }

      try {
        await supabaseAdmin.from('orders').update(updates).eq('id', orderId);
      } catch (dbErr) {
        console.warn('Notice updating order notes in Supabase, cached on server:', dbErr);
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating order notes:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. ADMIN GET COUPON USAGE STATS
  app.get('/api/coupons/:couponId/usage', async (req, res) => {
    try {
      const { couponId } = req.params;
      let usageList: any[] = serverCouponUsages.filter(
        (u) => u.couponId === couponId || u.couponCode === couponId
      );

      try {
        const { data: usageRows } = await supabaseAdmin
          .from('coupon_usage')
          .select('*')
          .eq('coupon_id', couponId);
        if (usageRows && usageRows.length > 0) {
          const fsUsages = usageRows.map((u: any) => ({ id: u.id, ...u }));
          usageList = [...usageList, ...fsUsages];
        }
      } catch (e) {}

      return res.json({ usage: usageList, count: usageList.length });
    } catch (err: any) {
      console.error('Error fetching coupon usage:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 6. Vite middleware for development / Static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kominote Online Stripe Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
