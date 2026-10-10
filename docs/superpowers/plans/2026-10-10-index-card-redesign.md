# Index Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the whole app as "index cards on a desk" (direction A), replace the sider with a desktop top bar + mobile bottom tab bar, and add dark mode, a board progress counter, board keyboard shortcuts and a desktop split view in the word bank.

**Architecture:** Colours move from SCSS constants to CSS custom properties (`--color-*`) switched by `data-theme` on `<html>`, so every existing `$color-*` usage gets dark mode for free; `src/styles/theme.ts` mirrors the same hex values into two antd `ThemeConfig`s. Game/keyboard rules live in pure `lib/` functions with Vitest tests; components only wire DOM events to them. Split view reuses `WordDetail` as a panel next to a new compact list, chosen by viewport in the page components.

**Tech Stack:** Vite + React 18 + TS strict, Ant Design 5 (`theme.darkAlgorithm`), SCSS modules, Zustand, Vitest. Fonts from Google Fonts: Literata + Be Vietnam Pro.

**Spec:** Choice made in the redesign artifact (https://claude.ai/artifact/6r7VeNJNNF4muWKGMzu9ZX): *Hướng A (Thẻ ghi chú) · Layout: Bottom tabs (mobile-first) · Bổ sung: Dark mode + nút chuyển, Đếm tiến độ trên board, Phím tắt trên board, Split view ở Kho từ (desktop)*. The decisions below are the spec.

## Global Constraints

- Follow `AGENTS.md` hard rules: no `dangerouslySetInnerHTML`, component files ≤ 200 lines, no cross-feature imports, no hardcoded hex in `.tsx`, `useEffect` only for external sync, no `document.querySelector`.
- Colour change order stays: `docs/DESIGN.md` → `src/styles/theme.ts` → `src/styles/_tokens.scss` / `src/styles/index.scss`.
- Fonts: display `"Literata", Georgia, "Times New Roman", serif` (weights 500, 700); body `"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (400, 500, 600, 700). Both cover Vietnamese.
- Radius: `4px` for cards and controls.
- Breakpoints unchanged: `400px` (board → 2 columns), `600px` (table → cards), `992px` (desktop shell + split view).
- Light palette — bg `#e9edf3`, surface `#ffffff`, chrome `#ffffff`, border `#d2dae6`, text `#24324d`, text-muted `#6a778f`, primary `#1d3a8a`, word `#1d3a8a`, definition `#34405a`, card-selected `#eef2fd`, card-rule `#e3e9f4`, card-margin `#f2b8c2`, correct `#cfe9d9`, wrong `#f8d4d8`, card-shadow `0 1px 0 #c7d0de, 0 2px 6px rgba(29, 58, 138, 0.06)`.
- Dark palette — bg `#121722`, surface `#1b2232`, chrome `#161c29`, border `#2c3549`, text `#dbe3f4`, text-muted `#8d99b3`, primary `#8fa8ff`, word `#b9c9ff`, definition `#c3cbe0`, card-selected `#232d47`, card-rule `#232c40`, card-margin `#6b3a48`, correct `#1f4a35`, wrong `#4f2630`, card-shadow `0 1px 0 #0b0f17, 0 2px 8px rgba(0, 0, 0, 0.35)`. Dark antd `colorTextLightSolid: "#0f1420"` so text on primary buttons stays readable.
- Colour-scheme storage key: `study-vocabulary:color-scheme`, values `"system" | "light" | "dark"`. Used by both the store and the pre-paint script in `index.html` — keep them identical.
- UI copy stays English (matches current app). Nav labels: `Study`, `Words`, `Add`.
- Every task ends green on `npm run typecheck && npm run typecheck:server && npm test`.
- Commits: Conventional Commits, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. `localStorage` blocked (Safari private mode) or holding garbage under the scheme key → app starts in `system`, never crashes. Pinned by `parseColorSchemePreference` tests (Task 1) + try/catch in the store.
2. The focused card gets matched and becomes `visibility: hidden` → focus falls to `<body>`; the next arrow key must land on the first available card. Pinned by the `moveBoardFocus(-1, …)` tests (Task 4).
3. Typing `r` in the category select search, the word search box or any form field, or pressing Ctrl/Cmd+R, must not deal a new board. Pinned by `isNewBoardShortcut` tests (Task 4).
4. Split view: opening a word keeps `?q=&category=&page=`; Close returns to the same filtered page; filtering out the open word leaves the panel open. Manual check in Task 6, Step 7.
5. Resizing across 992px while on `/vocabulary-management/:id` switches between split view and the full detail page without losing the word; a first load in dark mode shows no white flash. Manual checks in Task 6 and Task 7.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/color-scheme.ts` (+ test) | Pure: preference parsing, resolving, cycling |
| `src/store/color-scheme-store.ts` | Zustand store for the preference, persisted safely |
| `src/hooks/use-color-scheme.ts` | Resolved scheme + apply `data-theme` / `theme-color` |
| `src/hooks/use-media-query.ts` | `useMediaQuery`, `useIsMobile`, `useIsDesktop`, `useIsSmallScreen` (replaces `use-is-mobile.ts`) |
| `src/styles/_mixins.scss` | `index-card` mixin |
| `src/app/top-bar.tsx`, `bottom-tab-bar.tsx`, `theme-toggle.tsx` (+ scss) | New shell pieces |
| `src/lib/board-navigation.ts` (+ test) | Pure: arrow-key movement, shortcut detection |
| `src/features/study/use-board-keyboard.ts` | Wires keyboard events to the pure functions |
| `src/features/study/board-progress.tsx` | `3 / 8 pairs · 2 misses` |
| `src/features/words/word-index-list.tsx` (+ scss) | Compact list for the split view |
| `src/features/words/use-word-list-params.ts` | URL filter/page params (extracted from `words-workspace.tsx`) |

---

### Task 1: Tokens, fonts and dark mode infrastructure

**Files:**
- Create: `src/lib/color-scheme.ts`, `src/lib/color-scheme.test.ts`, `src/store/color-scheme-store.ts`, `src/hooks/use-color-scheme.ts`, `src/hooks/use-media-query.ts`, `src/styles/_mixins.scss`
- Modify: `docs/DESIGN.md`, `index.html`, `src/styles/theme.ts`, `src/styles/_tokens.scss`, `src/styles/index.scss`, `src/App.tsx`, `src/constants/layout.ts`, every importer of `@/hooks/use-is-mobile`
- Delete: `src/hooks/use-is-mobile.ts`

**Interfaces:**
- Produces:
  - `type ColorScheme = "light" | "dark"`; `type ColorSchemePreference = ColorScheme | "system"`
  - `parseColorSchemePreference(raw: unknown): ColorSchemePreference`
  - `resolveColorScheme(preference: ColorSchemePreference, systemPrefersDark: boolean): ColorScheme`
  - `nextColorSchemePreference(preference: ColorSchemePreference): ColorSchemePreference` — cycle `system → light → dark → system`
  - `COLOR_SCHEME_STORAGE_KEY = "study-vocabulary:color-scheme"`
  - `useColorSchemeStore: { preference: ColorSchemePreference; setPreference(p): void }`
  - `useResolvedColorScheme(): ColorScheme`; `useApplyColorScheme(scheme: ColorScheme): void`
  - `palettes: Record<ColorScheme, Palette>`, `fonts: { body: string; display: string }`, `appThemes: Record<ColorScheme, ThemeConfig>` in `theme.ts` (replaces `brand` / `appTheme`)
  - `useMediaQuery(query: string): boolean`, `useIsMobile()` (<600), `useIsDesktop()` (≥992), `useIsSmallScreen()` (<400)
  - `SMALL_BREAKPOINT_PX = 400` in `constants/layout.ts`
  - SCSS: `$color-*` names keep existing names but now equal `var(--color-*)`; new `$color-text`, `$color-chrome`, `$color-card-rule`, `$color-card-margin`, `$shadow-card`, `$font-display`, `$font-body`, `$topbar-height: 56px`, `$tabbar-height: 60px`, `$split-list-width: 380px`; `$radius: 4px`; `$board-gradient` and `$sider-width` removed
  - Mixin `@include index-card($ruled: true)` — surface background, border, radius, card shadow, red margin line 13–14px from the left, and (when `$ruled`) a rule every 22px; sets `padding-left: 22px`

- [ ] **Step 1: Write the failing tests** in `src/lib/color-scheme.test.ts`

```ts
describe("parseColorSchemePreference", () => {
  it("keeps valid values", () => {
    expect(parseColorSchemePreference("dark")).toBe("dark");
    expect(parseColorSchemePreference("light")).toBe("light");
    expect(parseColorSchemePreference("system")).toBe("system");
  });
  it("falls back to system for anything else", () => {
    for (const raw of [null, undefined, "", "DARK", "{}", 1]) {
      expect(parseColorSchemePreference(raw)).toBe("system");
    }
  });
});
describe("resolveColorScheme", () => {
  it("follows the OS only for system", () => {
    expect(resolveColorScheme("system", true)).toBe("dark");
    expect(resolveColorScheme("system", false)).toBe("light");
    expect(resolveColorScheme("light", true)).toBe("light");
    expect(resolveColorScheme("dark", false)).toBe("dark");
  });
});
describe("nextColorSchemePreference", () => {
  it("cycles system → light → dark → system", () => {
    expect(nextColorSchemePreference("system")).toBe("light");
    expect(nextColorSchemePreference("light")).toBe("dark");
    expect(nextColorSchemePreference("dark")).toBe("system");
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/lib/color-scheme.test.ts` — expected FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/color-scheme.ts`** with the signatures above. Run the test again — expected PASS.

- [ ] **Step 4: Store and hooks.** `color-scheme-store.ts`: plain `create()`; initial preference = `parseColorSchemePreference(readStorage())`; `setPreference` writes storage. Both storage reads and writes wrapped in try/catch. `use-media-query.ts`: generalise the current `useSyncExternalStore` code to any query; move `useIsMobile` there and update its importers. `use-color-scheme.ts`: `useResolvedColorScheme` combines the store with `useMediaQuery("(prefers-color-scheme: dark)")`; `useApplyColorScheme` is a `useEffect` that sets `document.documentElement.dataset.theme` and the `<meta name="theme-color">` content to `palettes[scheme].chrome`.

- [ ] **Step 5: Theme files.**
  - `theme.ts`: `palettes` + `fonts` from Global Constraints; `appThemes.light` / `appThemes.dark` built once at module level with `colorPrimary`, `colorBgLayout`, `colorBgContainer`, `colorBorder`, `colorText`, `colorTextSecondary`, `borderRadius: 4`, `fontFamily: fonts.body`; dark adds `algorithm: theme.darkAlgorithm` and `colorTextLightSolid: "#0f1420"`; component tokens `Table.headerBg = palette.bg`, `Table.rowHoverBg = palette.cardSelected`.
  - `index.scss`: declare every `--color-*` and `--shadow-card` on `:root` (light) and again under `:root[data-theme="dark"]` with `color-scheme: dark`; `body` uses `$font-body`, `$color-text`, `$color-bg`; `h1, h2, h3, .ant-typography:is(h1, h2, h3, h4)` use `$font-display`.
  - `index.html`: Google Fonts `<link>` (preconnect + `family=Literata:wght@500;700&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap`), `viewport-fit=cover` in the viewport meta, `theme-color` `#ffffff`, and an inline `<script>` in `<head>` that reads `COLOR_SCHEME_STORAGE_KEY` (try/catch), resolves with `matchMedia`, and sets `document.documentElement.dataset.theme` before first paint.
  - `App.tsx`: `const scheme = useResolvedColorScheme(); useApplyColorScheme(scheme);` and `<ConfigProvider theme={appThemes[scheme]}>`.
  - `docs/DESIGN.md`: rewrite the YAML block and principles for direction A (palettes, fonts, index-card mixin, shell, dark mode). Keep "Sources of truth" and principles 2–6.

- [ ] **Step 6: Verify.** `npm run typecheck && npm run typecheck:server && npm test` green. `npm run dev`: in devtools, set `localStorage["study-vocabulary:color-scheme"] = "dark"` and reload — page and antd controls are dark with no white flash; set it to `"garbage"` — app loads in the OS scheme.

- [ ] **Step 7: Commit** `feat(theme): add index-card tokens, fonts and dark mode`

---

### Task 2: App shell — top bar, bottom tab bar, theme toggle

**Files:**
- Create: `src/app/top-bar.tsx`, `src/app/top-bar.module.scss`, `src/app/bottom-tab-bar.tsx`, `src/app/bottom-tab-bar.module.scss`, `src/app/theme-toggle.tsx`
- Modify: `src/app/app-layout.tsx`, `src/app/app-layout.module.scss`, `src/app/nav-items.tsx`, `.cursor/rules/design.mdc` (shell line)

**Interfaces:**
- Consumes: `useColorSchemeStore`, `nextColorSchemePreference` (Task 1)
- Produces:
  - `NAV_ITEMS: NavItem[]` = Study (`ROUTES.study`, `ReadOutlined`), Words (`ROUTES.words`, `UnorderedListOutlined`)
  - `TAB_ITEMS: NavItem[]` = `NAV_ITEMS` + Add (`ROUTES.wordNew`, `PlusCircleOutlined`)
  - `findNavKey(pathname: string, items: readonly NavItem[] = NAV_ITEMS): string` (same longest-prefix rule)

- [ ] **Step 1: `AppLayout`** becomes `<div class=app><TopBar /><main class=content>{children}</main><BottomTabBar /></div>`; drop antd `Layout`/`Sider`/`Menu` and the collapse state. `.content`: `max-width: $content-max-width`, centred, padding `$space-lg $space-md`; below `$bp-lg` add bottom padding `calc(#{$tabbar-height} + #{$space-md} + env(safe-area-inset-bottom, 0px))`.

- [ ] **Step 2: `TopBar`** — sticky at `top: env(safe-area-inset-top, 0px)`, height `$topbar-height`, `$color-chrome` background, bottom border. Left: "Study Vocabulary" link to `/` in `$font-display`. Centre (≥992 only, hidden by CSS below): `NAV_ITEMS` as links with `aria-current="page"` for `findNavKey(pathname)`, active link underlined in `$color-primary`. Right: `<ThemeToggle />`.

- [ ] **Step 3: `ThemeToggle`** — antd `Button type="text" shape="circle"` inside a `Tooltip`. Icon: system `DesktopOutlined`, light `SunOutlined`, dark `MoonOutlined`. `aria-label` = `Theme: <current>. Switch to <next>` (labels `System`, `Light`, `Dark`). Click → `setPreference(nextColorSchemePreference(preference))`.

- [ ] **Step 4: `BottomTabBar`** — `<nav aria-label="Main">`, fixed bottom, hidden ≥992 by CSS. Height `$tabbar-height` plus `padding-bottom: env(safe-area-inset-bottom, 0px)`. Three equal links from `TAB_ITEMS`, icon above label, active (`findNavKey(pathname, TAB_ITEMS)`) in `$color-primary` with `aria-current="page"`.

- [ ] **Step 5: Verify.** typecheck + tests green. In the browser at 1280px: top bar with Study/Words links, no bottom bar. At 375px: brand + toggle on top, 3 tabs at the bottom; `/vocabulary-management/new` highlights Add, `/vocabulary-management/<id>/edit` highlights Words; the last table/card row and the edit form buttons are not hidden behind the tab bar. Toggle cycles System → Light → Dark.

- [ ] **Step 6: Commit** `feat(layout): replace sider with top bar and bottom tab bar`

---

### Task 3: Study board — index-card look and progress counter

**Files:**
- Create: `src/features/study/board-progress.tsx`, `src/features/study/board-progress.module.scss`
- Modify: `src/features/study/use-match-game.ts`, `src/features/study/study-session.tsx`, `src/features/study/study-session.module.scss`, `src/features/study/match-board.module.scss`

**Interfaces:**
- Produces (from `useMatchGame`): `progress: { matched: number; total: number; mistakes: number }` (`total = cards.length / 2`), `clearSelection(): void` (ignored while a flash is running). `mistakes` increments on every wrong pair and resets in `dealNewBoard`.
- `BoardProgress({ matched, total, mistakes }: { matched: number; total: number; mistakes: number })`

- [ ] **Step 1: Hook.** Add `mistakeCount` state and `clearSelection` to `useMatchGame`; return `progress` and `clearSelection`. Behaviour of matching, timers and speech unchanged.

- [ ] **Step 2: `BoardProgress`.** antd `Progress` with `steps={total}`, `percent={matched / total * 100}`, `showInfo={false}`, `size="small"`, plus text `${matched} / ${total} pairs`, and ` · ${mistakes} misses` in muted text only when `mistakes > 0`. Wrap the text in `aria-live="polite"`. Render nothing when `total === 0`.

- [ ] **Step 3: Toolbar.** Rename "Reload list" to "New board" (`type="primary"`). Order: New board, Upload file, category select, file tag, then `BoardProgress` pushed right (`margin-left: auto`; wraps to its own line on mobile).

- [ ] **Step 4: Board styles.** Remove the gradient and `min-height: 600px`; `gap: 10px`. `.card`: `@include index-card`, `min-height: 72px` (56px below 600px). `.word`: `$font-display`, weight 700, `$color-word`, 16px (14px mobile). `.definition`: `$color-definition`. `.selected`: 2px `$color-primary` outline, `$color-card-selected` background, `translateY(-2px)`. `.correct`: flash to `$color-correct`. `.wrong`: flash to `$color-wrong` plus a 4px horizontal shake. `:focus-visible`: 2px `$color-primary` outline offset 2px. Under `prefers-reduced-motion: reduce`, no transform or shake (colour flash stays).

- [ ] **Step 5: Verify.** typecheck + tests green. In both themes at 1280px and 375px: cards show the ruled lines and red margin, the counter goes 0/8 → 8/8 and resets on a new board, a wrong pair bumps misses, matched cards keep their slot.

- [ ] **Step 6: Commit** `feat(study): index-card board and match progress counter`

---

### Task 4: Board keyboard shortcuts

**Files:**
- Create: `src/lib/board-navigation.ts`, `src/lib/board-navigation.test.ts`, `src/features/study/use-board-keyboard.ts`
- Modify: `src/features/study/match-board.tsx`, `src/features/study/study-session.tsx`, `src/features/study/study-session.module.scss`, `src/constants/study.ts`

**Interfaces:**
- Consumes: `clearSelection`, `dealNewBoard` (Task 3), `useIsSmallScreen` (Task 1)
- Produces:
  - `type BoardArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"`; `isBoardArrowKey(key: string): key is BoardArrowKey`
  - `moveBoardFocus(from: number, key: BoardArrowKey, columns: number, total: number, isAvailable: (index: number) => boolean): number` — step is ±1 (left/right) or ±columns (up/down); walk from `from` until an available index inside `[0, total)`; none found → return `from`. `from === -1` (focus outside the board) → return the first available index for any key, or `-1` if none.
  - `type ShortcutEvent = { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; targetTag: string | null; targetEditable: boolean }`
  - `isTypingTarget(tag: string | null, editable: boolean): boolean` — true for `INPUT`, `TEXTAREA`, `SELECT` or editable
  - `isNewBoardShortcut(event: ShortcutEvent): boolean` — `key` is `r`/`R`, no modifier, not a typing target
  - `BOARD_COLUMNS = 4`, `BOARD_COLUMNS_SMALL = 2` in `constants/study.ts`
  - `useBoardKeyboard({ cards, columns, isAvailable, onClearSelection })` → `{ cardRefs, handleBoardKeyDown }`; `useNewBoardShortcut(onNewBoard: () => void, isEnabled: boolean)`

- [ ] **Step 1: Write the failing tests** in `src/lib/board-navigation.test.ts`

```ts
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
```

- [ ] **Step 2: Run** `npx vitest run src/lib/board-navigation.test.ts` — expected FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/board-navigation.ts`.** Run the test — expected PASS.

- [ ] **Step 4: `use-board-keyboard.ts`.**
  - `useBoardKeyboard`: `cardRefs` is a ref array indexed like `cards`. `handleBoardKeyDown` (attach to the board `div`): arrow key → `preventDefault`, find the index of `event.target` in `cardRefs`, focus `moveBoardFocus(...)`; `Escape` → `onClearSelection()`. A `window` `keydown` listener (effect, subscribed once, latest callbacks kept in a ref) handles arrow keys when focus is **not** inside the board and not a typing target: focus `moveBoardFocus(-1, …)`.
  - `useNewBoardShortcut`: `window` `keydown` listener; ignore when `event.target` is inside `[role="dialog"]` (via `closest`); call `onNewBoard` when `isNewBoardShortcut` and `isEnabled`.

- [ ] **Step 5: Wire it.** `MatchBoard` gets `columns` and `onClearSelection` props, sets each button's ref from `cardRefs`. `StudySession` passes `columns = useIsSmallScreen() ? BOARD_COLUMNS_SMALL : BOARD_COLUMNS`, `clearSelection`, and calls `useNewBoardShortcut(dealNewBoard, words.length > 0)`. Add a hint under the board, hidden below 992px and on `(pointer: coarse)`: `<kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>Enter</kbd> pick · <kbd>Esc</kbd> clear · <kbd>R</kbd> new board`, styled with `$color-text-muted` and bordered `kbd`.

- [ ] **Step 6: Verify.** typecheck + tests green. In the browser: arrows move focus and skip matched cards; Enter picks; Esc clears a selected card; after matching the focused pair an arrow key focuses the first remaining card; `r` deals a new board but typing `r` in the category select or pressing Cmd/Ctrl+R does not.

- [ ] **Step 7: Commit** `feat(study): keyboard navigation and shortcuts on the board`

---

### Task 5: Restyle the word bank, detail and form

**Files:**
- Modify: `src/features/words/words-workspace.module.scss`, `word-card-list.module.scss`, `word-table-columns.tsx` + `.module.scss`, `word-detail.module.scss`, `word-edit-form.module.scss`, `senses-field.module.scss`, `related-words.module.scss`, `related-words-field.module.scss`, `src/features/shared/page-header.module.scss`, `src/features/shared/word-senses.module.scss`

**Interfaces:**
- Consumes: `index-card` mixin and tokens (Task 1). No TS interface changes.

- [ ] **Step 1: List page.** Title "Word List" in `$font-display`; toolbar unchanged in structure. Table word column text in `$font-display` weight 700 `$color-word` (class on the cell in `word-table-columns.tsx`). Mobile cards: `@include index-card`, word in `$font-display` 17px `$color-word`.

- [ ] **Step 2: Detail.** Title row in `$font-display`; each `.section` is `@include index-card` with a muted uppercase label (`letter-spacing: 0.06em`, 12px). Related-word buttons: `@include index-card($ruled: false)`, hover border `$color-primary`.

- [ ] **Step 3: Form.** `.form` uses `@include index-card($ruled: false)`; sense blocks in `senses-field` get a `$color-border` top divider instead of their own box.

- [ ] **Step 4: Verify.** typecheck + tests green. Visit list, detail, new, edit and the Excel import preview at 375px and 1280px in both themes: no `#fff` boxes left in dark mode, multi-line definitions still break lines, category tags keep their colours.

- [ ] **Step 5: Commit** `style(words): index-card styling for list, detail and form`

---

### Task 6: Desktop split view in the word bank

**Files:**
- Create: `src/features/words/word-index-list.tsx`, `src/features/words/word-index-list.module.scss`, `src/features/words/use-word-list-params.ts`, `src/lib/word-labels.ts`, `src/lib/word-labels.test.ts`
- Modify: `src/features/words/words-workspace.tsx`, `words-workspace.module.scss`, `word-card-list.tsx`, `src/features/words/word-detail.tsx`, `word-detail.module.scss`, `src/pages/word-detail-page.tsx`, `src/pages/words-page.tsx`

**Interfaces:**
- Consumes: `useIsDesktop` (Task 1)
- Produces:
  - `useWordListParams(): { search: string; category: CategoryFilter; page: number; listSearch: string; updateParams(changes: Record<string, string>): void }` — body moved from `WordsWorkspace`; `listSearch` is `""` or `"?" + params`
  - `WordsWorkspace({ selectedId }: { selectedId?: string })`
  - `WordIndexList({ words, selectedId, isLoading, pagination, onOpen }: { words: Word[]; selectedId?: string; isLoading: boolean; pagination: PaginationProps; onOpen: (id: string) => void })`
  - `WordDetail({ id, variant = "page", onClose }: { id: string; variant?: "page" | "panel"; onClose?: () => void })`

- [ ] **Step 1: Extract `useWordListParams`** from `WordsWorkspace` with no behaviour change. typecheck green.

- [ ] **Step 2: Move `partsLabel` to `lib`.** Write `src/lib/word-labels.test.ts` first: `partsOfSpeechLabel` of a word with senses `verb, noun, verb` → `"Verb, Noun"`; with no `partOfSpeech` on any sense → `""`. Run it (FAIL), then create `src/lib/word-labels.ts` exporting `partsOfSpeechLabel(word: Word): string` (body from `partsLabel` in `word-card-list.tsx`), switch `word-card-list.tsx` to it, run it (PASS).

- [ ] **Step 3: `WordIndexList`.** antd `List` with the same pagination object. Each row is a `<button>` with: word (`$font-display`, `$color-word`), `partsOfSpeechLabel(word)` in muted text, the first sense's definition on one line with ellipsis, and `CategoryTag`. Selected row: `aria-current="true"`, `$color-card-selected` background and a 3px `$color-primary` left edge.

- [ ] **Step 4: `WordsWorkspace` layout.** `handleOpen` navigates to `wordDetailPath(id) + listSearch`. When `useIsDesktop()`: the workspace is a flex column with `height: calc(100dvh - #{$topbar-height} - #{$space-lg * 2})`; title and toolbar on top, then a grid `$split-list-width 1fr` with `flex: 1; min-height: 0`, each column `overflow: auto`. Left is `WordIndexList`; right shows `<WordDetail key={selectedId} id={selectedId} variant="panel" onClose={() => navigate(ROUTES.words + listSearch)} />`, or an `Empty` with "Select a word to see its meanings and examples" when no `selectedId`. Below 992px: current table/card behaviour. Keep the file ≤ 200 lines (move the desktop branch into a `WordsSplitView` component in the same folder if needed).

- [ ] **Step 5: `WordDetail` panel variant.** `variant="panel"`: no Back button; a `CloseOutlined` text button (`aria-label="Close"`) next to Edit calls `onClose`; related-word clicks navigate to `wordDetailPath(id) + location.search` so filters survive. `variant="page"` unchanged.

- [ ] **Step 6: Pages.** `WordDetailPage`: `useIsDesktop() ? <WordsWorkspace selectedId={id} /> : <WordDetail key={id} id={id} />`. `WordsPage` stays `<WordsWorkspace />`.

- [ ] **Step 7: Verify.** typecheck + tests green. At 1280px: search "inv", pick category, go to page 2, open a word → URL keeps `?q=inv&category=…&page=2` and the row is highlighted; Close returns to the same list; clear the search so the open word drops out → panel stays open; Edit → Save returns to the split view; an unknown id shows "Word not found" in the panel. Resize to 800px on `/vocabulary-management/<id>` → full detail page; back to 1280px → split view with the same word.

- [ ] **Step 8: Commit** `feat(words): desktop split view for the word bank`

---

### Task 7: Docs and full verification

**Files:**
- Modify: `docs/PROJECT.md` (Key behaviours: shell, dark mode, shortcuts, split view; folder tree: new files), `docs/DESIGN.md` (shell + keyboard + split view lines), `AGENTS.md` only if a rule changed

- [ ] **Step 1: Update docs** to describe the new shell, `data-theme` + `--color-*` model, shortcuts, and split view routes.

- [ ] **Step 2: Run** `npm run typecheck && npm run typecheck:server && npm test && npm run build` — all green.

- [ ] **Step 3: Real UI pass** with `npm run dev` at 375px and 1280px, light and dark, covering Study, Words, detail, new, edit, Excel import preview. Hard-reload in dark mode: no white flash. With `localStorage` disabled (private window): app works, toggle still switches for the session.

- [ ] **Step 4: Commit** `docs: describe index-card redesign, shell and shortcuts`
