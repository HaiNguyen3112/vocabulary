import { useEffect, useRef } from "react";
import { isTypingTarget } from "@/lib/board-navigation";

export type ExerciseKeyHandlers = {
  /** Enter — also fires from a text field, so pass it only in the feedback state. */
  onEnter?: () => void;
  onEscape?: () => void;
  /** Digit keys 1–9 (1-based). */
  onDigit?: (digit: number) => void;
  onSpace?: () => void;
};

function parseDigit(key: string): number | null {
  return /^[1-9]$/.test(key) ? Number(key) : null;
}

/**
 * One window `keydown` listener for exercise shortcuts. Ignores Ctrl/Cmd/Alt combos, keys
 * already handled (e.g. Enter submitting a text field), keys inside dialogs, Enter / Space on a
 * focused button (its own click handles them) and everything typed in a text field but Enter.
 */
export function useExerciseKeys(handlers: ExerciseKeyHandlers) {
  const latestRef = useRef(handlers);

  useEffect(() => {
    latestRef.current = handlers;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target?.closest('[role="dialog"]')) return;
      const { onEnter, onEscape, onDigit, onSpace } = latestRef.current;
      const isButton = target?.tagName === "BUTTON";

      if (event.key === "Enter") {
        if (!onEnter || isButton) return;
        event.preventDefault();
        onEnter();
        return;
      }
      if (target && isTypingTarget(target.tagName, target.isContentEditable)) return;

      if (event.key === "Escape" && onEscape) {
        onEscape();
        return;
      }
      if (event.key === " " && onSpace && !isButton) {
        event.preventDefault();
        onSpace();
        return;
      }
      const digit = parseDigit(event.key);
      if (digit !== null && onDigit) {
        event.preventDefault();
        onDigit(digit);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
