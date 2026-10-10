// server/vercel-entry.ts
import { handle } from "@hono/node-server/vercel";

// server/app.ts
import { Hono as Hono2 } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// server/db/mongo.ts
import { MongoClient } from "mongodb";
var DEFAULT_DB_NAME = "vocabulary";
var CONNECT_TIMEOUT_MS = 5e3;
var mongoGlobal = globalThis;
var client = mongoGlobal.__vocabMongoClient ?? null;
var db = mongoGlobal.__vocabMongoDb ?? null;
function resolveUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Copy .env.example \u2192 .env and fill it in.");
  }
  if (uri.includes("<db_password>")) {
    throw new Error("Replace <db_password> in MONGODB_URI with your real MongoDB Atlas password.");
  }
  return uri;
}
async function connectToMongoDB() {
  if (client) return client;
  if (mongoGlobal.__vocabMongoConnecting) {
    return mongoGlobal.__vocabMongoConnecting;
  }
  mongoGlobal.__vocabMongoConnecting = (async () => {
    const nextClient = new MongoClient(resolveUri(), {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS
    });
    await nextClient.connect();
    const dbName = process.env.MONGODB_DB ?? DEFAULT_DB_NAME;
    const nextDb = nextClient.db(dbName);
    await ensureIndexes(nextDb);
    client = nextClient;
    db = nextDb;
    mongoGlobal.__vocabMongoClient = nextClient;
    mongoGlobal.__vocabMongoDb = nextDb;
    console.log(`[vocabulary] MongoDB connected (${dbName})`);
    return nextClient;
  })();
  try {
    return await mongoGlobal.__vocabMongoConnecting;
  } finally {
    mongoGlobal.__vocabMongoConnecting = void 0;
  }
}
function getDb() {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectToMongoDB() first.");
  }
  return db;
}
var collections = {
  words: () => getDb().collection("words")
};
async function ensureIndexes(database) {
  await database.collection("words").createIndex({ wordKey: 1 });
  await database.collection("words").createIndex({ category: 1, createdAt: -1 });
  await database.collection("words").createIndex({ familyId: 1 }, { sparse: true });
}

// server/routes/words.ts
import { Hono } from "hono";

// shared/categories.ts
var CATEGORIES = [
  "DINNINGOUT",
  "ENTERTAINMENT",
  "GENERAL_BUSINESS",
  "MANUFACTURING",
  "OFFICES",
  "PERSONAL",
  "PURCHASING",
  "TECHNOLOGY",
  "TRAVEL",
  "PHRASAL_VERB",
  "IDIOM",
  "LINKING_WORD",
  "OTHER"
];
function isCategory(value) {
  return typeof value === "string" && CATEGORIES.includes(value);
}

// shared/part-of-speech.ts
var ALIASES = {
  n: "noun",
  noun: "noun",
  v: "verb",
  verb: "verb",
  adj: "adjective",
  adjective: "adjective",
  adv: "adverb",
  adverb: "adverb",
  prep: "preposition",
  preposition: "preposition",
  conj: "conjunction",
  conjunction: "conjunction",
  pron: "pronoun",
  pronoun: "pronoun",
  phr: "phrase",
  phrase: "phrase"
};
function parsePartOfSpeech(raw) {
  if (typeof raw !== "string") return null;
  return ALIASES[raw.trim().toLowerCase().replace(/\.$/, "")] ?? null;
}

// shared/legacy-definition.ts
var EXAMPLE_PREFIX = /^(?:ex|e\.g\.?|vd)\s*[:.]\s*/i;
var BULLET_PREFIX = /^[-•]\s*/;
var POS_SUFFIX = /\s*\(([^)]+)\)\s*$/;
var POS_PREFIX = /^([a-z]+)\s*:\s*/i;
function splitPartOfSpeech(line) {
  const text = line.replace(BULLET_PREFIX, "");
  const prefix = text.match(POS_PREFIX);
  const prefixPos = prefix ? parsePartOfSpeech(prefix[1]) : null;
  if (prefix && prefixPos) return { partOfSpeech: prefixPos, text: text.slice(prefix[0].length) };
  const suffix = text.match(POS_SUFFIX);
  const suffixPos = suffix ? parsePartOfSpeech(suffix[1]) : null;
  if (suffix && suffixPos) {
    return { partOfSpeech: suffixPos, text: text.slice(0, -suffix[0].length) };
  }
  return { partOfSpeech: null, text };
}
function parseLegacyDefinition(definition) {
  const lines = definition.split("\n").map((line) => line.trim()).filter(Boolean);
  const examples = lines.filter((line) => EXAMPLE_PREFIX.test(line)).map((line) => line.replace(EXAMPLE_PREFIX, "").trim());
  const body = lines.filter((line) => !EXAMPLE_PREFIX.test(line));
  if (body.length === 0) {
    return [{ partOfSpeech: null, definition: lines.join("\n"), examples: [] }];
  }
  const tagged = body.map(splitPartOfSpeech);
  if (tagged.every((line) => line.partOfSpeech && line.text)) {
    return tagged.map((line, index) => ({
      partOfSpeech: line.partOfSpeech,
      definition: line.text,
      // Old data never mixes examples with several senses; keep them on the last one.
      examples: index === tagged.length - 1 ? examples : []
    }));
  }
  return [{ partOfSpeech: null, definition: body.join("\n"), examples }];
}

// shared/word.ts
var MAX_WORD_LENGTH = 200;
var MAX_DEFINITION_LENGTH = 2e3;
var MAX_EXAMPLE_LENGTH = 500;
var MAX_SENSES = 10;
var MAX_EXAMPLES_PER_SENSE = 10;
var MAX_RELATED_WORDS = 50;
var MAX_BULK_WORDS = 2e3;
function normalizeWordKey(word) {
  return word.trim().replace(/\s+/g, " ").toLowerCase();
}
function normalizeDefinition(definition) {
  return definition.replace(/\\n/g, "\n").trim();
}
function toText(value) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}
function toExamples(value) {
  const list = Array.isArray(value) ? value : toText(value).split("\n");
  return list.map(toText).filter(Boolean);
}
function parseSenses(raw) {
  if (raw.senses === void 0) {
    const definition = normalizeDefinition(toText(raw.definition));
    if (!definition) return "Missing definition";
    const senses2 = parseLegacyDefinition(definition);
    const partOfSpeech = parsePartOfSpeech(raw.partOfSpeech);
    const extraExamples = toExamples(raw.examples);
    if (senses2.length === 1) {
      senses2[0].partOfSpeech ??= partOfSpeech;
      senses2[0].examples.push(...extraExamples);
    }
    return senses2;
  }
  if (!Array.isArray(raw.senses) || raw.senses.length === 0) return "Add at least one meaning";
  if (raw.senses.length > MAX_SENSES) return `At most ${MAX_SENSES} meanings`;
  const senses = [];
  for (const [index, item] of raw.senses.entries()) {
    const sense = item ?? {};
    const definition = normalizeDefinition(toText(sense.definition));
    const examples = toExamples(sense.examples);
    if (!definition) return `Meaning ${index + 1}: missing definition`;
    if (sense.partOfSpeech && !parsePartOfSpeech(sense.partOfSpeech)) {
      return `Meaning ${index + 1}: unknown part of speech "${String(sense.partOfSpeech)}"`;
    }
    if (examples.length > MAX_EXAMPLES_PER_SENSE) {
      return `Meaning ${index + 1}: at most ${MAX_EXAMPLES_PER_SENSE} examples`;
    }
    senses.push({ partOfSpeech: parsePartOfSpeech(sense.partOfSpeech), definition, examples });
  }
  return senses;
}
function parseWordInput(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "Invalid payload" };
  }
  const body = raw;
  const word = toText(body.word);
  const category = toText(body.category).toUpperCase();
  if (!word) return { ok: false, error: "Missing word" };
  if (word.length > MAX_WORD_LENGTH) return { ok: false, error: "Word is too long" };
  if (!isCategory(category)) {
    return { ok: false, error: `Unknown category "${toText(body.category)}"` };
  }
  const senses = parseSenses(body);
  if (typeof senses === "string") return { ok: false, error: senses };
  if (senses.some((sense) => sense.definition.length > MAX_DEFINITION_LENGTH)) {
    return { ok: false, error: "Definition is too long" };
  }
  if (senses.some((sense) => sense.examples.some((example) => example.length > MAX_EXAMPLE_LENGTH))) {
    return { ok: false, error: "Example is too long" };
  }
  const relatedWordIds = body.relatedWordIds ?? [];
  if (!Array.isArray(relatedWordIds) || relatedWordIds.some((id) => typeof id !== "string")) {
    return { ok: false, error: "relatedWordIds must be a list of ids" };
  }
  if (relatedWordIds.length > MAX_RELATED_WORDS) {
    return { ok: false, error: `At most ${MAX_RELATED_WORDS} related words` };
  }
  return {
    ok: true,
    value: { word, category, senses, relatedWordIds: [...new Set(relatedWordIds)] }
  };
}

// server/services/words.ts
import { randomUUID as randomUUID2 } from "node:crypto";

// server/services/families.ts
import { randomUUID } from "node:crypto";
var MIN_FAMILY_SIZE = 2;
function groupFamilies(rows) {
  const families = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!row.familyId) continue;
    families.set(row.familyId, [...families.get(row.familyId) ?? [], row._id]);
  }
  return (row) => row.familyId ? (families.get(row.familyId) ?? []).filter((id) => id !== row._id) : [];
}
async function getRelatedIds(row) {
  if (!row.familyId) return [];
  const members = await collections.words().find({ familyId: row.familyId }, { projection: { _id: 1, familyId: 1 } }).toArray();
  return groupFamilies(members)(row);
}
async function pruneSmallFamilies(familyIds) {
  for (const familyId of new Set(familyIds)) {
    const count = await collections.words().countDocuments({ familyId });
    if (count < MIN_FAMILY_SIZE) {
      await collections.words().updateMany({ familyId }, { $unset: { familyId: "" } });
    }
  }
}
async function setFamily(wordId, relatedIds) {
  const self = await collections.words().findOne({ _id: wordId });
  if (!self) return;
  const selected = await collections.words().find({ _id: { $in: relatedIds.filter((id) => id !== wordId) } }, { projection: { _id: 1, familyId: 1 } }).toArray();
  const touchedFamilies = selected.flatMap((row) => row.familyId ? [row.familyId] : []);
  if (selected.length === 0) {
    if (!self.familyId) return;
    await collections.words().updateOne({ _id: wordId }, { $unset: { familyId: "" } });
    await pruneSmallFamilies([self.familyId]);
    return;
  }
  const familyId = self.familyId ?? randomUUID();
  const memberIds = [wordId, ...selected.map((row) => row._id)];
  await collections.words().updateMany({ familyId, _id: { $nin: memberIds } }, { $unset: { familyId: "" } });
  await collections.words().updateMany({ _id: { $in: memberIds } }, { $set: { familyId } });
  await pruneSmallFamilies(touchedFamilies.filter((id) => id !== familyId));
}

// server/services/mappers.ts
function mapWord(row, relatedWordIds) {
  return {
    id: row._id,
    word: row.word,
    category: row.category,
    senses: row.senses,
    relatedWordIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? null
  };
}

// server/services/words.ts
function toDoc(input, createdAt) {
  return {
    _id: randomUUID2(),
    word: input.word,
    wordKey: normalizeWordKey(input.word),
    category: input.category,
    senses: input.senses,
    createdAt
  };
}
async function loadWord(id) {
  const row = await collections.words().findOne({ _id: id });
  return row ? mapWord(row, await getRelatedIds(row)) : null;
}
async function listWords(category) {
  const rows = await collections.words().find(category ? { category } : {}).sort({ createdAt: -1 }).toArray();
  const familyRows = category ? await collections.words().find({ familyId: { $exists: true } }, { projection: { _id: 1, familyId: 1 } }).toArray() : rows;
  const relatedOf = groupFamilies(familyRows);
  return rows.map((row) => mapWord(row, relatedOf(row)));
}
async function wordExists(word, exceptId) {
  const row = await collections.words().findOne(
    { wordKey: normalizeWordKey(word), ...exceptId ? { _id: { $ne: exceptId } } : {} },
    { projection: { _id: 1 } }
  );
  return row !== null;
}
async function insertWord(input) {
  const doc = toDoc(input, /* @__PURE__ */ new Date());
  await collections.words().insertOne(doc);
  if (input.relatedWordIds.length > 0) await setFamily(doc._id, input.relatedWordIds);
  return await loadWord(doc._id) ?? mapWord(doc, []);
}
async function updateWord(id, input) {
  const result = await collections.words().updateOne(
    { _id: id },
    {
      $set: {
        word: input.word,
        wordKey: normalizeWordKey(input.word),
        category: input.category,
        senses: input.senses,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }
  );
  if (result.matchedCount === 0) return null;
  await setFamily(id, input.relatedWordIds);
  return loadWord(id);
}
async function insertWordsSkippingExisting(inputs) {
  const keys = [...new Set(inputs.map((input) => normalizeWordKey(input.word)))];
  const existing = await collections.words().find({ wordKey: { $in: keys } }, { projection: { wordKey: 1 } }).toArray();
  const seenKeys = new Set(existing.map((row) => row.wordKey));
  const createdAt = /* @__PURE__ */ new Date();
  const docs = [];
  const skipped = [];
  for (const input of inputs) {
    const key = normalizeWordKey(input.word);
    if (seenKeys.has(key)) {
      skipped.push(input.word);
      continue;
    }
    seenKeys.add(key);
    docs.push(toDoc(input, createdAt));
  }
  if (docs.length > 0) {
    await collections.words().insertMany(docs, { ordered: false });
  }
  return { inserted: docs.map((doc) => mapWord(doc, [])), skipped };
}

// server/routes/words.ts
var wordRoutes = new Hono();
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
  const body = await c.req.json().catch(() => null);
  if (!body || !Array.isArray(body.words) || body.words.length === 0) {
    return c.json({ error: "Body must be { words: [...] } with at least one word" }, 400);
  }
  if (body.words.length > MAX_BULK_WORDS) {
    return c.json({ error: `At most ${MAX_BULK_WORDS} words per import` }, 400);
  }
  const inputs = [];
  for (const [index, raw] of body.words.entries()) {
    const parsed = parseWordInput(raw);
    if (!parsed.ok) return c.json({ error: `Row ${index + 1}: ${parsed.error}` }, 400);
    inputs.push(parsed.value);
  }
  return c.json(await insertWordsSkippingExisting(inputs), 201);
});

// server/app.ts
function createApp() {
  const app = new Hono2();
  app.use("*", logger());
  app.use(
    "/api/*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type"]
    })
  );
  app.use("/api/*", async (_c, next) => {
    await connectToMongoDB();
    await next();
  });
  app.onError((error, c) => {
    console.error("[vocabulary] Unhandled API error:", error);
    return c.json({ error: "Internal server error" }, 500);
  });
  app.get("/api/health", async (c) => {
    try {
      await getDb().command({ ping: 1 });
      return c.json({ ok: true, service: "vocabulary-api", db: "mongo" });
    } catch {
      return c.json({ ok: false, service: "vocabulary-api", db: "down" }, 503);
    }
  });
  app.route("/api/words", wordRoutes);
  return app;
}

// server/vercel-entry.ts
var config = {
  runtime: "nodejs",
  maxDuration: 30
};
var nodeHandle = handle(createApp());
function restoreIncomingPath(incoming) {
  const url = new URL(incoming.url ?? "/api", "http://localhost");
  const originalPath = url.searchParams.get("__path");
  if (originalPath == null) return;
  url.searchParams.delete("__path");
  url.pathname = originalPath.length > 0 ? `/api/${originalPath}` : "/api";
  incoming.url = `${url.pathname}${url.search}`;
}
function handler(req, res) {
  restoreIncomingPath(req);
  return nodeHandle(req, res);
}
export {
  config,
  handler as default
};
