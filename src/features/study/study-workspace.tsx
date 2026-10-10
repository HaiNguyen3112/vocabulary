import { CloseOutlined } from "@ant-design/icons";
import { Alert, App, Spin, Tag } from "antd";
import { useState } from "react";
import { formatDefinition, type WordInput } from "@shared/word";
import { ALL_CATEGORIES, type CategoryFilter } from "@/constants/categories";
import { CategoryFilterSelect } from "@/features/shared/category-select";
import { ExcelFileButton } from "@/features/shared/excel-file-button";
import { useWords } from "@/hooks/use-words";
import type { ParsedWordRows } from "@/lib/excel-rows";
import { filterWords } from "@/lib/filter-words";
import { StudySession } from "./study-session";

type FileDeck = {
  words: WordInput[];
  /** Bumped on each upload so the same file re-deals a fresh board. */
  version: number;
};

/** Study either the saved word bank or a local Excel file (not saved). */
export function StudyWorkspace() {
  const { message } = App.useApp();
  const { words: savedWords, isLoading, error } = useWords();
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [fileDeck, setFileDeck] = useState<FileDeck | null>(null);

  const sourceWords = fileDeck?.words ?? savedWords;
  const studyWords = filterWords(sourceWords, { search: "", category }).map((word) => ({
    word: word.word,
    definition: formatDefinition(word.senses),
  }));
  const deckKey = `${fileDeck ? `file-${fileDeck.version}` : "bank"}-${category}-${studyWords.length}`;

  const handleParsed = ({ valid, invalid }: ParsedWordRows) => {
    if (valid.length === 0) {
      message.error("No valid rows found (columns: word, definition, category)");
      return;
    }
    if (invalid.length > 0) message.warning(`Skipped ${invalid.length} invalid rows`);
    setFileDeck((prev) => ({ words: valid, version: (prev?.version ?? 0) + 1 }));
  };

  return (
    <Spin spinning={isLoading && !fileDeck} delay={500} size="large">
      {error && !fileDeck && <Alert type="error" showIcon message={error} />}
      <StudySession
        key={deckKey}
        words={studyWords}
        toolbar={
          <>
            <ExcelFileButton onParsed={handleParsed} />
            <CategoryFilterSelect value={category} onChange={setCategory} />
            {fileDeck && (
              <Tag closable closeIcon={<CloseOutlined />} onClose={() => setFileDeck(null)}>
                Studying file · {fileDeck.words.length} words
              </Tag>
            )}
          </>
        }
      />
    </Spin>
  );
}
