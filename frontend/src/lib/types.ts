export type CourseType = "EDUCATION" | "ALTERNATIVE_EDUCATION";

export type LessonType = "VIDEO" | "READING" | "PROJECT";

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: CourseType;
  domain: string;
  tags: string[];
  features: string[];
  gradeLevel: string | null;
  pricePaise: number;
  currency: string;
  thumbnailUrl: string | null;
  enrolledCount?: number;
  mentorNames?: string[];
}

export interface CourseTopic {
  id: string;
  title: string;
  order: number;
  _count: { lessons: number };
  lessons: { id: string; title: string; type: LessonType; order: number }[];
}

export interface CourseChapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  topics: CourseTopic[];
}

export interface CourseMentor {
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null };
  capacity: number | null;
  free: number;
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: CourseType;
  domain: string;
  features: string[];
  gradeLevel: string | null;
  level: string | null;
  tags: string[];
  pricePaise: number;
  currency: string;
  thumbnailUrl: string | null;
  roadmapTitle: string | null;
  roadmapSummary: string | null;
  prerequisites?: string[];
  learningOutcomes?: string[];
  targetAudience?: string[];
  durationHours?: number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: { id: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null } | null;
  chapters: CourseChapter[];
  mentors: CourseMentor[];
  recommendedResources?: ResourceArticleCard[];
  enrolledCount: number;
  isStaff: boolean;
}

export interface CourseDetailResponse {
  course: CourseDetail;
  myParticipation: { id: string; role: "LEARNER" | "MENTOR"; status: string; progressPct: number } | null;
  myWishlist: boolean;
  myApplication: {
    id: string;
    status: string;
    interviewUrl: string | null;
    interviewAt: string | null;
    reviewNote: string | null;
  } | null;
}

export interface ResourceCatalogItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  chapterCount: number;
  topicCount: number;
  lessonCount: number;
}

export interface WorkItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  coverUrl: string | null;
  organization: { id: string; slug: string; name: string; logoUrl: string | null } | null;
}

export interface ProgramItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  pricePaise: number | null;
  currency: string;
  coverUrl: string | null;
  organization: { id: string; slug: string; name: string; logoUrl: string | null } | null;
}

export interface OrganizationItem {
  id: string;
  slug: string;
  name: string;
  type: string;
  summary: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
}

// ────────────────────────────────────────────────────────────────────
// Resource Library Types
// ────────────────────────────────────────────────────────────────────

export interface ResourceSubcategoryItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
}

export interface ResourceCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  articleCount?: number;
  subcategories: ResourceSubcategoryItem[];
}

export interface ResourceArticleCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  coverUrl: string | null;
  tags: string[];
  views: number;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; slug: string; icon: string | null };
  subcategory?: { id: string; name: string; slug: string } | null;
  author?: { firstName: string; lastName: string; avatarUrl: string | null } | null;
}

export interface ResourceLearningPathArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  tags: string[];
  createdAt: string;
}

export interface ResourceLearningPathSubcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  articles: ResourceLearningPathArticle[];
}

export interface ResourceLearningPathCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  articles: ResourceLearningPathArticle[];
  subcategories: ResourceLearningPathSubcategory[];
}

export interface ResourceArticleDetail extends ResourceArticleCard {
  content: string;
  categoryId?: string;
  subcategoryId?: string | null;
  isPublished?: boolean;
  published?: boolean;
  isFeatured?: boolean;
  authorAttribution?: string | null;
  isBookmarked?: boolean;
  linkedCourseId?: string | null;
  linkedCourse?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnailUrl?: string | null;
  } | null;
  relatedCourse?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    pricePaise: number;
    level: string | null;
    category: string;
  } | null;
  prevArticle?: { id: string; slug: string; title: string } | null;
  nextArticle?: { id: string; slug: string; title: string } | null;
}

export interface ResourceArticleDetailResponse {
  article: ResourceArticleDetail;
  isBookmarked: boolean;
  prev: { id: string; slug: string; title: string } | null;
  next: { id: string; slug: string; title: string } | null;
  related: ResourceArticleCard[];
}

// ────────────────────────────────────────────────────────────────────
// Course Polling Types
// ────────────────────────────────────────────────────────────────────

export interface PollOptionItem {
  id: string;
  pollId: string;
  title: string;
  description: string;
  category: string;
  domain?: string;
  difficulty?: string | null;
  durationWeeks?: number | null;
  estimatedDuration?: string | null;
  learningOutcomes?: string[];
  outcomes?: string[];
  votes: number;
  voteCount?: number;
  percentage?: number;
  isWinningOption?: boolean;
  isWinner?: boolean;
  convertedCourseId?: string | null;
  orderIndex?: number;
  order?: number;
}

export interface CoursePollItem {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
  startDate: string | null;
  endDate: string | null;
  allowMultipleVotes?: boolean;
  allowVoteChange?: boolean;
  hideResultsUntilClosed?: boolean;
  totalVotes?: number;
  options: PollOptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivePollResponse {
  poll: CoursePollItem | null;
  userVotes?: string[];
  userVoteOptionId?: string | null;
  userVotedOptionId?: string | null;
}
