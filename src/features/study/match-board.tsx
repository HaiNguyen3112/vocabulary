import type { MatchCard } from "@/lib/match-board";
import type { CardState } from "./use-match-game";
import { useBoardKeyboard } from "./use-board-keyboard";
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
  columns: number;
  getCardState: (card: MatchCard) => CardState;
  onSelect: (card: MatchCard) => void;
  onClearSelection: () => void;
};

export function MatchBoard({ cards, columns, getCardState, onSelect, onClearSelection }: Props) {
  const { cardRefs, handleBoardKeyDown } = useBoardKeyboard({
    cards,
    columns,
    isAvailable: (index) => getCardState(cards[index]) !== "matched",
    onClearSelection,
  });

  return (
    <div className={styles.board} onKeyDown={handleBoardKeyDown}>
      {cards.map((card, index) => {
        const state = getCardState(card);
        return (
          <button
            key={card.id}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
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
