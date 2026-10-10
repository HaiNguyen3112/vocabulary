# PWA (offline read + practice) + compact tab bar — design

Date: 2026-10-10 · Status: draft for review

## Goal

The app already has a web manifest (`public/manifest.json`) and can be added to the home screen, but it has
**no service worker**: nothing works without a network, assets are re-fetched, and some browsers do not offer
"Install". Make it a real PWA that **opens and works offline for reading and free practice**, and fix the
bottom tab bar, which takes ~94px on an iPhone once launched from the home screen.

### Decisions

- Offline scope = **read + free practice**: open the app, browse/search the word bank, view word details,
  run every practice mode (Match, Flashcards, Multiple choice, Type, Listen & spell, Fill in the blank).
- **Writes stay online-only**: add / edit / import words, learner sign-in / register, and the **FSRS review
  session** (scheduling is server-side). Offline they are disabled with a "Cần kết nối mạng" hint — no
  outbox, no sync. **Server is unchanged.**
- Tooling: **`vite-plugin-pwa`** (Workbox `generateSW`). No hand-written service worker.
- Updates use **prompt** mode: a new version waits until the user taps "Tải lại", so a practice session is
  never reloaded mid-way.
- Tab bar: **compact in place** — stays at the bottom, thinner, and overlaps part of the home-indicator
  inset instead of adding all of it.

## 1. Service worker & manifest

- `vite.config.ts`: add `VitePWA({ registerType: "prompt", manifest: {...}, workbox: {...} })`.
- Manifest moves from `public/manifest.json` into the plugin config (the plugin emits
  `manifest.webmanifest` and injects the `<link>`; remove the hand-written `<link rel="manifest">` and
  `public/manifest.json`). Fields: existing ones + `id: "/"`, `scope: "/"`, `description`, `lang: "vi"`, and
  a **maskable** 512px icon (`public/logo-maskable-512.png`, logo inside the 80% safe zone, generated once
  from `logo512.png` with a solid `#1677ff` background).
- `index.html`: add `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-status-bar-style=default`,
  `apple-mobile-web-app-title=Vocabulary`.
- Workbox:
  - **Precache** the build output (`**/*.{js,css,html,ico,png,svg,webmanifest}`);
    `maximumFileSizeToCacheInBytes` raised to cover the large main chunk (build warns at 1.5MB).
  - `navigateFallback: "/index.html"`, `navigateFallbackDenylist: [/^\/api\//]`.
  - Runtime caching:

    | Match | Strategy | Cache | Notes |
    |---|---|---|---|
    | `GET /api/*` (same origin) | NetworkFirst, `networkTimeoutSeconds: 4` | `api` | 200 only; max 200 entries, 30 days |
    | `fonts.googleapis.com` | StaleWhileRevalidate | `google-fonts-css` | |
    | `fonts.gstatic.com` | CacheFirst | `google-fonts` | 1 year, status 0/200 |

  - Non-GET requests are never cached (Workbox default for runtime routes registered with `GET`).
- Dev: `devOptions.enabled = false` (SW only in `build` + `preview`, avoiding stale-dev-cache confusion).
- Vercel: `/sw.js` and `/manifest.webmanifest` are real files in `dist`; Vercel serves filesystem
  matches before `rewrites`, so `vercel.json` needs no route change. Add a `headers` entry giving
  `/sw.js` `Cache-Control: no-cache` so updates are picked up promptly.

## 2. Update prompt

- `src/app/pwa-update-prompt.tsx` (rendered once in `App`): uses `useRegisterSW` from
  `virtual:pwa-register/react`. When `needRefresh` is true, show an antd `notification` (no auto-close):
  "Đã có phiên bản mới" + button **Tải lại** → `updateServiceWorker(true)`; closing it dismisses until next
  launch. `offlineReady` → a short `message.success("App đã sẵn sàng dùng offline")` once.
- `tsconfig.json`: add `vite-plugin-pwa/react` to `types` for the virtual module.

## 3. Online status & disabled writes

- `src/hooks/use-online-status.ts`: `useSyncExternalStore` over `navigator.onLine` + `online`/`offline`
  events. (`navigator.onLine === true` does not guarantee reachability; a failed write still shows the
  existing error message, which is acceptable.)
- `src/app/offline-banner.tsx`: slim banner under the top bar while offline:
  "Đang offline — chỉ xem và luyện tập". Uses `$color-chrome` / muted text tokens; `role="status"`.
- When offline, disable with tooltip "Cần kết nối mạng":
  - Words: "Thêm từ", "Import", the edit button / Save in `word-edit-form.tsx`.
  - Study hub: the FSRS review entry (practice-mode cards stay enabled).
  - Learner gate: sign-in / register submit.
  Each call site reads `useOnlineStatus()`; no global interception.

## 4. Word bank offline fallback

The word list is paged and searched **on the server** (`/api/words?page=&q=&category=`), so arbitrary
searches cannot be served from the HTTP cache. Fallback: build the same `WordPage` client-side from the full
list (`GET /api/words`, which the practice modes already load and the SW caches).

- `src/lib/word-page-local.ts` (pure, unit-tested):
  - `buildWordPage(all: Word[], params: WordPageParams): WordPage` — filter with `filterWords` (same fields
    as the server: word, definitions, examples; case-insensitive), keep the server order (newest first — the
    full list is already sorted `createdAt desc`), clamp `page` to the last page like the server, slice, and
    fill `related` with family members (via `relatedWordIds`) that are not on the page.
  - `buildWordWithRelated(all: Word[], id: string): WordWithRelated | null`.
- `use-word-page.ts` / `use-word.ts`: the loader tries the network request; on a **network failure**
  (anything that is not an `ApiError`, and not an abort) it falls back to
  `buildWordPage(await fetchWordsRequest(), params)` — that request is answered from the SW cache. If the
  full list is not cached either, the original error surfaces as today.
- No change to `words-store`: offline, `GET /api/words` is served by the SW cache so `load()` succeeds.

## 5. Compact tab bar

Today: `height: calc(60px + env(safe-area-inset-bottom))` → ~94px in standalone on iPhone.

- `$tabbar-height: 60px → 48px`.
- New token `$tabbar-safe-bottom: max(6px, calc(env(safe-area-inset-bottom, 0px) - 14px))` — the bar sits
  partly over the home-indicator zone (Apple keeps the indicator usable over content) → ~20px on iPhone,
  6px elsewhere. Bar height = `$tabbar-height + $tabbar-safe-bottom` ≈ **68px** (was 94px).
- `.tab`: icon 20 → 18px, label 12 → 11px, `gap: 1px`.
- `app-layout.module.scss` content padding uses the same two tokens so the last row is not hidden.
- Desktop (≥992px) unchanged (bar hidden).

## 6. Testing

- Vitest: `word-page-local.test.ts` — search across word/definition/example, category filter, page clamp,
  `related` excludes on-page words, unknown id → null.
- `npm run typecheck`, `npm run typecheck:server`, `npm test` green.
- Manual (real browser), on `npm run build && npm run preview`:
  1. DevTools → Application: manifest valid (incl. maskable), SW activated, install prompt available.
  2. Load Study + Words once, set **Offline**, reload: app opens; practice modes run; Words search/paging
     works; word detail opens; banner shows; write buttons + FSRS review disabled.
  3. Back online: banner gone, writes work.
  4. Rebuild with a change, reload: "Tải lại" notification appears; tapping it loads the new version.
  5. Mobile viewport (and iPhone home-screen if available): tab bar ~68px, nothing hidden behind it.

## Out of scope

Offline FSRS reviews / outbox sync, offline word editing, push notifications, background sync,
install-button UI (browser's own prompt is enough).
