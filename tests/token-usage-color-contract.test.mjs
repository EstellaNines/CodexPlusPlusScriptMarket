import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-token-usage.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = "0\.1\.12";/, "script version should be bumped so Codex++ can reload the badge content fix");
assert.match(script, /codex-token-usage-part/, "badge text should render colored parts");
assert.match(script, /renderBadgeParts/, "badge should render structured spans instead of one plain text node");
assert.match(script, /content\.replaceChildren\(\.\.\.nodes\);/, "rendered text nodes must be attached to the badge content wrapper");
assert.match(script, /data-kind="total"/, "total text should have a color kind");
assert.match(script, /data-kind="input"/, "input text should have a color kind");
assert.match(script, /data-kind="output"/, "output text should have a color kind");
assert.match(script, /data-kind="cache"/, "cache text should have a color kind");
assert.match(script, /data-kind="context"/, "context text should have a color kind");
