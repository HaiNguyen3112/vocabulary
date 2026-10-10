import type { Rating, WordReview } from "../../shared/review";
import { collections } from "../db/mongo";
import type { ReviewDoc } from "../db/types";
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
  return mapReview(doc);
}
