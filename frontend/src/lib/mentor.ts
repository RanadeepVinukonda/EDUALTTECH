import type { ApplicationStatus } from "./app-types";

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; tone: string; next: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    tone: "text-blue-700",
    next: "Your application is in the review queue. Nothing else is needed from you right now.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    tone: "text-amber-700",
    next: "A reviewer is assessing your application.",
  },
  INTERVIEW_SCHEDULED: {
    label: "Interview scheduled",
    tone: "text-indigo-700",
    next: "Check the interview details below and attend at the scheduled time.",
  },
  ACCEPTED: {
    label: "Accepted",
    tone: "text-emerald-700",
    next: "You have been accepted as a mentor for this course. Your teaching workspace is now available.",
  },
  REJECTED: {
    label: "Not accepted",
    tone: "text-red-700",
    next: "This application was not accepted. You may apply for a different course.",
  },
};
