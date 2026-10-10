# PROJECT.md — Study Vocabulary

## Goal

Personal English vocabulary trainer: a study hub with a spaced-repetition review (FSRS, per learner) and free-practice modes (match board, flashcards, multiple choice, type the word, listen & spell, fill in the blank — with pronunciation), plus a word bank (search, filter by category, add, Excel import).

## Stack

**Vite + React 18 + TypeScript strict + Ant Design 5 + SCSS modules + Vitest** + **Hono API + MongoDB** (same repo).

## Folder tree

```
shared/                # contracts used by BOTH client and server (no React, no Node APIs)
  categories.ts        # CATEGORIES, Category, isCategory
  part-of-speech.ts    # PARTS_OF_SPEECH, parsePartOfSpeech (aliases n/v/adj…)
  word.ts              # Word / WordInput / WordSense, parseWordInput (validation), formatDefinition
  legacy-definition.ts # split old free-text definitions into senses
  learner.ts           # Learner, normalizeUserIdKey, parseLearnerInput
  review.ts            # Rating, ReviewState, WordReview, parseReviewInput
src/
  main.tsx, App.tsx    # providers: antd ConfigProvider + App, BrowserRouter
  app/                 # AppLayout (top bar + bottom tab bar), ThemeToggle, LearnerMenu, nav-items (ROUTES, studyModePath,
                       # NAV_ITEMS, TAB_ITEMS), app-routes
  pages/               # thin routes: study-page (hub), study-review-page, study-mode-page, words-page (list + :id),
                       # word-edit-page
  features/
    study/             # LearnerGate (sign in / register modal) wraps every Study route
                       # StudyHub → TodayCard + ModeGrid (category filter + Excel deck in router state, practice-source)
                       # ReviewSession / PracticeSession → ExerciseSession (useExerciseSession, use-exercise-keys,
                       #   Choice/Flashcard/Type/Listen/Cloze exercises, AnswerFeedback, SessionSummary)
                       # MatchPractice → StudySession → MatchBoard, useMatchGame, BoardProgress, use-board-keyboard
    words/             # WordsWorkspace (split view ≥992px / table ≥600px / WordCardList <600px, filters in URL via
                       # useWordListParams), WordsSplitView + WordIndexList (≥992px), WordDetailDrawer (<992px), WordDetail,
                       # WordEditForm (page, + SensesField, RelatedWordsField), ImportPreviewModal
    shared/            # CategoryFilterSelect, CategoryTag, PartOfSpeechTag, WordSenses, ExcelFileButton, readWordsFromExcel
  hooks/               # use-words (store + first load), use-learner, use-reviews (current learner's reviews),
                       # use-media-query (mobile/desktop/small), use-color-scheme, use-go-back
  store/               # words-store (Zustand cache over /api/words), learner-store (localStorage), reviews-store
                       # (per-learner review cache), color-scheme-store (light/dark/system)
  api/                 # apiFetch + words, learners, reviews endpoints
  lib/                 # pure: shuffle, speech, filter-words, match-board, excel-rows, related-words, color-scheme,
                       # board-navigation, word-labels, exercise (StudyWord, ExerciseKind), build-exercise (findCloze),
                       # grade-answer, review-queue (queue, exercise kind, today stats), learner-storage (+ *.test.ts)
  constants/           # category labels/colours, study timings + session sizes, study-modes (STUDY_MODES,
                       # PracticeMode), page sizes, breakpoints
  styles/              # theme.ts (palettes + antd themes), _tokens.scss, _mixins.scss (index-card), index.scss (CSS variables)
server/
  index.ts             # Node entry; serves dist/ in production
  app.ts               # Hono app: /api/health, /api/words, /api/learners (+ reviews)
  vercel-entry.ts      # serverless handler → bundled to api/index.js
  db/                  # mongo client + indexes, document types
  routes/              # thin REST handlers: words, learners (+ reviews)
  services/            # words (queries/inserts), learners, reviews, scheduler (ts-fsrs), families, mappers (doc → API)
scripts/
  build-api.mjs        # esbuild server/vercel-entry.ts → api/index.js
  import-firebase.ts   # one-off Firebase RTDB → MongoDB copy
docs/
```

All path segments and code identifiers: **English**. Component files ≤ **200 lines**.

## Who owns which state

| Kind | Where | Notes |
|------|-------|-------|
| UI local | `useState` | modal open, filter, selected card |
| Hub practice source | router state `{ category, fileDeck }` | hub filter + uploaded Excel deck; handed to `/study/*` and back, survives reload |
| Words | MongoDB via Hono; Zustand cache | `GET /api/words` once, patched after add/import; quiet refetch after edits (family changes touch other words) |
| Learner | `learner-store` + `localStorage["study-vocabulary:learner"]` | `{ id, userId, name }`; Switch learner clears it |
| Reviews | MongoDB via Hono; `reviews-store` | `GET /api/learners/:id/reviews` once per learner, patched by each `POST` review |
| Game | `useMatchGame` | board re-dealt by re-mounting `StudySession` (`key`) |
| Exercise session | `useExerciseSession` | queue / word set built once per mount; "Review again" / "Practice again" re-mounts (`key`) |
| Derived | render / `lib/` | filtered list, existing-word keys, card state |

## Key behaviours

- **Learner gate:** every Study route (`/`, `/study/*`) needs a learner — a modal to sign in (user ID) or register (name + user ID). Words pages do not.
- **Study hub (`/`):** Today card (due, new left today = `NEW_WORDS_PER_DAY` − new words first reviewed today, learned) with **Start review** (disabled, "All done for today", when nothing is due and no new words are left), then the free-practice mode grid with the category filter and "Upload file".
- **Review session (`/study/review`):** queue built once on mount = due words (oldest first) + new words up to today's allowance, capped at `SESSION_SIZE`; new/learning words get multiple choice, mature words rotate type → listen → cloze. A wrong answer comes back at the end (only the first answer is recorded). Summary: accuracy, missed words, Review again / Back to hub.
- **Free practice (`/study/:mode`):** `match`, `flashcards`, `choice`, `type`, `listen`, `cloze` (unknown → `/`). `PRACTICE_SESSION_SIZE` random distinct words of one kind from the hub's source + category; cloze only uses words with a usable example. Bank words record their first answer; file-deck words (`id: null`) never post reviews. Match keeps its board (New board + category filter) and records nothing.
- Board = 8 random pairs with **distinct** words (legacy data has the same word with different meanings).
- Hub "Upload file" studies a local Excel deck **without saving** (free-practice modes only); the tag closes it.
- Words page "Upload file" previews valid rows + lists invalid ones, then `POST /api/words/bulk` (existing words skipped).
- Single add / edit rejects a spelling another word already uses (client validator + server `409`).
- A word has one or more **senses** (word type + definition + example sentences). The study board shows `formatDefinition(senses)` and never the examples (they contain the word).
- **Related words** = word family, two-way and transitive. Table: click a related tag to peek at its meaning. Detail page: related words listed with their word types + meanings; click to open that word's page.
- **Routes:** `/` (study hub), `/study/review`, `/study/:mode`, `/vocabulary-management` (list, `?q=&category=&page=`), `/vocabulary-management/:id` (list + that word, read-only), `/vocabulary-management/:id/edit` and `/vocabulary-management/new` (form). Clicking a row/card opens the detail; the pencil (icon-only, also in the detail header) opens edit. Saving an edit returns to the previous page; saving a new word replaces the form with the list + its detail.
- Mobile (<600px): word cards instead of the table.
- **Shell:** top bar (brand, Study / Words ≥992px, theme toggle); below 992px a fixed bottom tab bar (Study · Words · Add).
- **Dark mode:** toggle cycles System → Light → Dark, stored in `localStorage["study-vocabulary:color-scheme"]`; `data-theme` on `<html>` switches the CSS variables (set before first paint by `index.html`).
- **Board:** progress `matched / 8 pairs · misses`; keyboard: arrows move focus (skip matched cards), Enter picks, Esc clears, R deals a new board (ignored while typing or with Ctrl/Cmd).
- **Word detail never leaves the list:** `/vocabulary-management/:id` keeps the list mounted (same scroll, filters in `?q=&category=&page=`).
  - ≥992px: split view — compact list beside the word (pick another word, or Back, to change it).
  - 600–991px: drawer from the right; <600px: bottom sheet (90% height, swipe down on the handle to close).
  - Drawer close (Esc, tap outside, swipe) = history back, so the browser/phone Back gesture closes it too; related words open in the same drawer with `replace` (no history pile-up).

## Checklist before claiming a feature done

- [ ] `npm run typecheck && npm run typecheck:server` green
- [ ] `npm test` green if `lib/` / `shared/` touched
- [ ] No cross-page / cross-feature imports
- [ ] Tokens from `src/styles/` (no hardcoded hex in TSX)
- [ ] Verified on real UI (desktop + 375px width)
