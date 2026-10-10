import { Empty, List } from "antd";
import type { Word } from "@shared/word";
import { CategoryTag } from "@/features/shared/category-tag";
import { partsOfSpeechLabel } from "@/lib/word-labels";
import styles from "./word-index-list.module.scss";

type Props = {
  words: Word[];
  selectedId?: string;
  isLoading: boolean;
  onOpen: (id: string) => void;
};

/** Compact list for the desktop split view: word, word types, first meaning, category. */
export function WordIndexList({ words, selectedId, isLoading, onOpen }: Props) {
  return (
    <List
      className={styles.list}
      loading={isLoading}
      dataSource={words}
      locale={{ emptyText: <Empty description="No words" /> }}
      renderItem={(word) => {
        const parts = partsOfSpeechLabel(word);
        return (
          <li>
            <button
              type="button"
              className={styles.item}
              aria-current={word.id === selectedId ? "true" : undefined}
              onClick={() => onOpen(word.id)}
            >
              <span className={styles.header}>
                <span className={styles.word}>{word.word}</span>
                {parts && <span className={styles.parts}>{parts}</span>}
                <CategoryTag category={word.category} />
              </span>
              <span className={styles.meaning}>{word.senses[0]?.definition}</span>
            </button>
          </li>
        );
      }}
    />
  );
}
