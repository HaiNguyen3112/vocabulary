# AGENTS.md — Study Vocabulary

Web app học từ vựng tiếng Anh cá nhân: trang Study (hub) có **ôn tập lặp lại ngắt quãng** (FSRS, tiến độ theo từng learner — đăng ký bằng tên + user ID, không mật khẩu) và luyện tự do (ghép cặp **từ ↔ nghĩa**, flashcards, trắc nghiệm, gõ từ, nghe & viết, điền vào chỗ trống — có phát âm), cùng quản lý kho từ (thêm, tìm, lọc, import Excel). Chủ app trao đổi bằng **tiếng Việt** → trả lời tiếng Việt, ngắn, ưu tiên kết quả chạy thật trên web/mobile.

Khung cấu trúc lấy từ `bistro-hub` (layers, rules, docs, Hono + MongoDB) — UI giữ **Ant Design**.

## Start here

| Doc | Content |
|-----|---------|
| **[docs/PROJECT.md](docs/PROJECT.md)** | Architecture, folders, state ownership |
| **[docs/BACKEND.md](docs/BACKEND.md)** | Hono API, MongoDB, deploy, Firebase import |
| **[docs/DESIGN.md](docs/DESIGN.md)** | Theme tokens & UI rules |
| **[docs/REACT_RULES.md](docs/REACT_RULES.md)** | React shortlist |
| **`.cursor/rules/`** | Always-on rules |

## Stack

- Vite + React 18 + TypeScript **`strict: true`**
- API: **Hono** + **MongoDB** (`server/`) — same repo, one deploy; URI via `.env`
- State: Zustand cache over the API (`src/store/words-store.ts`, `reviews-store.ts`; learner in `learner-store.ts` + localStorage)
- UI: Ant Design 5 + SCSS modules; tokens in `src/styles/`
- Excel import: `xlsx` (client-side parse → validated → `POST /api/words/bulk`)
- Test: Vitest for pure `lib/` + server input validation

## Code layers

```
shared/             → contracts + validation used by client AND server
pages/              → thin routes only
features/<domain>/  → study | words | shared
app/                → layout, nav, routes
hooks/              → cross-feature hooks
lib/                → pure client logic (shuffle, filter, board, excel rows)
api/                → fetch client + endpoint helpers
store/              → words cache (calls API)
constants/          → categories, thresholds
types/              → shared FE types
server/             → Hono API + DB (source of truth)
```

**Naming:** English only for folders/files/types/vars/functions. UI copy may stay Vietnamese/English.  
**Component file ≤ 200 lines.** No cross-imports between pages/features. No UI barrels.

## Hard rules

1. Không có SDK database ở frontend — mọi đọc/ghi qua `src/api/*` → Hono → MongoDB.
2. Thêm từ đơn lẻ: từ đã tồn tại (so khớp không phân biệt hoa thường, bỏ khoảng trắng) → từ chối (client validate + server `409`).
3. Import Excel: cột `word`, `definition`, `category` (+ tuỳ chọn `partOfSpeech`, `example`); dòng lỗi bị loại kèm lý do, từ đã có bị bỏ qua — báo số lượng cho người dùng.
4. Mỗi từ có `senses[]` (loại từ + nghĩa + câu ví dụ) và `relatedWordIds` (word family, hai chiều, bắc cầu — logic ở `server/services/families.ts`).
5. Không `dangerouslySetInnerHTML`; định nghĩa nhiều dòng hiển thị bằng `white-space: pre-line`.
6. `typecheck` (FE + server) + `npm test` green + kiểm tra UI thật trước khi báo xong.

## Commands

```bash
npm run dev               # web :5173 + api :3001
npm run typecheck
npm run typecheck:server
npm test
npm run build && npm start
npm run db:import-firebase   # one-off: copy words from old Firebase RTDB
npm run db:migrate-senses    # one-off: definition → senses (done)
npm run db:link-families -- <file.json> [--dry]   # link/create word families
```

## Commit messages

Conventional Commits — see `.cursorrules` + `.cursor/rules/commit-message.mdc`.
