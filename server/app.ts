import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { connectToMongoDB, getDb } from "./db/mongo";
import { learnerRoutes } from "./routes/learners";
import { wordRoutes } from "./routes/words";

export function createApp() {
  const app = new Hono();

  app.use("*", logger());
  app.use(
    "/api/*",
    cors({
      origin: "*",
      allowHeaders: ["Content-Type"],
    }),
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
  app.route("/api/learners", learnerRoutes);

  return app;
}
