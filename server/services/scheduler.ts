import { createEmptyCard, fsrs, Rating as FsrsRating, State, type Card, type FSRS } from "ts-fsrs";
import type { Rating, ReviewState } from "../../shared/review";

export type StoredCard = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: ReviewState;
  last_review: Date | null;
};

const scheduler = fsrs({ enable_fuzz: true });

const RATING_TO_FSRS = {
  again: FsrsRating.Again,
  hard: FsrsRating.Hard,
  good: FsrsRating.Good,
  easy: FsrsRating.Easy,
} as const satisfies Record<Rating, FsrsRating>;

const STATE_TO_FSRS = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
} as const satisfies Record<ReviewState, State>;

const STATE_FROM_FSRS: Record<State, ReviewState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

function toFsrsCard(card: StoredCard): Card {
  return {
    ...card,
    state: STATE_TO_FSRS[card.state],
    last_review: card.last_review ?? undefined,
  };
}

function toStoredCard(card: Card): StoredCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_FROM_FSRS[card.state],
    last_review: card.last_review ?? null,
  };
}

export function scheduleReview(
  previous: StoredCard | null,
  rating: Rating,
  now: Date,
  engine: FSRS = scheduler,
): StoredCard {
  const card = previous ? toFsrsCard(previous) : createEmptyCard(now);
  const { card: next } = engine.next(card, now, RATING_TO_FSRS[rating]);
  return toStoredCard(next);
}
