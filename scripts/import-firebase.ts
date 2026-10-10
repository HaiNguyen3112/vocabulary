/**
 * One-off migration: copy `words` from the old Firebase Realtime Database into MongoDB.
 * Idempotent — inserts missing Firebase keys only, so re-running never duplicates rows
 * nor overwrites words edited since.
 * Keeps legacy duplicates (same word, different meaning) on purpose.
 *
 *   npm run db:import-firebase
 *   FIREBASE_WORDS_URL=https://…/words.json npm run db:import-firebase
 */
import "dotenv/config";
import { normalizeWordKey, parseWordInput } from "../shared/word";
import { collections, connectToMongoDB, disconnectFromMongoDB } from "../server/db/mongo";
import type { WordDoc } from "../server/db/types";

const DEFAULT_FIREBASE_WORDS_URL =
  "https://vocabularyproject-ab9b6-default-rtdb.asia-southeast1.firebasedatabase.app/words.json";

type FirebaseWord = {
  word?: unknown;
  definition?: unknown;
  category?: unknown;
  created_date?: unknown;
};

function parseCreatedDate(value: unknown): Date {
  const date = typeof value === "string" ? new Date(value) : new Date(Number.NaN);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

async function main() {
  const url = process.env.FIREBASE_WORDS_URL ?? DEFAULT_FIREBASE_WORDS_URL;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Firebase responded ${response.status}`);
  const data = ((await response.json()) ?? {}) as Record<string, FirebaseWord>;

  const docs: WordDoc[] = [];
  const invalid: string[] = [];
  for (const [key, raw] of Object.entries(data)) {
    const parsed = parseWordInput(raw);
    if (!parsed.ok) {
      invalid.push(`${key}: ${parsed.error}`);
      continue;
    }
    const { word, category, senses } = parsed.value;
    docs.push({
      _id: key,
      word,
      category,
      senses,
      wordKey: normalizeWordKey(parsed.value.word),
      createdAt: parseCreatedDate(raw.created_date),
    });
  }

  await connectToMongoDB();
  if (docs.length > 0) {
    const result = await collections.words().bulkWrite(
      docs.map((doc) => ({
        updateOne: { filter: { _id: doc._id }, update: { $setOnInsert: doc }, upsert: true },
      })),
      { ordered: false },
    );
    console.log(
      `[import] ${docs.length} words from Firebase → inserted ${result.upsertedCount}, already present ${docs.length - result.upsertedCount}`,
    );
  }
  if (invalid.length > 0) {
    console.warn(`[import] Skipped ${invalid.length} invalid rows:\n  ${invalid.join("\n  ")}`);
  }
  console.log(`[import] MongoDB now has ${await collections.words().countDocuments()} words`);
  await disconnectFromMongoDB();
}

main().catch(async (error) => {
  console.error("[import] Failed:", error);
  await disconnectFromMongoDB();
  process.exit(1);
});
