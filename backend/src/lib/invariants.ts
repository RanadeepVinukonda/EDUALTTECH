// Server-side rules that keep application/course state honest.
// Kept pure so scripts/check-invariants.ts can assert them directly.

import type { TeacherApplicationStatus } from "@prisma/client";

/** Legal mentor-application transitions. APPROVED and REJECTED are terminal —
 *  rejected users re-apply (which resets to PENDING), approved mentors are managed
 *  through their CourseMentor assignment instead of the application row. */
export const APPLICATION_TRANSITIONS: Record<TeacherApplicationStatus, readonly TeacherApplicationStatus[]> = {
  PENDING: ["UNDER_REVIEW", "INTERVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "APPROVED", "REJECTED"],
  INTERVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export function canTransition(from: TeacherApplicationStatus, to: TeacherApplicationStatus): boolean {
  return from === to || APPLICATION_TRANSITIONS[from].includes(to);
}
