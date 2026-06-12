import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-main-transparency.js"), "utf8");

assert.match(script, /const SCRIPT_ID = "codex-main-transparency";/, "script should expose a stable id");
assert.match(script, /const SCRIPT_VERSION = "0\.1\.3";/, "script should expose the patched version");
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
assert.match(
  script,
  /\[data-app-shell-main-content-top-fade\]/,
  "Codex main content top fade should be covered",
);
assert.match(script, /\[data-home-ambient-suggestions\]/, "home ambient suggestion surfaces should be covered");
assert.match(script, /\[data-above-composer-portal\]/, "composer shell portal should be covered");
assert.match(script, /home-main-content/, "home main content container should be covered");
assert.match(script, /home-banners/, "home banner overlay should be covered");
assert.match(script, /bg-token-input-background/, "composer input token background should be covered");
assert.match(script, /\[role="main"\]\s+\[class\*="bg-token-"\]/, "main token background utilities should be cleared");
assert.match(script, /\[role="main"\]\s+\[class\*="shadow-"\]/, "main shadow utilities should be cleared");
assert.match(script, /electron\\\\:bg-token-main-surface-primary/, "electron main surface utility should be covered");
assert.match(script, /bg-token-side-bar-background/, "composer footer token background should be covered");
assert.match(script, /box-shadow:\s*none\s*!important/, "opaque ambient shadows should be removed");
assert.match(script, /backdrop-filter:\s*blur/, "main materials should use blur like a glass surface");
assert.match(script, /rgba\(0,\s*0,\s*0,\s*0\)/, "script should remove opaque page backgrounds");
assert.match(script, /rgba\(255,\s*255,\s*255,\s*0\.08\)/, "script should include translucent light material");
assert.match(script, /rgba\(17,\s*24,\s*39,\s*0\.36\)/, "script should include translucent dark material");
assert.match(script, /refresh\(\);\s*installObservers\(\);/, "script should apply immediately and watch later DOM updates");
assert.doesNotMatch(script, /localStorage|sessionStorage/, "transparency should not persist draggable or toggle state");
assert.doesNotMatch(script, /pointerdown|pointermove|pointerup/, "transparency should not add draggable controls");
