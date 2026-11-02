import { prisma } from "./prisma.js";
import { ApiError } from "../utils/ApiError.js";

interface LockedPoll {
  id: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
  endDate: Date | null;
  allowVoteChange: boolean;
}

/**
 * Cast or change one user's vote inside a single transaction.
 *
 * The poll row is locked first so concurrent votes on the same poll serialise:
 * two requests from the same user can never both see "no existing vote" and
 * both increment an option, and a vote change can never race its own decrement.
 */
export async function castPollVote(pollId: string, optionId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<LockedPoll[]>`
      SELECT id, status, "endDate", "allowVoteChange"
      FROM "CoursePoll"
      WHERE id = ${pollId}
      FOR UPDATE
    `;
    const poll = locked[0];

    if (!poll || poll.status !== "OPEN") {
      throw ApiError.badRequest("This course poll is currently closed or not found.");
    }
    if (poll.endDate && new Date() > poll.endDate) {
      throw ApiError.badRequest("This poll has already reached its closing deadline.");
    }

    const targetOption = await tx.pollOption.findFirst({
      where: { id: optionId, pollId },
      select: { id: true, title: true },
    });
    if (!targetOption) {
      throw ApiError.badRequest("The selected proposed course is not part of this poll.");
    }

    const existingVote = await tx.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
      select: { id: true, pollOptionId: true },
    });

    if (existingVote?.pollOptionId === optionId) {
      throw ApiError.conflict("You have already voted for this course proposal.");
    }
    if (existingVote && !poll.allowVoteChange) {
      throw ApiError.conflict("You have already voted in this poll and vote changes are disabled.");
    }

    if (existingVote) {
      // Guarded decrement keeps the counter non-negative even if a historical
      // row drifted; the vote row itself is the source of truth.
      await tx.pollOption.updateMany({
        where: { id: existingVote.pollOptionId, voteCount: { gt: 0 } },
        data: { voteCount: { decrement: 1 } },
      });
      await tx.pollVote.update({
        where: { id: existingVote.id },
        data: { pollOptionId: optionId },
      });
    } else {
      await tx.pollVote.create({
        data: { pollId, pollOptionId: optionId, userId },
      });
    }

    await tx.pollOption.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });

    const options = await tx.pollOption.findMany({
      where: { pollId },
      orderBy: { order: "asc" },
    });
    const totalVotes = options.reduce((acc, opt) => acc + opt.voteCount, 0);

    return { votedOptionId: optionId, optionTitle: targetOption.title, totalVotes, options };
  });
}
