import { ReloadOutlined } from "@ant-design/icons";
import { Button, Empty } from "antd";
import type { ReactNode } from "react";
import type { MatchSource } from "@/lib/match-board";
import { MatchBoard } from "./match-board";
import { useMatchGame } from "./use-match-game";
import styles from "./study-session.module.scss";

type Props = {
  words: readonly MatchSource[];
  /** Extra toolbar controls rendered after "Reload list". */
  toolbar?: ReactNode;
};

export function StudySession({ words, toolbar }: Props) {
  const { cards, getCardState, handleSelect, dealNewBoard } = useMatchGame(words);

  return (
    <div className={styles.session}>
      <div className={styles.toolbar}>
        <Button icon={<ReloadOutlined />} onClick={dealNewBoard} disabled={words.length === 0}>
          Reload list
        </Button>
        {toolbar}
      </div>
      {cards.length > 0 ? (
        <MatchBoard cards={cards} getCardState={getCardState} onSelect={handleSelect} />
      ) : (
        <Empty className={styles.empty} description="No words to study yet" />
      )}
    </div>
  );
}
