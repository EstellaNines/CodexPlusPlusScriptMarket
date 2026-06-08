import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-context-used-meter.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = 38;/, "script version should be bumped so Codex++ can reload the dual-theme script");
assert.match(script, /ccm-value-main/, "main value should be wrapped for color styling");
assert.match(script, /ccm-value-label/, "label text should have a dedicated color span");
assert.match(script, /ccm-value-percent/, "percent text should have a dedicated color span");
assert.match(script, /ccm-value-details/, "details text should have a dedicated color span");
assert.match(script, /contextColorLevel/, "usage percent should map to a color level");
assert.match(script, /data-color-level/, "root should expose the text color level for CSS");
assert.match(script, /function resolveCodexTheme\(\)/, "theme mode should be resolved from Codex and system signals");
assert.match(script, /function applyMeterTheme\(/, "meter root should receive the resolved theme");
assert.match(script, /dataset\.theme/, "meter root should expose data-theme for theme-specific CSS");
assert.match(script, /getAttribute\("data-theme"\)/, "Codex data-theme should be read before falling back");
assert.match(script, /classList\?\.contains\("light"\)/, "Codex light class should be recognized");
assert.match(script, /classList\?\.contains\("dark"\)/, "Codex dark class should be recognized");
assert.match(script, /matchMedia\?\.\("\(prefers-color-scheme: dark\)"\)/, "system dark preference should be a fallback");
assert.match(script, /#\$\{ROOT_ID\}\[data-theme="light"\]/, "light mode should have its own CSS variable set");
assert.match(script, /#\$\{ROOT_ID\},\s*#\$\{ROOT_ID\}\[data-theme="dark"\]/, "dark mode should remain an explicit CSS variable set");
assert.match(script, /--ccm-surface-bg/, "surface background should be controlled by theme variables");
assert.match(script, /--ccm-lock-bg/, "lock button background should be controlled by theme variables");
assert.match(script, /--ccm-fill-normal/, "progress fill should be controlled by theme variables");
assert.match(script, /attributeFilter:\s*\[\s*"class",\s*"data-theme"\s*\]/, "theme observer should react to Codex theme attribute changes");
