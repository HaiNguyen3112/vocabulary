import { Tag } from "antd";
import { useState } from "react";
import { formatDefinition, type WordInput } from "@shared/word";
import type { CategoryFilter } from "@/constants/categories";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { filterWords } from "@/lib/filter-words";
import { StudySession } from "./study-session";

type Props = {
  source: readonly WordInput[];
  initialCategory: CategoryFilter;
  isFileDeck: boolean;
};

/** Match board at `/study/match`: bank or the hub's file deck, filtered by category. */
export function MatchPractice({ source, initialCategory, isFileDeck }: Props) {
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const studyWords = filterWords(source, { search: "", category }).map((word) => ({
    word: word.word,
    definition: formatDefinition(word.senses),
  }));

  return (
    <StudySession
      key={`${category}-${studyWords.length}`}
      words={studyWords}
      toolbar={
        <>
          <CategoryFilterSelect value={category} onChange={setCategory} />
          {isFileDeck && <Tag>Studying file · {source.length} words</Tag>}
        </>
      }
    />
  );
}
