# PROJECT.md — Study Vocabulary

## Goal

Personal English vocabulary trainer: a word ↔ definition matching board (with pronunciation) and a word bank (search, filter by category, add, Excel import).

## Stack

**Vite + React 18 + TypeScript strict + Ant Design 5 + SCSS modules + Vitest** + **Hono API + MongoDB** (same repo).

## Folder tree

```
shared/                # contracts used by BOTH client and server (no React, no Node APIs)
  categories.ts        # CATEGORIES, Category, isCategory
  part-of-speech.ts    # PARTS_OF_SPEECH, parsePartOfSpeech (aliases n/v/adj…)
  word.ts              # Word / WordInput / WordSense, parseWordInput (validation), formatDefinition
  legacy-definition.ts # split old free-text definitions into senses
src/
  main.tsx, App.tsx    # providers: antd ConfigProvider + App, BrowserRouter
  app/                 # AppLayout (top bar + bottom tab bar), ThemeToggle, nav-items (ROUTES, NAV_ITEMS, TAB_ITEMS), app-routes
  pages/               # thin routes: study-page, words-page (list + :id), word-edit-page
  features/
    study/             # StudyWorkspace → StudySession → MatchBoard, useMatchGame, BoardProgress, use-board-keyboard
    words/             # WordsWorkspace (split view ≥992px / table ≥600px / WordCardList <600px, filters in URL via
                       # useWordListParams), WordsSplitView + WordIndexList (≥992px), WordDetailDrawer (<992px), WordDetail,
                       # WordEditForm (page, + SensesField, RelatedWordsField), ImportPreviewModal
    shared/            # CategoryFilterSelect, CategoryTag, PartOfSpeechTag, WordSenses, ExcelFileButton, readWordsFromExcel
  hooks/               # use-words (store + first load), use-media-query (mobile/desktop/small), use-color-scheme, use-go-back
  store/               # words-store (Zustand cache over /api/words), color-scheme-store (light/dark/system)
  api/                 # apiFetch + words endpoints
  lib/                 # pure: shuffle, speech, filter-words, match-board, excel-rows, related-words, color-scheme,
                       # board-navigation, word-labels (+ *.test.ts)
  constants/           # category labels/colours, study timings, page sizes, breakpoints
  styles/              # theme.ts (palettes + antd themes), _tokens.scss, _mixins.scss (index-card), index.scss (CSS variables)
server/
  index.ts             # Node entry; serves dist/ in production
  app.ts               # Hono app: /api/health, /api/words
  vercel-entry.ts      # serverless handler → bundled to api/index.js
  db/                  # mongo client + indexes, document types
  routes/words.ts      # thin REST handlers
  services/            # words (queries/inserts), mappers (doc → API)
scripts/
  build-api.mjs        # esbuild server/vercel-entry.ts → api/index.js
  import-firebase.ts   # one-off Firebase RTDB → MongoDB copy
docs/
```

All path segments and code identifiers: **English**. Component files ≤ **200 lines**.

## Who owns which state

| Kind | Where | Notes |
|------|-------|-------|
| UI local | `useState` | modal open, filter, selected card, uploaded file deck |
| Words | MongoDB via Hono; Zustand cache | `GET /api/words` once, patched after add/import; quiet refetch after edits (family changes touch other words) |
| Game | `useMatchGame` | board re-dealt by re-mounting `StudySession` (`key`) |
| Derived | render / `lib/` | filtered list, existing-word keys, card state |

## Key behaviours

- Board = 8 random pairs with **distinct** words (legacy data has the same word with different meanings).
- Study page "Upload file" studies a local Excel deck **without saving**; the tag closes it.
- Words page "Upload file" previews valid rows + lists invalid ones, then `POST /api/words/bulk` (existing words skipped).
- Single add / edit rejects a spelling another word already uses (client validator + server `409`).
- A word has one or more **senses** (word type + definition + example sentences). The study board shows `formatDefinition(senses)` and never the examples (they contain the word).
- **Related words** = word family, two-way and transitive. Table: click a related tag to peek at its meaning. Detail page: related words listed with their word types + meanings; click to open that word's page.
- **Routes:** `/vocabulary-management` (list, `?q=&category=&page=`), `/vocabulary-management/:id` (list + that word, read-only), `/vocabulary-management/:id/edit` and `/vocabulary-management/new` (form). Clicking a row/card opens the detail; the pencil (icon-only, also in the detail header) opens edit. Saving an edit returns to the previous page; saving a new word replaces the form with the list + its detail.
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
