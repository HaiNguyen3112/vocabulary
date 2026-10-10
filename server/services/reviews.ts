import { randomUUID } from "node:crypto";
import type { Rating, WordReview } from "../../shared/review";
import { collections } from "../db/mongo";
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
  const existing = await collections.reviews().findOne({ learnerId, wordId });
  const card = scheduleReview(existing?.card ?? null, rating, now);
  const firstReviewedAt = existing?.firstReviewedAt ?? now;

  await collections.reviews().updateOne(
    { learnerId, wordId },
    {
      $set: { card, dueAt: card.due, updatedAt: now },
      $setOnInsert: { _id: randomUUID(), learnerId, wordId, firstReviewedAt },
    },
    { upsert: true },
  );
  return mapReview({
    _id: existing?._id ?? "",
    learnerId,
    wordId,
    card,
    dueAt: card.due,
    firstReviewedAt,
    updatedAt: now,
  });
}
