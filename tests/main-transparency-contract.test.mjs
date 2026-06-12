import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-main-transparency.js"), "utf8");

assert.match(script, /const SCRIPT_ID = "codex-main-transparency";/, "script should expose a stable id");
assert.match(script, /const SCRIPT_VERSION = "0\.1\.0";/, "script should start at version 0.1.0");
assert.match(script, /const API_KEY = "__codexMainTransparency";/, "script should expose a lightweight API namespace");
assert.match(script, /const STYLE_ID = "codex-main-transparency-style";/, "script should install a named style tag");
assert.match(script, /function installStyle\(\)/, "script should install transparent main-surface styles");
assert.match(script, /function refresh\(\)/, "script should expose refresh behavior");
assert.match(script, /function destroy\(\)/, "script should expose cleanup behavior");
assert.match(script, /function resolveCodexTheme\(\)/, "script should follow Codex theme signals");
assert.match(script, /MutationObserver/, "script should observe DOM and theme changes");
assert.match(script, /dataset\.codexMainTransparency/, "document root should expose the enabled state");
assert.match(script, /html\[data-codex-main-transparency="true"\]/, "styles should be scoped behind an enabled marker");
assert.match(script, /html,\s*body,\s*#root,\s*main/, "root and main surfaces should be covered");
assert.match(script, /\[data-app-shell-main-content-layout\]/, "Codex main content layout should be covered");
assert.match(script, /backdrop-filter:\s*blur/, "main materials should use blur like a glass surface");
assert.match(script, /rgba\(0,\s*0,\s*0,\s*0\)/, "script should remove opaque page backgrounds");
assert.match(script, /rgba\(255,\s*255,\s*255,\s*0\.08\)/, "script should include translucent light material");
assert.match(script, /rgba\(17,\s*24,\s*39,\s*0\.36\)/, "script should include translucent dark material");
assert.match(script, /refresh\(\);\s*installObservers\(\);/, "script should apply immediately and watch later DOM updates");
assert.doesNotMatch(script, /localStorage|sessionStorage/, "transparency should not persist draggable or toggle state");
assert.doesNotMatch(script, /pointerdown|pointermove|pointerup/, "transparency should not add draggable controls");
