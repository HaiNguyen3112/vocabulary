# Study methods + spaced repetition — design

Date: 2026-10-10 · Status: draft for review

## Goal

Study currently has one method (the word ↔ definition Match board) and remembers nothing between sessions.
Add the methods proven on Quizlet / Anki / Memrise / Duolingo / Vocabulary.com, schedule reviews with
**FSRS** (Anki's current algorithm), and keep progress **per learner** (simple sign-up, no password).

### Reference platforms → what we take

| Platform | Method | Here |
|---|---|---|
| Quizlet Flashcards | flip card, self-rate | Flashcards mode (Again/Hard/Good/Easy) |
| Quizlet Learn | adaptive mix, recognition → recall, wrong answers come back | Review session |
| Quizlet Write / Spell | type from definition / from audio | Type the word, Listen & spell |
| Quizlet Test, Duolingo | multiple choice, rotating short exercises | Multiple choice |
| Vocabulary.com | word missing from an example sentence | Fill in the blank (cloze) |
| Anki (FSRS), Memrise | spaced repetition, weak words return more often | `ts-fsrs` scheduler, per learner |

### Decisions

- Progress is stored in MongoDB and scheduled with **FSRS via `ts-fsrs@5.4.2`** (server-side only).
- **Word bank stays shared**; only progress is per learner. `/api/words` is unchanged.
- **Learner = display name + unique user ID**, no password. Anyone who knows a user ID can use it (accepted).
- Match board is kept as-is (moved to `/study/match`) and does **not** write reviews.
- Excel-file decks are practice-only: no reviews written (words have no IDs).

## 1. UX & navigation

### Learner sign-up / sign-in

- First visit to any Study route with no stored learner → modal with two tabs:
  - **Sign in**: user ID → `GET /api/learners/by-user-id/:userId`; 404 → "User ID not found — register?".
  - **Register**: display name + user ID → `POST /api/learners`; 409 → "User ID already exists".
- Stored in `localStorage["study-vocabulary:learner"]` as `{ id, userId, name }` (Zustand store, same
  pattern as `color-scheme-store`). Reads/writes wrapped so a blocked storage just re-asks.
- Top bar shows the learner name; its menu has **Switch learner** (clears the store → modal).
- Words pages do not require a learner; without one the review status tag is hidden.

### Study hub (`/`)

- **Today card**: due count, new words left today (`NEW_WORDS_PER_DAY − new words first reviewed today`),
  learned count (state `review`), and the primary **Start review** button (disabled when 0 due and 0 new left;
  label then reads "All done for today").
- **Mode grid** (free practice): Match, Flashcards, Multiple choice, Type the word, Listen & spell,
  Fill in the blank — icon + one-line description each.
- Category filter + "Upload file" stay on the hub and apply to free-practice modes (passed via
  `?category=`; a file deck lives in component state of the hub → passed to the mode via router state).

### Routes

| Path | Page |
|---|---|
| `/` | Study hub |
| `/study/review` | Review session (SRS) |
| `/study/:mode` | Free practice: `match`, `flashcards`, `choice`, `type`, `listen`, `cloze` (unknown → redirect `/`) |

Bottom tabs unchanged (Study · Words · Add); `findNavKey` keeps `/study/*` under Study.

### Review session (adaptive)

- Queue = due words (oldest `dueAt` first) + new words (up to the remaining daily allowance), capped at
  `SESSION_SIZE = 20`.
- Exercise kind per word (`pickExerciseKind`):
  - state `new` / `learning` / `relearning` → **multiple choice** (alternating direction word→meaning / meaning→word);
  - state `review` → rotate **type → listen → cloze** by `reps % 3`; cloze falls back to type when the word has no usable example.
- Wrong answer → the word is re-queued at the end of the session (answered again, not re-recorded).
- Summary screen: accuracy %, list of missed words (tap → speak + show meaning), "Review again" / "Back to hub".

### Free practice

- `PRACTICE_SESSION_SIZE = 15` random words from the filter (distinct `wordKey`), single exercise kind.
- Saved words: the **first answer per word per session** is posted as a review. File-deck words: not posted.

### Shared exercise behaviour

- After answering: show correct/close/wrong, the correct answer and speak the word; **Enter** → next.
- Keys: multiple choice `1–4`; flashcards `Space` flip, `1–4` rate; typing fields submit on Enter.
- Progress bar `n / total` at the top; Esc → confirm leaving the session.
- Definition shown with `formatDefinition(senses)`; examples are never shown where they would reveal the answer.

### Words page

- `WordDetail` shows a status tag for the current learner: **New / Learning / Review**, plus
  "next review in X days" (or "due now").

## 2. Data & backend

### Collections

```ts
type LearnerDoc = {
  _id: string;        // ObjectId hex
  userId: string;     // as typed (trimmed)
  userIdKey: string;  // lowercase — unique index
  name: string;       // display name, 1–50 chars, may repeat
  createdAt: Date;
};

type ReviewDoc = {
  _id: string;        // `${learnerId}:${wordId}`
  learnerId: string;
  wordId: string;
  card: FsrsCard;     // ts-fsrs Card serialised (due, stability, difficulty, elapsed_days,
                      // scheduled_days, learning_steps, reps, lapses, state, last_review)
  dueAt: Date;        // = card.due; index { learnerId: 1, dueAt: 1 }
  firstReviewedAt: Date;
  updatedAt: Date;
};
```

- A word without a review doc is **New** for that learner — no data migration needed.
- No per-answer log (YAGNI); session stats live on the client.
- Deleting a word should delete its reviews — there is no delete endpoint today; note it in `BACKEND.md`.

### Shared contracts (`shared/`)

- `shared/learner.ts`: `Learner` (`{ id, userId, name }`), `normalizeUserIdKey`, `parseLearnerInput`
  (user ID `^[a-z0-9_.-]{3,30}$` after lowercasing; name trimmed, 1–50 chars).
- `shared/review.ts`: `RATINGS = ["again","hard","good","easy"]`, `REVIEW_STATES = ["new","learning","review","relearning"]`,
  `WordReview` (`{ wordId, state, dueAt, reps, lapses, firstReviewedAt }`, ISO strings), `parseReviewInput`.

### API

| Method | Path | Result |
|---|---|---|
| `POST` | `/api/learners` `{ userId, name }` | `201 { learner }` · `400` invalid · `409` user ID exists |
| `GET` | `/api/learners/by-user-id/:userId` | `{ learner }` · `404` |
| `GET` | `/api/learners/:learnerId/reviews` | `{ reviews: WordReview[] }` · `404` unknown learner |
| `POST` | `/api/learners/:learnerId/reviews` `{ wordId, rating }` | `{ review: WordReview }` · `400` · `404` learner/word |

- `server/services/learners.ts`, `server/services/reviews.ts` (wraps `fsrs({ enable_fuzz: true })`,
  `createEmptyCard`, `scheduler.next(card, now, rating)`; `now` injectable for tests), mappers for both.
- Indexes in `ensureIndexes`: `learners.userIdKey` unique; `reviews { learnerId, dueAt }`.
- Unique-index race on register → map duplicate-key error to `409`.

### Client data

- `src/api/learners-api.ts`, `src/api/reviews-api.ts`.
- `src/store/learner-store.ts` (persisted learner), `src/store/reviews-store.ts` (cache keyed by wordId for
  the current learner; loaded once per learner, patched after each POST; reset on learner switch).
- `src/hooks/use-learner.ts`, `src/hooks/use-reviews.ts`.
- POST failure → toast, session continues (answer not recorded).

### Constants (`src/constants/study.ts`)

`NEW_WORDS_PER_DAY = 10`, `SESSION_SIZE = 20`, `PRACTICE_SESSION_SIZE = 15`, `CHOICE_OPTION_COUNT = 4`.

## 3. Client exercise engine

### Pure logic (`src/lib/`, unit-tested)

- `exercise.ts` — `Exercise` union:
  `choice` (`direction`, `prompt`, `options`, `answer`), `type` (definition prompt), `listen` (spoken answer),
  `cloze` (`sentence` with `___`, definition hint), `flashcard` (`front` word, `back` definition).
- `build-exercise.ts` — builds one exercise for a word + kind. Distractors: same part of speech → same
  category → any, distinct `wordKey`, never equal to the answer text. `findClozeSentence(word)`: an example
  containing the word (case-insensitive, word boundary, simple `-s/-es/-ed/-d/-ing` forms); none → `null`.
- `grade-answer.ts` — normalise (trim, lowercase, collapse spaces, strip trailing punctuation);
  exact → `correct`; Levenshtein 1 and answer length ≥ 5 → `close`; else `wrong`.
  `toRating`: correct → good, close → hard, wrong → again. (Flashcards: rating chosen by the learner.)
- `review-queue.ts` — `buildReviewQueue(words, reviews, now, newAllowance, size)`, `pickExerciseKind`,
  `countNewToday(reviews, now)` (local-day boundary), `requeue`.

### Components (`src/features/study/`, each ≤ 200 lines)

- `study-hub.tsx` (replaces `study-workspace.tsx` at `/`), `today-card.tsx`, `mode-grid.tsx`.
- `learner-gate.tsx` (sign in / register modal), `learner-menu.tsx` (top bar — rendered via `app/top-bar`).
- `exercise-session.tsx` (progress, current exercise, feedback, summary switch) +
  `use-exercise-session.ts` (queue, results, review posting, first-answer-only rule).
- `choice-exercise.tsx`, `type-exercise.tsx` (type + listen), `cloze-exercise.tsx`, `flashcard-exercise.tsx`,
  `answer-feedback.tsx`, `session-summary.tsx`.
- Match: existing `StudySession` / `MatchBoard` / `useMatchGame` unchanged, mounted by the match mode page.

Pages: `study-page.tsx` (hub), `study-review-page.tsx`, `study-mode-page.tsx`.
Words: `features/shared/review-status-tag.tsx` used by `word-detail.tsx`.

## 4. Testing

- Vitest: `grade-answer`, `build-exercise` (distractors distinct, cloze blanks the right token, fallback),
  `review-queue` (ordering, daily new limit, requeue, kind rotation), `shared/learner` + `shared/review` parsing.
- Server: `services/reviews` scheduling with a fixed clock (good → later `dueAt`; again → `lapses` + 1 on a review card).
- Real UI, desktop + 375px: register, sign in, switch learner (progress separate), one full Review session,
  each free-practice mode, status tag on the word detail.
- `npm run typecheck && npm run typecheck:server && npm test` green.

## Out of scope

Passwords/PIN, per-learner word banks, answer history & charts, streaks, speech recognition (speaking practice),
FSRS parameter optimisation.
