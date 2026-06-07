import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const script = readFileSync(resolve("scripts/codex-token-usage.js"), "utf8");

assert.match(script, /const SCRIPT_VERSION = "0\.1\.11";/, "script version should be bumped for the root-container display fix");
assert.match(script, /data-placement="message-actions"/, "badge should keep the fixed assistant-message placement");
assert.match(script, /function isRootConversationContainer\(node\)/, "token usage should identify Codex root surfaces");
assert.match(script, /if \(isRootConversationContainer\(node\)\) return -1;/, "root surfaces must not be scored as assistant messages");
assert.match(script, /tagName === "MAIN"[\s\S]*tagName === "BODY"[\s\S]*tagName === "HTML"/, "root surface guard should cover main, body, and html");
assert.doesNotMatch(script, /TOKEN_USAGE_POSITION_STORAGE_KEY/, "token usage should not keep a draggable position storage key");
assert.doesNotMatch(script, /__codexTokenUsageBadgePlacement/, "token usage should not persist badge coordinates");
assert.doesNotMatch(script, /codex-token-usage-lock/, "token usage should not render lock or unlock controls");
assert.doesNotMatch(script, /createLockIconSvg|renderLockIcon|handleLockClick/, "token usage should not include lock icon handlers");
assert.doesNotMatch(script, /wireBadgePositionControls/, "token usage should not wire draggable controls");
assert.doesNotMatch(script, /data-placement="floating"/, "token usage should not support floating placement");
assert.doesNotMatch(script, /document\.body\.appendChild\(badge\)/, "token usage should not attach a floating badge to body");
