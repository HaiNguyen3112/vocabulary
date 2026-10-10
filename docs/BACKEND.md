# BACKEND.md — Hono API + MongoDB (same repo)

Single-repo deploy: Vite SPA + Hono API + MongoDB Atlas. Replaces the old Firebase Realtime Database (no Firebase SDK anywhere now).

## Setup

```bash
cp .env.example .env     # fill MONGODB_URI
npm run dev              # Vite :5173 (proxies /api) + API :3001
```

| Key | Example |
|-----|---------|
| `MONGODB_URI` | `mongodb+srv://user:pass@….mongodb.net/?appName=…` (same Atlas cluster as bistro-hub) |
| `MONGODB_DB` | `vocabulary` (default) |
| `PORT` | `3001` (bistro-hub uses 3000) |

**Never commit `.env`.**

## Collection `words`

| Field | Type | Notes |
|-------|------|-------|
| `_id` | string | UUID (imported rows keep their Firebase key) |
| `word` | string | as typed |
| `wordKey` | string | `normalizeWordKey(word)` — indexed, duplicate checks |
| `category` | `Category` | see `shared/categories.ts` |
| `senses` | `WordSense[]` | `{ partOfSpeech: PartOfSpeech \| null, definition, examples: string[] }` — one per word type |
| `familyId` | string? | words sharing it are related (word family); absent = none |
| `createdAt` / `updatedAt` | Date | |

Indexes: `{ wordKey: 1 }` (not unique — legacy duplicates), `{ category: 1, createdAt: -1 }`, `{ familyId: 1 }` sparse.

**Word family:** the API exposes `relatedWordIds` (family minus self), computed in `server/services/families.ts`. Saving a word with `relatedWordIds` makes its family exactly that set: unselected members leave, selected words join (leaving their old family), families left with one member are dissolved. So links are two-way and transitive.

## Collections `learners`, `reviews` and `review_logs`

`learners`: `{ _id (UUID), userId (lowercased), userIdKey (normalizeUserIdKey), name, createdAt }`. Index `{ userIdKey: 1 }` **unique** (duplicate insert -> Mongo code 11000 -> 409).

`reviews` (one per learner + word, FSRS state): `{ _id (`${learnerId}:${wordId}`), learnerId, wordId, card: StoredCard, dueAt, firstReviewedAt, updatedAt }`. Index `{ learnerId: 1, dueAt: 1 }`. Written by an upsert in `server/services/reviews.ts` (`firstReviewedAt` set only on insert); scheduling lives in `server/services/scheduler.ts`.

`review_logs` (append-only history, one per recorded answer): `{ learnerId, wordId, rating, stateBefore, stabilityBefore, stateAfter, stabilityAfter, reviewedAt }`. Index `{ learnerId: 1, reviewedAt: 1 }`. Inserted right after the review upsert; a failed insert is logged and does not fail the answer. Logging started with the Progress page — older answers have no history. `server/services/activity.ts` aggregates it per local day (`buildActivity`, pure + tested).

**Deleting a word must also delete its `reviews` and `review_logs`** (`{ wordId }`). There is no delete endpoint yet, so nothing does this today.

## Endpoints

| Method | Path | Body | Result |
|--------|------|------|--------|
| GET | `/api/health` | — | `{ ok, db: "mongo" }` or 503 |
| GET | `/api/words?category=` | — | `{ words: Word[] }` newest first |
| GET | `/api/words?page=&pageSize=&q=&category=` | — | `{ words, related, total, page, pageSize }` — word list page (≤ 100), `q` matches word / definition / example case-insensitively; `related` = family members of the page's words; a page past the end returns the last page · `400` invalid query |
| GET | `/api/words/:id` | — | `{ word, related }` · `404` |
| POST | `/api/words` | `WordInput` | `201 { word }` · `400` invalid · `409` exists |
| PUT | `/api/words/:id` | `WordInput` | `200 { word }` · `400` · `404` · `409` spelling used by another word |
| POST | `/api/words/bulk` | `{ words: WordInput[] }` (≤ 2000) | `201 { inserted, skipped }` · `400` with row number |
| POST | `/api/learners` | `{ userId, name }` | `201 { learner }` · `400` · `409` User ID already exists |
| GET | `/api/learners/by-user-id/:userId` | — | `{ learner }` (case-insensitive) · `404` |
| GET | `/api/learners/:learnerId/reviews` | — | `{ reviews: WordReview[] }` · `404` Learner not found |
| GET | `/api/learners/:learnerId/activity?tz=<IANA>` | — | `{ activity: Activity }` (last 182 local days, 30-day retention, streak, mastered per day) · `400` Invalid time zone · `404` |
| POST | `/api/learners/:learnerId/reviews` | `{ wordId, rating }` | `{ review }` · `400` · `404` Learner/Word not found |

`WordInput = { word, category, senses, relatedWordIds }`. All input goes through `parseWordInput` (`shared/word.ts`), which also accepts the flat shape `{ word, category, definition, partOfSpeech?, examples? }` (Excel rows) and splits legacy text like `"- nắm lấy (Verb)\n- vali (Noun)"` / `"…\nex: …"` into senses (`shared/legacy-definition.ts`).

## Migrating from Firebase

```bash
npm run db:import-firebase
```

Reads `words.json` from the old RTDB over REST and inserts missing Firebase keys only — safe to re-run, never overwrites edits. Done once on 2026-10-10: 937 words imported.

## Senses migration (done 2026-10-10)

```bash
npm run db:migrate-senses -- --dry   # preview
npm run db:migrate-senses            # apply (idempotent)
```

Converted `definition: string` → `senses[]` for all 937 words (68 got a part of speech, 17 got examples, 8 split into several senses). The original collection is kept as `words_backup_before_senses`.

## Word families (done 2026-10-10)

```bash
npm run db:link-families -- families.json [--dry]
```

Input `[{ base, members: [{ word, partOfSpeech, definition, example }] }]`: stored words are linked, missing members are created (category of the base word), overlapping families are merged. Idempotent. First run: 555 single words → 387 families, 450 existing words linked, 832 new words created (937 → 1769). Backup: `words_backup_before_families`.

## Proofreading fixes (done 2026-10-10)

The 937 original entries were proofread: 47 fixes (English spelling, Vietnamese typos, clearly wrong meanings such as oven = "lò nướng", wrong part of speech such as produce → verb, truncated idioms). Spelling fixes that collided with another entry were merged ("bugdet" into "budget"; the auto-created "transportation" into the corrected "transpotation"). Backup: `words_backup_before_fixes`.

## Deploy

- **VPS / Docker:** `npm run build && npm start` (serves `dist/` + `/api`).
- **Vercel:** `server/vercel-entry.ts` is bundled to `api/index.js` by `npm run build:api` (commit it). `vercel.json` rewrites `/api/*` → `/api?__path=…`. Set `MONGODB_URI` (+ `MONGODB_DB`) in project env and allow Vercel egress in Atlas Network Access. Check `GET /api/health` after deploy.

## Security note

The API has no auth (same as the old public Firebase DB). Anyone with the URL can add words. Add auth before sharing the deployment publicly.
