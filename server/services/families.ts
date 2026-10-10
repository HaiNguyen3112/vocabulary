import { randomUUID } from "node:crypto";
import { collections } from "../db/mongo";
import type { WordDoc } from "../db/types";

const MIN_FAMILY_SIZE = 2;

/** familyId → member ids, for computing `relatedWordIds`. */
export function groupFamilies(rows: readonly Pick<WordDoc, "_id" | "familyId">[]) {
  const families = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.familyId) continue;
    families.set(row.familyId, [...(families.get(row.familyId) ?? []), row._id]);
  }
  return (row: Pick<WordDoc, "_id" | "familyId">): string[] =>
    row.familyId ? (families.get(row.familyId) ?? []).filter((id) => id !== row._id) : [];
}

export async function getRelatedIds(row: WordDoc): Promise<string[]> {
  if (!row.familyId) return [];
  const members = await collections
    .words()
    .find({ familyId: row.familyId }, { projection: { _id: 1, familyId: 1 } })
    .toArray();
  return groupFamilies(members)(row);
}

/** A family left with a single member is meaningless — detach it. */
async function pruneSmallFamilies(familyIds: Iterable<string>): Promise<void> {
  for (const familyId of new Set(familyIds)) {
    const count = await collections.words().countDocuments({ familyId });
    if (count < MIN_FAMILY_SIZE) {
      await collections.words().updateMany({ familyId }, { $unset: { familyId: "" } });
    }
  }
}

/**
 * Makes the family of `wordId` exactly `{wordId} ∪ relatedIds` (what the user sees is
 * what is saved): unselected former members leave, selected words join (leaving their old family).
 */
export async function setFamily(wordId: string, relatedIds: readonly string[]): Promise<void> {
  const self = await collections.words().findOne({ _id: wordId });
  if (!self) return;

  const selected = await collections
    .words()
    .find({ _id: { $in: relatedIds.filter((id) => id !== wordId) } }, { projection: { _id: 1, familyId: 1 } })
    .toArray();
  const touchedFamilies = selected.flatMap((row) => (row.familyId ? [row.familyId] : []));

  if (selected.length === 0) {
    if (!self.familyId) return;
    await collections.words().updateOne({ _id: wordId }, { $unset: { familyId: "" } });
    await pruneSmallFamilies([self.familyId]);
    return;
  }

  const familyId = self.familyId ?? randomUUID();
  const memberIds = [wordId, ...selected.map((row) => row._id)];
  await collections
    .words()
    .updateMany({ familyId, _id: { $nin: memberIds } }, { $unset: { familyId: "" } });
  await collections.words().updateMany({ _id: { $in: memberIds } }, { $set: { familyId } });
  await pruneSmallFamilies(touchedFamilies.filter((id) => id !== familyId));
}
