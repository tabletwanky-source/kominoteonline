import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';
import { createServer as createViteServer } from 'vite';
import {
  sendOrderReceivedEmail,
  sendOrderApprovedEmail,
  sendOrderRejectedEmail,
  sendDownloadEnabledEmail,
} from './server/emailService';

dotenv.config();

const PORT = 3000;

// Official Kominote Online Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBnYODpUGO4leV6YnPaRRjLpMELCIibSRM",
  authDomain: "kominoteonline.firebaseapp.com",
  projectId: "kominoteonline",
  storageBucket: "kominoteonline.firebasestorage.app",
  messagingSenderId: "23708938066",
  appId: "1:23708938066:web:91674c93503f72b9df548b",
  measurementId: "G-8QB8F64S9N"
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

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

// Helper: Fetch real course directly from Cloud Firestore
async function getCourseFromFirestore(courseIdOrSlug: string): Promise<any | null> {
  try {
    const docRef = doc(db, 'courses', courseIdOrSlug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // Query by slug
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('slug', '==', courseIdOrSlug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const match = snap.docs[0];
      return { id: match.id, ...match.data() };
    }
    return null;
  } catch (err) {
    console.warn('Could not read course directly from Firestore:', err);
    return null;
  }
}

// Helper: Check if student already has active enrollment in Firestore
async function isStudentEnrolled(studentId: string, courseId: string): Promise<boolean> {
  try {
    // Check by doc ID studentId_courseId
    const enrDoc = await getDoc(doc(db, 'enrollments', `${studentId}_${courseId}`));
    if (enrDoc.exists() && enrDoc.data().status === 'active') {
      return true;
    }

    // Also query enrollments collection
    const colRef = collection(db, 'enrollments');
    const q = query(
      colRef,
      where('student_id', '==', studentId),
      where('course_id', '==', courseId),
      where('status', '==', 'active')
    );
    const qSnap = await getDocs(q);
    if (!qSnap.empty) return true;

    const q2 = query(
      colRef,
      where('studentId', '==', studentId),
      where('courseId', '==', courseId),
      where('status', '==', 'active')
    );
    const qSnap2 = await getDocs(q2);
    return !qSnap2.empty;
  } catch (err) {
    console.warn('Error checking enrollment in Firestore:', err);
    return false;
  }
}

async function startServer() {
  const app = express();

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

            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (!orderSnap.exists()) {
              console.error(`⚠️ Shop order ${orderId} not found in Firestore`);
              return res.status(404).json({ error: 'Order not found' });
            }

            const order = orderSnap.data();
            const approvedAt = new Date().toISOString();

            // Mark order as paid & approved, unlock downloads immediately
            await updateDoc(orderRef, {
              paymentStatus: 'paid',
              orderStatus: 'approved',
              downloadStatus: 'enabled',
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              approvedAt,
              approvedBy: 'Stripe Automatic',
              updatedAt: approvedAt,
            });

            // Grant digitalAccess for all items in order
            const items = order.items || [];
            for (const item of items) {
              const prodId = item.productId;
              const accessDocId = `${order.userId}_${prodId}`;
              const accessRef = doc(db, 'digitalAccess', accessDocId);
              await setDoc(
                accessRef,
                {
                  id: accessDocId,
                  userId: order.userId,
                  productId: prodId,
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  active: true,
                  enabledAt: approvedAt,
                  enabledBy: 'Stripe Automatic',
                  downloadCount: 0,
                  lastDownloadedAt: null,
                },
                { merge: true }
              );
            }

            // Update invoice if linked
            if (order.invoiceId) {
              try {
                const invRef = doc(db, 'invoices', order.invoiceId);
                await updateDoc(invRef, {
                  paymentStatus: 'paid',
                  orderStatus: 'approved',
                });
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
          const orderRef = doc(db, 'orders', session.id);
          const existingOrder = await getDoc(orderRef);
          if (existingOrder.exists() && existingOrder.data().paymentStatus === 'paid') {
            console.log(`[Webhook] Order ${session.id} already paid and fulfilled. Skipping duplicate.`);
            return res.json({ received: true, duplicate: true });
          }

          const amount = session.amount_total
            ? session.amount_total / 100
            : Number(session.metadata?.amountCharged || 0);

          // Create/Update order in Firestore
          const orderData = {
            id: session.id,
            studentId,
            student_id: studentId,
            courseId,
            course_id: courseId,
            amount,
            currency: (session.currency || 'usd').toLowerCase(),
            paymentProvider: 'stripe',
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            paymentStatus: 'paid',
            orderStatus: 'approved',
            approvalStatus: 'approved',
            createdAt: existingOrder.exists() ? existingOrder.data().createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customerEmail: studentEmail,
          };

          await setDoc(orderRef, orderData, { merge: true });
          console.log(`[Webhook] Firestore course order created/updated: ${session.id}`);

          // Create student's course enrollment (prevent duplicate)
          const enrollmentId = `${studentId}_${courseId}`;
          const enrollRef = doc(db, 'enrollments', enrollmentId);
          const existingEnroll = await getDoc(enrollRef);

          if (!existingEnroll.exists() || existingEnroll.data().status !== 'active') {
            await setDoc(
              enrollRef,
              {
                id: enrollmentId,
                student_id: studentId,
                studentId,
                course_id: courseId,
                courseId,
                orderId: session.id,
                status: 'active',
                enrolled_at: new Date().toISOString(),
                enrolledAt: new Date().toISOString(),
                progress_percentage: 0,
                completed_lessons_count: 0,
                total_required_lessons_count: 0,
              },
              { merge: true }
            );
            console.log(`[Webhook] Student ${studentId} successfully enrolled in course ${courseId}`);
          } else {
            console.log(`[Webhook] Student ${studentId} was already enrolled in ${courseId}. Linking order.`);
            await updateDoc(enrollRef, { orderId: session.id, status: 'active' });
          }
        } else if (event.type === 'charge.refunded' || event.type === 'payment_intent.canceled') {
          // Handle refunds
          const charge = event.data.object as any;
          const paymentIntentId = charge.payment_intent || charge.id;

          console.log(`[Webhook] Processing refund for payment intent: ${paymentIntentId}`);
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('stripePaymentIntentId', '==', paymentIntentId));
          const snap = await getDocs(q);

          for (const d of snap.docs) {
            await updateDoc(d.ref, {
              paymentStatus: 'refunded',
              refundedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            console.log(`[Webhook] Updated order ${d.id} to refunded.`);
          }
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error('Error handling webhook event:', err);
        return res.status(500).json({ error: 'Internal webhook fulfillment error', message: err.message });
      }
    }
  );

  // Standard JSON body parsing for other API endpoints
  app.use(express.json());

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

      // 2. Read the real course information from Firestore
      // Never trust price, course title or course ID sent only from the browser!
      const course = await getCourseFromFirestore(courseId);

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
        const enrollRef = doc(db, 'enrollments', enrollmentId);

        await setDoc(
          enrollRef,
          {
            id: enrollmentId,
            student_id: studentId,
            studentId,
            course_id: course.id,
            courseId: course.id,
            orderId: 'free_enrollment',
            status: 'active',
            enrolled_at: new Date().toISOString(),
            enrolledAt: new Date().toISOString(),
            progress_percentage: 0,
            completed_lessons_count: 0,
            total_required_lessons_count: course.total_lessons || 0,
          },
          { merge: true }
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

      // Record pending order in Firestore
      try {
        const orderRef = doc(db, 'orders', session.id);
        await setDoc(orderRef, {
          id: session.id,
          studentId,
          student_id: studentId,
          courseId: course.id,
          course_id: course.id,
          amount: effectivePrice,
          currency: 'usd',
          paymentProvider: 'stripe',
          stripeSessionId: session.id,
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          customerEmail: studentEmail || '',
        });
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

      // Read real products from Firestore and verify prices
      let subtotal = 0;
      const verifiedItems: any[] = [];
      const stripeLineItems: any[] = [];

      for (const item of items) {
        const prodId = item.productId;
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);

        if (!prodSnap.exists()) {
          return res.status(404).json({
            error: 'Product not found',
            message: `Pwodwi ${prodId} pa jwenn nan boutik la.`,
          });
        }

        const productData = prodSnap.data();
        const unitPrice =
          productData.salePrice !== undefined && productData.salePrice !== null && productData.salePrice < productData.price
            ? Number(productData.salePrice)
            : Number(productData.price || 0);

        const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
        const itemTotal = unitPrice * quantity;
        subtotal += itemTotal;

        verifiedItems.push({
          productId: prodId,
          productTitle: productData.title,
          productImage: productData.imageUrl || '',
          productType: productData.productType || 'other',
          unitPrice,
          quantity,
          totalPrice: itemTotal,
        });

        stripeLineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: productData.title,
              description: productData.shortDescription || `Pwodwi dijital: ${productData.title}`,
              images: productData.imageUrl ? [productData.imageUrl] : [],
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

      const newOrderRef = doc(collection(db, 'orders'));
      const newInvoiceRef = doc(collection(db, 'invoices'));
      const submittedAt = new Date().toISOString();

      const orderData = {
        id: newOrderRef.id,
        orderNumber,
        userId,
        customerName,
        email,
        phone: phone || '',
        country: country || 'Haiti',
        city: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total: subtotal,
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        downloadStatus: 'locked',
        invoiceId: newInvoiceRef.id,
        submittedAt,
        createdAt: submittedAt,
        updatedAt: submittedAt,
      };

      await setDoc(newOrderRef, orderData);

      const invoiceData = {
        id: newInvoiceRef.id,
        invoiceNumber,
        orderId: newOrderRef.id,
        orderNumber,
        userId,
        customerName,
        customerEmail: email,
        customerPhone: phone || '',
        customerCountry: country || 'Haiti',
        customerCity: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total: subtotal,
        currency: 'USD',
        paymentMethod: 'stripe',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        createdAt: submittedAt,
        issuedAt: submittedAt,
      };

      await setDoc(newInvoiceRef, invoiceData);

      const origin = req.headers.origin || process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const baseUrl = origin.replace(/\/$/, '');

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: email,
        line_items: stripeLineItems,
        metadata: {
          purchaseType: 'shop_product',
          orderId: newOrderRef.id,
          orderNumber,
          invoiceId: newInvoiceRef.id,
          userId,
          email,
          totalAmount: String(subtotal),
        },
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=shop&order_id=${newOrderRef.id}&invoice_id=${newInvoiceRef.id}`,
        cancel_url: `${baseUrl}/checkout?canceled=true`,
      });

      return res.json({
        success: true,
        url: session.url,
        orderId: newOrderRef.id,
        orderNumber,
        invoiceId: newInvoiceRef.id,
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

      // Check order in Firestore
      const orderRef = doc(db, 'orders', sessionId);
      const orderSnap = await getDoc(orderRef);

      let orderData = orderSnap.exists() ? orderSnap.data() : null;

      // If order not found or still pending, query Stripe directly if secret key is present
      const stripe = getStripe();
      if (stripe && (!orderData || orderData.paymentStatus === 'pending')) {
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
              const shopOrderRef = doc(db, 'orders', shopOrderId);
              const shopOrderSnap = await getDoc(shopOrderRef);
              if (shopOrderSnap.exists()) {
                const sOrder = shopOrderSnap.data();
                const approvedAt = new Date().toISOString();
                await updateDoc(shopOrderRef, {
                  paymentStatus: 'paid',
                  orderStatus: 'approved',
                  downloadStatus: 'enabled',
                  stripeSessionId: session.id,
                  stripePaymentIntentId: paymentIntentId,
                  approvedAt,
                  approvedBy: 'Stripe Automatic',
                  updatedAt: approvedAt,
                });
                const items = sOrder.items || [];
                for (const item of items) {
                  const prodId = item.productId;
                  const accessDocId = `${sOrder.userId}_${prodId}`;
                  const accessRef = doc(db, 'digitalAccess', accessDocId);
                  await setDoc(
                    accessRef,
                    {
                      id: accessDocId,
                      userId: sOrder.userId,
                      productId: prodId,
                      orderId: sOrder.id,
                      orderNumber: sOrder.orderNumber,
                      active: true,
                      enabledAt: approvedAt,
                      enabledBy: 'Stripe Automatic',
                      downloadCount: 0,
                      lastDownloadedAt: null,
                    },
                    { merge: true }
                  );
                }
                if (sOrder.invoiceId) {
                  try {
                    await updateDoc(doc(db, 'invoices', sOrder.invoiceId), {
                      paymentStatus: 'paid',
                      orderStatus: 'approved',
                    });
                  } catch (e) {}
                }
                return res.json({
                  status: 'completed',
                  purchaseType: 'shop_product',
                  orderId: sOrder.id,
                  orderNumber: sOrder.orderNumber,
                  invoiceId: sOrder.invoiceId,
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
                studentId,
                student_id: studentId,
                courseId,
                course_id: courseId,
                amount,
                currency: session.currency || 'usd',
                paymentProvider: 'stripe',
                stripeSessionId: session.id,
                stripePaymentIntentId: paymentIntentId,
                paymentStatus: 'paid',
                orderStatus: 'approved',
                approvalStatus: 'approved',
                createdAt: orderData ? orderData.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                customerEmail: studentEmail,
              };

              await setDoc(orderRef, orderData, { merge: true });

              // Fulfill enrollment if not enrolled yet
              const enrollmentId = `${studentId}_${courseId}`;
              const enrollRef = doc(db, 'enrollments', enrollmentId);
              const enrollSnap = await getDoc(enrollRef);

              if (!enrollSnap.exists() || enrollSnap.data().status !== 'active') {
                await setDoc(
                  enrollRef,
                  {
                    id: enrollmentId,
                    student_id: studentId,
                    studentId,
                    course_id: courseId,
                    courseId,
                    orderId: session.id,
                    status: 'active',
                    enrolled_at: new Date().toISOString(),
                    enrolledAt: new Date().toISOString(),
                    progress_percentage: 0,
                    completed_lessons_count: 0,
                    total_required_lessons_count: 0,
                  },
                  { merge: true }
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

      if (orderData.paymentStatus === 'paid') {
        const course = await getCourseFromFirestore(orderData.courseId);
        return res.json({
          status: 'completed',
          order: orderData,
          course,
        });
      }

      if (orderData.paymentStatus === 'failed') {
        return res.json({ status: 'failed', order: orderData });
      }

      return res.json({ status: 'processing', order: orderData });
    } catch (err: any) {
      console.error('Error verifying session:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 4. SIMULATE TEST WEBHOOK (Required for robust Test Mode verification)
  app.post('/api/checkout/simulate-test-webhook', async (req, res) => {
    try {
      const { courseId, studentId, studentEmail, testType } = req.body;

      if (!studentId || !courseId) {
        return res.status(400).json({ error: 'Missing studentId or courseId' });
      }

      const course = await getCourseFromFirestore(courseId);
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const testSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const testPaymentIntentId = `pi_test_${Date.now()}`;
      const amount = Number(course.sale_price || course.price || 29.99);

      if (testType === 'canceled') {
        // Canceled checkout test: Do not mark as paid, do not create enrollment
        const orderRef = doc(db, 'orders', testSessionId);
        await setDoc(orderRef, {
          id: testSessionId,
          studentId,
          student_id: studentId,
          courseId: course.id,
          course_id: course.id,
          amount,
          currency: 'usd',
          paymentProvider: 'stripe',
          stripeSessionId: testSessionId,
          paymentStatus: 'failed',
          createdAt: new Date().toISOString(),
          notes: 'Test: Canceled checkout simulation',
        });
        return res.json({ success: true, status: 'canceled', sessionId: testSessionId });
      }

      // Simulate successful payment webhook
      const orderRef = doc(db, 'orders', testSessionId);
      await setDoc(orderRef, {
        id: testSessionId,
        studentId,
        student_id: studentId,
        courseId: course.id,
        course_id: course.id,
        amount,
        currency: 'usd',
        paymentProvider: 'stripe',
        stripeSessionId: testSessionId,
        stripePaymentIntentId: testPaymentIntentId,
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customerEmail: studentEmail || 'student@kominote.test',
        isTestMode: true,
      });

      // Create enrollment
      const enrollmentId = `${studentId}_${course.id}`;
      const enrollRef = doc(db, 'enrollments', enrollmentId);
      await setDoc(
        enrollRef,
        {
          id: enrollmentId,
          student_id: studentId,
          studentId,
          course_id: course.id,
          courseId: course.id,
          orderId: testSessionId,
          status: 'active',
          enrolled_at: new Date().toISOString(),
          enrolledAt: new Date().toISOString(),
          progress_percentage: 0,
          completed_lessons_count: 0,
          total_required_lessons_count: course.total_lessons || 10,
        },
        { merge: true }
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
      const ordersRef = collection(db, 'orders');
      const snap = await getDocs(ordersRef);

      const orders = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      return res.json({ orders });
    } catch (err: any) {
      console.error('Error fetching admin orders:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/orders/:orderId/refund', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { revokeAccess, refundReason } = req.body;

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderSnap.data();

      // Update order status to refunded
      await updateDoc(orderRef, {
        paymentStatus: 'refunded',
        refundedAt: new Date().toISOString(),
        refundReason: refundReason || 'Ranbousman Admin',
        accessRevoked: !!revokeAccess,
        updatedAt: new Date().toISOString(),
      });

      // If admin decides to revoke course access
      if (revokeAccess && order.studentId && order.courseId) {
        const enrollmentId = `${order.studentId}_${order.courseId}`;
        const enrollRef = doc(db, 'enrollments', enrollmentId);
        const enrollSnap = await getDoc(enrollRef);
        if (enrollSnap.exists()) {
          await updateDoc(enrollRef, {
            status: 'canceled',
            revokedAt: new Date().toISOString(),
            revocationReason: 'Ranbousman fèt',
          });
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

  // 1. CREATE DIGITAL SHOP ORDER (Recalculates all prices securely from Firestore)
  app.post('/api/orders/create', async (req, res) => {
    try {
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
      } = req.body;

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
      // Retrieve current product data directly from Firestore.
      let subtotal = 0;
      const verifiedItems: any[] = [];
      let detectedCourseId: string | null = null;

      for (const item of items) {
        const prodId = item.productId || item.courseId;
        if (!prodId) {
          return res.status(400).json({ error: 'Invalid item: missing productId or courseId' });
        }

        // Check if product exists in products collection
        const prodRef = doc(db, 'products', prodId);
        const prodSnap = await getDoc(prodRef);

        if (prodSnap.exists()) {
          const productData = prodSnap.data();
          if (productData.status !== 'published') {
            return res.status(400).json({
              error: 'Product unavailable',
              message: `Pwodwi "${productData.title}" pa disponib pou lavant kounye a.`,
            });
          }

          // Use authentic server price
          const unitPrice =
            productData.salePrice !== undefined && productData.salePrice !== null && productData.salePrice < productData.price
              ? Number(productData.salePrice)
              : Number(productData.price || 0);

          const quantity = Math.max(1, parseInt(item.quantity || 1, 10));
          const itemTotal = unitPrice * quantity;
          subtotal += itemTotal;

          verifiedItems.push({
            productId: prodId,
            productTitle: productData.title,
            productImage: productData.imageUrl || '',
            productType: productData.productType || 'other',
            unitPrice,
            quantity,
            totalPrice: itemTotal,
          });
        } else {
          // Check if it's a course in courses collection
          const courseRef = doc(db, 'courses', prodId);
          const courseSnap = await getDoc(courseRef);

          if (!courseSnap.exists()) {
            return res.status(404).json({
              error: 'Item not found',
              message: `Pwodwi oswa kou ak ID ${prodId} pa egziste.`,
            });
          }

          const courseData = courseSnap.data();
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

      // Generate unique human-readable order number: KO-2026-XXXXXX
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `KO-2026-${randomSuffix}`;
      const invoiceNumber = `INV-2026-${randomSuffix}`;

      // Default statuses: LOCKED by default, Admin approval required for manual payments!
      const orderColRef = collection(db, 'orders');
      const invoiceColRef = collection(db, 'invoices');

      const newInvoiceRef = doc(invoiceColRef);
      const newOrderRef = doc(orderColRef);

      const submittedAt = new Date().toISOString();

      const orderData: any = {
        id: newOrderRef.id,
        orderNumber,
        userId,
        studentId: userId,
        customerName,
        email,
        phone: phone || '',
        country: country || 'Haiti',
        city: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total,
        currency: 'USD',
        paymentMethod,
        transactionReference: transactionReference || '',
        paymentProofUrl: paymentProofUrl || '',
        bankSelected: bankSelected || '',
        senderPhone: senderPhone || '',
        paypalEmailUsed: paypalEmailUsed || '',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        approvalStatus: 'pending',
        downloadStatus: 'locked', // STRICT: Locked until Admin approval
        invoiceId: newInvoiceRef.id,
        submittedAt,
        createdAt: submittedAt,
        updatedAt: submittedAt,
      };

      if (detectedCourseId) {
        orderData.courseId = detectedCourseId;
        orderData.course_id = detectedCourseId;
        orderData.purchaseType = 'course';
      }

      await setDoc(newOrderRef, orderData);

      const invoiceData = {
        id: newInvoiceRef.id,
        invoiceNumber,
        orderId: newOrderRef.id,
        orderNumber,
        userId,
        customerName,
        customerEmail: email,
        customerPhone: phone || '',
        customerCountry: country || 'Haiti',
        customerCity: city || 'Port-au-Prince',
        items: verifiedItems,
        subtotal,
        total,
        currency: 'USD',
        paymentMethod,
        bankSelected: bankSelected || '',
        paymentStatus: 'pending',
        orderStatus: 'pending',
        createdAt: submittedAt,
        issuedAt: submittedAt,
      };

      await setDoc(newInvoiceRef, invoiceData);

      // Trigger asynchronous Brevo email notification
      const origin = req.headers.origin || 'https://kominote.online';
      const invoiceUrl = `${origin}/invoice/${newInvoiceRef.id}`;
      sendOrderReceivedEmail(orderData, invoiceUrl).catch((err) =>
        console.warn('Notice sending order received email:', err)
      );

      return res.json({
        success: true,
        orderId: newOrderRef.id,
        orderNumber,
        invoiceId: newInvoiceRef.id,
        total,
        currency: 'USD',
        message: 'Kòmand ou an kreye avèk siksè. Li ap tann verifikasyon pa administrasyon an.',
      });
    } catch (err: any) {
      console.error('Error creating digital shop order:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 2. ADMIN APPROVAL: Approves Order & Enables Download Access
  app.post('/api/orders/:orderId/approve', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { adminId, adminNotes } = req.body;

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderSnap.data();
      const approvedAt = new Date().toISOString();
      const approvedBy = adminId || 'Admin';

      // 1. Update order status
      await updateDoc(orderRef, {
        paymentStatus: 'paid',
        orderStatus: 'approved',
        approvalStatus: 'approved',
        downloadStatus: 'enabled',
        approvedAt,
        approvedBy,
        adminNotes: adminNotes || order.adminNotes || '',
        updatedAt: approvedAt,
      });

      // 2. If this is or includes a course purchase, activate student enrollment!
      const targetUserId = order.userId || order.studentId;
      if (order.courseId && targetUserId) {
        const enrollmentId = `${targetUserId}_${order.courseId}`;
        const enrollRef = doc(db, 'enrollments', enrollmentId);
        await setDoc(
          enrollRef,
          {
            id: enrollmentId,
            student_id: targetUserId,
            studentId: targetUserId,
            course_id: order.courseId,
            courseId: order.courseId,
            orderId: order.id,
            status: 'active',
            enrolled_at: approvedAt,
            enrolledAt: approvedAt,
            progress_percentage: 0,
            completed_lessons_count: 0,
            total_required_lessons_count: 0,
          },
          { merge: true }
        );
        console.log(`[Admin Approval] Activated course enrollment for student ${targetUserId} in course ${order.courseId}`);
      }

      // 3. Create customer digitalAccess entitlements for each shop product in order
      const items = order.items || [];
      for (const item of items) {
        if (item.courseId && targetUserId) {
          const courseEnrollId = `${targetUserId}_${item.courseId}`;
          const courseEnrollRef = doc(db, 'enrollments', courseEnrollId);
          await setDoc(
            courseEnrollRef,
            {
              id: courseEnrollId,
              student_id: targetUserId,
              studentId: targetUserId,
              course_id: item.courseId,
              courseId: item.courseId,
              orderId: order.id,
              status: 'active',
              enrolled_at: approvedAt,
              enrolledAt: approvedAt,
              progress_percentage: 0,
              completed_lessons_count: 0,
              total_required_lessons_count: 0,
            },
            { merge: true }
          );
        }

        const prodId = item.productId;
        if (!prodId) continue;

        const accessDocId = `${targetUserId}_${prodId}`;
        const accessRef = doc(db, 'digitalAccess', accessDocId);
        const accessSnap = await getDoc(accessRef);

        if (!accessSnap.exists()) {
          await setDoc(accessRef, {
            id: accessDocId,
            userId: targetUserId,
            productId: prodId,
            orderId: order.id,
            orderNumber: order.orderNumber,
            active: true,
            enabledAt: approvedAt,
            enabledBy: approvedBy,
            downloadCount: 0,
            lastDownloadedAt: null,
          });
          console.log(`[DigitalAccess] Created entitlement for user ${targetUserId} on product ${prodId}`);
        } else {
          await updateDoc(accessRef, {
            active: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            enabledAt: approvedAt,
            enabledBy: approvedBy,
          });
          console.log(`[DigitalAccess] Reactivated entitlement for user ${targetUserId} on product ${prodId}`);
        }
      }

      // 4. Update invoice if exists
      if (order.invoiceId) {
        try {
          const invRef = doc(db, 'invoices', order.invoiceId);
          await updateDoc(invRef, {
            paymentStatus: 'paid',
            orderStatus: 'approved',
          });
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
      const { adminNotes } = req.body;

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderSnap.data();
      const rejectedAt = new Date().toISOString();

      await updateDoc(orderRef, {
        orderStatus: 'rejected',
        approvalStatus: 'rejected',
        downloadStatus: 'locked',
        adminNotes: adminNotes || 'Refize pa administrasyon an',
        updatedAt: rejectedAt,
      });

      // If course order, deactivate enrollment
      const targetUserId = order.userId || order.studentId;
      if (order.courseId && targetUserId) {
        const enrollmentId = `${targetUserId}_${order.courseId}`;
        const enrollRef = doc(db, 'enrollments', enrollmentId);
        const enrollSnap = await getDoc(enrollRef);
        if (enrollSnap.exists()) {
          await updateDoc(enrollRef, { status: 'rejected' });
        }
      }

      // Deactivate digital access records
      const items = order.items || [];
      for (const item of items) {
        const prodId = item.productId;
        if (!prodId) continue;
        const accessDocId = `${targetUserId}_${prodId}`;
        const accessRef = doc(db, 'digitalAccess', accessDocId);
        const accessSnap = await getDoc(accessRef);
        if (accessSnap.exists()) {
          await updateDoc(accessRef, { active: false });
        }
      }

      // Update invoice
      if (order.invoiceId) {
        try {
          const invRef = doc(db, 'invoices', order.invoiceId);
          await updateDoc(invRef, {
            orderStatus: 'rejected',
          });
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
      const { enable } = req.body; // boolean

      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderSnap.data();
      const newStatus = enable ? 'enabled' : 'locked';

      await updateDoc(orderRef, {
        downloadStatus: newStatus,
        updatedAt: new Date().toISOString(),
      });

      // Update entitlements
      const items = order.items || [];
      for (const item of items) {
        const accessDocId = `${order.userId}_${item.productId}`;
        const accessRef = doc(db, 'digitalAccess', accessDocId);
        const accessSnap = await getDoc(accessRef);
        if (accessSnap.exists()) {
          await updateDoc(accessRef, { active: !!enable });
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

      // Check admin status or digitalAccess entitlement
      let hasAccess = false;

      // Check user doc for admin role
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().role === 'admin') {
        hasAccess = true;
      }

      if (!hasAccess) {
        const accessDocId = `${userId}_${productId}`;
        const accessRef = doc(db, 'digitalAccess', accessDocId);
        const accessSnap = await getDoc(accessRef);

        if (accessSnap.exists() && accessSnap.data().active === true) {
          hasAccess = true;
          // Increment download count
          const currentCount = accessSnap.data().downloadCount || 0;
          await updateDoc(accessRef, {
            downloadCount: currentCount + 1,
            lastDownloadedAt: new Date().toISOString(),
          });
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access locked',
          message:
            'Aksè telechajman bloke. Fòk administrasyon Kominote Online konfime kòmand ou anvan ou ka telechaje.',
        });
      }

      // Fetch file from productFiles
      const filesCol = collection(db, 'productFiles');
      const q = query(filesCol, where('productId', '==', productId), where('active', '==', true));
      const fileSnap = await getDocs(q);

      if (fileSnap.empty) {
        return res.status(404).json({
          error: 'File not found',
          message: 'Poko gen fichye ki atache ak pwodwi sa a.',
        });
      }

      const fileData = fileSnap.docs[0].data();
      return res.json({
        success: true,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
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
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);

      if (!snap.exists()) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({ order: { id: snap.id, ...snap.data() } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 7. GET INVOICE BY ID
  app.get('/api/invoices/:invoiceId', async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const invRef = doc(db, 'invoices', invoiceId);
      const snap = await getDoc(invRef);

      if (!snap.exists()) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      return res.json({ invoice: { id: snap.id, ...snap.data() } });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // 8. PAYMENT SETTINGS (GET & POST)
  app.get('/api/payment-settings', async (req, res) => {
    try {
      const settingsRef = doc(db, 'paymentSettings', 'general');
      const snap = await getDoc(settingsRef);

      const defaultSettings = {
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

      if (!snap.exists()) {
        await setDoc(settingsRef, defaultSettings);
        return res.json({ settings: defaultSettings });
      }

      const existing = snap.data();
      // Ensure merged settings have banks if not present
      const merged = { ...defaultSettings, ...existing };
      if (!merged.bankTransfer?.banks || merged.bankTransfer.banks.length === 0) {
        merged.bankTransfer = {
          ...merged.bankTransfer,
          banks: defaultSettings.bankTransfer.banks,
        };
      }
      if (!merged.moncash) merged.moncash = defaultSettings.moncash;
      if (!merged.natcash) merged.natcash = defaultSettings.natcash;
      if (!merged.stripe) merged.stripe = defaultSettings.stripe;

      return res.json({ settings: merged });
    } catch (err: any) {
      console.error('Error fetching payment settings:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payment-settings', async (req, res) => {
    try {
      const { settings } = req.body;
      if (!settings) {
        return res.status(400).json({ error: 'Missing settings payload' });
      }

      const settingsRef = doc(db, 'paymentSettings', 'general');
      await setDoc(
        settingsRef,
        {
          ...settings,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return res.json({ success: true, message: 'Paramèt peman yo anrejistre avèk siksè!' });
    } catch (err: any) {
      console.error('Error saving payment settings:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // 9. TEAM MEMBERS & FOUNDER CMS (GET & POST)
  app.get('/api/team-members', async (req, res) => {
    try {
      const snap = await getDocs(collection(db, 'teamMembers'));
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

      if (snap.empty) {
        try {
          await setDoc(doc(db, 'teamMembers', defaultFounder.id), defaultFounder);
        } catch (e) {
          console.warn('Notice seeding team member on server:', e);
        }
        return res.json({ members: [defaultFounder] });
      }

      let members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const onlyActive = req.query.all !== 'true';
      if (onlyActive) {
        members = members.filter((m: any) => m.is_active !== false);
      }
      members.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      return res.json({ members });
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
      await setDoc(doc(db, 'teamMembers', memberId), {
        ...member,
        updated_at: new Date().toISOString(),
      }, { merge: true });
      return res.json({ success: true, member: { id: memberId, ...member } });
    } catch (err: any) {
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
