import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-context-used-meter.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = 35;/, "script version should be bumped for the movable context meter release");
assert.match(script, /CONTEXT_METER_POSITION_STORAGE_KEY/, "context meter position should use a named persistent storage key");
assert.match(script, /__codexContextMeterPlacement/, "context meter position should persist independently from reading state");
assert.match(script, /localStorage/, "context meter lock state and coordinates should survive app restarts");
assert.match(script, /ccm-lock/, "context meter should expose a visible lock/unlock control");
assert.match(script, /pointerdown|pointermove|pointerup/, "context meter should use pointer events for drag movement");
assert.match(script, /data-placement="floating"/, "context meter should support a floating placement mode");
assert.match(script, /applyMeterPlacement/, "context meter should apply stored placement when the root is created or refreshed");
