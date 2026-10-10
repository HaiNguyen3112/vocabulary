import type { Rating, WordReview } from "../../shared/review";
import { collections } from "../db/mongo";
import type { ReviewDoc, ReviewLogDoc } from "../db/types";
import { mapReview } from "./mappers";
import { scheduleReview } from "./scheduler";

export async function listReviews(learnerId: string): Promise<WordReview[]> {
  const docs = await collections.reviews().find({ learnerId }).toArray();
  return docs.map(mapReview);
}

export async function recordReview(
  learnerId: string,
  wordId: string,
  rating: Rating,
  now: Date = new Date(),
): Promise<WordReview> {
  const _id = `${learnerId}:${wordId}`;
  const existing = await collections.reviews().findOne({ _id });
  const card = scheduleReview(existing?.card ?? null, rating, now);
  const doc: ReviewDoc = {
    _id,
    learnerId,
    wordId,
    card,
    dueAt: card.due,
    firstReviewedAt: existing?.firstReviewedAt ?? now,
    updatedAt: now,
  };

  await collections.reviews().updateOne(
    { _id },
    {
      $set: { card: doc.card, dueAt: doc.dueAt, updatedAt: doc.updatedAt },
      $setOnInsert: { learnerId, wordId, firstReviewedAt: doc.firstReviewedAt },
    },
    { upsert: true },
  );
  await logReview({
    learnerId,
    wordId,
    rating,
    stateBefore: existing?.card.state ?? "new",
    stabilityBefore: existing?.card.stability ?? 0,
    stateAfter: card.state,
    stabilityAfter: card.stability,
    reviewedAt: now,
  });
  return mapReview(doc);
}

/** History is best-effort: the card is the source of truth, so a failed log never fails the answer. */
async function logReview(log: ReviewLogDoc): Promise<void> {
  try {
    await collections.reviewLogs().insertOne(log);
  } catch (error) {
    console.error("[vocabulary] Could not log review:", error);
  }
}
