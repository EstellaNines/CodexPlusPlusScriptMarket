import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const index = JSON.parse(readFileSync(resolve("index.json"), "utf8"));
const script = index.scripts.find((item) => item.id === "codex-main-transparency");

assert.ok(script, "market index should include the main transparency script");
assert.equal(script.name, "Codex Main Transparency");
assert.equal(script.version, "0.2.4");
assert.match(script.description, /background image/i);
assert.match(script.description, /visible|layer/i);
assert.match(script.description, /early injection|body/i);
assert.match(script.description, /blob|object URL/i);
assert.match(script.description, /32 MiB|larger local/i);
assert.match(script.description, /shortcut/i);
assert.equal(script.author, "EstellaNines");
assert.deepEqual(script.tags, ["codex", "ui", "transparency", "glass"]);
assert.equal(script.homepage, "https://github.com/EstellaNines/CodexPlusPlusScriptMarket");
assert.equal(
  script.script_url,
  "https://raw.githubusercontent.com/EstellaNines/CodexPlusPlusScriptMarket/main/scripts/codex-main-transparency.js",
);
assert.match(script.sha256, /^[a-f0-9]{64}$/, "market entry should include a sha256 digest");
