import type { MatchCard } from "@/lib/match-board";
import type { CardState } from "./use-match-game";
import styles from "./match-board.module.scss";

const STATE_CLASS: Record<CardState, string> = {
  idle: "",
  selected: styles.selected,
  correct: styles.correct,
  wrong: styles.wrong,
  matched: styles.matched,
};

type Props = {
  cards: MatchCard[];
  getCardState: (card: MatchCard) => CardState;
  onSelect: (card: MatchCard) => void;
};

export function MatchBoard({ cards, getCardState, onSelect }: Props) {
  return (
    <div className={styles.board}>
      {cards.map((card) => {
        const state = getCardState(card);
        return (
          <button
            key={card.id}
            type="button"
            className={`${styles.card} ${STATE_CLASS[state]}`}
            disabled={state === "matched"}
            aria-pressed={state === "selected"}
            onClick={() => onSelect(card)}
          >
            <span className={`pre-line ${card.kind === "word" ? styles.word : styles.definition}`}>
              {card.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}
