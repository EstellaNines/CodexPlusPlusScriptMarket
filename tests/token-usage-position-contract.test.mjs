import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-token-usage.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = "0\.1\.9";/, "script version should be bumped for the icon lock release");
assert.match(script, /TOKEN_USAGE_POSITION_STORAGE_KEY/, "badge position should use a named persistent storage key");
assert.match(script, /__codexTokenUsageBadgePlacement/, "badge position should persist independently from usage history");
assert.match(script, /localStorage/, "badge lock state and coordinates should survive app restarts");
assert.match(script, /codex-token-usage-lock/, "badge should expose a visible lock/unlock control");
assert.match(script, /renderLockIcon/, "lock control should render an icon instead of text");
assert.match(script, /createLockIconSvg/, "lock icon should be built as inline SVG for standalone user-script use");
assert.match(script, /viewBox/, "lock icon SVG should define a viewBox");
assert.match(script, /aria-hidden/, "decorative lock icon should be hidden from assistive labels");
assert.match(script, /stopImmediatePropagation/, "lock clicks should not bubble into Codex native handlers");
assert.match(script, /addEventListener\("click",\s*handleLockClick,\s*true\)/, "lock button should handle click directly in capture phase");
assert.match(script, /addEventListener\("pointerdown",\s*stopLockControlEvent,\s*true\)/, "lock button should own pointerdown before drag handlers");
assert.doesNotMatch(script, /lock\.textContent\s*=\s*locked\s*\?\s*"锁"\s*:\s*"移"/, "lock control should not use text labels as its visual state");
assert.match(script, /PointerEvent|pointerdown|pointermove|pointerup/, "badge should use pointer events for drag movement");
assert.match(script, /data-placement="floating"/, "badge should support a body-level floating placement");
assert.match(script, /document\.body\.appendChild\(badge\)/, "floating badges should attach to document.body");
assert.doesNotMatch(
  script,
  /body > \.\$\{BADGE_CLASS\}\s*\{\s*display: none !important;/s,
  "floating body-level badge must not be hidden by fallback CSS",
);
