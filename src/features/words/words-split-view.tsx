import { Empty } from "antd";
import { useRef, type ComponentProps } from "react";
import type { Word } from "@shared/word";
import { WordDetail } from "./word-detail";
import { WordIndexList } from "./word-index-list";
import { WordListPager } from "./word-list-pager";
import styles from "./words-workspace.module.scss";

type Props = {
  words: Word[];
  selectedId?: string;
  isLoading: boolean;
  pager: Omit<ComponentProps<typeof WordListPager>, "className">;
  onOpen: (id: string) => void;
  onClose: () => void;
};

/** Desktop word bank: compact list on the left, the open word on the right. */
export function WordsSplitView({ words, selectedId, isLoading, pager, onOpen, onClose }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: number) => {
    pager.onChange(page);
    listRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className={styles.split}>
      <div className={styles.listPane}>
        <div ref={listRef} className={styles.listScroll}>
          <WordIndexList words={words} selectedId={selectedId} isLoading={isLoading} onOpen={onOpen} />
        </div>
        {pager.total > 0 && (
          <WordListPager {...pager} isStacked className={styles.paneFooter} onChange={handlePageChange} />
        )}
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
