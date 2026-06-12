import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const index = JSON.parse(readFileSync(resolve("index.json"), "utf8"));

assert.equal(index.version, 1);
assert.ok(Array.isArray(index.scripts), "market index should contain scripts array");
assert.ok(index.scripts.length > 0, "market index should list at least one script");

const ids = new Set();
for (const script of index.scripts) {
  assert.equal(typeof script.id, "string", "script id should be a string");
  assert.ok(script.id.trim(), "script id should not be empty");
  assert.ok(!ids.has(script.id), `duplicate script id: ${script.id}`);
  ids.add(script.id);

  assert.equal(typeof script.script_url, "string", `${script.id} should include script_url`);
  assert.match(
    script.script_url,
    /^https:\/\/raw\.githubusercontent\.com\/EstellaNines\/CodexPlusPlusScriptMarket\/main\/scripts\/[^/]+\.js$/,
    `${script.id} should use the canonical raw GitHub script URL`,
  );

  const scriptPath = resolve("scripts", basename(script.script_url));
  assert.ok(existsSync(scriptPath), `${script.id} should point to an existing local script`);

  const bytes = readFileSync(scriptPath);
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.equal(script.sha256, digest, `${script.id} sha256 should match ${basename(scriptPath)}`);
}
