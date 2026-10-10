import { useEffect, useRef, type KeyboardEvent } from "react";
import {
  boardMoveKey,
  isClearSelectionShortcut,
  isNewBoardShortcut,
  isTypingTarget,
  moveBoardFocus,
  type ShortcutEvent,
} from "@/lib/board-navigation";
import type { MatchCard } from "@/lib/match-board";

type BoardKeyboardOptions = {
  cards: MatchCard[];
  columns: number;
  isAvailable: (index: number) => boolean;
  onClearSelection: () => void;
};

/** Ignore keys aimed at text fields, open dialogs and dropdowns. */
function isOutsideShortcutScope(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    isTypingTarget(target.tagName, target.isContentEditable) ||
    target.closest('[role="dialog"], [role="listbox"]') !== null
  );
}

function toShortcutEvent(event: globalThis.KeyboardEvent): ShortcutEvent {
  const target = event.target instanceof HTMLElement ? event.target : null;
  return {
    key: event.key,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    altKey: event.altKey,
    targetTag: target?.tagName ?? null,
    targetEditable: target?.isContentEditable ?? false,
  };
}

/**
 * Arrow keys move focus between cards (skipping matched ones), Esc drops a half-made pair.
 * Arrows pressed outside the board (e.g. after the focused pair was matched) focus the first card.
 */
export function useBoardKeyboard(options: BoardKeyboardOptions) {
  const { cards, columns, isAvailable } = options;
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const latestRef = useRef(options);

  useEffect(() => {
    latestRef.current = options;
  });

  const handleBoardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = boardMoveKey(event);
    if (!key) return;
    event.preventDefault();
    const from = cardRefs.current.indexOf(event.target as HTMLButtonElement);
    cardRefs.current[moveBoardFocus(from, key, columns, cards.length, isAvailable)]?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || isOutsideShortcutScope(event.target)) return;
      const latest = latestRef.current;
      if (isClearSelectionShortcut(toShortcutEvent(event))) {
        latest.onClearSelection();
        return;
      }
      const key = boardMoveKey(event);
      if (!key || cardRefs.current.includes(event.target as HTMLButtonElement)) return;
      const next = moveBoardFocus(-1, key, latest.columns, latest.cards.length, latest.isAvailable);
      if (next === -1) return;
      event.preventDefault();
      cardRefs.current[next]?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { cardRefs, handleBoardKeyDown };
}

/** Plain R deals a new board (not Ctrl/Cmd+R, not while typing or in a dialog). */
export function useNewBoardShortcut(onNewBoard: () => void, isEnabled: boolean) {
  const latestRef = useRef({ onNewBoard, isEnabled });

  useEffect(() => {
    latestRef.current = { onNewBoard, isEnabled };
  });

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.repeat || !latestRef.current.isEnabled || isOutsideShortcutScope(event.target)) return;
      if (isNewBoardShortcut(toShortcutEvent(event))) latestRef.current.onNewBoard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
