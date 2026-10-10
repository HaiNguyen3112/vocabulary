# PWA Offline + Compact Tab Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app an installable PWA that opens offline for reading + free practice, and shrink the mobile tab bar (~94px → ~68px in standalone).

**Architecture:** `vite-plugin-pwa` (Workbox `generateSW`, `registerType: "prompt"`) precaches the build and serves `GET /api/*` network-first. Offline, the word bank pages/details are rebuilt client-side from the cached full word list; writes and FSRS review are disabled via a `useOnlineStatus` hook, and practice skips recording. Server unchanged.

**Tech Stack:** Vite 5.4, React 18, antd 5, Zustand, Vitest; `vite-plugin-pwa@0.21.2`, `workbox-window@7.4.1`.

**Spec:** `docs/superpowers/specs/2026-10-10-pwa-offline-design.md`

## Global Constraints

- Offline copy (Vietnamese, exact): banner `Đang offline — chỉ xem và luyện tập (không lưu tiến độ)`; disabled tooltip `Cần kết nối mạng`; update notification title `Đã có phiên bản mới`, button `Tải lại`; offline-ready message `App đã sẵn sàng dùng offline`.
- Pin exact versions: `vite-plugin-pwa@0.21.2`, `workbox-window@7.4.1` (devDependencies).
- Component files ≤ 200 lines; English names; no UI barrels; no cross-feature imports (AGENTS.md).
- Server code and `/api` contracts unchanged.
- Tab bar: `$tabbar-height: 48px`; `$tabbar-safe-bottom: max(6px, calc(env(safe-area-inset-bottom, 0px) - 14px))`; icon 18px, label 11px, gap 1px. Desktop (≥992px) unchanged.
- Workbox `/api/*`: NetworkFirst, `networkTimeoutSeconds: 4`, cache `api`, statuses `[200]`, max 200 entries, 30 days.
- Done = `npm run typecheck`, `npm run typecheck:server`, `npm test` green + manual checks in Task 6.

## Review Focus

1. **Words page opened offline with a search/page never visited** → results come from the cached full list, not an error. (Task 3 test: network `TypeError` → local page.)
2. **Request aborted because the user typed again** → must stay an abort, not trigger the offline fallback. (Task 3 test: `AbortError` is not a network error.)
3. **Server returns 404/400 while online** → shown as today, not masked by local data. (Task 3 test: `ApiError` is not a network error.)
4. **Page number beyond the end after filtering locally** (e.g. offline search on page 5) → clamps to last page like the server; empty result → page 1, total 0. (Task 2 tests.)
5. **Practising offline** → no "Could not save progress" toast per answer. (Task 4 test on the pure guard `shouldRecordReview`.)

---

### Task 1: Compact tab bar

**Files:**
- Modify: `src/styles/_tokens.scss:34` (`$tabbar-height`, add `$tabbar-safe-bottom`)
- Modify: `src/app/bottom-tab-bar.module.scss`
- Modify: `src/app/app-layout.module.scss:20`

**Interfaces:**
- Produces: SCSS tokens `$tabbar-height` (48px), `$tabbar-safe-bottom`.

- [ ] **Step 1:** In `_tokens.scss` set `$tabbar-height: 48px;` and add `$tabbar-safe-bottom: max(6px, calc(env(safe-area-inset-bottom, 0px) - 14px));` with a comment: the bar overlaps the home-indicator zone instead of adding the full inset. Sass passes `max()`/`env()` through to CSS; verify the compiled value with Step 4.
- [ ] **Step 2:** `bottom-tab-bar.module.scss`: `.bar` `height: calc(#{$tabbar-height} + #{$tabbar-safe-bottom})`, `padding-bottom: $tabbar-safe-bottom`; `.tab` `font-size: 11px; gap: 1px`; `.icon` `font-size: 18px`.
- [ ] **Step 3:** `app-layout.module.scss`: content `padding-bottom: calc(#{$tabbar-height} + #{$space-md} + #{$tabbar-safe-bottom})`.
- [ ] **Step 4:** Run `npm run build` → succeeds; `grep -o "max(6px[^;]*" dist/assets/*.css` shows the `max(...)` expression intact (not evaluated by Sass).
- [ ] **Step 5:** `npm run dev`, Chrome DevTools device "iPhone 14": tab bar ~54px (48 + 6, no inset in the browser), last list row visible above it; at 1200px width bar hidden.
- [ ] **Step 6: Commit** — `feat(ui): compact the mobile tab bar for home-screen mode`

---

### Task 2: Local word page builder (pure)

**Files:**
- Create: `src/lib/word-page-local.ts`
- Test: `src/lib/word-page-local.test.ts`

**Interfaces:**
- Consumes: `filterWords` (`src/lib/filter-words.ts`), `WordPageParams` (`src/api/words-api.ts` — `category: ""` = all), `Word`, `WordPage`, `WordWithRelated` (`@shared/word`).
- Produces:
  - `buildWordPage(all: readonly Word[], params: WordPageParams): WordPage`
  - `buildWordWithRelated(all: readonly Word[], id: string): WordWithRelated | null`

- [ ] **Step 1: Write failing tests** (fixture helper `word(id, text, category, opts?: { definition?, examples?, relatedWordIds? })`, list given newest-first):

```ts
describe("buildWordPage", () => {
  it("searches word, definition and example, case-insensitive", () => {
    // "TIP" matches a word; "thưởng" a definition; "award" an example
    expect(buildWordPage(all, p({ search: "TIP" })).words.map((w) => w.id)).toEqual(["tip"]);
  });
  it("filters by category", () => { /* category: "IDIOM" → only idioms, total = their count */ });
  it("keeps the input order and slices the page", () => {
    // 5 words, pageSize 2, page 2 → ids [3rd, 4th], total 5, page 2, pageSize 2
  });
  it("clamps a page past the end to the last page", () => {
    // 5 words, pageSize 2, page 9 → page 3, words [5th]
  });
  it("returns page 1 with no words when nothing matches", () => {
    expect(buildWordPage(all, p({ search: "zzz", page: 4 }))).toMatchObject({ words: [], total: 0, page: 1 });
  });
  it("puts family members not on the page into related", () => {
    // page word A has relatedWordIds [B, C]; B on the same page, C not → related = [C]
  });
});
describe("buildWordWithRelated", () => {
  it("returns the word and its family members", () => { /* A → { word: A, related: [B, C] } */ });
  it("returns null for an unknown id", () => { expect(buildWordWithRelated(all, "nope")).toBeNull(); });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/word-page-local.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement. Map `params.category` (`""` → `ALL_CATEGORIES` from `src/constants/categories.ts`) into `filterWords`; `page = min(params.page, max(1, ceil(total / pageSize)))`; related = words whose id is in any page word's `relatedWordIds` and not on the page, deduplicated, in list order.
- [ ] **Step 4:** Run the test → PASS.
- [ ] **Step 5: Commit** — `feat(words): build word pages locally from the full list`

---

### Task 3: Offline fallback for word list and detail

**Files:**
- Modify: `src/api/client.ts` (add `isNetworkError`)
- Test: `src/api/client.test.ts`
- Modify: `src/hooks/use-word-page.ts`, `src/hooks/use-word.ts`
- Modify: `vite.config.ts` `test.include` only if `src/api/*.test.ts` is not already matched (it is: `src/**/*.test.ts`).

**Interfaces:**
- Consumes: `buildWordPage`, `buildWordWithRelated` (Task 2); `fetchWordsRequest` (`src/api/words-api.ts`).
- Produces: `isNetworkError(error: unknown): boolean` in `src/api/client.ts`.

- [ ] **Step 1: Write failing tests:**

```ts
describe("isNetworkError", () => {
  it("is true for a fetch TypeError", () => expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true));
  it("is false for an ApiError", () => expect(isNetworkError(new ApiError(404, "Word not found"))).toBe(false));
  it("is false for an abort", () => expect(isNetworkError(new DOMException("aborted", "AbortError"))).toBe(false));
});
```

- [ ] **Step 2:** `npx vitest run src/api/client.test.ts` → FAIL.
- [ ] **Step 3:** Implement `isNetworkError`: `error instanceof TypeError` (what `fetch` rejects with offline or when the SW has no cached response).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** In `useWordPage` the loader becomes: try `fetchWordPageRequest(params, signal)`; `catch (error)` → if `isNetworkError(error)` return `buildWordPage((await fetchWordsRequest()).words, params)`, else rethrow. Same in `useWord` with `buildWordWithRelated`; when it returns `null` throw `new ApiError(404, "Word not found")` so the existing not-found UI shows. If `fetchWordsRequest` itself fails, let that error propagate (existing error UI).
- [ ] **Step 6:** `npm run typecheck && npm test` → green.
- [ ] **Step 7: Commit** — `feat(words): fall back to the cached word list when offline`

---

### Task 4: Online status, offline banner, disabled writes, no offline recording

**Files:**
- Create: `src/hooks/use-online-status.ts`
- Create: `src/constants/offline.ts`
- Create: `src/app/offline-banner.tsx`, `src/app/offline-banner.module.scss`
- Create: `src/lib/review-recording.ts`, Test: `src/lib/review-recording.test.ts`
- Modify: `src/app/app-layout.tsx` (render `<OfflineBanner />` right after `<TopBar />`)
- Modify: `src/features/words/words-workspace.tsx:85-88` ("Add word" button + `ExcelFileButton`)
- Modify: `src/features/shared/excel-file-button.tsx` (accept `disabled?: boolean`)
- Modify: `src/features/words/word-detail.tsx:69` (Edit button)
- Modify: `src/features/words/word-edit-form.tsx:123-126` (Save & add another, Save)
- Modify: `src/features/study/today-card.tsx:45-51` (Start review)
- Modify: `src/features/study/learner-gate.tsx:136-176` (sign-in / register submit buttons)
- Modify: `src/features/study/use-exercise-session.ts:74`

**Interfaces:**
- Produces:
  - `useOnlineStatus(): boolean` — `useSyncExternalStore(subscribe to window "online"/"offline", () => navigator.onLine, () => true)`.
  - `shouldRecordReview(wordId: string | null, isFirstAttempt: boolean, isOnline: boolean): boolean`.
  - `OFFLINE_HINT = "Cần kết nối mạng"` exported from `src/constants/offline.ts` (create) alongside `OFFLINE_BANNER_TEXT`.

- [ ] **Step 1: Write failing test** `review-recording.test.ts`:

```ts
it("records a bank word's first answer online", () => expect(shouldRecordReview("w1", true, true)).toBe(true));
it("never records offline", () => expect(shouldRecordReview("w1", true, false)).toBe(false));
it("never records file-deck words", () => expect(shouldRecordReview(null, true, true)).toBe(false));
it("never records a repeat attempt", () => expect(shouldRecordReview("w1", false, true)).toBe(false));
```

- [ ] **Step 2:** `npx vitest run src/lib/review-recording.test.ts` → FAIL.
- [ ] **Step 3:** Implement `shouldRecordReview`; in `use-exercise-session.ts` replace `isFirstAttempt && word.id !== null` with `shouldRecordReview(word.id, isFirstAttempt, isOnline)` (`isOnline` from `useOnlineStatus()`; narrow `word.id` for `record` as today).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Implement `useOnlineStatus`, `OfflineBanner` (returns `null` online; `role="status"`, text `OFFLINE_BANNER_TEXT`, styled with `$color-chrome` background, `$color-text-muted`, 13px, `$space-xs` vertical padding, border-bottom `$color-border`; sticky under the top bar using the top bar's offset).
- [ ] **Step 6:** At each listed call site: `const isOnline = useOnlineStatus();` → `disabled={!isOnline}` and wrap in `<Tooltip title={isOnline ? undefined : OFFLINE_HINT}>` (wrap disabled antd buttons in a `<span>` so the tooltip still triggers). Today card: `disabled={isLoading || isAllDone || !isOnline}`.
- [ ] **Step 7:** `npm run typecheck && npm test` → green.
- [ ] **Step 8:** `npm run dev`, DevTools Network → Offline (no SW in dev, so only the UI states): banner shows; Add/Import/Edit/Save/Start review/sign-in disabled with tooltip; back Online → all re-enabled, banner gone.
- [ ] **Step 9: Commit** — `feat(app): show offline state and disable writes while offline`

---

### Task 5: Service worker, manifest, update prompt

**Files:**
- Modify: `package.json` (devDependencies)
- Modify: `vite.config.ts`
- Modify: `tsconfig.json` (`types`)
- Modify: `index.html` (remove manifest link; add Apple meta)
- Delete: `public/manifest.json`
- Create: `public/logo-maskable-512.png`
- Create: `src/app/pwa-update-prompt.tsx`
- Modify: `src/App.tsx` (render `<PwaUpdatePrompt />` inside `<AntApp>`)
- Modify: `vercel.json` (headers)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `PwaUpdatePrompt(): null` component.

- [ ] **Step 1:** `npm i -D vite-plugin-pwa@0.21.2 workbox-window@7.4.1` (exact versions in `package.json`).
- [ ] **Step 2:** Maskable icon: `sips -p 640 640 --padColor 1677FF public/logo512.png --out /tmp/m.png && sips -z 512 512 /tmp/m.png --out public/logo-maskable-512.png` (logo occupies 80% safe zone). Open it to check.
- [ ] **Step 3:** `vite.config.ts`: add `VitePWA({...})` with
  - `registerType: "prompt"`, `injectRegister: false` (registered by `useRegisterSW`), `devOptions: { enabled: false }`, `includeAssets: ["favicon.ico", "logo192.png"]`.
  - `manifest`: `id: "/"`, `name: "Studying Vocabulary"`, `short_name: "Vocabulary"`, `description: "Học từ vựng tiếng Anh: ghép từ với nghĩa và quản lý kho từ"`, `lang: "vi"`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color: "#1677ff"`, `background_color: "#f5f7fb"`, icons: `logo192.png` (192, any), `logo512.png` (512, any), `logo-maskable-512.png` (512, `purpose: "maskable"`).
  - `workbox`: `globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"]`, `maximumFileSizeToCacheInBytes: 4 * 1024 * 1024`, `navigateFallback: "/index.html"`, `navigateFallbackDenylist: [/^\/api\//]`, `runtimeCaching` per the spec table (`/api/*` same-origin GET NetworkFirst as in Global Constraints; `fonts.googleapis.com` StaleWhileRevalidate `google-fonts-css`; `fonts.gstatic.com` CacheFirst `google-fonts`, 1 year, statuses `[0, 200]`).
- [ ] **Step 4:** `tsconfig.json` `types: ["vite/client", "vite-plugin-pwa/react"]`. `index.html`: delete `<link rel="manifest" …>`; add `<meta name="apple-mobile-web-app-capable" content="yes" />`, `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`, `<meta name="apple-mobile-web-app-title" content="Vocabulary" />`. Delete `public/manifest.json`.
- [ ] **Step 5:** `PwaUpdatePrompt`: `useRegisterSW()` from `virtual:pwa-register/react`; `App.useApp()` for `notification` / `message`. Effect on `needRefresh` true → `notification.info({ key: "pwa-update", message: "Đã có phiên bản mới", duration: 0, btn: <Button type="primary" size="small" onClick={() => updateServiceWorker(true)}>Tải lại</Button>, onClose: () => setNeedRefresh(false) })`. Effect on `offlineReady` true → `message.success("App đã sẵn sàng dùng offline")` then `setOfflineReady(false)`. Returns `null`.
- [ ] **Step 6:** `vercel.json`: add `"headers": [{ "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }]`.
- [ ] **Step 7:** `npm run build` → succeeds; `ls dist/sw.js dist/manifest.webmanifest` exist; `grep -c 'rel="manifest"' dist/index.html` → `1`; `npm run typecheck && npm run typecheck:server && npm test` green.
- [ ] **Step 8: Commit** — `feat(pwa): add service worker, manifest and update prompt`

---

### Task 6: End-to-end verification on the production build

**Files:** none (fix-ups go in the task that owns the file, as a new commit).

- [ ] **Step 1:** `npm run dev:api` (API on :3001) and `npm run build && npm run preview` (:4173).
- [ ] **Step 2:** Chrome DevTools → Application: Manifest has no errors, maskable icon previews correctly, Installability OK; Service Workers shows `sw.js` activated; `App đã sẵn sàng dùng offline` toast appeared once.
- [ ] **Step 3:** Visit Study hub, open a practice mode, open Words and one word detail. Then Network → **Offline**, reload:
  - app shell + fonts load; banner visible;
  - each practice mode runs, answering shows no "Could not save progress";
  - Words: search a term not searched online → results; paging works; word detail opens;
  - Add word / Import / Edit / Save / Start review / sign-in disabled with `Cần kết nối mạng`.
- [ ] **Step 4:** Online again: banner gone; adding a word works and appears in the list.
- [ ] **Step 5:** Change any visible text, `npm run build`, keep preview tab open and reload: `Đã có phiên bản mới` notification shows; `Tải lại` loads the new text. Revert the text change.
- [ ] **Step 6:** Mobile emulation (iPhone 14): tab bar ~54px in browser, nothing hidden behind it. If a real iPhone is available: add to home screen via `npm run dev` LAN URL is not enough (needs HTTPS) — verify on the Vercel preview deployment instead; tab bar ≈ 68px.
- [ ] **Step 7:** Final: `npm run typecheck && npm run typecheck:server && npm test` green; update `AGENTS.md` Stack section with one line: "PWA: `vite-plugin-pwa` — offline read + free practice; writes/FSRS review need a network". Commit `docs: note PWA offline support`.
