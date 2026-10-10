import { ReloadOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import type { ReactNode } from "react";
import { BOARD_COLUMNS, BOARD_COLUMNS_SMALL } from "@/constants/study";
import { useIsSmallScreen } from "@/hooks/use-media-query";
import type { MatchSource } from "@/lib/match-board";
import { BoardProgress } from "./board-progress";
import { MatchBoard } from "./match-board";
import { useNewBoardShortcut } from "./use-board-keyboard";
import { useMatchGame } from "./use-match-game";
import styles from "./study-session.module.scss";

type Props = {
  words: readonly MatchSource[];
  /** Extra toolbar controls rendered after "New board". */
  toolbar?: ReactNode;
};

export function StudySession({ words, toolbar }: Props) {
  const { cards, getCardState, handleSelect, dealNewBoard, clearSelection, progress } = useMatchGame(words);
  const columns = useIsSmallScreen() ? BOARD_COLUMNS_SMALL : BOARD_COLUMNS;
  useNewBoardShortcut(dealNewBoard, words.length > 0);

  return (
    <div className={styles.session}>
      <div className={styles.toolbar}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={dealNewBoard} disabled={words.length === 0}>
          New board
        </Button>
        {toolbar}
        <BoardProgress {...progress} />
      </div>
      {cards.length > 0 ? (
        <>
          <MatchBoard
            cards={cards}
            columns={columns}
            getCardState={getCardState}
            onSelect={handleSelect}
            onClearSelection={clearSelection}
          />
          <p className={styles.hint}>
            <kbd>←</kbd>
            <kbd>→</kbd>
            <kbd>↑</kbd>
            <kbd>↓</kbd> move · <kbd>Enter</kbd> pick · <kbd>Esc</kbd> clear · <kbd>R</kbd> new board
          </p>
        </>
      ) : (
        <Empty className={styles.empty} description="No words to study yet" />
      )}
    </div>
  );
}
