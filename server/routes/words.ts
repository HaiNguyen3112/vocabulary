import { Hono } from "hono";
import { isCategory } from "../../shared/categories";
import { MAX_BULK_WORDS, parseWordInput, type WordInput } from "../../shared/word";
import {
  insertWord,
  insertWordsSkippingExisting,
  listWords,
  updateWord,
  wordExists,
} from "../services/words";

export const wordRoutes = new Hono();

wordRoutes.get("/", async (c) => {
  const category = c.req.query("category");
  if (!category) return c.json({ words: await listWords() });
  if (!isCategory(category)) {
    return c.json({ error: `Unknown category "${category}"` }, 400);
  }
  return c.json({ words: await listWords(category) });
});

wordRoutes.post("/", async (c) => {
  const parsed = parseWordInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  if (await wordExists(parsed.value.word)) {
    return c.json({ error: `"${parsed.value.word}" already exists` }, 409);
  }
  return c.json({ word: await insertWord(parsed.value) }, 201);
});

wordRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = parseWordInput(await c.req.json().catch(() => null));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);

  if (await wordExists(parsed.value.word, id)) {
    return c.json({ error: `"${parsed.value.word}" already exists` }, 409);
  }
  const word = await updateWord(id, parsed.value);
  return word ? c.json({ word }) : c.json({ error: "Word not found" }, 404);
});

wordRoutes.post("/bulk", async (c) => {
  const body = await c.req.json<{ words?: unknown }>().catch(() => null);
  if (!body || !Array.isArray(body.words) || body.words.length === 0) {
    return c.json({ error: "Body must be { words: [...] } with at least one word" }, 400);
  }
  if (body.words.length > MAX_BULK_WORDS) {
    return c.json({ error: `At most ${MAX_BULK_WORDS} words per import` }, 400);
  }

  const inputs: WordInput[] = [];
  for (const [index, raw] of body.words.entries()) {
    const parsed = parseWordInput(raw);
    if (!parsed.ok) return c.json({ error: `Row ${index + 1}: ${parsed.error}` }, 400);
    inputs.push(parsed.value);
  }
  return c.json(await insertWordsSkippingExisting(inputs), 201);
});
