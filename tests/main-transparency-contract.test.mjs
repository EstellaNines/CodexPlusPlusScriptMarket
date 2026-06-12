import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-main-transparency.js"), "utf8");

assert.match(script, /const SCRIPT_ID = "codex-main-transparency";/, "script should expose a stable id");
assert.match(script, /const SCRIPT_VERSION = "0\.1\.7";/, "script should expose the patched version");
assert.match(script, /const API_KEY = "__codexMainTransparency";/, "script should expose a lightweight API namespace");
assert.match(script, /const STYLE_ID = "codex-main-transparency-style";/, "script should install a named style tag");
assert.match(script, /const CONTROL_ID = "codex-main-transparency-control";/, "script should install a named opacity control");
assert.match(script, /const DEFAULT_OPACITY_PERCENT = 100;/, "opacity control should default to full current material strength");
assert.match(script, /function installStyle\(\)/, "script should install transparent main-surface styles");
assert.match(script, /function installOpacityControl\(\)/, "script should install a dynamic opacity range control");
assert.match(script, /function applyGlassOpacity\(/, "script should apply opacity by updating CSS variables");
assert.match(script, /function clampOpacityPercent\(/, "script should clamp opacity values");
assert.match(script, /function refresh\(\)/, "script should expose refresh behavior");
assert.match(script, /function destroy\(\)/, "script should expose cleanup behavior");
assert.match(script, /function resolveCodexTheme\(\)/, "script should follow Codex theme signals");
assert.match(script, /MutationObserver/, "script should observe DOM and theme changes");
assert.match(script, /dataset\.codexMainTransparency/, "document root should expose the enabled state");
assert.match(script, /dataset\.codexMainTransparencyOpacity/, "document root should expose the current opacity");
assert.match(script, /style\.setProperty\("--cmt-main-glass-dark"/, "opacity control should update dark glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-panel-glass"/, "opacity control should update panel glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-input-glass"/, "opacity control should update input glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-hover-glass"/, "opacity control should update hover glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-shadow-glass"/, "opacity control should update glass shadow CSS variable");
assert.match(script, /type = "range"/, "opacity control should use a range input");
assert.match(script, /min = "0"/, "opacity range should start at zero");
assert.match(script, /max = "100"/, "opacity range should end at one hundred");
assert.match(script, /addEventListener\("input"/, "opacity range should update live while dragged");
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
assert.match(script, /thread-content-max-width/, "thread-width wrapper masks should be covered");
assert.match(script, /multilineSurface/, "composer multiline surface should be covered after glass rules");
assert.match(script, /main-surface/, "main surface shell should be covered");
assert.match(script, /app-header-tint/, "header tint shell should be covered");
assert.match(script, /data-codex-composer/, "editable composer body should be covered after glass rules");
assert.match(script, /after:bg-token-foreground/, "title pseudo-element backgrounds should be covered");
assert.match(script, /\[role="main"\]\s+\[class\*="bg-token-"\]/, "main token background utilities should be cleared");
assert.match(script, /\[role="main"\]\s+\[class\*="shadow-"\]/, "main shadow utilities should be cleared");
assert.match(script, /color-background-panel/, "settings panel inline backgrounds should be covered");
assert.match(script, /color-token-bg-fog/, "settings fog panel backgrounds should be covered");
assert.match(script, /bg-token-bg-fog/, "fog token backgrounds should be covered");
assert.match(script, /bg-token-list-hover-background/, "selected settings tiles should be covered");
assert.match(script, /bg-token-foreground\\\\\/5/, "settings pill button backgrounds should be covered");
assert.match(script, /backdrop-filter:\s*none\s*!important/, "late mask cleanup should remove backdrop filters");
assert.match(script, /electron\\\\:bg-token-main-surface-primary/, "electron main surface utility should be covered");
assert.match(script, /bg-token-side-bar-background/, "composer footer token background should be covered");
assert.match(script, /box-shadow:\s*none\s*!important/, "opaque ambient shadows should be removed");
assert.match(script, /backdrop-filter:\s*blur/, "main materials should use blur like a glass surface");
assert.match(script, /rgba\(0,\s*0,\s*0,\s*0\)/, "script should remove opaque page backgrounds");
assert.match(script, /rgba\(255,\s*255,\s*255,\s*0\.08\)/, "script should include translucent light material");
assert.match(script, /rgba\(17,\s*24,\s*39,\s*0\.36\)/, "script should include translucent dark material");
assert.match(script, /refresh\(\);\s*installObservers\(\);/, "script should apply immediately and watch later DOM updates");
assert.match(script, /installOpacityControl\(\)/, "refresh should install and sync the opacity control");
assert.doesNotMatch(script, /localStorage|sessionStorage/, "transparency should not persist draggable or toggle state");
assert.doesNotMatch(script, /pointerdown|pointermove|pointerup/, "transparency should not add draggable controls");
