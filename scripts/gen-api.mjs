/**
 * Regenerates src/api/schema.gen.ts from docs/openapi.json.
 *
 * Run `npm run gen:api` (or `bun run gen:api`) EVERY TIME the API spec changes:
 * replace docs/openapi.json with the new contract first, then run this. The
 * generated file is never edited by hand.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const SPEC = "docs/openapi.json";
const OUT = "src/api/schema.gen.ts";

// On Windows the tool is a .cmd shim, which execFileSync cannot launch without a shell.
execFileSync("openapi-typescript", [SPEC, "-o", OUT], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

const banner = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 *
 * Source: ${SPEC}
 * Regenerate with: npm run gen:api
 * This must be re-run whenever the API spec changes; the app's types are only as
 * correct as the spec copy in ${SPEC}.
 */
`;

const body = readFileSync(OUT, "utf8");
writeFileSync(OUT, banner + body);
console.log(`Wrote ${OUT}`);
