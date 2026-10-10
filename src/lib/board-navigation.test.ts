import { describe, expect, it } from "vitest";
import { boardMoveKey, isClearSelectionShortcut, isNewBoardShortcut, moveBoardFocus } from "./board-navigation";

const all = () => true;

describe("moveBoardFocus", () => {
  it("moves one step left/right and one row up/down", () => {
    expect(moveBoardFocus(0, "ArrowRight", 4, 16, all)).toBe(1);
    expect(moveBoardFocus(1, "ArrowDown", 4, 16, all)).toBe(5);
    expect(moveBoardFocus(5, "ArrowUp", 4, 16, all)).toBe(1);
    expect(moveBoardFocus(3, "ArrowRight", 4, 16, all)).toBe(4);
  });

  it("stays put at the edges", () => {
    expect(moveBoardFocus(0, "ArrowLeft", 4, 16, all)).toBe(0);
    expect(moveBoardFocus(13, "ArrowDown", 4, 16, all)).toBe(13);
  });

  it("skips matched cards", () => {
    expect(moveBoardFocus(0, "ArrowRight", 4, 16, (i) => i !== 1)).toBe(2);
    expect(moveBoardFocus(9, "ArrowUp", 4, 16, (i) => i !== 5)).toBe(1);
  });

  it("uses the given column count", () => {
    expect(moveBoardFocus(1, "ArrowDown", 2, 16, all)).toBe(3);
  });

  it("returns the first available card when focus is outside the board", () => {
    expect(moveBoardFocus(-1, "ArrowDown", 4, 16, (i) => i >= 2)).toBe(2);
    expect(moveBoardFocus(-1, "ArrowLeft", 4, 16, () => false)).toBe(-1);
  });

  it("stays put when nothing else is available", () => {
    expect(moveBoardFocus(6, "ArrowRight", 4, 16, (i) => i === 6)).toBe(6);
  });
});

describe("isNewBoardShortcut", () => {
  const base = { key: "r", ctrlKey: false, metaKey: false, altKey: false, targetTag: "BODY", targetEditable: false };

  it("accepts r and R", () => {
    expect(isNewBoardShortcut(base)).toBe(true);
    expect(isNewBoardShortcut({ ...base, key: "R" })).toBe(true);
  });

  it("ignores browser reload and other modifiers", () => {
    expect(isNewBoardShortcut({ ...base, ctrlKey: true })).toBe(false);
    expect(isNewBoardShortcut({ ...base, metaKey: true })).toBe(false);
    expect(isNewBoardShortcut({ ...base, altKey: true })).toBe(false);
  });

  it("ignores typing in fields", () => {
    for (const targetTag of ["INPUT", "TEXTAREA", "SELECT"]) {
      expect(isNewBoardShortcut({ ...base, targetTag })).toBe(false);
    }
    expect(isNewBoardShortcut({ ...base, targetTag: "DIV", targetEditable: true })).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isNewBoardShortcut({ ...base, key: "t" })).toBe(false);
  });
});

describe("boardMoveKey", () => {
  const plain = { key: "ArrowLeft", ctrlKey: false, metaKey: false, altKey: false };

  it("returns plain arrow keys", () => {
    expect(boardMoveKey(plain)).toBe("ArrowLeft");
    expect(boardMoveKey({ ...plain, key: "ArrowDown" })).toBe("ArrowDown");
  });

  it("leaves browser shortcuts alone (Alt+← / Cmd+← = Back)", () => {
    expect(boardMoveKey({ ...plain, altKey: true })).toBeNull();
    expect(boardMoveKey({ ...plain, metaKey: true })).toBeNull();
    expect(boardMoveKey({ ...plain, ctrlKey: true })).toBeNull();
  });

  it("ignores other keys", () => {
    expect(boardMoveKey({ ...plain, key: "a" })).toBeNull();
  });
});

describe("isClearSelectionShortcut", () => {
  const base = { key: "Escape", ctrlKey: false, metaKey: false, altKey: false, targetTag: "BODY", targetEditable: false };

  it("accepts Esc wherever focus is, outside fields", () => {
    expect(isClearSelectionShortcut(base)).toBe(true);
    expect(isClearSelectionShortcut({ ...base, targetTag: "BUTTON" })).toBe(true);
  });

  it("ignores Esc while typing or with modifiers", () => {
    expect(isClearSelectionShortcut({ ...base, targetTag: "INPUT" })).toBe(false);
    expect(isClearSelectionShortcut({ ...base, metaKey: true })).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isClearSelectionShortcut({ ...base, key: "r" })).toBe(false);
  });
});
