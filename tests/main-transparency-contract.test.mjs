import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-main-transparency.js"), "utf8");

assert.match(script, /const SCRIPT_ID = "codex-main-transparency";/, "script should expose a stable id");
assert.match(script, /const SCRIPT_VERSION = "0\.1\.9";/, "script should expose the patched version");
assert.match(script, /const API_KEY = "__codexMainTransparency";/, "script should expose a lightweight API namespace");
assert.match(script, /const STYLE_ID = "codex-main-transparency-style";/, "script should install a named style tag");
assert.match(script, /const CONTROL_ID = "codex-main-transparency-control";/, "script should install a named opacity control");
assert.match(script, /const DEFAULT_TRANSPARENCY_PERCENT = 100;/, "opacity control should default to fully transparent main materials");
assert.match(script, /const AUDIT_EXCLUDE_SELECTOR = `#\$\{CONTROL_ID\}`;/, "audit should exclude the floating opacity control");
assert.match(script, /function installStyle\(\)/, "script should install transparent main-surface styles");
assert.match(script, /function installOpacityControl\(\)/, "script should install a dynamic opacity range control");
assert.match(script, /function applyTransparency\(/, "script should apply transparency by updating CSS variables");
assert.match(script, /function clampTransparencyPercent\(/, "script should clamp transparency values");
assert.match(script, /function materialPercentFromTransparency\(/, "script should invert transparency into material strength");
assert.match(script, /function refresh\(\)/, "script should expose refresh behavior");
assert.match(script, /function destroy\(\)/, "script should expose cleanup behavior");
assert.match(script, /function resolveCodexTheme\(\)/, "script should follow Codex theme signals");
assert.match(script, /function auditTransparency\(\)/, "script should expose a runtime transparency audit");
assert.match(script, /function describeElement\(/, "audit should summarize failing elements");
assert.match(script, /MutationObserver/, "script should observe DOM and theme changes");
assert.match(script, /dataset\.codexMainTransparency/, "document root should expose the enabled state");
assert.match(script, /dataset\.codexMainTransparencyOpacity/, "document root should expose the current opacity for compatibility");
assert.match(script, /dataset\.codexMainTransparencyPercent/, "document root should expose the current transparency");
assert.match(script, /style\.setProperty\("--cmt-main-glass-dark"/, "opacity control should update dark glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-panel-glass"/, "opacity control should update panel glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-input-glass"/, "opacity control should update input glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-hover-glass"/, "opacity control should update hover glass CSS variable");
assert.match(script, /style\.setProperty\("--cmt-shadow-glass"/, "opacity control should update glass shadow CSS variable");
assert.match(script, /style\.setProperty\("--cmt-control-bg"/, "opacity control should use an independent readable surface");
assert.match(script, /const materialPercent = materialPercentFromTransparency\(transparencyPercent\);/, "100% transparency should produce 0% material strength");
assert.doesNotMatch(script, /scaleAlpha\(glassAlpha\.[^,]+,\s*transparencyPercent\)/, "glass alpha should not use transparency percent directly");
assert.match(script, /transparencyPercent:\s*state\.transparencyPercent/, "audit should expose the user-facing transparency percent");
assert.match(script, /materialPercent:\s*materialPercentFromTransparency\(state\.transparencyPercent\)/, "audit should expose the computed material percent");
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
assert.match(
  script,
  /\[data-above-composer-portal\][\s\S]{0,1000}backdrop-filter:\s*none\s*!important/,
  "composer shell portal should clear inherited blur masks",
);
assert.match(script, /home-main-content/, "home main content container should be covered");
assert.match(script, /home-banners/, "home banner overlay should be covered");
assert.match(
  script,
  /home-banners[\s\S]{0,1000}backdrop-filter:\s*none\s*!important/,
  "home banner overlays should clear inherited blur masks",
);
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
assert.match(
  script,
  /\[role="main"\]\s+\[class\*="bg-token-side-bar-background"\]/,
  "sidebar-named token backgrounds should only be covered inside the main area",
);
assert.doesNotMatch(
  script,
  /html\[data-codex-main-transparency="true"\]\s+\[class\*="bg-token-side-bar-background"\]/,
  "sidebar-named token backgrounds should not be cleared globally",
);
assert.match(script, /box-shadow:\s*none\s*!important/, "opaque ambient shadows should be removed");
assert.doesNotMatch(
  script,
  /main article,[\s\S]{0,900}background:\s*var\(--cmt-panel-glass\)/,
  "main article and section surfaces should not regain panel glass",
);
assert.doesNotMatch(
  script,
  /main article,[\s\S]{0,900}box-shadow:\s*var\(--cmt-shadow-glass\)/,
  "main article and section surfaces should not regain glass shadows",
);
assert.doesNotMatch(
  script,
  /main article,[\s\S]{0,900}backdrop-filter:\s*blur/,
  "main article and section surfaces should not regain blur masks",
);
assert.match(script, /backdrop-filter:\s*blur/, "floating control or popovers may retain a readable glass surface");
assert.match(script, /closest\(AUDIT_EXCLUDE_SELECTOR\)/, "audit should skip the floating control");
assert.match(script, /audit:\s*auditTransparency/, "public API should expose the audit function");
assert.match(script, /rgba\(0,\s*0,\s*0,\s*0\)/, "script should remove opaque page backgrounds");
assert.match(script, /rgba\(255,\s*255,\s*255,\s*0\)/, "default light main material should be fully transparent");
assert.match(script, /rgba\(17,\s*24,\s*39,\s*0\)/, "default dark main material should be fully transparent");
assert.match(script, /refresh\(\);\s*installObservers\(\);/, "script should apply immediately and watch later DOM updates");
assert.match(script, /installOpacityControl\(\)/, "refresh should install and sync the opacity control");
assert.doesNotMatch(script, /localStorage|sessionStorage/, "transparency should not persist draggable or toggle state");
assert.doesNotMatch(script, /pointerdown|pointermove|pointerup/, "transparency should not add draggable controls");
