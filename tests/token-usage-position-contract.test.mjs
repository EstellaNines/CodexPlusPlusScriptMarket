import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-token-usage.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = "0\.1\.8";/, "script version should be bumped for the movable badge release");
assert.match(script, /TOKEN_USAGE_POSITION_STORAGE_KEY/, "badge position should use a named persistent storage key");
assert.match(script, /__codexTokenUsageBadgePlacement/, "badge position should persist independently from usage history");
assert.match(script, /localStorage/, "badge lock state and coordinates should survive app restarts");
assert.match(script, /codex-token-usage-lock/, "badge should expose a visible lock/unlock control");
assert.match(script, /PointerEvent|pointerdown|pointermove|pointerup/, "badge should use pointer events for drag movement");
assert.match(script, /data-placement="floating"/, "badge should support a body-level floating placement");
assert.match(script, /document\.body\.appendChild\(badge\)/, "floating badges should attach to document.body");
assert.doesNotMatch(
  script,
  /body > \.\$\{BADGE_CLASS\}\s*\{\s*display: none !important;/s,
  "floating body-level badge must not be hidden by fallback CSS",
);
