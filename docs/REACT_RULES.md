# React rules (shortlist)

## Critical

- No barrel imports for components.
- No async waterfalls — use `Promise.all` when calling several endpoints.
- Keep pages thin; logic in `features/` + `lib/`.

## Effects

- `useEffect` only to sync external systems (initial words load, timers).
- No effects for derived state (filtered list, category subset) — compute in render.
- No effects reacting to "file parsed" — the upload handler opens the preview itself.
- Event handlers own mutations (`handleSubmit`, `handleConfirmImport`, …).
- Timers started from handlers are tracked in a ref and cleared on unmount.

## State

- Derive on render (filtered words, existing-word set, counts).
- Functional `setState` when based on previous.
- Server data only via `store/words-store`; refresh/patch the store after a mutation.

## Review checklist

1. Fat page?
2. Barrel import?
3. `useEffect` for click/submit/derived state?
4. Hardcoded hex / external image URL?
5. Component file > 200 lines?
6. `dangerouslySetInnerHTML` or `document.querySelector`?
