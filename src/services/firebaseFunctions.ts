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

/**
 * Submits a course registration securely via Firebase Cloud Function
 * (Uses httpsCallable with seamless fallback to backend endpoint).
 */
export async function submitCourseRegistration(
  payload: CourseRegistrationPayload
): Promise<CourseRegistrationResult> {
  try {
    const callable = httpsCallable<CourseRegistrationPayload, CourseRegistrationResult>(
      functions,
      'submitCourseRegistration'
    );
    const response = await callable(payload);
    if (response.data && response.data.success) {
      return response.data;
    }
    if (response.data) {
      return response.data;
    }
  } catch (err: any) {
    console.warn('Cloud function submitCourseRegistration fallback:', err?.message || err);
  }

  // Unified secure backend endpoint execution
  const res = await fetch('/api/course-registrations/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Nou pa t kapab trete anrejistreman kou a. Tanpri eseye ankò.');
  }

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || 'Nou pa t kapab trete anrejistreman kou a. Tanpri eseye ankò.');
  }

  return data;
}
