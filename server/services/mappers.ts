import type { Word } from "../../shared/word";
import type { WordDoc } from "../db/types";

export function mapWord(row: WordDoc, relatedWordIds: string[]): Word {
  return {
    id: row._id,
    word: row.word,
    category: row.category,
    senses: row.senses,
    relatedWordIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}
