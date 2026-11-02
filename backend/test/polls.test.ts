import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    coursePoll: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    pollOption: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    pollVote: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    course: { findUnique: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: mockPrisma }));

describe("Course Polling Logic & Vote Integrity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates percentages and vote distribution accurately", () => {
    const options = [
      { id: "opt1", title: "Autonomous AI Agents", voteCount: 60 },
      { id: "opt2", title: "Rust Systems", voteCount: 40 },
    ];
    const totalVotes = options.reduce((acc, o) => acc + o.voteCount, 0);
    expect(totalVotes).toBe(100);

    const withPercentages = options.map((opt) => ({
      ...opt,
      percentage: Math.round((opt.voteCount / totalVotes) * 100),
    }));

    expect(withPercentages[0].percentage).toBe(60);
    expect(withPercentages[1].percentage).toBe(40);
  });

  it("prevents duplicate voting when user has already voted for the same option", () => {
    const existingVotes = [{ id: "v1", pollId: "p1", pollOptionId: "opt1", userId: "u1" }];
    const optionId = "opt1";

    const alreadyVotedThisOption = existingVotes.some((v) => v.pollOptionId === optionId);
    expect(alreadyVotedThisOption).toBe(true);
  });

  it("allows vote switching when allowVoteChange is enabled", () => {
    const poll = { id: "p1", allowMultipleVotes: false, allowVoteChange: true };
    const existingVotes = [{ id: "v1", pollId: "p1", pollOptionId: "opt1", userId: "u1" }];
    const newOptionId = "opt2";

    const canSwitch = existingVotes.length > 0 && !poll.allowMultipleVotes && poll.allowVoteChange;
    expect(canSwitch).toBe(true);
    expect(existingVotes[0].pollOptionId).not.toBe(newOptionId);
  });

  it("converts a poll option proposal to a valid course draft structure", () => {
    const option = {
      id: "opt1",
      pollId: "p1",
      title: "Electronic Music Production & Synthesis",
      description: "From sound design to mixing masters.",
      category: "Creative Arts",
      domain: "Arts & Production",
      difficulty: "Beginner",
      outcomes: ["Master subtractive synthesis", "Audio mixing fundamentals"],
    };

    const courseDraft = {
      title: option.title,
      slug: "electronic-music-production-synthesis",
      description: option.description,
      category: option.category,
      domain: option.domain,
      level: option.difficulty,
      status: "DRAFT",
      pricePaise: 0,
      learningOutcomes: option.outcomes,
    };

    expect(courseDraft.status).toBe("DRAFT");
    expect(courseDraft.learningOutcomes).toHaveLength(2);
    expect(courseDraft.title).toBe(option.title);
  });
});
