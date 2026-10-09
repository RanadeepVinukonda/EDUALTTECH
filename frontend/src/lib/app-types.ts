export type Role = "USER" | "ADMIN";

export interface Me {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  mobile: string | null;
  mobileVerifiedAt: boolean;
  emailVerifiedAt: boolean;
  dateOfBirth: string | null;
  bio: string | null;
  educationLevel: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  gradYear: number | null;
  onboardingDone: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface MentorMini {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface LearningCourse {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
}

export interface LearningRow {
  id: string;
  courseId: string;
  role: string;
  status: string;
  progressPct: number;
  mentorUserId: string | null;
  currentTopicId: string | null;
  course: LearningCourse;
  mentor: MentorMini | null;
}

export interface MentoringRow {
  id: string;
  courseId: string;
  role: string;
  status: string;
  course: LearningCourse & { status: string; _count?: { participants: number } };
}

export interface MeetingRow {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl: string;
  courseId: string;
  course: { id: string; slug: string; title: string };
  createdBy?: { firstName: string; lastName: string; avatarUrl: string | null };
  chapter?: { id: string; title: string } | null;
  topic?: { id: string; title: string } | null;
}

export interface ApplicationRow {
  id: string;
  status: string;
  createdAt: string;
  course: { id: string; slug: string; title: string };
}

export interface DashboardData {
  role: Role;
  learning: LearningRow[];
  mentoring: MentoringRow[];
  upcomingMeetings: MeetingRow[];
  unreadNotifications: number;
  unreadMessages: number;
  applications: ApplicationRow[];
}

export interface MyLearningRow extends LearningRow {
  course: LearningCourse & { status: string; pricePaise: number; currency: string };
}
export interface MyCourses {
  learning: MyLearningRow[];
  mentoring: MentoringRow[];
}

export interface LessonRow {
  id: string;
  title: string;
  type: "VIDEO" | "READING";
  contentUrl: string | null;
  textContent: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
}
export interface TopicRow {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  lessons: LessonRow[];
}
export interface ChapterRow {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  topics: TopicRow[];
}
export interface Roadmap {
  chapters: ChapterRow[];
  completedLessonIds: string[];
}

export interface CourseOverview {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string | null;
  pricePaise: number;
  currency: string;
  thumbnailUrl: string | null;
  status: string;
  createdBy: { id: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null };
  chapters: {
    id: string;
    title: string;
    summary: string | null;
    order: number;
    topics: { id: string; title: string; order: number; _count: { lessons: number } }[];
  }[];
  mentors: { user: MentorMini & { bio: string | null }; capacity: number | null }[];
  enrolledCount: number;
  upcomingMeetings: { id: string; title: string; scheduledAt: string; durationMin: number; meetingUrl: string }[];
  isStaff: boolean;
}

export interface CourseAccess {
  isAdmin: boolean;
  isCreator: boolean;
  isMentor: boolean;
  isLearner: boolean;
  isStaff: boolean;
  canRead: boolean;
}

export interface CourseDetailResponse {
  course: CourseOverview;
  access: CourseAccess;
  myParticipation: {
    id: string;
    role: string;
    status: string;
    progressPct: number;
    mentorUserId: string | null;
    currentTopicId: string | null;
  } | null;
  myWishlist: boolean;
  myApplication: { id: string; status: string } | null;
}

export interface WishlistItem {  id: string;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    pricePaise: number;
    currency: string;
    thumbnailUrl: string | null;
    status: string;
  };
}

export type OrderStatus = "CREATED" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderPayment {
  id: string;
  orderId: string;
  razorpayPaymentId: string;
  signature: string;
  method: string | null;
  verified: boolean;
  rawPayload?: unknown;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  status: OrderStatus;
  idempotencyKey: string | null;
  createdAt: string;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  payments?: OrderPayment[];
}

export interface CheckoutPayload {  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  status: string;
  keyId: string;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  prefill?: { name: string; email: string; contact: string };
}

export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "INTERVIEW_SCHEDULED" | "ACCEPTED" | "REJECTED";

export interface ApplicationCourse {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  qualification: string;
  message: string | null;
  resumePath?: string | null;
  interviewUrl?: string | null;
  interviewAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  course: ApplicationCourse;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    mobile: string | null;
  } | null;
}

export interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  url: string | null;
  storagePath?: string | null;
  fileSizeBytes: number | null;
  mimeType: string | null;
  downloads: number;
  isPublished: boolean;
  createdAt: string;
  courseId: string | null;
  topicId: string | null;
  ownerId: string;
  owner: { firstName: string; lastName: string };
  course: { id: string; slug: string; title: string } | null;
}

export interface ResourceDetail extends ResourceRow {
  downloadUrl: string | null;
}

export interface ChatPeer {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  courseId: string;
  title: string | null;
  createdAt: string;
  learnerUserId: string;
  mentorUserId: string;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  learner: ChatPeer;
  mentor: ChatPeer;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: ChatPeer;
}

export interface AdminStats {
  users: number;
  newUsers: number;
  activeLearners: number;
  mentors: number;
  courses: { published: number; draft: number; archived: number; total: number };
  enrollments: number;
  revenuePaise: number;
  paidOrders: number;
  payments: { ok: number; failed: number };
  applications: Record<string, number>;
  unreadContact: number;
  mentorCapacityDefault: number | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  avatarUrl: string | null;
  mobile: string | null;
  mobileVerifiedAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  _count: { participations: number };
}

export interface AdminCourseSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  pricePaise: number;
  currency: string;
  createdAt: string;
  createdBy: { firstName: string; lastName: string } | null;
  _count: { participants: number; chapters: number };
}

export interface AnalyticsPoint {
  date: string;
  revenuePaise: number;
  newUsers: number;
  enrollments: number;
}

export interface AnalyticsTopCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
  pricePaise: number;
  enrolledCount: number;
}

export interface AnalyticsData {
  range: string;
  series: AnalyticsPoint[];
  topCourses: AnalyticsTopCourse[];
}

export interface AdminApplicationRow {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  course: { id: string; slug: string; title: string; category: string; status: string };
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  courseId: string | null;
  course: { id: string; slug: string; title: string } | null;
  sender: { firstName: string; lastName: string; avatarUrl: string | null } | null;
}

export interface Page {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  status: OrderStatus;
  idempotencyKey: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  user: { id: string; firstName: string; lastName: string; email: string; mobile: string | null };
  payments: OrderPayment[];
}

export interface WebhookEventRow {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  signature: string;
  processed: boolean;
  processedAt: string | null;
  payload: unknown;
  receivedAt: string;
}

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  handledById: string | null;
  isRead: boolean;
  handledAt: string | null;
  createdAt: string;
}

export interface AuditLogRow {
  id: string;
  actorId: string | null;
  actor: { firstName: string; lastName: string; email: string } | null;
  action: string;
  targetType: string;
  targetId: string | null;
  meta: unknown;
  createdAt: string;
}

export interface AdminMentorRow {
  id: string;
  courseId: string;
  userId: string;
  role: "MENTOR";
  capacity: number | null;
  status: "ACTIVE" | "COMPLETED" | "DROPPED";
  mentorUserId: string | null;
  progressPct: number;
  currentTopicId: string | null;
  enrolledAt: string;
  updatedAt: string;
  assignedLearners: number;
  user: { id: string; firstName: string; lastName: string; email: string; avatarUrl: string | null };
  course: { id: string; slug: string; title: string; status: string };
}

export type SettingsMap = Record<string, unknown>;

// ── CMS ────────────────────────────────────────────────────────────

export type OrganizationType = "SCHOOL" | "PARTNER" | "FRANCHISE" | "NGO" | "OTHER";

export interface MediaAssetRow {
  id: string;
  alt: string | null;
  url: string;
  kind: string;
  category: string | null;
  position: string | null;
  createdAt: string;
}

export interface WorkItemRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  category: string;
  coverUrl: string | null;
  mediaIds: string[];
  organizationId: string | null;
  organization?: { id: string; slug: string; name: string } | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  summary: string | null;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; workItems: number; programs: number };
}

export interface ProgramRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  pricePaise: number | null;
  currency: string;
  coverUrl: string | null;
  organizationId: string | null;
  organization?: { id: string; slug: string; name: string } | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberRow {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}



