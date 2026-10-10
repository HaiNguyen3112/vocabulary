import { Empty, type PaginationProps } from "antd";
import type { Word } from "@shared/word";
import { WordDetail } from "./word-detail";
import { WordIndexList } from "./word-index-list";
import styles from "./words-workspace.module.scss";

type Props = {
  words: Word[];
  selectedId?: string;
  isLoading: boolean;
  pagination: PaginationProps;
  onOpen: (id: string) => void;
  onClose: () => void;
};

/** Desktop word bank: compact list on the left, the open word on the right. */
export function WordsSplitView({ words, selectedId, isLoading, pagination, onOpen, onClose }: Props) {
  return (
    <div className={styles.split}>
      <div className={styles.listPane}>
        <WordIndexList
          words={words}
          selectedId={selectedId}
          isLoading={isLoading}
          pagination={pagination}
          onOpen={onOpen}
        />
      </div>
      <div className={styles.detailPane}>
        {selectedId ? (
          <WordDetail key={selectedId} id={selectedId} onClose={onClose} onOpenRelated={onOpen} />
        ) : (
          <Empty className={styles.placeholder} description="Select a word to see its meanings and examples" />
        )}
      </div>
    </div>
  );
}
