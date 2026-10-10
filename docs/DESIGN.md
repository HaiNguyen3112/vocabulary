# DESIGN.md — Study Vocabulary

**Reading:** personal study tool, used on desktop and phone.
**Language:** index cards on a desk — ruled white cards with a red margin line, ink-blue serif words, calm cool-grey desk. Light and dark themes.

```yaml
fonts:
  display: Literata 500/700      # words, page titles, brand
  body: Be Vietnam Pro 400–700   # everything else (covers Vietnamese)
radius: 4px
colors:            # light / dark
  bg:            "#e9edf3" / "#121722"   # the desk
  surface:       "#ffffff" / "#1b2232"   # cards, inputs
  chrome:        "#ffffff" / "#161c29"   # top bar, tab bar, browser theme-color
  border:        "#d2dae6" / "#2c3549"
  text:          "#24324d" / "#dbe3f4"
  text-muted:    "#6a778f" / "#8d99b3"
  primary:       "#1d3a8a" / "#8fa8ff"   # ink blue — buttons, focus, active nav
  word:          "#1d3a8a" / "#b9c9ff"   # English word on cards
  definition:    "#34405a" / "#c3cbe0"   # meaning on cards
  card-selected: "#eef2fd" / "#232d47"
  card-rule:     "#e3e9f4" / "#232c40"   # ruled lines, every 22px
  card-margin:   "#f2b8c2" / "#6b3a48"   # red margin line, 13px from the left
  correct:       "#cfe9d9" / "#1f4a35"   # flash on a match
  wrong:         "#f8d4d8" / "#4f2630"   # flash on a miss
shell: sticky top bar (brand · nav ≥992px · theme toggle) + bottom tab bar <992px (Study · Words · Add)
maxWidth: { content: 1080px, board: 1000px }
```

## Sources of truth

1. `docs/DESIGN.md` (this file)
2. `src/styles/theme.ts` — `palettes`, `fonts`, Ant Design `appThemes` (light + `darkAlgorithm`)
3. `src/styles/index.scss` — the same values as CSS variables (`--color-*`) on `:root` and `:root[data-theme="dark"]`
4. `src/styles/_tokens.scss` — SCSS names (`$color-*` = `var(--color-*)`), spacing, breakpoints, fonts; `_mixins.scss` — `index-card`

Change a colour in that order. Components only use `$color-*` / antd tokens, so both themes follow automatically.

## Dark mode

- Preference `system | light | dark` in `localStorage["study-vocabulary:color-scheme"]` (Zustand store); the top-bar toggle cycles it.
- Dark antd theme sets `colorTextLightSolid: #0f1420` (dark text on the light primary buttons) but `#ffffff` for Tooltip.
- `data-theme` on `<html>` switches the CSS variables; an inline script in `index.html` sets it before first paint.

## Principles

1. Cards use `@include index-card` (ruled) or `index-card($ruled: false)` for forms and lists of buttons.
2. Board grid: 4 columns (definition, word, definition, word); 2 columns under 400px.
3. Cards are `<button>`s — keyboard + screen reader friendly; matched cards keep their slot (`visibility: hidden`).
4. Category = antd preset tag colour from `CATEGORY_COLOR`; label from `CATEGORY_LABEL`.
5. Multiline definitions via `.pre-line` — never HTML injection.
6. Icons from `@ant-design/icons`; no emoji.
7. No external image URLs. Fonts are the only external asset (Google Fonts).
8. Word detail opens over or beside the list, never as its own page: split view ≥992px (list 380px + panel, each scrolls on its own), right drawer 480px at 600–991px, bottom sheet (90%, rounded top, grab handle) below 600px. Drawers use the desk colour (`bg`) so cards stand out.
9. Every interactive card shows a 2px primary focus outline; motion (lift, shake) is dropped under `prefers-reduced-motion`.
