# Progress page — design

Date: 2026-10-10 · Status: approved in chat (approach A)

## Goal

A learner has no place to see how they are doing. Add a **Progress** tab that answers:
which words do I keep forgetting, which words do I know, and am I studying regularly.

Viewer: **the learner, about their own progress only** (no admin view).

## Decisions

- New top-level tab **Progress** (`/progress`), between Words and Add on the mobile tab bar.
- Sections: **overview stats**, **words you keep forgetting**, **activity charts** (heatmap + known words over time).
  No due-forecast section.
- **Approach A — split computation:**
  - Word-state numbers and the forgetting list are computed **on the client** from the reviews cache that
    the Today card already loads (same source → the two screens never disagree).
  - History (heatmap, 30-day retention, streak, known words over time) comes from a new
    **`GET /api/learners/:id/activity?tz=<IANA>`**, aggregated on the server from a new `review_logs` collection.
- "Practice these words" opens the study hub with the forgetting list as a **temporary deck**: practice only,
  **nothing written to FSRS** (same mechanism as an uploaded Excel deck).
- Every recorded answer is logged — review session and free practice alike, since both write reviews today.
- History starts empty: logging begins with this release. The page says since when activity is recorded.

## Definitions

| Term (UI) | Rule |
|---|---|
| Chưa học (not studied) | no review document |
| Đang học (learning) | state `new` / `learning` / `relearning` |
| Đã thuộc (known) | state `review`, stability < 21 days |
| Nhớ chắc (mastered) | state `review`, stability ≥ 21 days (`MATURE_STABILITY_DAYS`) |
| Hay quên (keeps forgetting) | `lapses ≥ 2` or `difficulty ≥ 8`; sorted by lapses, then difficulty |
| Tỷ lệ nhớ (retention, 30 days) | answers on words that were in `review` state, share not rated `again` |
| Chuỗi ngày (streak) | consecutive local days with ≥ 1 answer, ending today (or yesterday if nothing yet today) |

Days are the learner's **local calendar days**: the client sends its IANA time zone; an invalid zone → 400.

## Data

`review_logs` (append-only, one per recorded answer):
`{ learnerId, wordId, rating, stateBefore, stabilityBefore, stateAfter, stabilityAfter, reviewedAt }`,
index `{ learnerId: 1, reviewedAt: 1 }`. Written right after the review upsert; a failed log insert is logged
to the console and does not fail the answer (the card stays the source of truth).

`WordReview` (API) gains `stability` and `difficulty`.

### Activity response

```ts
type Activity = {
  since: string | null;            // first logged answer (ISO), null = no history yet
  days: ActivityDay[];             // last 182 local days, oldest first, today last
  retention: { passed: number; total: number };
  streak: { current: number; longest: number };
};
type ActivityDay = { date: string /* YYYY-MM-DD */; reviews: number; mastered: number | null };
```

`mastered` per day is rebuilt **backwards** from today's cards: start from the current mastered set, undo each
log newest → oldest using its `stateBefore` / `stabilityBefore`. It is exact for days on or after `since`
and `null` before it (unknown).

## UI

- Overview: four counts (Chưa học / Đang học / Đã thuộc / Nhớ chắc) as a segmented bar + numbers,
  plus retention % and streak (current · longest).
- Keeps forgetting: up to 20 words (word, meaning, "quên N lần"), each opens the word detail; button
  "Luyện những từ này" → hub with the temporary deck. Empty state when none.
- Activity: 26-week heatmap (weeks as columns, Mon–Sun rows), one-hue sequential ramp from the ink-blue primary,
  5 levels (0 + 4), per-cell tooltip; known-words line chart (single series, 2px, hover crosshair + tooltip).
  Before `since` the heatmap shows empty cells and the line is not drawn.
- Behind `LearnerGate` (moved to `features/shared/` — now used by two features).
- Offline / load error: overview + list still render from the reviews cache; activity shows an inline message.

## Testing

- `server/services/activity.test.ts`: day bucketing across time zones, retention, streaks, backward mastered rebuild.
- `src/lib/progress.test.ts`: classification, counts, forgetting list order.
- `src/lib/practice-state.test.ts`: router state parsing incl. deck label.
- Real UI check in light/dark, desktop/mobile.
