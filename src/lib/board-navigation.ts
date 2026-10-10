export type BoardArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

const ARROW_KEYS: readonly string[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

export function isBoardArrowKey(key: string): key is BoardArrowKey {
  return ARROW_KEYS.includes(key);
}

/**
 * Next card to focus on a grid of `total` cards, skipping unavailable (matched) ones.
 * Left/right step through reading order; up/down stay in the column. Nothing in that
 * direction → stay. `from === -1` (focus outside the board) → first available card, or -1.
 */
export function moveBoardFocus(
  from: number,
  key: BoardArrowKey,
  columns: number,
  total: number,
  isAvailable: (index: number) => boolean,
): number {
  if (from === -1) {
    for (let index = 0; index < total; index++) {
      if (isAvailable(index)) return index;
    }
    return -1;
  }
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns }[key];
  for (let index = from + step; index >= 0 && index < total; index += step) {
    if (isAvailable(index)) return index;
  }
  return from;
}

export function isTypingTarget(tag: string | null, editable: boolean): boolean {
  return editable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export type ShortcutEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  targetTag: string | null;
  targetEditable: boolean;
};

/** Plain R deals a new board — not Ctrl/Cmd+R (reload) and not while typing. */
export function isNewBoardShortcut(event: ShortcutEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (isTypingTarget(event.targetTag, event.targetEditable)) return false;
  return event.key === "r" || event.key === "R";
}
