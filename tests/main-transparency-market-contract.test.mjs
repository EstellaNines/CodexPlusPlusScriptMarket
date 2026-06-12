import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const index = JSON.parse(readFileSync(resolve("index.json"), "utf8"));
const script = index.scripts.find((item) => item.id === "codex-main-transparency");

assert.ok(script, "market index should include the main transparency script");
assert.equal(script.name, "Codex Main Transparency");
assert.equal(script.version, "0.1.6");
assert.match(script.description, /transparent main interface/i);
assert.equal(script.author, "EstellaNines");
assert.deepEqual(script.tags, ["codex", "ui", "transparency", "glass"]);
assert.equal(script.homepage, "https://github.com/EstellaNines/CodexPlusPlusScriptMarket");
assert.equal(
  script.script_url,
  "https://raw.githubusercontent.com/EstellaNines/CodexPlusPlusScriptMarket/main/scripts/codex-main-transparency.js",
);
assert.match(script.sha256, /^[a-f0-9]{64}$/, "market entry should include a sha256 digest");
