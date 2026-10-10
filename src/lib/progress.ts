import { isMastered, type ActivityDay, type WordReview } from "@shared/review";
import { HEAT_LEVELS, STRUGGLING_MIN_DIFFICULTY, STRUGGLING_MIN_LAPSES } from "@/constants/study";

export const PROGRESS_BUCKETS = ["unstudied", "learning", "known", "mastered"] as const;
export type ProgressBucket = (typeof PROGRESS_BUCKETS)[number];

/** Not studied / learning (incl. relearning) / known (review, short stability) / mastered. */
export function progressBucket(review: WordReview | undefined): ProgressBucket {
  if (!review) return "unstudied";
  if (review.state !== "review") return "learning";
  return isMastered(review.state, review.stability) ? "mastered" : "known";
}

export function countBuckets(
  words: readonly { id: string }[],
  byWordId: Readonly<Record<string, WordReview>>,
): Record<ProgressBucket, number> {
  const counts: Record<ProgressBucket, number> = { unstudied: 0, learning: 0, known: 0, mastered: 0 };
  for (const word of words) counts[progressBucket(byWordId[word.id])]++;
  return counts;
}

export function isStruggling(review: WordReview): boolean {
  return review.lapses >= STRUGGLING_MIN_LAPSES || review.difficulty >= STRUGGLING_MIN_DIFFICULTY;
}

/** Words the learner keeps forgetting: most lapses first, then the hardest. */
export function findStrugglingWords<W extends { id: string }>(
  words: readonly W[],
  byWordId: Readonly<Record<string, WordReview>>,
  limit: number,
): { word: W; review: WordReview }[] {
  return words
    .flatMap((word) => {
      const review = byWordId[word.id];
      return review && isStruggling(review) ? [{ word, review }] : [];
    })
    .sort((a, b) => b.review.lapses - a.review.lapses || b.review.difficulty - a.review.difficulty)
    .slice(0, limit);
}

export function retentionPercent({ passed, total }: { passed: number; total: number }): number | null {
  return total > 0 ? Math.round((passed / total) * 100) : null;
}

/** 0 = no reviews; 1…HEAT_LEVELS relative to the busiest day. */
export function heatLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.max(1, Math.ceil((count / max) * HEAT_LEVELS));
}

/** Monday = 0 … Sunday = 6 for a YYYY-MM-DD date. */
function weekdayIndex(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
}

/** Calendar columns of 7 (Mon → Sun); null pads days outside the range. */
export function toWeekColumns(days: readonly ActivityDay[]): (ActivityDay | null)[][] {
  const first = days[0];
  if (!first) return [];
  const cells: (ActivityDay | null)[] = [...Array<null>(weekdayIndex(first.date)).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  const columns: (ActivityDay | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) columns.push(cells.slice(index, index + 7));
  return columns;
}

const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

/** "T7, 10/10" for 2026-10-10. */
export function formatDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${WEEKDAY_SHORT[weekdayIndex(date)]}, ${Number(day)}/${Number(month)}`;
}

/** "Th10" when this column holds the 1st of a month (the column is labelled with that month). */
export function monthLabel(column: readonly (ActivityDay | null)[]): string | null {
  const first = column.find((cell) => cell?.date.endsWith("-01"));
  return first ? `Th${Number(first.date.slice(5, 7))}` : null;
}

/** Smallest of 5, 10, 20, 50, 100, 200, 500… that is ≥ value — a round top for a chart axis. */
export function niceMax(value: number): number {
  let magnitude = 1;
  for (;;) {
    for (const step of [1, 2, 5]) {
      const candidate = step * magnitude;
      if (candidate >= 5 && candidate >= value) return candidate;
    }
    magnitude *= 10;
  }
}
