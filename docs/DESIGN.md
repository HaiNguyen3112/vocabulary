# DESIGN.md — Study Vocabulary

**Reading:** personal study tool, used on desktop and phone.
**Language:** Ant Design defaults, calm pastel board, colour = card type.

```yaml
colors:
  primary: "#1677ff"        # antd default — buttons, selected card border
  background: "#f5f7fb"     # layout background
  word: "#d46b08"           # word cards (bold)
  definition: "#1d39c4"     # definition cards
  selected: "#e6f4ff"
  correct: "#b7eb8f"        # flash on a match
  wrong: "#ffa39e"          # flash on a miss
  board: pastel gradient (sky → pink → violet)
shell: fixed light sider ≥992px · zero-width sider + hamburger <992px
maxWidth: { content: 1080px, board: 1000px }
```

## Sources of truth

1. `docs/DESIGN.md` (this file)
2. `src/styles/theme.ts` — Ant Design `ThemeConfig`
3. `src/styles/_tokens.scss` — SCSS mirror (colours, spacing, breakpoints, motion)

Change a colour in that order.

## Principles

1. Board grid: 4 columns (definition, word, definition, word); 2 columns under 400px.
2. Cards are `<button>`s — keyboard + screen reader friendly; matched cards keep their slot (`visibility: hidden`).
3. Category = antd preset tag colour from `CATEGORY_COLOR`; label from `CATEGORY_LABEL`.
4. Multiline definitions via `.pre-line` — never HTML injection.
5. Icons from `@ant-design/icons`; no emoji.
6. No external image URLs.
