import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    course: { findUnique: vi.fn() },
    courseParticipant: { findUnique: vi.fn() },
  },
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: mockPrisma }));

import {
  getCourseAccess,
  assertCourseOwner,
  assertCourseParticipant,
  assertCourseMentor,
} from "../src/lib/course-access.js";
import { ApiError } from "../src/utils/ApiError.js";

const ADMIN = { id: "admin1", role: "ADMIN" as const };
const USER = { id: "u1", role: "USER" as const };
const OTHER = { id: "u2", role: "USER" as const };

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.course.findUnique.mockResolvedValue({ id: "c1", createdById: "owner1" });
  mockPrisma.courseParticipant.findUnique.mockResolvedValue(null);
});

describe("getCourseAccess — authorization derivation", () => {
  it("grants full staff access to a platform admin without a participant lookup", async () => {
    const access = await getCourseAccess("c1", ADMIN);
    expect(access).toMatchObject({ isAdmin: true, isStaff: true, canRead: true });
    expect(mockPrisma.courseParticipant.findUnique).not.toHaveBeenCalled();
  });

  it("treats the course creator as staff", async () => {
    const access = await getCourseAccess("c1", { id: "owner1", role: "USER" });
    expect(access).toMatchObject({ isCreator: true, isStaff: true, canRead: true });
  });

  it("an ACTIVE mentor is staff but not a learner", async () => {
    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "MENTOR", status: "ACTIVE" });
    const access = await getCourseAccess("c1", USER);
    expect(access).toMatchObject({ isMentor: true, isLearner: false, isStaff: true, canRead: true });
  });

  it("an ACTIVE learner can read but is not staff", async () => {
    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });
    const access = await getCourseAccess("c1", USER);
    expect(access).toMatchObject({ isLearner: true, isMentor: false, isStaff: false, canRead: true });
  });

  it("a non-ACTIVE participation grants nothing", async () => {
    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "MENTOR", status: "DROPPED" });
    const access = await getCourseAccess("c1", USER);
    expect(access).toMatchObject({ isMentor: false, isLearner: false, canRead: false });
  });

  it("an unrelated user has no access", async () => {
    const access = await getCourseAccess("c1", OTHER);
    expect(access.canRead).toBe(false);
  });

  it("a single participation row can never be learner AND mentor at once", async () => {
    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });
    const access = await getCourseAccess("c1", USER);
    expect(access.isLearner && access.isMentor).toBe(false);
  });

  it("throws NOT_FOUND for an unknown course", async () => {
    mockPrisma.course.findUnique.mockResolvedValue(null);
    await expect(getCourseAccess("missing", USER)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("assert guards — least privilege", () => {
  it("assertCourseOwner forbids a non-owner mentor", async () => {
    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "MENTOR", status: "ACTIVE" });
    await expect(assertCourseOwner("c1", USER)).rejects.toBeInstanceOf(ApiError);
  });

  it("assertCourseOwner allows the creator and admin", async () => {
    await expect(assertCourseOwner("c1", { id: "owner1", role: "USER" })).resolves.toBeUndefined();
    await expect(assertCourseOwner("c1", ADMIN)).resolves.toBeUndefined();
  });

  it("assertCourseParticipant forbids an outsider", async () => {
    await expect(assertCourseParticipant("c1", OTHER)).rejects.toMatchObject({ status: 403 });
  });

  it("assertCourseMentor allows admin and mentor but forbids a learner", async () => {
    await expect(assertCourseMentor("c1", ADMIN)).resolves.toMatchObject({ isAdmin: true });

    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "MENTOR", status: "ACTIVE" });
    await expect(assertCourseMentor("c1", USER)).resolves.toMatchObject({ isMentor: true });

    mockPrisma.courseParticipant.findUnique.mockResolvedValue({ role: "LEARNER", status: "ACTIVE" });
    await expect(assertCourseMentor("c1", USER)).rejects.toMatchObject({ status: 403 });
  });
});
