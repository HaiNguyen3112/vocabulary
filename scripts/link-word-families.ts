/**
 * Links word families from a JSON file and creates the family members that are missing.
 *
 *   npm run db:link-families -- <families.json> [<more.json> …] [--dry]
 *
 * Input: [{ "base": "produce", "members": [{ "word", "partOfSpeech", "definition", "example" }] }]
 * - base / members already stored (same normalized spelling) → linked
 * - members not stored → created with the base word's category
 * Overlapping families are merged (union-find), existing families are kept and extended.
 * Backs up the collection to `words_backup_before_families` first (only once).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parsePartOfSpeech } from "../shared/part-of-speech";
import { normalizeWordKey } from "../shared/word";
import { collections, connectToMongoDB, disconnectFromMongoDB, getDb } from "../server/db/mongo";
import type { WordDoc } from "../server/db/types";

const BACKUP_COLLECTION = "words_backup_before_families";
const WORD_PATTERN = /^[a-z][a-z'-]*$/i;
const LARGE_FAMILY_SIZE = 8;

type FamilyEntry = {
  base: string;
  members: { word: string; partOfSpeech: string; definition: string; example?: string }[];
};

class UnionFind {
  private parent = new Map<string, string>();

  find(id: string): string {
    const parent = this.parent.get(id) ?? id;
    if (parent === id) return id;
    const root = this.find(parent);
    this.parent.set(id, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}

async function main() {
  const isDryRun = process.argv.includes("--dry");
  const files = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  if (files.length === 0) throw new Error("Pass at least one families JSON file");
  const entries = files.flatMap((file) => JSON.parse(readFileSync(file, "utf8")) as FamilyEntry[]);

  await connectToMongoDB();
  const rows = await collections.words().find({}).toArray();
  const idsByKey = new Map<string, string[]>();
  for (const row of rows) idsByKey.set(row.wordKey, [...(idsByKey.get(row.wordKey) ?? []), row._id]);
  const rowById = new Map(rows.map((row) => [row._id, row]));

  const created = new Map<string, WordDoc>(); // wordKey → new doc
  const skipped: string[] = [];
  const unionFind = new UnionFind();
  const now = new Date();

  // Keep families that already exist.
  const byFamily = new Map<string, string>();
  for (const row of rows) {
    if (!row.familyId) continue;
    const first = byFamily.get(row.familyId);
    if (first) unionFind.union(first, row._id);
    else byFamily.set(row.familyId, row._id);
  }

  for (const entry of entries) {
    const baseIds = idsByKey.get(normalizeWordKey(entry.base)) ?? [];
    if (baseIds.length === 0) {
      skipped.push(`base not found: ${entry.base}`);
      continue;
    }
    const category = rowById.get(baseIds[0])?.category ?? "OTHER";
    baseIds.forEach((id) => unionFind.union(baseIds[0], id));

    for (const member of entry.members) {
      const key = normalizeWordKey(member.word);
      const partOfSpeech = parsePartOfSpeech(member.partOfSpeech);
      if (key === normalizeWordKey(entry.base)) continue;
      const pending = created.get(key);
      if (pending && partOfSpeech && !pending.senses.some((sense) => sense.partOfSpeech === partOfSpeech)) {
        // Same new word suggested again with another word type → extra sense.
        pending.senses.push({
          partOfSpeech,
          definition: member.definition.trim(),
          examples: member.example?.trim() ? [member.example.trim()] : [],
        });
      }
      const existingIds = idsByKey.get(key) ?? (pending ? [pending._id] : []);
      if (existingIds.length > 0) {
        existingIds.forEach((id) => unionFind.union(baseIds[0], id));
        continue;
      }
      if (!WORD_PATTERN.test(member.word.trim()) || !partOfSpeech || !member.definition?.trim()) {
        skipped.push(`invalid member of ${entry.base}: ${JSON.stringify(member)}`);
        continue;
      }
      const doc: WordDoc = {
        _id: randomUUID(),
        word: member.word.trim(),
        wordKey: key,
        category,
        senses: [
          {
            partOfSpeech,
            definition: member.definition.trim(),
            examples: member.example?.trim() ? [member.example.trim()] : [],
          },
        ],
        createdAt: now,
      };
      created.set(key, doc);
      unionFind.union(baseIds[0], doc._id);
    }
  }

  // Group every touched id by its root.
  const allIds = [...rows.map((row) => row._id), ...[...created.values()].map((doc) => doc._id)];
  const groups = new Map<string, string[]>();
  for (const id of allIds) {
    const root = unionFind.find(id);
    groups.set(root, [...(groups.get(root) ?? []), id]);
  }
  const families = [...groups.values()].filter((ids) => ids.length > 1);
  const createdById = new Map([...created.values()].map((doc) => [doc._id, doc]));
  const label = (id: string) => rowById.get(id)?.word ?? `${createdById.get(id)?.word}*`;

  const linkedExisting = families.flat().filter((id) => rowById.has(id)).length;
  console.log(`[families] ${entries.length} entries → ${families.length} families`);
  console.log(`[families] existing words linked: ${linkedExisting}, new words: ${created.size}`);
  const sizes = families.map((ids) => ids.length).sort((a, b) => b - a);
  console.log(`[families] largest sizes: ${sizes.slice(0, 10).join(", ")}`);
  for (const ids of families.filter((group) => group.length >= LARGE_FAMILY_SIZE)) {
    console.log(`  large: ${ids.map(label).join(", ")}`);
  }
  if (skipped.length > 0) console.log(`[families] skipped ${skipped.length}:\n  ${skipped.join("\n  ")}`);
  if (isDryRun) {
    for (const ids of families.slice(0, 15)) console.log(`  sample: ${ids.map(label).join(", ")}`);
    return;
  }

  const db = getDb();
  const hasBackup = (await db.listCollections({ name: BACKUP_COLLECTION }).toArray()).length > 0;
  if (!hasBackup) {
    await db.collection("words").aggregate([{ $match: {} }, { $out: BACKUP_COLLECTION }]).toArray();
    console.log(`[families] backup written to ${BACKUP_COLLECTION}`);
  }

  if (created.size > 0) await collections.words().insertMany([...created.values()], { ordered: false });
  const updates = families.flatMap((ids) => {
    const familyId = ids.map((id) => rowById.get(id)?.familyId).find(Boolean) ?? randomUUID();
    return ids.map((id) => ({
      updateOne: { filter: { _id: id }, update: { $set: { familyId } } },
    }));
  });
  const result = await collections.words().bulkWrite(updates, { ordered: false });
  console.log(`[families] inserted ${created.size} words, set familyId on ${result.modifiedCount} words`);
  console.log(`[families] total words now: ${await collections.words().countDocuments()}`);
}

main()
  .catch((error) => {
    console.error("[families] Failed:", error);
    process.exitCode = 1;
  })
  .finally(() => disconnectFromMongoDB());
