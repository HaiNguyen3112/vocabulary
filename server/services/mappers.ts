import type { Learner } from "../../shared/learner";
import type { WordReview } from "../../shared/review";
import type { Word } from "../../shared/word";
import type { LearnerDoc, ReviewDoc, WordDoc } from "../db/types";

export function mapWord(row: WordDoc, relatedWordIds: string[]): Word {
  return {
    id: row._id,
    word: row.word,
    category: row.category,
    senses: row.senses,
    relatedWordIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export function mapLearner(doc: LearnerDoc): Learner {
  return { id: doc._id, userId: doc.userId, name: doc.name };
}

export function mapReview(doc: ReviewDoc): WordReview {
  return {
    wordId: doc.wordId,
    state: doc.card.state,
    dueAt: doc.dueAt.toISOString(),
    reps: doc.card.reps,
    lapses: doc.card.lapses,
    firstReviewedAt: doc.firstReviewedAt.toISOString(),
  };
}
