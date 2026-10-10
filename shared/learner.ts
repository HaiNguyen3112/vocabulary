export const USER_ID_PATTERN = /^[a-z0-9_.-]{3,30}$/;
export const MAX_LEARNER_NAME_LENGTH = 50;

export type Learner = {
  id: string;
  userId: string;
  name: string;
};

export type LearnerInput = {
  userId: string;
  name: string;
};

export type LearnerInputResult =
  | { ok: true; value: LearnerInput }
  | { ok: false; error: string };

/** Key used to look a learner up: trimmed, lowercase. */
export function normalizeUserIdKey(userId: string): string {
  return userId.trim().toLowerCase();
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export function parseLearnerInput(raw: unknown): LearnerInputResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const body = raw as Record<string, unknown>;
  const userId = normalizeUserIdKey(toText(body.userId));
  const name = toText(body.name);

  if (!USER_ID_PATTERN.test(userId)) {
    return { ok: false, error: "User ID must be 3–30 characters: a-z, 0-9, _ . -" };
  }
  if (!name) return { ok: false, error: "Missing name" };
  if (name.length > MAX_LEARNER_NAME_LENGTH) return { ok: false, error: "Name is too long" };

  return { ok: true, value: { userId, name } };
}
