import { supabase } from '../lib/supabase';
import { courseRegistrationsService } from './firebaseService';

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

function generateOrderNumber(): string {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-6)}`;
}

function generateTrackingNumber(): string {
  return `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createDigitalShopOrder(
  payload: DigitalShopOrderPayload
): Promise<OrderCreationResult> {
  try {
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();
    const trackingNumber = generateTrackingNumber();

    let total = 0;
    const itemRecords: any[] = [];

    for (const item of payload.items) {
      if (item.productId) {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, title, price, sale_price, product_type, slug')
          .eq('id', item.productId)
          .maybeSingle();
        if (error || !product) continue;
        const unitPrice = Number(product.sale_price ?? product.price) || 0;
        const lineTotal = unitPrice * (item.quantity || 1);
        total += lineTotal;
        itemRecords.push({
          id: product.id,
          title: product.title,
          price: unitPrice,
          quantity: item.quantity || 1,
          total: lineTotal,
          productType: product.product_type || 'digital',
        });
      } else if (item.courseId) {
        const { data: course, error } = await supabase
          .from('courses')
          .select('id, title, price, sale_price')
          .eq('id', item.courseId)
          .maybeSingle();
        if (error || !course) continue;
        const unitPrice = Number(course.sale_price ?? course.price) || 0;
        const lineTotal = unitPrice * (item.quantity || 1);
        total += lineTotal;
        itemRecords.push({
          id: course.id,
          title: course.title,
          price: unitPrice,
          quantity: item.quantity || 1,
          total: lineTotal,
          productType: 'course',
        });
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: payload.userId,
        customer_name: payload.customerName,
        customer_email: payload.email,
        customer_phone: payload.phone,
        country: payload.country || null,
        city: payload.city || null,
        items: itemRecords,
        amount: total,
        currency: 'USD',
        payment_method: payload.paymentMethod,
        payment_status: 'pending',
        order_status: 'pending',
        tracking_number: trackingNumber,
        transaction_reference: payload.transactionReference || null,
        payment_proof_url: payload.paymentProofUrl || null,
        bank_selected: payload.bankSelected || null,
        sender_phone: payload.senderPhone || null,
        paypal_email_used: payload.paypalEmailUsed || null,
        coupon_code: payload.couponCode || null,
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    const { error: invoiceError } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      order_id: order.id,
      order_number: orderNumber,
      user_id: payload.userId,
      customer_name: payload.customerName,
      customer_email: payload.email,
      customer_phone: payload.phone,
      customer_country: payload.country || null,
      customer_city: payload.city || null,
      items: itemRecords,
      subtotal: total,
      total: total,
      currency: 'USD',
      payment_method: payload.paymentMethod,
      payment_status: 'pending',
      order_status: 'pending',
      tracking_number: trackingNumber,
      coupon_code: payload.couponCode || null,
    });

    if (invoiceError) {
      console.warn('Could not auto-create invoice for shop order:', invoiceError.message);
    }

    await supabase.from('orders').update({ invoice_id: invoiceNumber }).eq('id', order.id);

    return {
      success: true,
      orderId: order.id,
      orderNumber,
      trackingNumber,
      invoiceId: invoiceNumber,
      total,
      message: 'Kòmand ou an anrejistre avèk siksè.',
    };
  } catch (err: any) {
    console.error('Shop order creation error:', err);
    throw new Error(err.message || 'Nou pa t kapab trete kòmand ou a. Tanpri eseye ankò.');
  }
}

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
        bankName: payload.bankSelected || undefined,
        paypalEmail: payload.paypalEmailUsed || undefined,
        senderPhone: payload.senderPhone || undefined,
      },
      transactionReference: payload.transactionReference,
      paymentProofUrl: payload.paymentProofUrl,
    });

    const regAny = reg as any;
    return {
      success: true,
      registrationId: regAny.id,
      orderId: regAny.id,
      orderNumber: regAny.invoice_id || regAny.invoiceId || regAny.id,
      trackingNumber: regAny.invoice_id || regAny.invoiceId || regAny.id,
      invoiceId: regAny.invoice_id || regAny.invoiceId || regAny.id,
      total: regAny.course_price || regAny.coursePrice || 0,
      message: 'Demann enskripsyon ou an anrejistre avèk siksè.',
    };
  } catch (err: any) {
    console.error('Course registration error:', err);
    throw new Error(err.message || 'Nou pa t kapab trete anrejistreman kou a. Tanpri eseye ankò.');
  }
}
