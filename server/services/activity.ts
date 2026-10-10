import { isMastered, type Activity, type ActivityDay, type ReviewState } from "../../shared/review";
import { collections } from "../db/mongo";
import type { ReviewLogDoc } from "../db/types";

export const ACTIVITY_DAYS = 182;
const RETENTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ActivityLog = Omit<ReviewLogDoc, "learnerId">;
export type ActivityCard = { wordId: string; state: ReviewState; stability: number };

type BuildOptions = {
  /** Oldest first. */
  logs: readonly ActivityLog[];
  /** Every card of the learner as it is now. */
  cards: readonly ActivityCard[];
  now: Date;
  timeZone: string;
  days?: number;
};

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function localDateFormatter(timeZone: string): (date: Date) => string {
  // en-CA formats as YYYY-MM-DD.
  const format = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  return (date) => format.format(date);
}

/** Calendar arithmetic on YYYY-MM-DD strings (UTC midnight avoids DST shifts). */
function shiftDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function countStreaks(activeDates: ReadonlySet<string>, today: string): Activity["streak"] {
  let cursor = activeDates.has(today) ? today : shiftDate(today, -1);
  let current = 0;
  while (activeDates.has(cursor)) {
    current++;
    cursor = shiftDate(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of [...activeDates].sort()) {
    run = previous !== null && shiftDate(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }
  return { current, longest };
}

/**
 * Daily history in the learner's time zone. Mastered counts are rebuilt backwards: start from today's
 * cards and undo each answer newest → oldest, so they are exact from the first logged day on.
 */
export function buildActivity({ logs, cards, now, timeZone, days = ACTIVITY_DAYS }: BuildOptions): Activity {
  const toLocalDate = localDateFormatter(timeZone);
  const today = toLocalDate(now);
  const logDates = logs.map((entry) => toLocalDate(entry.reviewedAt));
  const sinceDate = logDates[0] ?? null;

  const reviewsByDate = new Map<string, number>();
  for (const date of logDates) reviewsByDate.set(date, (reviewsByDate.get(date) ?? 0) + 1);

  const mastered = new Set(cards.filter((card) => isMastered(card.state, card.stability)).map((card) => card.wordId));
  const result: ActivityDay[] = [];
  let logIndex = logs.length - 1;
  for (let offset = 0; offset < days; offset++) {
    const date = shiftDate(today, -offset);
    const isRecorded = sinceDate !== null && date >= sinceDate;
    result.push({ date, reviews: reviewsByDate.get(date) ?? 0, mastered: isRecorded ? mastered.size : null });
    // Undo this day's answers so `mastered` describes the end of the previous day.
    while (logIndex >= 0 && (logDates[logIndex] ?? "") >= date) {
      const entry = logs[logIndex];
      if (entry && isMastered(entry.stateBefore, entry.stabilityBefore)) mastered.add(entry.wordId);
      else if (entry) mastered.delete(entry.wordId);
      logIndex--;
    }
  }

  const retentionStart = now.getTime() - RETENTION_WINDOW_MS;
  const reviewAnswers = logs.filter(
    (entry) => entry.stateBefore === "review" && entry.reviewedAt.getTime() >= retentionStart,
  );

  return {
    since: logs[0]?.reviewedAt.toISOString() ?? null,
    days: result.reverse(),
    retention: {
      passed: reviewAnswers.filter((entry) => entry.rating !== "again").length,
      total: reviewAnswers.length,
    },
    streak: countStreaks(new Set(logDates), today),
  };
}

export async function loadActivity(learnerId: string, timeZone: string, now: Date = new Date()): Promise<Activity> {
  const [logs, cards] = await Promise.all([
    collections
      .reviewLogs()
      .find({ learnerId }, { projection: { _id: 0, learnerId: 0 } })
      .sort({ reviewedAt: 1 })
      .toArray(),
    collections
      .reviews()
      .find({ learnerId }, { projection: { wordId: 1, "card.state": 1, "card.stability": 1 } })
      .toArray(),
  ]);
  return buildActivity({
    logs,
    cards: cards.map((doc) => ({ wordId: doc.wordId, state: doc.card.state, stability: doc.card.stability })),
    now,
    timeZone,
  });
}
