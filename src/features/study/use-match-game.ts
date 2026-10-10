import { App } from "antd";
import { useEffect, useRef, useState } from "react";
import { BOARD_PAIR_COUNT, MATCH_FLASH_MS, NEXT_BOARD_DELAY_MS, SPEECH_LANG } from "@/constants/study";
import { buildMatchBoard, isMatch, type MatchCard, type MatchSource } from "@/lib/match-board";
import { speakText } from "@/lib/speech";

export type CardState = "idle" | "selected" | "correct" | "wrong" | "matched";

type Flash = { ids: [string, string]; result: "correct" | "wrong" };

/** Word ↔ definition matching game. Re-mount (via `key`) to start over with new words. */
export function useMatchGame(words: readonly MatchSource[]) {
  const { message } = App.useApp();
  const [cards, setCards] = useState(() => buildMatchBoard(words, BOARD_PAIR_COUNT));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matchedKeys, setMatchedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [flash, setFlash] = useState<Flash | null>(null);
  const [mistakeCount, setMistakeCount] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const schedule = (callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  };

  const dealNewBoard = () => {
    clearTimers();
    setCards(buildMatchBoard(words, BOARD_PAIR_COUNT));
    setSelectedId(null);
    setMatchedKeys(new Set());
    setFlash(null);
    setMistakeCount(0);
  };

  /** Drops a half-made pair (Esc); ignored while a result is flashing. */
  const clearSelection = () => {
    if (!flash) setSelectedId(null);
  };

  const handleCorrect = (first: MatchCard, second: MatchCard) => {
    const wordCard = first.kind === "word" ? first : second;
    if (!speakText(wordCard.content, SPEECH_LANG)) {
      message.warning("Your browser does not support speech synthesis.");
    }
    setFlash({ ids: [first.id, second.id], result: "correct" });
    schedule(() => {
      setFlash(null);
      setSelectedId(null);
      const nextMatched = new Set(matchedKeys).add(first.pairKey);
      setMatchedKeys(nextMatched);
      if (nextMatched.size === cards.length / 2) schedule(dealNewBoard, NEXT_BOARD_DELAY_MS);
    }, MATCH_FLASH_MS);
  };

  const handleSelect = (card: MatchCard) => {
    if (flash || matchedKeys.has(card.pairKey) || card.id === selectedId) return;

    const selected = cards.find((item) => item.id === selectedId);
    if (!selected) {
      setSelectedId(card.id);
      return;
    }
    if (isMatch(selected, card)) {
      handleCorrect(selected, card);
      return;
    }
    setFlash({ ids: [selected.id, card.id], result: "wrong" });
    setMistakeCount((count) => count + 1);
    schedule(() => {
      setFlash(null);
      setSelectedId(null);
    }, MATCH_FLASH_MS);
  };

  const getCardState = (card: MatchCard): CardState => {
    if (matchedKeys.has(card.pairKey)) return "matched";
    if (flash?.ids.includes(card.id)) return flash.result;
    return card.id === selectedId ? "selected" : "idle";
  };

  const progress = { matched: matchedKeys.size, total: cards.length / 2, mistakes: mistakeCount };

  return { cards, getCardState, handleSelect, dealNewBoard, clearSelection, progress };
}
