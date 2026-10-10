import { randomUUID } from "node:crypto";
import type { Category } from "../../shared/categories";
import type { Filter } from "mongodb";
import {
  normalizeWordKey,
  type BulkInsertResult,
  type Word,
  type WordInput,
  type WordPage,
  type WordPageQuery,
  type WordWithRelated,
} from "../../shared/word";
import { collections } from "../db/mongo";
import type { WordDoc } from "../db/types";
import { getRelatedIds, groupFamilies, setFamily } from "./families";
import { mapWord } from "./mappers";

function toDoc(input: WordInput, createdAt: Date): WordDoc {
  return {
    _id: randomUUID(),
    word: input.word,
    wordKey: normalizeWordKey(input.word),
    category: input.category,
    senses: input.senses,
    createdAt,
  };
}

async function loadWord(id: string): Promise<Word | null> {
  const row = await collections.words().findOne({ _id: id });
  return row ? mapWord(row, await getRelatedIds(row)) : null;
}

export async function listWords(category?: Category): Promise<Word[]> {
  const rows = await collections
    .words()
    .find(category ? { category } : {})
    .sort({ createdAt: -1 })
    .toArray();
  // Family members may sit outside the category filter — group over all of them.
  const familyRows = category
    ? await collections
        .words()
        .find({ familyId: { $exists: true } }, { projection: { _id: 1, familyId: 1 } })
        .toArray()
    : rows;
  const relatedOf = groupFamilies(familyRows);
  return rows.map((row) => mapWord(row, relatedOf(row)));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Same match as the old client filter: word, any definition or any example, case-insensitive. */
function pageFilter({ search, category }: WordPageQuery): Filter<WordDoc> {
  const filter: Filter<WordDoc> = category ? { category } : {};
  if (!search) return filter;
  const pattern = { $regex: escapeRegex(search), $options: "i" };
  return {
    ...filter,
    $or: [{ word: pattern }, { "senses.definition": pattern }, { "senses.examples": pattern }],
  };
}

/** Maps `rows` with their related ids and loads the family members that are not in `rows`. */
async function withRelated(rows: WordDoc[]): Promise<{ words: Word[]; related: Word[] }> {
  const familyIds = [...new Set(rows.flatMap((row) => (row.familyId ? [row.familyId] : [])))];
  if (familyIds.length === 0) return { words: rows.map((row) => mapWord(row, [])), related: [] };

  const members = await collections.words().find({ familyId: { $in: familyIds } }).toArray();
  const relatedOf = groupFamilies(members);
  const rowIds = new Set(rows.map((row) => row._id));
  return {
    words: rows.map((row) => mapWord(row, relatedOf(row))),
    related: members.filter((row) => !rowIds.has(row._id)).map((row) => mapWord(row, relatedOf(row))),
  };
}

/** One page of the word list, newest first. A page past the end returns the last page. */
export async function listWordPage(query: WordPageQuery): Promise<WordPage> {
  const filter = pageFilter(query);
  const total = await collections.words().countDocuments(filter);
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const rows = await collections
    .words()
    .find(filter)
    .sort({ createdAt: -1, _id: 1 })
    .skip((page - 1) * query.pageSize)
    .limit(query.pageSize)
    .toArray();
  return { ...(await withRelated(rows)), total, page, pageSize: query.pageSize };
}

export async function getWordWithRelated(id: string): Promise<WordWithRelated | null> {
  const row = await collections.words().findOne({ _id: id });
  if (!row) return null;
  const { words, related } = await withRelated([row]);
  return { word: words[0], related };
}

/** True when another word (not `exceptId`) already uses this spelling. */
export async function wordExists(word: string, exceptId?: string): Promise<boolean> {
  const row = await collections.words().findOne(
    { wordKey: normalizeWordKey(word), ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
    { projection: { _id: 1 } },
  );
  return row !== null;
}

export async function insertWord(input: WordInput): Promise<Word> {
  const doc = toDoc(input, new Date());
  await collections.words().insertOne(doc);
  if (input.relatedWordIds.length > 0) await setFamily(doc._id, input.relatedWordIds);
  return (await loadWord(doc._id)) ?? mapWord(doc, []);
}

export async function updateWord(id: string, input: WordInput): Promise<Word | null> {
  const result = await collections.words().updateOne(
    { _id: id },
    {
      $set: {
        word: input.word,
        wordKey: normalizeWordKey(input.word),
        category: input.category,
        senses: input.senses,
        updatedAt: new Date(),
      },
    },
  );
  if (result.matchedCount === 0) return null;
  await setFamily(id, input.relatedWordIds);
  return loadWord(id);
}

/** Inserts words whose key is not yet stored (also dedupes within the batch). */
export async function insertWordsSkippingExisting(
  inputs: WordInput[],
): Promise<BulkInsertResult> {
  const keys = [...new Set(inputs.map((input) => normalizeWordKey(input.word)))];
  const existing = await collections
    .words()
    .find({ wordKey: { $in: keys } }, { projection: { wordKey: 1 } })
    .toArray();
  const seenKeys = new Set(existing.map((row) => row.wordKey));

  const createdAt = new Date();
  const docs: WordDoc[] = [];
  const skipped: string[] = [];
  for (const input of inputs) {
    const key = normalizeWordKey(input.word);
    if (seenKeys.has(key)) {
      skipped.push(input.word);
      continue;
    }
    seenKeys.add(key);
    docs.push(toDoc(input, createdAt));
  }

  if (docs.length > 0) {
    await collections.words().insertMany(docs, { ordered: false });
  }
  return { inserted: docs.map((doc) => mapWord(doc, [])), skipped };
}
