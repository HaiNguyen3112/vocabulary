# Study Vocabulary

Web app học từ vựng tiếng Anh: ghép cặp **từ ↔ nghĩa** (có phát âm) và quản lý kho từ (tìm, lọc, thêm, import Excel).

## Quick start

```bash
npm install
cp .env.example .env   # điền MONGODB_URI (MongoDB Atlas)
npm run dev            # Vite :5173 + Hono API :3001
```

Excel import: sheet đầu tiên, cột `word`, `definition`, `category` (vd. `IDIOM`, `PHRASAL_VERB` — xem `shared/categories.ts`), tuỳ chọn `partOfSpeech` (`noun`/`v`/`adj`…) và `example` (mỗi câu một dòng).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Web + API |
| `npm run typecheck` / `typecheck:server` | TypeScript |
| `npm test` | Vitest |
| `npm run build` | Typecheck + frontend + `api/index.js` |
| `npm start` | Production server (serves `dist/` + `/api`) |
| `npm run db:import-firebase` | Copy dữ liệu cũ từ Firebase sang MongoDB |
| `npm run db:migrate-senses` | Tách `definition` cũ thành `senses` (đã chạy) |

## Docs

- [`AGENTS.md`](./AGENTS.md) — agent entry
- [`docs/PROJECT.md`](./docs/PROJECT.md) — architecture
- [`docs/BACKEND.md`](./docs/BACKEND.md) — API, MongoDB, deploy
- [`docs/DESIGN.md`](./docs/DESIGN.md) — visual system
