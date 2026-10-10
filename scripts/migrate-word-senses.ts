/**
 * One-off migration: `definition: string` → `senses: [{ partOfSpeech, definition, examples }]`.
 * Backs up the collection to `words_backup_before_senses` first (only once).
 * Idempotent — only touches documents that still have `definition` and no `senses`.
 *
 *   npm run db:migrate-senses            # apply
 *   npm run db:migrate-senses -- --dry   # print what would change
 */
import "dotenv/config";
import { parseLegacyDefinition } from "../shared/legacy-definition";
import { normalizeDefinition } from "../shared/word";
import { collections, connectToMongoDB, disconnectFromMongoDB, getDb } from "../server/db/mongo";
import type { LegacyWordDoc } from "../server/db/types";

const BACKUP_COLLECTION = "words_backup_before_senses";
const SAMPLE_SIZE = 8;

async function main() {
  const isDryRun = process.argv.includes("--dry");
  await connectToMongoDB();
  const db = getDb();

  const legacy = await db
    .collection<LegacyWordDoc>("words")
    .find({ definition: { $exists: true }, senses: { $exists: false } })
    .toArray();
  console.log(`[migrate] ${legacy.length} words still use a plain definition`);
  if (legacy.length === 0) return;

  const planned = legacy.map((row) => ({
    row,
    senses: parseLegacyDefinition(normalizeDefinition(row.definition)),
  }));
  const typed = planned.filter(({ senses }) => senses.some((sense) => sense.partOfSpeech)).length;
  const withExamples = planned.filter(({ senses }) => senses.some((sense) => sense.examples.length > 0)).length;
  const multi = planned.filter(({ senses }) => senses.length > 1).length;
  console.log(`[migrate] with part of speech: ${typed}, with examples: ${withExamples}, multi-sense: ${multi}`);
  for (const { row, senses } of planned.filter(({ senses }) => senses.length > 1 || senses[0].examples.length > 0).slice(0, SAMPLE_SIZE)) {
    console.log(`  ${row.word}: ${JSON.stringify(senses)}`);
  }
  if (isDryRun) return;

  const hasBackup = (await db.listCollections({ name: BACKUP_COLLECTION }).toArray()).length > 0;
  if (!hasBackup) {
    await db.collection("words").aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }]).toArray();
    console.log(`[migrate] backup written to ${BACKUP_COLLECTION}`);
  }

  const result = await collections.words().bulkWrite(
    planned.map(({ row, senses }) => ({
      updateOne: {
        filter: { _id: row._id },
        update: { $set: { senses }, $unset: { definition: "" } },
      },
    })),
    { ordered: false },
  );
  console.log(`[migrate] updated ${result.modifiedCount} words`);
}

main()
  .catch((error) => {
    console.error("[migrate] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromMongoDB());
