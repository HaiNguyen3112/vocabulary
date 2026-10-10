import { EditOutlined } from "@ant-design/icons";
import { Button, Empty, List, type PaginationProps } from "antd";
import type { Word } from "@shared/word";
import { PART_OF_SPEECH_LABEL } from "@shared/part-of-speech";
import { CategoryTag } from "@/features/shared/category-tag";
import { WordSenses } from "@/features/shared/word-senses";
import styles from "./word-card-list.module.scss";

type Props = {
  words: Word[];
  wordsById: ReadonlyMap<string, Word>;
  isLoading: boolean;
  pagination: PaginationProps;
  onOpen: (id: string) => void;
  onEdit: (word: Word) => void;
};

function partsLabel(word: Word): string {
  const labels = new Set(
    word.senses.flatMap((sense) => (sense.partOfSpeech ? [PART_OF_SPEECH_LABEL[sense.partOfSpeech]] : [])),
  );
  return [...labels].join(", ");
}

/** Mobile word list: one card per word with every meaning and its related words. */
export function WordCardList({ words, wordsById, isLoading, pagination, onOpen, onEdit }: Props) {
  return (
    <List
      className={styles.list}
      loading={isLoading}
      dataSource={words}
      locale={{ emptyText: <Empty description="No words" /> }}
      pagination={{ ...pagination, size: "small", align: "center" }}
      renderItem={(word) => {
        const related = word.relatedWordIds.flatMap((id) => wordsById.get(id) ?? []);
        return (
          <li className={styles.card}>
            <button type="button" className={styles.main} onClick={() => onOpen(word.id)}>
              <span className={styles.header}>
                <span className={styles.word}>{word.word}</span>
                <CategoryTag category={word.category} />
              </span>
              <WordSenses senses={word.senses} hasExamples={false} />
            </button>
            {related.length > 0 && (
              <div className={styles.related}>
                {related.map((item) => (
                  <button key={item.id} type="button" className={styles.relatedItem} onClick={() => onOpen(item.id)}>
                    ↳ <strong>{item.word}</strong>
                    {partsLabel(item) && <span className={styles.parts}> · {partsLabel(item)}</span>}
                  </button>
                ))}
              </div>
            )}
            <Button
              type="text"
              className={styles.edit}
              icon={<EditOutlined />}
              aria-label={`Edit ${word.word}`}
              onClick={() => onEdit(word)}
            />
          </li>
        );
      }}
    />
  );
}
