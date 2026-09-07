export type UserRole = 'student' | 'instructor' | 'admin';

export type CourseLevel = 'Kòmansan' | 'Entèmedyè' | 'Avanse' | 'Tout Nivo';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type EnrollmentStatus = 'active' | 'completed' | 'cancelled';
export type LessonContentType = 'youtube' | 'vimeo' | 'uploaded_video' | 'pdf' | 'file' | 'text';

export interface Profile {
  id: string; // User ID
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  course_count?: number;
  created_at?: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail: string;
  instructor_id: string;
  category_id: string;
  price: number;
  sale_price?: number;
  salePrice?: number;
  isFree?: boolean;
  currency?: string;
  level: CourseLevel;
  status: CourseStatus;
  featured: boolean;
  certificate_enabled?: boolean;
  requirements?: string[];
  learning_outcomes?: string[];
  rating: number;
  students_count: number;
  duration_hours: number;
  total_lessons: number;
  created_at: string;
  updated_at?: string;
  updatedAt?: string;
  // Course preview video fields (Admin-controlled public marketing media)
  previewEnabled?: boolean;
  previewType?: 'youtube' | 'vimeo' | 'upload' | null;
  previewVideoUrl?: string | null;
  previewStoragePath?: string | null;
  previewThumbnailUrl?: string | null;
  // Joined relation fields
  instructor?: Profile;
  category?: Category;
  modules?: CourseModule[];
  sections?: CourseModule[]; // Backward compatibility alias
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  position: number;
  created_at?: string;
  lessons?: Lesson[];
}

export type Module = CourseModule;
export type CourseSection = CourseModule; // Alias for backward compatibility

export interface Lesson {
  id: string;
  module_id?: string;
  course_id?: string;
  title: string;
  description?: string;
  content_type?: LessonContentType;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  text_content?: string;
  content_text?: string; // Compatibility alias
  duration?: string; // e.g. "12:40"
  duration_minutes?: number;
  duration_seconds?: number;
  position: number;
  preview_enabled?: boolean;
  is_free_preview?: boolean;
  completion_required?: boolean;
  created_at?: string;
  // Compatibility fields
  is_preview?: boolean;
  section_id?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  orderId?: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  completed_lessons_count?: number;
  total_required_lessons_count?: number;
  course?: Course;
  student?: Profile;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Order {
  id: string;
  studentId: string;
  student_id?: string;
  courseId: string;
  course_id?: string;
  courseTitle?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  currency: string;
  paymentProvider: 'stripe' | 'manual' | string;
  paymentMethod?: string;
  bankSelected?: string;
  senderPhone?: string;
  paypalEmailUsed?: string;
  transactionReference?: string;
  paymentProofUrl?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentStatus: PaymentStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  orderStatus?: 'pending' | 'approved' | 'rejected';
  invoiceId?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  adminNotes?: string;
  notes?: string;
  refundedAt?: string;
  refundReason?: string;
  accessRevoked?: boolean;
  isTestMode?: boolean;
  trackingNumber?: string;
  publicStatusNote?: string;
  couponCode?: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  originalSubtotal?: number;
  finalTotal?: number;
  // Joined relation fields
  student?: Profile;
  course?: Course;
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface CourseRegistration {
  id: string;
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
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: any;
  updatedAt?: any;
  approvedAt?: any;
  approvedBy?: string | null;
  notes?: string;
  invoiceId?: string;
  // Joined relation fields
  student?: Profile;
  course?: Course;
}

export interface LessonProgress {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  completed: boolean;
  watch_percentage: number; // 0 to 100
  seconds_watched?: number;
  completed_at?: string;
  updated_at?: string;
}

export interface Certificate {
  id: string;
  certificate_id: string; // Unique public code e.g. KO-2026-9A8F
  student_id: string;
  student_name: string;
  course_id: string;
  course_title: string;
  instructor_name: string;
  completion_date: string;
  verification_url: string;
  created_at: string;
}

export interface AboutPageCMS {
  id: string; // 'main'
  title: string;
  description: string;
  mission: string;
  vision: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  professional_title?: string;
  organizations?: string[];
  photo: string;
  bio: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    github?: string;
  };
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface SiteSettings {
  id: string; // 'general'
  site_name: string;
  contact_email: string;
  contact_phone?: string;
  announcement?: string;
  is_maintenance?: boolean;
  updated_at?: string;
}

export interface Review {
  id: string;
  course_id: string;
  student_name: string;
  student_location: string;
  avatar_url: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ==========================================
// DIGITAL SHOP TYPES
// ==========================================

export type DigitalProductType =
  | 'pdf'
  | 'ebook'
  | 'template'
  | 'zip'
  | 'software'
  | 'guide'
  | 'training'
  | 'document'
  | 'other';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface DigitalProduct {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  coverImage?: string;
  categoryId: string;
  categoryName?: string;
  category?: string;
  price: number;
  salePrice?: number;
  currency: string;
  productType: DigitalProductType;
  status: ProductStatus;
  featured: boolean;
  downloadable: boolean;
  downloadFileUrl?: string;
  requirements?: string[];
  includedFiles?: string[];
  purchaseInstructions?: string;
  createdAt: string;
  updatedAt: string;
  // Joined relation fields
  files?: ProductFile[];
}

export interface ProductFile {
  id: string;
  productId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  active: boolean;
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
}

export interface ShopOrderItem {
  productId: string;
  productTitle: string;
  productImage: string;
  productType: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type ManualPaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'BANK_DEPOSIT' | 'PAYPAL' | 'MONCASH' | 'NATCASH' | 'STRIPE' | string;
export type ShopOrderStatus = 'pending' | 'approved' | 'rejected' | 'canceled';
export type DownloadStatus = 'locked' | 'enabled';

export interface ShopOrder {
  id: string;
  orderNumber: string; // e.g. KO-2026-000001
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  items: ShopOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: ManualPaymentMethod | string;
  bankSelected?: string;
  senderPhone?: string;
  paypalEmailUsed?: string;
  transactionReference?: string;
  paymentProofUrl?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: ShopOrderStatus;
  downloadStatus: DownloadStatus;
  invoiceId: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  adminNotes?: string;
  trackingNumber?: string;
  publicStatusNote?: string;
  couponCode?: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  originalSubtotal?: number;
  finalTotal?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string;
  customerCity: string;
  items: ShopOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  bankSelected?: string;
  paymentStatus: string;
  orderStatus: string;
  trackingNumber?: string;
  couponCode?: string;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  originalSubtotal?: number;
  finalTotal?: number;
  createdAt: string;
  issuedAt?: string;
}

export interface DigitalAccess {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  active: boolean;
  enabledAt: string;
  enabledBy: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  product?: DigitalProduct;
  orderNumber?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType?: string;
  accountNumber: string;
  accountHolder: string;
}

// ==========================================
// COUPON CODE SYSTEM
// ==========================================

export type CouponDiscountType = 'percentage' | 'fixed';
export type CouponAppliesTo = 'all' | 'courses' | 'products' | 'categories';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  currency?: string;
  minimumPurchase?: number;
  maximumDiscount?: number;
  appliesTo: CouponAppliesTo;
  courseIds?: string[];
  productIds?: string[];
  categoryIds?: string[];
  usageLimit?: number;
  usageCount: number;
  usageLimitPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  userId: string;
  orderId: string;
  courseId?: string;
  productId?: string;
  discountAmount: number;
  usedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  originalSubtotal: number;
  finalTotal: number;
  message: string;
  messageKey?: 'success' | 'invalid' | 'expired' | 'usage_limit_reached' | 'not_applicable' | 'below_minimum' | 'user_limit_reached';
}

export interface PaymentSettings {
  id?: string;
  cashEnabled?: boolean;
  bankTransferEnabled?: boolean;
  bankDepositEnabled?: boolean;
  paypalEnabled?: boolean;
  moncashEnabled?: boolean;
  natcashEnabled?: boolean;
  stripeEnabled?: boolean;

  cash: {
    enabled: boolean;
    instructions: string;
    location: string;
    phone: string;
  };

  bankTransfer: {
    enabled: boolean;
    title?: string;
    description?: string;
    banks: BankAccount[];
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    accountType?: string;
    currency?: string;
    swift?: string;
    swiftCode?: string;
    instructions?: string;
  };

  bankDeposit: {
    enabled: boolean;
    instructions: string;
  };

  paypal: {
    enabled: boolean;
    title?: string;
    paypalEmail: string;
    paymentLink?: string;
    instructions: string;
  };

  moncash?: {
    enabled: boolean;
    title?: string;
    phone: string;
    accountName: string;
    instructions: string;
  };

  natcash?: {
    enabled: boolean;
    title?: string;
    phone: string;
    accountName: string;
    instructions: string;
  };

  stripe?: {
    enabled: boolean;
    title?: string;
    subtitle?: string;
  };

  updatedAt?: string;
}
