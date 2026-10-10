import { MongoClient, type Db } from "mongodb";
import type { WordDoc } from "./types";

const DEFAULT_DB_NAME = "vocabulary";
const CONNECT_TIMEOUT_MS = 5_000;

type MongoGlobal = {
  __vocabMongoClient?: MongoClient;
  __vocabMongoDb?: Db;
  __vocabMongoConnecting?: Promise<MongoClient>;
};

// Cached on globalThis so serverless warm starts / tsx watch reuse one client.
const mongoGlobal = globalThis as typeof globalThis & MongoGlobal;

let client: MongoClient | null = mongoGlobal.__vocabMongoClient ?? null;
let db: Db | null = mongoGlobal.__vocabMongoDb ?? null;

function resolveUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Copy .env.example → .env and fill it in.");
  }
  if (uri.includes("<db_password>")) {
    throw new Error("Replace <db_password> in MONGODB_URI with your real MongoDB Atlas password.");
  }
  return uri;
}

export async function connectToMongoDB(): Promise<MongoClient> {
  if (client) return client;
  if (mongoGlobal.__vocabMongoConnecting) {
    return mongoGlobal.__vocabMongoConnecting;
  }

  mongoGlobal.__vocabMongoConnecting = (async () => {
    const nextClient = new MongoClient(resolveUri(), {
      serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
      connectTimeoutMS: CONNECT_TIMEOUT_MS,
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
    mongoGlobal.__vocabMongoConnecting = undefined;
  }
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (!client) return;
  await client.close();
  client = null;
  db = null;
  mongoGlobal.__vocabMongoClient = undefined;
  mongoGlobal.__vocabMongoDb = undefined;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectToMongoDB() first.");
  }
  return db;
}

export const collections = {
  words: () => getDb().collection<WordDoc>("words"),
};

async function ensureIndexes(database: Db): Promise<void> {
  // Not unique: legacy data has the same word with different meanings.
  await database.collection("words").createIndex({ wordKey: 1 });
  await database.collection("words").createIndex({ category: 1, createdAt: -1 });
  await database.collection("words").createIndex({ familyId: 1 }, { sparse: true });
}
