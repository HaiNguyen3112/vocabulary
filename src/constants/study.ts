/** Word/definition pairs shown on one board (board = 2 × pairs cards). */
export const BOARD_PAIR_COUNT = 8;
/** Duration of the correct / wrong flash before cards hide or reset. */
export const MATCH_FLASH_MS = 600;
/** Pause after the last pair before a new board is dealt. */
export const NEXT_BOARD_DELAY_MS = 1000;
export const SPEECH_LANG = "en-US";
/** Board grid columns (definition, word, definition, word); 2 below `SMALL_BREAKPOINT_PX`. */
export const BOARD_COLUMNS = 4;
export const BOARD_COLUMNS_SMALL = 2;
/** New words introduced per day in the review queue. */
export const NEW_WORDS_PER_DAY = 10;
/** Exercises in one scheduled study session. */
export const SESSION_SIZE = 20;
/** Exercises in one free-practice session. */
export const PRACTICE_SESSION_SIZE = 15;
/** Options (answer + distractors) shown in a multiple-choice exercise. */
export const CHOICE_OPTION_COUNT = 4;
/** A word "keeps being forgotten" from this many lapses… */
export const STRUGGLING_MIN_LAPSES = 2;
/** …or from this FSRS difficulty (1–10). */
export const STRUGGLING_MIN_DIFFICULTY = 8;
/** Words listed in "keeps forgetting" on the Progress page. */
export const STRUGGLING_LIST_SIZE = 20;
/** Heatmap colour steps above "no reviews". */
export const HEAT_LEVELS = 4;
