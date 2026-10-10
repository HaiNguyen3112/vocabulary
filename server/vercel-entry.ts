import { handle } from "@hono/node-server/vercel";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "./app";

export const config = {
  runtime: "nodejs",
  maxDuration: 30,
};

const nodeHandle = handle(createApp());

// vercel.json rewrites /api/<path> → /api?__path=<path>; restore the original path for Hono.
function restoreIncomingPath(incoming: IncomingMessage): void {
  const url = new URL(incoming.url ?? "/api", "http://localhost");
  const originalPath = url.searchParams.get("__path");
  if (originalPath == null) return;
  url.searchParams.delete("__path");
  url.pathname = originalPath.length > 0 ? `/api/${originalPath}` : "/api";
  incoming.url = `${url.pathname}${url.search}`;
}

export default function handler(
  req: IncomingMessage,
  res: ServerResponse,
): void | Promise<void> {
  restoreIncomingPath(req);
  return nodeHandle(req, res);
}
