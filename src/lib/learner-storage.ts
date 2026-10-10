import type { Learner } from "@shared/learner";

export const LEARNER_STORAGE_KEY = "study-vocabulary:learner";

/** Corrupted or incomplete stored values mean "not signed in". */
export function parseStoredLearner(raw: string | null): Learner | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    if (!value || typeof value !== "object") return null;
    const { id, userId, name } = value;
    if (typeof id !== "string" || typeof userId !== "string" || typeof name !== "string") return null;
    if (!id || !userId || !name) return null;
    return { id, userId, name };
  } catch {
    return null;
  }
}
