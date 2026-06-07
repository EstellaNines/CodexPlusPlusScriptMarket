import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-context-used-meter.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = 34;/, "script version should be bumped so Codex++ can reload the modified script");
assert.match(script, /ccm-value-main/, "main value should be wrapped for color styling");
assert.match(script, /ccm-value-label/, "label text should have a dedicated color span");
assert.match(script, /ccm-value-percent/, "percent text should have a dedicated color span");
assert.match(script, /ccm-value-details/, "details text should have a dedicated color span");
assert.match(script, /contextColorLevel/, "usage percent should map to a color level");
assert.match(script, /data-color-level/, "root should expose the text color level for CSS");
