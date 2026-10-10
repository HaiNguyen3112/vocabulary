import { RightOutlined } from "@ant-design/icons";
import { Button, Popover, Tag } from "antd";
import { useState } from "react";
import type { Word } from "@shared/word";
import { PART_OF_SPEECH_LABEL } from "@shared/part-of-speech";
import { WordSenses } from "@/features/shared/word-senses";
import styles from "./related-words.module.scss";

function partsLabel(word: Word): string {
  const labels = [...new Set(word.senses.flatMap((sense) => (sense.partOfSpeech ? [PART_OF_SPEECH_LABEL[sense.partOfSpeech]] : [])))];
  return labels.length > 0 ? ` · ${labels.join(", ")}` : "";
}

type Props = {
  words: Word[];
  onOpen: (id: string) => void;
};

/** Table cell: click a related word to peek at its meaning, then open its details. */
export function RelatedWordsPeek({ words, onOpen }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Close the popover before opening the drawer, otherwise it floats above it.
  const handleViewDetails = (id: string) => {
    setOpenId(null);
    onOpen(id);
  };

  return (
    <div className={styles.tags}>
      {words.map((word) => (
        <Popover
          key={word.id}
          trigger="click"
          open={openId === word.id}
          onOpenChange={(isOpen) => setOpenId(isOpen ? word.id : null)}
          title={word.word}
          content={
            <div className={styles.peek}>
              <WordSenses senses={word.senses} hasExamples={false} />
              <Button type="link" size="small" className={styles.more} onClick={() => handleViewDetails(word.id)}>
                View details
              </Button>
            </div>
          }
        >
          <Tag className={styles.tag}>
            {word.word}
            <span className={styles.parts}>{partsLabel(word)}</span>
          </Tag>
        </Popover>
      ))}
    </div>
  );
}

/** Detail drawer: each related word with its word types and meanings; click to open it in place. */
export function RelatedWordsList({ words, onOpen }: Props) {
  return (
    <ul className={styles.list}>
      {words.map((word) => (
        <li key={word.id}>
          <button type="button" className={styles.card} onClick={() => onOpen(word.id)}>
            <span className={styles.cardHeader}>
              <span className={styles.cardWord}>{word.word}</span>
              <RightOutlined className={styles.chevron} />
            </span>
            <WordSenses senses={word.senses} hasExamples={false} />
          </button>
        </li>
      ))}
    </ul>
  );
}
