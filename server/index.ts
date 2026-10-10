import "dotenv/config";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createApp } from "./app";
import { connectToMongoDB, disconnectFromMongoDB } from "./db/mongo";

const DEFAULT_PORT = 3001;

async function main() {
  await connectToMongoDB();

  const app = createApp();
  const isProd = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT ?? DEFAULT_PORT);

  if (isProd) {
    app.use("/*", serveStatic({ root: "./dist" }));
    app.notFound(async (c) => {
      if (c.req.path.startsWith("/api")) {
        return c.json({ error: "Not found" }, 404);
      }
      try {
        const html = await readFile(path.join(process.cwd(), "dist", "index.html"), "utf8");
        return c.html(html);
      } catch {
        return c.text("Frontend not built. Run npm run build.", 500);
      }
    });
  }

  serve({ fetch: app.fetch, port });
  console.log(
    `[vocabulary] API listening on http://localhost:${port} (${isProd ? "prod" : "dev"})`,
  );

  const shutdown = async () => {
    await disconnectFromMongoDB();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

main().catch((error) => {
  console.error("[vocabulary] Failed to start:", error);
  process.exit(1);
});
