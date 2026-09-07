import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface OrderItemPayload {
  productId?: string;
  courseId?: string;
  quantity: number;
}

export interface DigitalShopOrderPayload {
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  items: OrderItemPayload[];
  paymentMethod: string;
  transactionReference?: string;
  paymentProofUrl?: string;
  bankSelected?: string;
  senderPhone?: string;
  paypalEmailUsed?: string;
  couponCode?: string;
}

export interface CourseRegistrationPayload {
  courseId: string;
  courseTitle?: string;
  amount?: number;
  userId?: string;
  customerName: string;
  email: string;
  phone: string;
  country?: string;
  city?: string;
  paymentMethod: string;
  transactionReference?: string;
  paymentProofUrl?: string;
  bankSelected?: string;
  senderPhone?: string;
  paypalEmailUsed?: string;
  couponCode?: string;
}

export interface OrderCreationResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  invoiceId: string;
  total: number;
  message?: string;
  error?: string;
}

export interface CourseRegistrationResult {
  success: boolean;
  registrationId: string;
  orderId?: string;
  orderNumber: string;
  trackingNumber: string;
  invoiceId: string;
  total: number;
  message?: string;
  error?: string;
}

/**
 * Creates a digital shop order securely via Firebase Cloud Function
 * (Uses httpsCallable with seamless fallback to backend endpoint).
 */
export async function createDigitalShopOrder(
  payload: DigitalShopOrderPayload
): Promise<OrderCreationResult> {
  try {
    const callable = httpsCallable<DigitalShopOrderPayload, OrderCreationResult>(
      functions,
      'createDigitalShopOrder'
    );
    const response = await callable(payload);
    if (response.data && response.data.success) {
      return response.data;
    }
    // If callable returned result without throwing
    if (response.data) {
      return response.data;
    }
  } catch (err: any) {
    // Fall back to server endpoint /api/orders/create
    console.warn('Cloud function createDigitalShopOrder fallback:', err?.message || err);
  }

  // Unified secure backend endpoint execution
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.');
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.');
  }

  return data;
}

import { courseRegistrationsService } from './firebaseService';

/**
 * Submits a course registration securely via direct Firebase Firestore SDK
 * (Pure Firebase-only implementation without any external REST backend).
 */
export async function submitCourseRegistration(
  payload: CourseRegistrationPayload
): Promise<CourseRegistrationResult> {
  try {
    const reg = await courseRegistrationsService.createRegistration({
      courseId: payload.courseId,
      courseTitle: payload.courseTitle || 'Kou Kominote Online',
      coursePrice: payload.amount || 0,
      studentId: payload.userId || '',
      studentName: payload.customerName || 'Elèv',
      studentEmail: payload.email || '',
      studentPhone: payload.phone || '',
      paymentMethod: (payload.paymentMethod as any) || 'bankTransfer',
      paymentMethodDetails: {
        bankName: payload.bankSelected,
        paypalEmail: payload.paypalEmailUsed,
        senderPhone: payload.senderPhone,
      },
      transactionReference: payload.transactionReference,
      paymentProofUrl: payload.paymentProofUrl,
    });

    return {
      success: true,
      registrationId: reg.id,
      orderId: reg.id,
      orderNumber: reg.invoiceId || reg.id,
      trackingNumber: reg.invoiceId || reg.id,
      invoiceId: reg.invoiceId || reg.id,
      total: reg.coursePrice,
      message: 'Demann enskripsyon ou an anrejistre avèk siksè.',
    };
  } catch (err: any) {
    console.error('Course registration error:', err);
    throw new Error(err.message || 'Nou pa t kapab trete anrejistreman kou a. Tanpri eseye ankò.');
  }
}
