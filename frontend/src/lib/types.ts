export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
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
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string | null;
  pricePaise: number;
  currency: string;
  thumbnailUrl: string | null;
  roadmapTitle: string | null;
  roadmapSummary: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: { id: string; firstName: string; lastName: string; avatarUrl: string | null; bio: string | null } | null;
  chapters: CourseChapter[];
  mentors: CourseMentor[];
  enrolledCount: number;
  isStaff: boolean;
}

export interface CourseDetailResponse {
  course: CourseDetail;
  myParticipation: { id: string; role: "LEARNER" | "MENTOR"; status: string; progressPct: number } | null;
  myWishlist: boolean;
  myApplication: { id: string; status: string } | null;
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
