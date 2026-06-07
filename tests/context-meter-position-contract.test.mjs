import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-context-used-meter.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = 36;/, "script version should be bumped for the icon lock release");
assert.match(script, /CONTEXT_METER_POSITION_STORAGE_KEY/, "context meter position should use a named persistent storage key");
assert.match(script, /__codexContextMeterPlacement/, "context meter position should persist independently from reading state");
assert.match(script, /localStorage/, "context meter lock state and coordinates should survive app restarts");
assert.match(script, /ccm-lock/, "context meter should expose a visible lock/unlock control");
assert.match(script, /renderMeterLockIcon/, "context meter lock control should render an icon instead of text");
assert.match(script, /createMeterLockIconSvg/, "context meter lock icon should be built as inline SVG for standalone user-script use");
assert.match(script, /viewBox/, "context meter lock icon SVG should define a viewBox");
assert.match(script, /aria-hidden/, "decorative context meter lock icon should be hidden from assistive labels");
assert.match(script, /stopImmediatePropagation/, "context meter lock clicks should not bubble into Codex native handlers");
assert.match(script, /addEventListener\("click",\s*handleMeterLockClick,\s*true\)/, "context meter lock button should handle click directly in capture phase");
assert.match(script, /addEventListener\("pointerdown",\s*stopMeterLockControlEvent,\s*true\)/, "context meter lock button should own pointerdown before drag handlers");
assert.doesNotMatch(script, /lock\.textContent\s*=\s*locked\s*\?\s*"锁"\s*:\s*"移"/, "context meter lock control should not use text labels as its visual state");
assert.match(script, /pointerdown|pointermove|pointerup/, "context meter should use pointer events for drag movement");
assert.match(script, /data-placement="floating"/, "context meter should support a floating placement mode");
assert.match(script, /applyMeterPlacement/, "context meter should apply stored placement when the root is created or refreshed");
