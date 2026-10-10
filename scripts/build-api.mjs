import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["server/vercel-entry.ts"],
  outfile: "api/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  packages: "external",
  logLevel: "info",
});

console.log("[vocabulary] Bundled API → api/index.js");
