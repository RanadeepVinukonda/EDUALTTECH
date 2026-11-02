import { describe, it, expect, beforeEach, vi } from "vitest";

const { tx, mockPrisma } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    pollOption: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    pollVote: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
  return {
    tx,
    mockPrisma: { $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)) },
  };
});

vi.mock("../src/lib/prisma.js", () => ({ prisma: mockPrisma }));

import { castPollVote } from "../src/lib/poll-vote.js";
import { ApiError } from "../src/utils/ApiError.js";

const openPoll = { id: "poll1", status: "OPEN", endDate: null, allowVoteChange: true };

beforeEach(() => {
  vi.clearAllMocks();
  tx.pollOption.update.mockResolvedValue({});
  tx.pollOption.updateMany.mockResolvedValue({ count: 1 });
  tx.pollVote.create.mockResolvedValue({});
  tx.pollVote.update.mockResolvedValue({});
  tx.pollOption.findMany.mockResolvedValue([]);
});

describe("castPollVote", () => {
  it("rejects a closed poll", async () => {
    tx.$queryRaw.mockResolvedValue([{ ...openPoll, status: "CLOSED" }]);

    await expect(castPollVote("poll1", "opt1", "user1")).rejects.toMatchObject({
      status: 400,
      code: "BAD_REQUEST",
    });
    expect(tx.pollOption.findFirst).not.toHaveBeenCalled();
  });

  it("rejects a vote after the end date", async () => {
    tx.$queryRaw.mockResolvedValue([{ ...openPoll, endDate: new Date(Date.now() - 60_000) }]);

    await expect(castPollVote("poll1", "opt1", "user1")).rejects.toBeInstanceOf(ApiError);
    expect(tx.pollVote.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an option from another poll", async () => {
    tx.$queryRaw.mockResolvedValue([openPoll]);
    tx.pollOption.findFirst.mockResolvedValue(null);

    await expect(castPollVote("poll1", "other-poll-option", "user1")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("rejects voting twice for the same option", async () => {
    tx.$queryRaw.mockResolvedValue([openPoll]);
    tx.pollOption.findFirst.mockResolvedValue({ id: "opt1", title: "AI" });
    tx.pollVote.findUnique.mockResolvedValue({ id: "vote1", pollOptionId: "opt1" });

    await expect(castPollVote("poll1", "opt1", "user1")).rejects.toMatchObject({
      status: 409,
      message: "You have already voted for this course proposal.",
    });
    expect(tx.pollOption.update).not.toHaveBeenCalled();
  });

  it("rejects a vote change when the poll disallows changes", async () => {
    tx.$queryRaw.mockResolvedValue([{ ...openPoll, allowVoteChange: false }]);
    tx.pollOption.findFirst.mockResolvedValue({ id: "opt2", title: "Rust" });
    tx.pollVote.findUnique.mockResolvedValue({ id: "vote1", pollOptionId: "opt1" });

    await expect(castPollVote("poll1", "opt2", "user1")).rejects.toMatchObject({
      status: 409,
      message: "You have already voted in this poll and vote changes are disabled.",
    });
    expect(tx.pollVote.update).not.toHaveBeenCalled();
  });

  it("creates a first vote and increments only the chosen option", async () => {
    tx.$queryRaw.mockResolvedValue([openPoll]);
    tx.pollOption.findFirst.mockResolvedValue({ id: "opt1", title: "AI" });
    tx.pollVote.findUnique.mockResolvedValue(null);
    tx.pollOption.findMany.mockResolvedValue([
      { id: "opt1", voteCount: 3, order: 1 },
      { id: "opt2", voteCount: 1, order: 2 },
    ]);

    const result = await castPollVote("poll1", "opt1", "user1");

    expect(tx.pollVote.create).toHaveBeenCalledWith({
      data: { pollId: "poll1", pollOptionId: "opt1", userId: "user1" },
    });
    expect(tx.pollOption.update).toHaveBeenCalledWith({
      where: { id: "opt1" },
      data: { voteCount: { increment: 1 } },
    });
    expect(result.totalVotes).toBe(4);
    expect(result.votedOptionId).toBe("opt1");
  });

  it("changes a vote by guarded-decrementing the old option and incrementing the new one", async () => {
    tx.$queryRaw.mockResolvedValue([openPoll]);
    tx.pollOption.findFirst.mockResolvedValue({ id: "opt2", title: "Rust" });
    tx.pollVote.findUnique.mockResolvedValue({ id: "vote1", pollOptionId: "opt1" });
    tx.pollOption.findMany.mockResolvedValue([
      { id: "opt1", voteCount: 0, order: 1 },
      { id: "opt2", voteCount: 5, order: 2 },
    ]);

    const result = await castPollVote("poll1", "opt2", "user1");

    expect(tx.pollOption.updateMany).toHaveBeenCalledWith({
      where: { id: "opt1", voteCount: { gt: 0 } },
      data: { voteCount: { decrement: 1 } },
    });
    expect(tx.pollVote.update).toHaveBeenCalledWith({
      where: { id: "vote1" },
      data: { pollOptionId: "opt2" },
    });
    expect(tx.pollVote.create).not.toHaveBeenCalled();
    expect(result.totalVotes).toBe(5);
  });
});
