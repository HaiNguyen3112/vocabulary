# Study Methods + FSRS Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five exercise types, an adaptive FSRS review session, and per-learner progress (sign-up by name + user ID) to the Study area.

**Architecture:** `shared/` holds learner/review contracts; the server owns FSRS scheduling (`ts-fsrs`) and stores one review doc per (learner, word) in MongoDB. The client keeps a learner store (localStorage) and a reviews cache (Zustand), builds exercises with pure `src/lib/` functions, and renders them through one generic `ExerciseSession`.

**Tech Stack:** Vite + React 18 + TS strict, Ant Design 5, SCSS modules, Zustand, Hono, MongoDB, Vitest, `ts-fsrs@5.4.2`.

**Spec:** `docs/superpowers/specs/2026-10-10-study-methods-design.md`

## Global Constraints

- Read `AGENTS.md`, `docs/PROJECT.md`, `docs/DESIGN.md`, `docs/REACT_RULES.md`, `.cursor/rules/` first.
- English identifiers and file names; UI copy in English (matches existing UI). Component files ≤ 200 lines; no cross-page / cross-feature imports (`features/study` must not import `features/words` and vice versa; shared bits go to `features/shared`).
- Colours only via `$color-*` tokens / antd tokens; no hex in TSX; cards via `@include index-card`.
- No `dangerouslySetInnerHTML`; multiline definitions via `.pre-line`.
- Server imports `shared/` with relative paths (`../../shared/...`), client with `@shared/...`.
- Dependency: `ts-fsrs` pinned exactly to `5.4.2`, used **server-side only**.
- Constants: `NEW_WORDS_PER_DAY = 10`, `SESSION_SIZE = 20`, `PRACTICE_SESSION_SIZE = 15`, `CHOICE_OPTION_COUNT = 4`.
- User ID: `^[a-z0-9_.-]{3,30}$` after trim + lowercase; display name trimmed, 1–50 chars.
- localStorage key: `study-vocabulary:learner`; all storage access wrapped in try/catch.
- Doc ids use `randomUUID()` like `words` (spec's "ObjectId hex" is superseded); review `_id = \`${learnerId}:${wordId}\``.
- Commits: `type(scope): subject` ≤ 72 chars, scopes `study | words | api | db | ui`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Done = `npm run typecheck && npm run typecheck:server && npm test` green + real UI check (desktop + 375px).

## Review Focus

1. **Tiny or duplicate-heavy banks** (fewer than 4 distinct words, legacy duplicates with identical definitions): multiple choice must show only distinct option texts (≥ 2 options) and never two identical correct-looking options — test in Task 6.
2. **Stale learner in localStorage** (DB reset / different `MONGODB_DB`): `GET reviews` → 404 must clear the stored learner and reopen the gate, not loop or crash — handled + tested via store logic in Task 4.
3. **Typed answers with phrases / casing / punctuation / extra spaces** ("Take  off." for "take off"): graded `correct` — test in Task 5.
4. **Cloze where the word appears several times or is a multi-word phrase**: every occurrence blanked, answer is the first matched form — test in Task 6.
5. **"Today" boundary**: new-word allowance counts by the learner's local calendar day, so a review at 23:59 and one at 00:01 belong to different days — test in Task 7.

---

### Task 1: Shared learner & review contracts

**Files:**
- Create: `shared/learner.ts`, `shared/review.ts`
- Test: `shared/learner.test.ts`, `shared/review.test.ts`

**Interfaces:**
- Produces (`shared/learner.ts`):
  - `type Learner = { id: string; userId: string; name: string }`
  - `type LearnerInput = { userId: string; name: string }`
  - `normalizeUserIdKey(userId: string): string` (trim + lowercase)
  - `parseLearnerInput(raw: unknown): { ok: true; value: LearnerInput } | { ok: false; error: string }` — `value.userId` is the trimmed **lowercased** id, `value.name` trimmed.
  - `USER_ID_PATTERN = /^[a-z0-9_.-]{3,30}$/`, `MAX_LEARNER_NAME_LENGTH = 50`
- Produces (`shared/review.ts`):
  - `RATINGS = ["again", "hard", "good", "easy"] as const`, `type Rating`
  - `REVIEW_STATES = ["new", "learning", "review", "relearning"] as const`, `type ReviewState`
  - `type WordReview = { wordId: string; state: ReviewState; dueAt: string; reps: number; lapses: number; firstReviewedAt: string }` (ISO strings)
  - `type ReviewInput = { wordId: string; rating: Rating }`
  - `parseReviewInput(raw: unknown): { ok: true; value: ReviewInput } | { ok: false; error: string }`

- [ ] **Step 1: Write failing tests**

```ts
// shared/learner.test.ts
expect(parseLearnerInput({ userId: "  Hai.Nguyen ", name: " Hải " }))
  .toEqual({ ok: true, value: { userId: "hai.nguyen", name: "Hải" } });
expect(parseLearnerInput({ userId: "ab", name: "x" }).ok).toBe(false);          // too short
expect(parseLearnerInput({ userId: "hai nguyen", name: "x" }).ok).toBe(false);  // space
expect(parseLearnerInput({ userId: "hai", name: "   " }).ok).toBe(false);       // empty name
expect(parseLearnerInput({ userId: "hai", name: "x".repeat(51) }).ok).toBe(false);
expect(parseLearnerInput(null).ok).toBe(false);
expect(normalizeUserIdKey(" HAI ")).toBe("hai");

// shared/review.test.ts
expect(parseReviewInput({ wordId: "w1", rating: "good" })).toEqual({ ok: true, value: { wordId: "w1", rating: "good" } });
expect(parseReviewInput({ wordId: "w1", rating: "perfect" }).ok).toBe(false);
expect(parseReviewInput({ wordId: "", rating: "good" }).ok).toBe(false);
expect(parseReviewInput({ rating: "good" }).ok).toBe(false);
```

- [ ] **Step 2:** `npx vitest run shared/learner.test.ts shared/review.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement both files; follow the `toText` / result-union style of `shared/word.ts`. Error strings: `"User ID must be 3–30 characters: a-z, 0-9, _ . -"`, `"Missing name"`, `"Name is too long"`, `"Missing wordId"`, `` `Unknown rating "${x}"` ``.
- [ ] **Step 4:** Same command → PASS.
- [ ] **Step 5:** Commit `feat(study): add learner and review contracts`.

---

### Task 2: Server FSRS scheduler (pure)

**Files:**
- Modify: `package.json` (dependency), `vite.config.ts` (test include adds `"server/**/*.test.ts"`)
- Create: `server/services/scheduler.ts`
- Test: `server/services/scheduler.test.ts`

**Interfaces:**
- Consumes: `Rating`, `ReviewState` from Task 1.
- Produces:
  - `type StoredCard = { due: Date; stability: number; difficulty: number; elapsed_days: number; scheduled_days: number; learning_steps: number; reps: number; lapses: number; state: ReviewState; last_review: Date | null }` — the shape persisted in Mongo (state stored as our string, not the ts-fsrs enum).
  - `scheduleReview(previous: StoredCard | null, rating: Rating, now: Date): StoredCard` — `null` ⇒ `createEmptyCard(now)` first.

- [ ] **Step 1:** `npm install --save-exact ts-fsrs@5.4.2`; add the server test glob to `vite.config.ts` `test.include`.
- [ ] **Step 2: Write failing tests** (fixed `now = new Date("2026-10-10T08:00:00Z")`):

```ts
const first = scheduleReview(null, "good", now);
expect(first.reps).toBe(1);
expect(first.due.getTime()).toBeGreaterThan(now.getTime());
expect(first.state).not.toBe("new");

const easy = scheduleReview(null, "easy", now);
expect(easy.due.getTime()).toBeGreaterThanOrEqual(first.due.getTime());

// drive a card into "review", then fail it
let card = scheduleReview(null, "easy", now);
const later = new Date(card.due.getTime() + 60_000);
card = scheduleReview(card, "good", later);
expect(card.state).toBe("review");
const lapsed = scheduleReview(card, "again", new Date(card.due.getTime() + 60_000));
expect(lapsed.lapses).toBe(card.lapses + 1);
expect(lapsed.state).toBe("relearning");
```

- [ ] **Step 3:** `npx vitest run server/services/scheduler.test.ts` → FAIL.
- [ ] **Step 4:** Implement with a module-level `const scheduler = fsrs({ enable_fuzz: true })`; signature becomes `scheduleReview(previous, rating, now, engine = scheduler)` so tests pass `fsrs({ enable_fuzz: false })` for determinism. Map `Rating`→`ts-fsrs` `Rating.Again/Hard/Good/Easy` and `State`↔`ReviewState` with two small lookup objects; convert `last_review: undefined` ↔ `null`.
- [ ] **Step 5:** Test → PASS; `npm run typecheck:server` green.
- [ ] **Step 6:** Commit `feat(api): add FSRS review scheduler`.

---

### Task 3: Learners & reviews API

**Files:**
- Modify: `server/db/types.ts`, `server/db/mongo.ts` (collections + `ensureIndexes`), `server/services/mappers.ts`, `server/app.ts`, `docs/BACKEND.md`
- Create: `server/services/learners.ts`, `server/services/reviews.ts`, `server/routes/learners.ts`

**Interfaces:**
- Consumes: Task 1 contracts; `scheduleReview`, `StoredCard` (Task 2).
- Produces (HTTP, consumed by Task 4):
  - `POST /api/learners` `{ userId, name }` → `201 { learner: Learner }` · `400 { error }` · `409 { error: "User ID already exists" }`
  - `GET /api/learners/by-user-id/:userId` → `{ learner }` · `404 { error: "User ID not found" }` (lookup by `normalizeUserIdKey`)
  - `GET /api/learners/:learnerId/reviews` → `{ reviews: WordReview[] }` · `404 { error: "Learner not found" }`
  - `POST /api/learners/:learnerId/reviews` `{ wordId, rating }` → `{ review: WordReview }` · `400` · `404 "Learner not found" | "Word not found"`
- Docs: `LearnerDoc { _id, userId, userIdKey, name, createdAt }`, `ReviewDoc { _id, learnerId, wordId, card: StoredCard, dueAt, firstReviewedAt, updatedAt }`.
- Mappers: `mapLearner(doc): Learner`, `mapReview(doc): WordReview` (`state = card.state`, `reps`, `lapses` from card; dates → ISO).

- [ ] **Step 1:** Add doc types, `collections.learners()` / `collections.reviews()`, indexes: `learners { userIdKey: 1 } unique`, `reviews { learnerId: 1, dueAt: 1 }`.
- [ ] **Step 2:** `services/learners.ts`: `createLearner(input): Promise<Learner | "exists">` (catch Mongo error code `11000` → `"exists"`), `findLearnerByUserId(userId)`, `learnerExists(id)`.
- [ ] **Step 3:** `services/reviews.ts`: `listReviews(learnerId)`, `recordReview(learnerId, wordId, rating, now = new Date())` — load existing doc, `scheduleReview(doc?.card ?? null, …)`, upsert with `firstReviewedAt` kept from the existing doc (`$setOnInsert`), return mapped review.
- [ ] **Step 4:** `routes/learners.ts` (thin, like `routes/words.ts`); mount `app.route("/api/learners", learnerRoutes)`. Word existence via `collections.words().findOne({ _id: wordId }, { projection: { _id: 1 } })`.
- [ ] **Step 5:** `npm run typecheck:server` green.
- [ ] **Step 6: Verify against the dev API** (`npm run dev:api`):

```bash
curl -s -XPOST localhost:3001/api/learners -H 'content-type: application/json' -d '{"userId":"plan-test","name":"Plan"}'   # 201
curl -s -XPOST localhost:3001/api/learners -H 'content-type: application/json' -d '{"userId":"PLAN-TEST","name":"X"}' -w '%{http_code}'  # 409
curl -s localhost:3001/api/learners/by-user-id/Plan-Test        # same learner
WID=$(curl -s localhost:3001/api/words | node -pe 'JSON.parse(require("fs").readFileSync(0)).words[0].id')
curl -s -XPOST localhost:3001/api/learners/<id>/reviews -H 'content-type: application/json' -d "{\"wordId\":\"$WID\",\"rating\":\"good\"}"  # review, reps 1
curl -s -XPOST localhost:3001/api/learners/<id>/reviews -H 'content-type: application/json' -d '{"wordId":"nope","rating":"good"}' -w '%{http_code}'  # 404
curl -s localhost:3001/api/learners/<id>/reviews                # 1 review
```
Then delete the test learner + its reviews with a one-off `mongosh`/tsx snippet (do not leave test data).
- [ ] **Step 7:** `docs/BACKEND.md`: document the two collections, endpoints, and "deleting a word must also delete its `reviews` (no delete endpoint yet)".
- [ ] **Step 8:** Commit `feat(api): add learners and per-learner FSRS reviews`.

---

### Task 4: Client data layer (API, stores, hooks)

**Files:**
- Create: `src/api/learners-api.ts`, `src/api/reviews-api.ts`, `src/store/learner-store.ts`, `src/store/reviews-store.ts`, `src/hooks/use-learner.ts`, `src/hooks/use-reviews.ts`, `src/lib/learner-storage.ts`
- Test: `src/lib/learner-storage.test.ts`

**Interfaces:**
- Consumes: Task 3 HTTP API; `apiFetch`, `ApiError`, `getErrorMessage` from `src/api/client.ts`.
- Produces:
  - `registerLearnerRequest(input: LearnerInput)`, `findLearnerRequest(userId: string)` → `{ learner: Learner }`
  - `fetchReviewsRequest(learnerId)` → `{ reviews: WordReview[] }`; `postReviewRequest(learnerId, input: ReviewInput)` → `{ review: WordReview }`
  - `LEARNER_STORAGE_KEY = "study-vocabulary:learner"`, `parseStoredLearner(raw: string | null): Learner | null` (pure; rejects malformed JSON / missing fields)
  - `useLearnerStore`: `{ learner: Learner | null; signIn(learner: Learner): void; signOut(): void }` (persists via try/catch like `color-scheme-store`)
  - `useReviewsStore`: `{ learnerId: string | null; byWordId: Record<string, WordReview>; status: "idle" | "loading" | "ready" | "error"; load(learnerId: string): Promise<void>; record(wordId: string, rating: Rating): Promise<WordReview | null>; reset(): void }`
    - `load` is a no-op when already loaded for that learner; on `ApiError` 404 → `useLearnerStore.getState().signOut()` + `reset()`.
    - `record` returns `null` on failure (caller shows the toast); patches `byWordId` on success.
  - `useLearner()` → `{ learner, signIn, signOut }`; `useReviews()` → `{ byWordId, isLoading, record }` (loads for the current learner in an effect; resets when the learner changes).

- [ ] **Step 1:** Failing test for `parseStoredLearner`: valid JSON → learner; `null`, `"{"`, `'{"id":"1"}'` → `null`.
- [ ] **Step 2:** `npx vitest run src/lib/learner-storage.test.ts` → FAIL; implement; → PASS.
- [ ] **Step 3:** Implement API helpers, stores, hooks (follow `words-store.ts` / `use-words.ts` patterns).
- [ ] **Step 4:** `npm run typecheck` green.
- [ ] **Step 5:** Commit `feat(study): add learner and reviews client stores`.

---

### Task 5: Answer grading

**Files:**
- Create: `src/lib/grade-answer.ts`
- Test: `src/lib/grade-answer.test.ts`

**Interfaces:**
- Produces:
  - `type Grade = "correct" | "close" | "wrong"`
  - `normalizeAnswer(text: string): string` — trim, lowercase, collapse whitespace, strip trailing `.,!?;:`
  - `gradeAnswer(input: string, answer: string): Grade` — exact after normalising → correct; Levenshtein distance 1 and normalised answer length ≥ 5 → close; else wrong (empty input → wrong)
  - `gradeToRating(grade: Grade): Rating` — correct→good, close→hard, wrong→again

- [ ] **Step 1: Failing tests**

```ts
expect(gradeAnswer("Take  off.", "take off")).toBe("correct");      // Review Focus 3
expect(gradeAnswer("  PRODUCE ", "produce")).toBe("correct");
expect(gradeAnswer("produse", "produce")).toBe("close");
expect(gradeAnswer("prodce", "produce")).toBe("close");               // deletion
expect(gradeAnswer("cst", "cat")).toBe("wrong");                      // short word: no close
expect(gradeAnswer("prodeuc", "produce")).toBe("wrong");              // distance 2
expect(gradeAnswer("", "produce")).toBe("wrong");
expect(gradeToRating("close")).toBe("hard");
```

- [ ] **Step 2:** Run `npx vitest run src/lib/grade-answer.test.ts` → FAIL; implement; → PASS.
- [ ] **Step 3:** Commit `feat(study): add typed-answer grading`.

---

### Task 6: Exercise builder

**Files:**
- Create: `src/lib/exercise.ts`, `src/lib/build-exercise.ts`
- Test: `src/lib/build-exercise.test.ts`

**Interfaces:**
- Consumes: `formatDefinition`, `normalizeWordKey`, `WordSense` from `@shared/word`; `shuffle` from `src/lib/shuffle.ts`.
- Produces (`exercise.ts`):
  - `type StudyWord = { id: string | null; word: string; category: Category; senses: WordSense[] }` — `id: null` for file-deck words
  - `EXERCISE_KINDS = ["flashcard", "choice", "type", "listen", "cloze"] as const`, `type ExerciseKind`
  - `type Exercise = { word: StudyWord } & (
      | { kind: "flashcard"; front: string; back: string }
      | { kind: "choice"; direction: "word-to-meaning" | "meaning-to-word"; prompt: string; options: string[]; answer: string }
      | { kind: "type"; prompt: string; answer: string }
      | { kind: "listen"; answer: string }
      | { kind: "cloze"; sentence: string; hint: string; answer: string })`
- Produces (`build-exercise.ts`):
  - `findCloze(word: StudyWord): { sentence: string; answer: string } | null` — first example containing the word or a simple form (`word`, `+s`, `+es`, `+ed`, `+d`, `+ing`, `e`-dropping `+ing`) on word boundaries, case-insensitive; **every** occurrence replaced by `___`; `answer` = the first matched text as written (lowercased)
  - `buildExercise(word: StudyWord, kind: ExerciseKind, pool: readonly StudyWord[], options?: { direction?: "word-to-meaning" | "meaning-to-word"; random?: () => number }): Exercise` — cloze with no match falls back to `type`; choice options = answer + up to `CHOICE_OPTION_COUNT - 1` distractors (same first-sense part of speech → same category → rest; skip same `wordKey`; skip duplicate option text), shuffled. Definitions rendered with `formatDefinition(senses)`; `type` prompt = definition; `cloze.hint` = definition.

- [ ] **Step 1: Failing tests** (fixture helper `w(word, def, pos?, examples?, category?)`; deterministic `random = () => 0.5`)

```ts
// choice — distinct texts, includes answer, ≤ 4  (Review Focus 1)
const pool = [w("big","lớn"), w("large","lớn"), w("tiny","nhỏ"), w("Big","to")];
const ex = buildExercise(pool[0], "choice", pool, { direction: "meaning-to-word" });
expect(ex.options).toContain("big");
expect(new Set(ex.options.map((o) => o.toLowerCase())).size).toBe(ex.options.length);
expect(ex.options).not.toContain("Big");              // same wordKey as answer
const wm = buildExercise(pool[0], "choice", pool, { direction: "word-to-meaning" });
expect(wm.options.filter((o) => o === "lớn")).toHaveLength(1);
// tiny bank
expect(buildExercise(w("a1","x"), "choice", [w("a1","x"), w("b2","y")]).options).toHaveLength(2);
// distractor preference: same part of speech first
// cloze  (Review Focus 4)
expect(findCloze(w("produce","sx","verb",["They produced it and produce more."])))
  .toEqual({ sentence: "They ___ it and ___ more.", answer: "produced" });
expect(findCloze(w("take off","cất cánh",null,["The plane will take off soon."]))?.sentence).toBe("The plane will ___ soon.");
expect(findCloze(w("make","làm",null,["We are making tea."]))?.answer).toBe("making");
expect(findCloze(w("cat","mèo",null,["Concatenate"]))).toBeNull();     // word boundary
expect(buildExercise(w("cat","mèo"), "cloze", []).kind).toBe("type");  // fallback
```

- [ ] **Step 2:** `npx vitest run src/lib/build-exercise.test.ts` → FAIL; implement; → PASS. Escape regex metacharacters in the word.
- [ ] **Step 3:** Add the constants from Global Constraints to `src/constants/study.ts`.
- [ ] **Step 4:** Commit `feat(study): add exercise builder`.

---

### Task 7: Review queue

**Files:**
- Create: `src/lib/review-queue.ts`
- Test: `src/lib/review-queue.test.ts`

**Interfaces:**
- Consumes: `StudyWord`, `ExerciseKind` (Task 6), `WordReview` (Task 1).
- Produces:
  - `countNewToday(reviews: readonly WordReview[], now: Date): number` — reviews whose `firstReviewedAt` is on `now`'s **local** calendar day
  - `buildReviewQueue(words: readonly StudyWord[], byWordId: Readonly<Record<string, WordReview>>, now: Date, newAllowance: number, size: number, random?: () => number): StudyWord[]` — due words (`dueAt <= now`) by `dueAt` ascending, then up to `newAllowance` random unreviewed words, total ≤ `size`; skips `id === null`
  - `pickExerciseKind(review: WordReview | undefined, word: StudyWord): ExerciseKind` — undefined / `new` / `learning` / `relearning` → `"choice"`; `review` → `["type","listen","cloze"][review.reps % 3]`, `cloze` → `"type"` when `findCloze(word)` is null
  - `todayStats(words, byWordId, now)` → `{ due: number; newLeft: number; learned: number }` (`newLeft = max(0, NEW_WORDS_PER_DAY − countNewToday)`, but ≤ unreviewed count; `learned` = state `review`)

- [ ] **Step 1: Failing tests**

```ts
// local-day boundary  (Review Focus 5) — build dates with new Date(y, m, d, h, min) (local time)
const now = new Date(2026, 9, 10, 0, 1);
expect(countNewToday([r({ firstReviewedAt: new Date(2026, 9, 9, 23, 59).toISOString() }),
                      r({ firstReviewedAt: new Date(2026, 9, 10, 0, 0).toISOString() })], now)).toBe(1);
// ordering + caps
const q = buildReviewQueue(words, byId /* w2 due 2d ago, w1 due 1d ago, w3 due tomorrow */, now, 2, 20);
expect(q.slice(0, 2).map((x) => x.id)).toEqual(["w2", "w1"]);
expect(q.filter((x) => !byId[x.id!])).toHaveLength(2);   // new allowance respected
expect(q.map((x) => x.id)).not.toContain("w3");           // not due
expect(buildReviewQueue(words, byId, now, 10, 1)).toHaveLength(1);
// kind
expect(pickExerciseKind(undefined, w)).toBe("choice");
expect(pickExerciseKind(r({ state: "review", reps: 5 }), wNoExamples)).toBe("type"); // 5%3=2 → cloze → fallback
```

- [ ] **Step 2:** `npx vitest run src/lib/review-queue.test.ts` → FAIL; implement; → PASS.
- [ ] **Step 3:** Commit `feat(study): add review queue and today stats`.

---

### Task 8: Learner gate & top-bar menu

**Files:**
- Create: `src/features/study/learner-gate.tsx` (+ `.module.scss` if needed), `src/app/learner-menu.tsx`
- Modify: `src/app/top-bar.tsx`

**Interfaces:**
- Consumes: `useLearner`, `registerLearnerRequest`, `findLearnerRequest`, `parseLearnerInput`, `ApiError`.
- Produces: `<LearnerGate>{children}</LearnerGate>` — renders children when a learner is set, else an antd `Modal` (not closable) with `Tabs` "Sign in" (User ID) / "Register" (Name + User ID). Client validation via `parseLearnerInput`; server `404` on sign in → field error `"User ID not found — register?"` with a link switching to the Register tab (prefilled); `409` → `"User ID already exists"`.
- `LearnerMenu`: when a learner is set, a `Dropdown` button with `UserOutlined` + name (name hidden < 600px) and item "Switch learner" → `signOut()`. Placed before `ThemeToggle`.

- [ ] **Step 1:** Implement; `npm run typecheck` green.
- [ ] **Step 2:** Real UI: register `ui-test`, reload (stays signed in), switch learner, sign in with `UI-TEST` (works), sign in with `nobody-xyz` (404 message), register `ui-test` again (409 message). Check 375px.
- [ ] **Step 3:** Commit `feat(study): add learner sign-in and register gate`.

---

### Task 9: Exercise session & exercise components

**Files:**
- Create in `src/features/study/`: `use-exercise-session.ts`, `exercise-session.tsx`, `exercise-session.module.scss`, `choice-exercise.tsx`, `type-exercise.tsx`, `cloze-exercise.tsx`, `flashcard-exercise.tsx`, `answer-feedback.tsx`, `session-summary.tsx`, `use-exercise-keys.ts`

**Interfaces:**
- Consumes: Tasks 4–7.
- Produces:
  - `useExerciseSession({ words, pool, kindFor, requeueWrong })` where `words: StudyWord[]` is the ordered queue, `pool` the distractor pool, `kindFor: (word: StudyWord) => ExerciseKind`, `requeueWrong: boolean` → `{ current: Exercise | null; index: number; total: number; feedback: { grade: Grade; rating: Rating } | null; answer(result: { grade: Grade } | { rating: Rating }): void; next(): void; results: SessionResult[]; isDone: boolean }`
    - `SessionResult = { word: StudyWord; grade: Grade }` (first attempt only)
    - On the **first** answer for a word with `id !== null`: `record(word.id, rating)`; `null` result → `message.warning("Could not save progress")`, continue.
    - `requeueWrong` (review mode): grade `wrong` → append the word to the end once more (not recorded again).
    - After answering, speak the word (`speakText(word.word, SPEECH_LANG)`).
  - `<ExerciseSession words pool kindFor requeueWrong title onExit />` — header (title, `Progress` bar `index/total`, exit button with `Popconfirm` "Leave this session?"), the exercise component for `current.kind`, `<AnswerFeedback>` (correct/close/wrong + correct answer + definition, "Continue" button), `<SessionSummary results onRestart onExit />` when done (accuracy %, missed words list each with speak button + definition).
  - Exercise components receive `{ exercise, disabled, onAnswer }`:
    - choice: option buttons (index-card style), keys `1–4`; grade correct/wrong by equality.
    - type / listen: `Input` + "Check"; listen auto-plays on mount + replay button; Enter submits; grade with `gradeAnswer`.
    - cloze: sentence with `___` (`pre-line`), hint, `Input`; grade with `gradeAnswer`.
    - flashcard: card flips on click / `Space`; after flip, four buttons Again/Hard/Good/Easy (keys `1–4`) → `onAnswer({ rating })`; grade derived: again→wrong, hard→close, else correct.
  - `use-exercise-keys.ts`: `useExerciseKeys(handlers)` — one `keydown` listener (ignores events from inputs except Enter in feedback state, and Ctrl/Cmd), cleaned up on unmount (see `use-board-keyboard.ts`).

- [ ] **Step 1:** Implement hook + components (each ≤ 200 lines); styles use tokens + `index-card` mixin; motion respects `prefers-reduced-motion`.
- [ ] **Step 2:** `npm run typecheck` green; `npm test` green.
- [ ] **Step 3:** Commit `feat(study): add exercise session and exercise types`.

---

### Task 10: Study hub, routes, review & practice pages

**Files:**
- Create: `src/features/study/study-hub.tsx`, `today-card.tsx`, `mode-grid.tsx` (+ scss), `review-session.tsx`, `practice-session.tsx`, `src/pages/study-review-page.tsx`, `src/pages/study-mode-page.tsx`, `src/constants/study-modes.ts`
- Modify: `src/app/nav-items.tsx` (`ROUTES.studyReview = "/study/review"`, `ROUTES.studyMode = "/study/:mode"`, `studyModePath(mode)`), `src/app/app-routes.tsx`, `src/pages/study-page.tsx` (renders `StudyHub`), `src/features/study/study-workspace.tsx` (delete; its file-deck/category logic moves into `study-hub.tsx`), `docs/PROJECT.md`, `AGENTS.md` (one-line description of Study)
- Test: `src/app/nav-items.test.ts` (new)

**Interfaces:**
- Consumes: Tasks 4–9; existing `StudySession` (match).
- Produces:
  - `STUDY_MODES: { mode: PracticeMode; label: string; description: string; icon: ReactNode }[]` with `type PracticeMode = "match" | "flashcards" | "choice" | "type" | "listen" | "cloze"`; `isPracticeMode(value: string): value is PracticeMode`. Mode → `ExerciseKind`: flashcards→flashcard, choice→choice, type→type, listen→listen, cloze→cloze.
  - Hub navigates to `studyModePath(mode)` with router state `{ category: CategoryFilter; fileDeck: WordInput[] | null }`; mode page reads it (missing state → bank + all categories).
  - `ReviewSession`: wrapped in `LearnerGate`; builds the queue once on mount from `useWords` + `useReviews` (`buildReviewQueue(…, NEW_WORDS_PER_DAY - countNewToday, SESSION_SIZE)`), `kindFor = pickExerciseKind`, `requeueWrong: true`; empty queue → `Result` "All done for today" + back button.
  - `PracticeSession`: `PRACTICE_SESSION_SIZE` random distinct words from the filtered source (via `pickPairs`-style distinct pick), fixed kind; cloze mode only picks words where `findCloze` ≠ null (empty → `Empty` "No words with example sentences"). Match mode renders the existing `StudySession` with the old toolbar minus the file button.
  - `TodayCard`: `todayStats` numbers + **Start review** (`disabled` and label "All done for today" when `due === 0 && newLeft === 0`).
  - Hub is wrapped in `LearnerGate`; wait for words + reviews loaded before building a queue (spinner).

- [ ] **Step 1: Failing test** `nav-items.test.ts`: `findNavKey("/study/review", TAB_ITEMS)` and `findNavKey("/study/flashcards")` → `ROUTES.study` (`"/"`); `isPracticeMode("cloze")` true, `isPracticeMode("nope")` false. (If `findNavKey` already returns `/` via fallback, the test still pins it.)
- [ ] **Step 2:** Run → FAIL (`isPracticeMode` missing); implement everything above; `/study/:mode` with unknown mode → `<Navigate to="/" replace />`.
- [ ] **Step 3:** `npm run typecheck && npm test` green.
- [ ] **Step 4:** Real UI (desktop + 375px), signed in as a test learner: Today card numbers; full Review session (answer some wrong → they come back; summary); each practice mode once; match still works with R / arrows; upload an Excel file on hub → practice mode uses it and no review POST fires (check network tab); reload on `/study/flashcards` works.
- [ ] **Step 5:** Update `docs/PROJECT.md` (folder tree, state table: learner + reviews, key behaviours: hub, review session, practice modes, routes) and the Study line in `AGENTS.md`.
- [ ] **Step 6:** Commit `feat(study): add study hub, review session and practice modes`.

---

### Task 11: Review status on word detail

**Files:**
- Create: `src/features/shared/review-status-tag.tsx`, `src/lib/review-status.ts`
- Modify: `src/features/words/word-detail.tsx`
- Test: `src/lib/review-status.test.ts`

**Interfaces:**
- Consumes: `useLearner`, `useReviews`, `WordReview`.
- Produces: `describeReviewStatus(review: WordReview | undefined, now: Date): { label: "New" | "Learning" | "Review"; next: string | null }` — `relearning` → "Learning"; `next`: `"due now"` when `dueAt <= now`, else `"next review in N days"` (`N = ceil(days)`, `"in 1 day"` singular; under 1 day → `"next review today"`). `<ReviewStatusTag wordId />` renders nothing without a learner.

- [ ] **Step 1: Failing tests** for `describeReviewStatus`: undefined → `{ label: "New", next: null }`; due yesterday → "due now"; due in 36h → "next review in 2 days"; due in 20h → "next review today"; due in 24h exactly → "next review in 1 day"; `relearning` → "Learning".
- [ ] **Step 2:** Run `npx vitest run src/lib/review-status.test.ts` → FAIL; implement; → PASS.
- [ ] **Step 3:** Add the tag in the `WordDetail` header after `CategoryTag`; typecheck green.
- [ ] **Step 4:** Real UI: a word studied in Task 10 shows Learning/Review + next review; an untouched word shows New; signed out → no tag.
- [ ] **Step 5:** Final gate: `npm run typecheck && npm run typecheck:server && npm test && npm run build` all green.
- [ ] **Step 6:** Commit `feat(words): show learner review status on word detail`.
