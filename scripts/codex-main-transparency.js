(() => {
  "use strict";

  const SCRIPT_ID = "codex-main-transparency";
  const SCRIPT_VERSION = "0.2.3";
  const INSTALL_KEY = "__codexMainTransparencyInstalled";
  const API_KEY = "__codexMainTransparency";
  const STYLE_ID = "codex-main-transparency-style";
  const CONTROL_ID = "codex-main-transparency-control";
  const BACKGROUND_LAYER_ID = "codex-main-background-layer";
  const AUDIT_EXCLUDE_SELECTOR = `#${CONTROL_ID}`;
  const BACKGROUND_AUDIT_EXCLUDE_SELECTOR = `#${BACKGROUND_LAYER_ID}`;
  const TOP_FADE_SELECTOR = "[data-app-shell-main-content-top-fade]";
  const SETTINGS_STORAGE_KEY = "codex-main-transparency-settings-v1";
  const BACKGROUND_IMAGE_DB_NAME = "codex-main-transparency";
  const BACKGROUND_IMAGE_STORE_NAME = "background-images";
  const BACKGROUND_IMAGE_STORAGE_KEY = "codex-main-transparency-background-image";
  const STORED_BACKGROUND_IMAGE_TOKEN = `indexeddb:${BACKGROUND_IMAGE_STORAGE_KEY}`;
  const DEFAULT_TRANSPARENCY_PERCENT = 100;
  const DEFAULT_BACKGROUND_OPACITY_PERCENT = 72;
  const DEFAULT_BACKGROUND_FIT = "cover";
  const DEFAULT_BACKGROUND_BLUR_PX = 0;
  const DEFAULT_SHORTCUT = "Alt+B";
  const MAX_BACKGROUND_IMAGE_BYTES = 32 * 1024 * 1024;
  const AUDIT_MAX_ISSUES = 40;
  const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
  const DEFAULT_SETTINGS = {
    transparencyPercent: DEFAULT_TRANSPARENCY_PERCENT,
    backgroundEnabled: false,
    backgroundImage: "",
    backgroundImageStored: false,
    backgroundOpacityPercent: DEFAULT_BACKGROUND_OPACITY_PERCENT,
    backgroundFit: DEFAULT_BACKGROUND_FIT,
    backgroundBlurPx: DEFAULT_BACKGROUND_BLUR_PX,
    shortcut: DEFAULT_SHORTCUT,
  };

  const glassChannels = {
    mainDark: "17, 24, 39",
    mainLight: "255, 255, 255",
    panelDark: "17, 24, 39",
    panelLight: "255, 255, 255",
    inputDark: "15, 23, 42",
    inputLight: "255, 255, 255",
    hoverDark: "255, 255, 255",
    hoverLight: "15, 23, 42",
    shadowDark: "0, 0, 0",
    shadowLight: "15, 23, 42",
    controlDark: "15, 23, 42",
    controlLight: "255, 255, 255",
  };

  const glassAlpha = {
    mainDark: 0.36,
    mainLight: 0.08,
    panelDark: 0.28,
    panelLight: 0.18,
    inputDark: 0.42,
    inputLight: 0.34,
    hoverDark: 0.07,
    hoverLight: 0.05,
    shadowDark: 0.18,
    shadowLight: 0.12,
    controlDark: 0.72,
    controlLight: 0.82,
  };

  if (window[INSTALL_KEY]) {
    const api = window[API_KEY];
    if (api && api.version === SCRIPT_VERSION) {
      api.refresh?.();
      return;
    }
    api?.destroy?.();
  }

  const state = {
    observer: null,
    themeObserver: null,
    themeMediaQuery: null,
    themeMediaListener: null,
    refreshTimer: 0,
    shortcutListenerInstalled: false,
    panelOpen: false,
    recordingShortcut: false,
    backgroundImageRestoreStarted: false,
    statusMessage: "",
    ...loadStoredSettings(),
  };

  function loadStoredSettings() {
    try {
      const raw = window.localStorage?.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return normalizeSettings(JSON.parse(raw));
    } catch (error) {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function normalizeSettings(raw) {
    const settings = raw && typeof raw === "object" ? raw : {};
    const backgroundImage = normalizeBackgroundImage(settings.backgroundImage);
    return {
      transparencyPercent: clampTransparencyPercent(settings.transparencyPercent),
      backgroundEnabled: Boolean(settings.backgroundEnabled),
      backgroundImage,
      backgroundImageStored: isStoredBackgroundImageToken(backgroundImage) || Boolean(settings.backgroundImageStored),
      backgroundOpacityPercent: clampBackgroundOpacityPercent(settings.backgroundOpacityPercent),
      backgroundFit: normalizeBackgroundFit(settings.backgroundFit),
      backgroundBlurPx: clampBackgroundBlurPx(settings.backgroundBlurPx),
      shortcut: isValidShortcut(settings.shortcut) ? settings.shortcut : DEFAULT_SHORTCUT,
    };
  }

  function saveSettings() {
    try {
      window.localStorage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
        transparencyPercent: state.transparencyPercent,
        backgroundEnabled: state.backgroundEnabled,
        backgroundImage: persistedBackgroundImage(),
        backgroundImageStored: Boolean(state.backgroundImageStored),
        backgroundOpacityPercent: state.backgroundOpacityPercent,
        backgroundFit: state.backgroundFit,
        backgroundBlurPx: state.backgroundBlurPx,
        shortcut: state.shortcut,
      }));
    } catch (error) {
      showStatus("设置未能保存");
    }
  }

  function persistedBackgroundImage() {
    return state.backgroundImageStored ? STORED_BACKGROUND_IMAGE_TOKEN : normalizeBackgroundImage(state.backgroundImage);
  }

  function clampTransparencyPercent(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_TRANSPARENCY_PERCENT;
    return Math.min(100, Math.max(0, number));
  }

  function clampBackgroundOpacityPercent(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_BACKGROUND_OPACITY_PERCENT;
    return Math.min(100, Math.max(0, number));
  }

  function clampBackgroundBlurPx(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_BACKGROUND_BLUR_PX;
    return Math.min(24, Math.max(0, number));
  }

  function normalizeBackgroundFit(value) {
    const fit = String(value || "").trim().toLowerCase();
    return ["cover", "contain", "fill"].includes(fit) ? fit : DEFAULT_BACKGROUND_FIT;
  }

  function cssBackgroundFit(value) {
    return normalizeBackgroundFit(value) === "fill" ? "100% 100%" : normalizeBackgroundFit(value);
  }

  function normalizeBackgroundImage(value) {
    const image = String(value || "").trim();
    if (!image) return "";
    if (isStoredBackgroundImageToken(image)) return image;
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(image)) return image;
    if (!/^https?:\/\//i.test(image)) return "";
    try {
      const url = new URL(image);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (error) {
      return "";
    }
  }

  function isStoredBackgroundImageToken(value) {
    return String(value || "").trim() === STORED_BACKGROUND_IMAGE_TOKEN;
  }

  function escapeCssString(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n|\r|\f/g, "");
  }

  function cssImageUrl(value) {
    const image = normalizeBackgroundImage(value);
    return image ? `url("${escapeCssString(image)}")` : "none";
  }

  function readLocalBackgroundFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
        reject(new Error("仅支持 png/jpeg/webp/gif"));
        return;
      }
      if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
        reject(new Error("图片需小于 32 MiB"));
        return;
      }
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")));
      reader.addEventListener("error", () => reject(new Error("图片读取失败")));
      reader.readAsDataURL(file);
    });
  }

  function openBackgroundImageStore() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("当前环境不支持 IndexedDB"));
        return;
      }
      const request = window.indexedDB.open(BACKGROUND_IMAGE_DB_NAME, 1);
      request.addEventListener("upgradeneeded", () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BACKGROUND_IMAGE_STORE_NAME)) {
          db.createObjectStore(BACKGROUND_IMAGE_STORE_NAME);
        }
      });
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error || new Error("背景图片存储打开失败")));
    });
  }

  function saveBackgroundImageToStore(image) {
    return new Promise((resolve, reject) => {
      openBackgroundImageStore().then((db) => {
        const transaction = db.transaction(BACKGROUND_IMAGE_STORE_NAME, "readwrite");
        transaction.objectStore(BACKGROUND_IMAGE_STORE_NAME).put(image, BACKGROUND_IMAGE_STORAGE_KEY);
        transaction.addEventListener("complete", () => {
          db.close();
          resolve();
        });
        transaction.addEventListener("error", () => {
          db.close();
          reject(transaction.error || new Error("背景图片保存失败"));
        });
      }, reject);
    });
  }

  function loadBackgroundImageFromStore() {
    return new Promise((resolve, reject) => {
      openBackgroundImageStore().then((db) => {
        const transaction = db.transaction(BACKGROUND_IMAGE_STORE_NAME, "readonly");
        const request = transaction.objectStore(BACKGROUND_IMAGE_STORE_NAME).get(BACKGROUND_IMAGE_STORAGE_KEY);
        request.addEventListener("success", () => {
          db.close();
          resolve(normalizeBackgroundImage(request.result));
        });
        request.addEventListener("error", () => {
          db.close();
          reject(request.error || new Error("背景图片读取失败"));
        });
      }, reject);
    });
  }

  function clearBackgroundImageStore() {
    return new Promise((resolve, reject) => {
      openBackgroundImageStore().then((db) => {
        const transaction = db.transaction(BACKGROUND_IMAGE_STORE_NAME, "readwrite");
        transaction.objectStore(BACKGROUND_IMAGE_STORE_NAME).delete(BACKGROUND_IMAGE_STORAGE_KEY);
        transaction.addEventListener("complete", () => {
          db.close();
          resolve();
        });
        transaction.addEventListener("error", () => {
          db.close();
          reject(transaction.error || new Error("背景图片清除失败"));
        });
      }, reject);
    });
  }

  function restoreStoredBackgroundImage() {
    if (state.backgroundImageRestoreStarted || !state.backgroundImageStored) return;
    state.backgroundImageRestoreStarted = true;
    loadBackgroundImageFromStore().then((image) => {
      if (!image) {
        state.backgroundImage = "";
        state.backgroundImageStored = false;
        state.backgroundEnabled = false;
        saveSettings();
        showStatus("本地背景已失效");
      } else {
        state.backgroundImage = image;
        state.backgroundImageStored = true;
      }
      applyBackground();
      syncControlPanel();
    }, (error) => {
      state.backgroundImage = "";
      state.backgroundImageStored = false;
      state.backgroundEnabled = false;
      saveSettings();
      showStatus(String(error && error.message || error));
      applyBackground();
      syncControlPanel();
    });
  }

  function materialPercentFromTransparency(transparencyPercent) {
    return 100 - clampTransparencyPercent(transparencyPercent);
  }

  function scaleAlpha(alpha, materialPercent) {
    return Number((alpha * materialPercent / 100).toFixed(3));
  }

  function rgba(channel, alpha) {
    return `rgba(${channel}, ${alpha})`;
  }

  function normalizeShortcutKey(key) {
    const value = String(key || "");
    if (!value || ["Control", "Alt", "Shift", "Meta"].includes(value)) return "";
    if (value === " ") return "Space";
    if (value === "Esc") return "Escape";
    if (value === "Escape" || value === "Space") return value;
    const functionKey = value.match(/^F([1-9]|1[0-2])$/i);
    if (functionKey) return `F${functionKey[1]}`;
    if (/^[a-z]$/i.test(value)) return value.toUpperCase();
    if (/^[0-9]$/.test(value)) return value;
    return "";
  }

  function shortcutFromEvent(event) {
    const parts = [];
    if (event.ctrlKey) parts.push("Ctrl");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    if (event.metaKey) parts.push("Meta");
    const key = normalizeShortcutKey(event.key);
    if (!key) return "";
    parts.push(key);
    return parts.join("+");
  }

  function isValidShortcut(value) {
    const parts = String(value || "").split("+").filter(Boolean);
    if (parts.length < 2 || parts.length > 3) return false;
    const key = parts[parts.length - 1];
    const modifiers = parts.slice(0, -1);
    const seen = new Set();
    return modifiers.length >= 1
      && modifiers.every((part) => ["Ctrl", "Alt", "Shift", "Meta"].includes(part) && !seen.has(part) && seen.add(part))
      && (/^[A-Z0-9]$/.test(key) || /^F([1-9]|1[0-2])$/.test(key) || key === "Escape" || key === "Space");
  }

  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    if (target.closest("[contenteditable='true']")) return true;
    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
  }

  function handleGlobalShortcut(event) {
    if (state.recordingShortcut || isEditableTarget(event.target)) return;
    if (shortcutFromEvent(event) !== state.shortcut) return;
    event.preventDefault();
    state.backgroundEnabled = !state.backgroundEnabled;
    showStatus(state.backgroundEnabled ? "背景已开启" : "背景已关闭");
    applyBackground();
    saveSettings();
    syncControlPanel();
  }

  function installShortcutListener() {
    if (state.shortcutListenerInstalled) return;
    document.addEventListener("keydown", handleGlobalShortcut, true);
    state.shortcutListenerInstalled = true;
  }

  function startShortcutRecording() {
    if (state.recordingShortcut) return;
    state.recordingShortcut = true;
    showStatus("按下 2 或 3 键组合");
    syncControlPanel();
    document.addEventListener("keydown", recordShortcut, true);
  }

  function recordShortcut(event) {
    event.preventDefault();
    event.stopPropagation();
    const shortcut = shortcutFromEvent(event);
    if (!isValidShortcut(shortcut)) {
      showStatus("快捷键需为 2 或 3 键");
      return;
    }
    state.shortcut = shortcut;
    state.recordingShortcut = false;
    document.removeEventListener("keydown", recordShortcut, true);
    showStatus(`快捷键 ${shortcut}`);
    saveSettings();
    syncControlPanel();
  }

  function applyTransparency(value) {
    const root = document.documentElement;
    if (!root) return DEFAULT_TRANSPARENCY_PERCENT;
    const transparencyPercent = clampTransparencyPercent(value);
    const materialPercent = materialPercentFromTransparency(transparencyPercent);
    state.transparencyPercent = transparencyPercent;
    const style = root.style;
    const theme = resolveCodexTheme();
    const themed = theme === "light" ? "Light" : "Dark";
    style.setProperty("--cmt-main-glass-dark", rgba(glassChannels.mainDark, scaleAlpha(glassAlpha.mainDark, materialPercent)));
    style.setProperty("--cmt-main-glass-light", rgba(glassChannels.mainLight, scaleAlpha(glassAlpha.mainLight, materialPercent)));
    style.setProperty("--cmt-panel-glass", rgba(glassChannels[`panel${themed}`], scaleAlpha(glassAlpha[`panel${themed}`], materialPercent)));
    style.setProperty("--cmt-input-glass", rgba(glassChannels[`input${themed}`], scaleAlpha(glassAlpha[`input${themed}`], materialPercent)));
    style.setProperty("--cmt-hover-glass", rgba(glassChannels[`hover${themed}`], scaleAlpha(glassAlpha[`hover${themed}`], materialPercent)));
    const shadowAlpha = scaleAlpha(glassAlpha[`shadow${themed}`], materialPercent);
    style.setProperty("--cmt-shadow-glass", shadowAlpha > 0 ? `0 18px 54px ${rgba(glassChannels[`shadow${themed}`], shadowAlpha)}` : "none");
    style.setProperty("--cmt-control-bg", rgba(glassChannels[`control${themed}`], glassAlpha[`control${themed}`]));
    style.setProperty("--cmt-control-shadow", theme === "light" ? "0 8px 28px rgba(15, 23, 42, 0.12)" : "0 8px 28px rgba(0, 0, 0, 0.24)");
    root.dataset.codexMainTransparencyOpacity = String(transparencyPercent);
    root.dataset.codexMainTransparencyPercent = String(transparencyPercent);
    const control = document.getElementById(CONTROL_ID);
    const output = control?.querySelector?.("[data-codex-main-transparency-percent-value], [data-codex-main-transparency-opacity-value]");
    const range = control?.querySelector?.("input[type='range']");
    if (output) output.textContent = `${transparencyPercent}%`;
    if (range && range.value !== String(transparencyPercent)) range.value = String(transparencyPercent);
    return transparencyPercent;
  }

  function applyBackground() {
    const root = document.documentElement;
    if (!root) return;
    const image = normalizeBackgroundImage(state.backgroundImage);
    state.backgroundImage = image;
    state.backgroundOpacityPercent = clampBackgroundOpacityPercent(state.backgroundOpacityPercent);
    state.backgroundFit = normalizeBackgroundFit(state.backgroundFit);
    state.backgroundBlurPx = clampBackgroundBlurPx(state.backgroundBlurPx);
    const enabled = Boolean(state.backgroundEnabled && image && !isStoredBackgroundImageToken(image));
    const style = root.style;
    style.setProperty("--cmt-background-image", enabled ? cssImageUrl(image) : "none");
    style.setProperty("--cmt-background-opacity", enabled ? String(state.backgroundOpacityPercent / 100) : "0");
    style.setProperty("--cmt-background-fit", cssBackgroundFit(state.backgroundFit));
    style.setProperty("--cmt-background-blur", `${state.backgroundBlurPx}px`);
    root.dataset.codexMainBackgroundEnabled = String(enabled);
    root.dataset.codexMainBackgroundShortcut = state.shortcut;
    const layer = document.getElementById(BACKGROUND_LAYER_ID);
    if (layer) {
      layer.dataset.enabled = String(enabled);
      layer.hidden = !enabled;
    }
    syncControlPanel();
  }

  function resolveCodexTheme() {
    const root = document.documentElement;
    const theme = String(root?.getAttribute("data-theme") || "").trim().toLowerCase();
    if (theme.startsWith("light")) return "light";
    if (theme.startsWith("dark")) return "dark";
    if (root?.classList?.contains("light")) return "light";
    if (root?.classList?.contains("dark")) return "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  }

  function installStyle() {
    const existing = document.getElementById(STYLE_ID);
    if (existing?.dataset.version === SCRIPT_VERSION) return;
    existing?.remove();

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.scriptId = SCRIPT_ID;
    style.dataset.version = SCRIPT_VERSION;
    style.textContent = `
      /* root coverage: html, body, #root, main */
      html[data-codex-main-transparency="true"] {
        --cmt-page-clear: rgba(0, 0, 0, 0);
        --cmt-main-glass-dark: rgba(17, 24, 39, 0);
        --cmt-main-glass-light: rgba(255, 255, 255, 0);
        --cmt-main-glass: var(--cmt-main-glass-dark);
        --cmt-panel-glass: rgba(17, 24, 39, 0);
        --cmt-border-glass: rgba(255, 255, 255, 0.12);
        --cmt-input-glass: rgba(15, 23, 42, 0);
        --cmt-hover-glass: rgba(255, 255, 255, 0);
        --cmt-shadow-glass: none;
        --cmt-control-bg: rgba(15, 23, 42, 0.72);
        --cmt-control-shadow: 0 8px 28px rgba(0, 0, 0, 0.24);
        --cmt-background-image: none;
        --cmt-background-opacity: 0;
        --cmt-background-fit: cover;
        --cmt-background-blur: 0px;
        background: var(--cmt-page-clear) !important;
      }

      html[data-codex-main-transparency="true"][data-codex-main-transparency-theme="light"] {
        --cmt-main-glass: var(--cmt-main-glass-light);
        --cmt-panel-glass: rgba(255, 255, 255, 0);
        --cmt-border-glass: rgba(15, 23, 42, 0.1);
        --cmt-input-glass: rgba(255, 255, 255, 0);
        --cmt-hover-glass: rgba(15, 23, 42, 0);
        --cmt-control-bg: rgba(255, 255, 255, 0.82);
        --cmt-control-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
      }

      html[data-codex-main-transparency="true"] body,
      html[data-codex-main-transparency="true"] #root {
        background: var(--cmt-page-clear) !important;
      }

      html[data-codex-main-transparency="true"] html,
      html[data-codex-main-transparency="true"] body,
      html[data-codex-main-transparency="true"] #root,
      html[data-codex-main-transparency="true"] main {
        background-color: var(--cmt-page-clear) !important;
      }

      html[data-codex-main-transparency="true"] main,
      html[data-codex-main-transparency="true"] [role="main"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] {
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] main > *,
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout],
      html[data-codex-main-transparency="true"] [class*="home-main-content"],
      html[data-codex-main-transparency="true"] [class*="home-banners"],
      html[data-codex-main-transparency="true"] [class*="h-\\[39\\%\\]"],
      html[data-codex-main-transparency="true"] [class*="thread"],
      html[data-codex-main-transparency="true"] [class*="transcript"],
      html[data-codex-main-transparency="true"] [data-testid*="conversation" i],
      html[data-codex-main-transparency="true"] [data-testid*="thread" i] {
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] main [class*="bg-token-"],
      html[data-codex-main-transparency="true"] [role="main"] [class*="bg-token-"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] [class*="bg-token-"],
      html[data-codex-main-transparency="true"] main [class*="shadow-"],
      html[data-codex-main-transparency="true"] [role="main"] [class*="shadow-"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] [class*="shadow-"] {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
      }

      html[data-codex-main-transparency="true"] [data-above-composer-portal],
      html[data-codex-main-transparency="true"] [data-above-composer-queue-portal],
      html[data-codex-main-transparency="true"] [data-above-composer-portal] ~ *,
      html[data-codex-main-transparency="true"] [class*="bg-token-input-background"],
      html[data-codex-main-transparency="true"] [class*="electron\\:bg-token-main-surface-primary"],
      html[data-codex-main-transparency="true"] main [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [role="main"] [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions] > *,
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions] button {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] [style*="color-background-panel"],
      html[data-codex-main-transparency="true"] [style*="color-token-bg-fog"],
      html[data-codex-main-transparency="true"] [class*="bg-token-list-hover-background"],
      html[data-codex-main-transparency="true"] [class*="bg-token-main-surface-primary"],
      html[data-codex-main-transparency="true"] [class*="bg-token-foreground\\/5"],
      html[data-codex-main-transparency="true"] [class*="bg-token-foreground\\/10"] {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
      }

      html[data-codex-main-transparency="true"] main article,
      html[data-codex-main-transparency="true"] main section,
      html[data-codex-main-transparency="true"] main [class*="surface"],
      html[data-codex-main-transparency="true"] main [class*="panel"],
      html[data-codex-main-transparency="true"] main [class*="card"],
      html[data-codex-main-transparency="true"] main [class*="composer"],
      html[data-codex-main-transparency="true"] main [class*="input"],
      html[data-codex-main-transparency="true"] main form,
      html[data-codex-main-transparency="true"] main textarea,
      html[data-codex-main-transparency="true"] main [contenteditable="true"] {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] main textarea,
      html[data-codex-main-transparency="true"] main [contenteditable="true"],
      html[data-codex-main-transparency="true"] main form:has(textarea) {
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] [class*="thread-content-max-width"],
      html[data-codex-main-transparency="true"] main[class*="main-surface"],
      html[data-codex-main-transparency="true"] [class*="main-surface"],
      html[data-codex-main-transparency="true"] [class*="app-header-tint"],
      html[data-codex-main-transparency="true"] [class*="app-shell-main-content-viewport"],
      html[data-codex-main-transparency="true"] [class*="app-shell-main-content-frame"],
      html[data-codex-main-transparency="true"] [class*="h-\\[39\\%\\]"],
      html[data-codex-main-transparency="true"] [class*="multilineSurface"],
      html[data-codex-main-transparency="true"] [class*="bg-token-input-background"],
      html[data-codex-main-transparency="true"] [class*="bg-token-main-surface-primary"],
      html[data-codex-main-transparency="true"] [class*="bg-token-bg-fog"],
      html[data-codex-main-transparency="true"] [class*="bg-token-dropdown-background"],
      html[data-codex-main-transparency="true"] [class*="electron\\:bg-token-main-surface-primary"],
      html[data-codex-main-transparency="true"] main [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [role="main"] [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] main [contenteditable="true"],
      html[data-codex-main-transparency="true"] main [data-codex-composer],
      html[data-codex-main-transparency="true"] main .ProseMirror,
      html[data-codex-main-transparency="true"] main [class*="backdrop-blur"],
      html[data-codex-main-transparency="true"] [role="main"] [class*="backdrop-blur"],
      html[data-codex-main-transparency="true"] [data-app-shell-main-content-layout] [class*="backdrop-blur"],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions] *,
      html[data-codex-main-transparency="true"] [style*="color-background-panel"],
      html[data-codex-main-transparency="true"] [style*="color-token-bg-fog"] {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] main [class*="after:bg-token-foreground"]::after,
      html[data-codex-main-transparency="true"] main [class*="hover:after:bg-token-foreground"]::after,
      html[data-codex-main-transparency="true"] main [class*="group-hover/title:after:bg-token-foreground"]::after,
      html[data-codex-main-transparency="true"] main [class*="data-[state=open]:after:bg-token-foreground"]::after {
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
      }

      html[data-codex-main-transparency="true"] main button:hover,
      html[data-codex-main-transparency="true"] main [role="button"]:hover,
      html[data-codex-main-transparency="true"] main [data-highlighted],
      html[data-codex-main-transparency="true"] main [aria-selected="true"] {
        background-color: var(--cmt-hover-glass) !important;
      }

      html[data-codex-main-transparency="true"] [role="dialog"],
      html[data-codex-main-transparency="true"] [data-radix-popper-content-wrapper],
      html[data-codex-main-transparency="true"] [data-side],
      html[data-codex-main-transparency="true"] [class*="popover"],
      html[data-codex-main-transparency="true"] [class*="menu"] {
        border-color: var(--cmt-border-glass) !important;
        background: var(--cmt-page-clear) !important;
        background-color: var(--cmt-page-clear) !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      html[data-codex-main-transparency="true"] main ::-webkit-scrollbar-track {
        background: var(--cmt-page-clear) !important;
      }

      #codex-main-background-layer {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: var(--cmt-background-image);
        background-size: var(--cmt-background-fit);
        background-position: center;
        background-repeat: no-repeat;
        opacity: var(--cmt-background-opacity);
        filter: blur(var(--cmt-background-blur));
        transform: scale(1.02);
        transition: opacity 160ms ease, filter 160ms ease;
      }

      html[data-codex-main-transparency="true"] body > :not(#codex-main-background-layer):not(#codex-main-transparency-control) {
        position: relative;
        z-index: 1;
      }

      #codex-main-transparency-control {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 60;
        display: grid;
        gap: 8px;
        width: min(320px, calc(100vw - 24px));
        padding: 8px;
        border: 1px solid var(--cmt-border-glass);
        border-radius: 8px;
        background: var(--cmt-control-bg) !important;
        color: var(--text-primary, currentColor);
        box-shadow: var(--cmt-control-shadow);
        opacity: 0.82;
        backdrop-filter: blur(10px) saturate(1.08);
        -webkit-backdrop-filter: blur(10px) saturate(1.08);
        font: 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #codex-main-transparency-control:hover,
      #codex-main-transparency-control:focus-within {
        opacity: 1;
      }

      #codex-main-transparency-control button,
      #codex-main-transparency-control input,
      #codex-main-transparency-control select {
        font: inherit;
      }

      #codex-main-transparency-control button {
        border: 1px solid var(--cmt-border-glass);
        border-radius: 7px;
        background: var(--cmt-hover-glass);
        color: inherit;
        cursor: pointer;
      }

      #codex-main-transparency-control input[type="text"] {
        min-width: 0;
        border: 1px solid var(--cmt-border-glass);
        border-radius: 7px;
        background: rgba(0, 0, 0, 0.14);
        color: inherit;
        padding: 5px 6px;
      }

      #codex-main-transparency-control select {
        border: 1px solid var(--cmt-border-glass);
        border-radius: 7px;
        background: rgba(0, 0, 0, 0.14);
        color: inherit;
        padding: 5px 6px;
      }

      #codex-main-transparency-control label,
      #codex-main-transparency-control .cmt-control-row {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 6px;
      }

      #codex-main-transparency-control span {
        white-space: nowrap;
      }

      #codex-main-transparency-control .cmt-control-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      #codex-main-transparency-control .cmt-control-toggle {
        min-width: 0;
        flex: 1;
        padding: 5px 8px;
        text-align: left;
      }

      #codex-main-transparency-control .cmt-control-panel {
        display: grid;
        gap: 8px;
      }

      #codex-main-transparency-control[data-panel-open="false"] .cmt-control-panel {
        display: none;
      }

      #codex-main-transparency-control .cmt-control-wide {
        flex: 1;
      }

      #codex-main-transparency-control .cmt-control-status {
        min-height: 14px;
        color: var(--text-secondary, currentColor);
        opacity: 0.82;
        white-space: normal;
      }

      #codex-main-transparency-control input[type="range"] {
        min-width: 0;
        flex: 1;
        accent-color: currentColor;
      }
    `;
    document.head?.appendChild(style);
  }

  function installBackgroundLayer() {
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", scheduleRefresh, { once: true });
      return;
    }
    let layer = document.getElementById(BACKGROUND_LAYER_ID);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = BACKGROUND_LAYER_ID;
      layer.dataset.version = SCRIPT_VERSION;
      layer.setAttribute("aria-hidden", "true");
    }
    document.body.prepend(layer);
    applyBackground();
  }

  function showStatus(message) {
    state.statusMessage = message;
    syncControlPanel();
  }

  function createText(text) {
    const span = document.createElement("span");
    span.textContent = text;
    return span;
  }

  function createButton(text, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className || "";
    button.textContent = text;
    return button;
  }

  function installOpacityControl() {
    installControlPanel();
    applyTransparency(state.transparencyPercent);
  }

  function installControlPanel() {
    let control = document.getElementById(CONTROL_ID);
    if (!control) {
      control = document.createElement("div");
      control.id = CONTROL_ID;
      control.dataset.version = SCRIPT_VERSION;
      const header = document.createElement("div");
      header.className = "cmt-control-header";
      const toggle = createButton("透明与背景", "cmt-control-toggle");
      toggle.dataset.codexMainTransparencyPanelToggle = "true";
      const shortcut = createText("");
      shortcut.dataset.codexMainBackgroundShortcutValue = "true";
      header.append(toggle, shortcut);

      const panel = document.createElement("div");
      panel.className = "cmt-control-panel";

      const transparencyLabel = document.createElement("label");
      const transparencyRange = document.createElement("input");
      transparencyRange.type = "range";
      transparencyRange.min = "0";
      transparencyRange.max = "100";
      transparencyRange.step = "1";
      transparencyRange.dataset.codexMainTransparencyRange = "true";
      const transparencyValue = createText("");
      transparencyValue.dataset.codexMainTransparencyOpacityValue = "true";
      transparencyValue.dataset.codexMainTransparencyPercentValue = "true";
      transparencyLabel.append(createText("主界面"), transparencyRange, transparencyValue);

      const backgroundRow = document.createElement("div");
      backgroundRow.className = "cmt-control-row";
      const backgroundToggle = document.createElement("input");
      backgroundToggle.type = "checkbox";
      backgroundToggle.dataset.codexMainBackgroundEnabledInput = "true";
      const backgroundToggleLabel = document.createElement("label");
      backgroundToggleLabel.append(backgroundToggle, createText("背景"));
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
      fileInput.hidden = true;
      fileInput.dataset.codexMainBackgroundFileInput = "true";
      const fileButton = createButton("导入", "");
      fileButton.dataset.codexMainBackgroundFileButton = "true";
      const clearButton = createButton("清除", "");
      clearButton.dataset.codexMainBackgroundClear = "true";
      backgroundRow.append(backgroundToggleLabel, fileButton, clearButton, fileInput);

      const urlRow = document.createElement("div");
      urlRow.className = "cmt-control-row";
      const urlInput = document.createElement("input");
      urlInput.type = "text";
      urlInput.placeholder = "https:// 或 data:image";
      urlInput.className = "cmt-control-wide";
      urlInput.dataset.codexMainBackgroundUrlInput = "true";
      const applyUrlButton = createButton("应用", "");
      applyUrlButton.dataset.codexMainBackgroundUrlApply = "true";
      urlRow.append(urlInput, applyUrlButton);

      const backgroundOpacityLabel = document.createElement("label");
      const backgroundOpacityRange = document.createElement("input");
      backgroundOpacityRange.type = "range";
      backgroundOpacityRange.min = "0";
      backgroundOpacityRange.max = "100";
      backgroundOpacityRange.step = "1";
      backgroundOpacityRange.dataset.codexMainBackgroundOpacityRange = "true";
      const backgroundOpacityValue = createText("");
      backgroundOpacityValue.dataset.codexMainBackgroundOpacityValue = "true";
      backgroundOpacityLabel.append(createText("图片"), backgroundOpacityRange, backgroundOpacityValue);

      const backgroundStyleRow = document.createElement("div");
      backgroundStyleRow.className = "cmt-control-row";
      const fitSelect = document.createElement("select");
      fitSelect.dataset.codexMainBackgroundFitSelect = "true";
      [["cover", "铺满"], ["contain", "完整"], ["fill", "拉伸"]].forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        fitSelect.append(option);
      });
      const blurRange = document.createElement("input");
      blurRange.type = "range";
      blurRange.min = "0";
      blurRange.max = "24";
      blurRange.step = "1";
      blurRange.dataset.codexMainBackgroundBlurRange = "true";
      const blurValue = createText("");
      blurValue.dataset.codexMainBackgroundBlurValue = "true";
      backgroundStyleRow.append(createText("显示"), fitSelect, createText("模糊"), blurRange, blurValue);

      const shortcutRow = document.createElement("div");
      shortcutRow.className = "cmt-control-row";
      const shortcutButton = createButton("", "cmt-control-wide");
      shortcutButton.dataset.codexMainBackgroundShortcutRecord = "true";
      shortcutRow.append(createText("快捷键"), shortcutButton);

      const status = createText("");
      status.className = "cmt-control-status";
      status.dataset.codexMainTransparencyStatus = "true";

      panel.append(transparencyLabel, backgroundRow, urlRow, backgroundOpacityLabel, backgroundStyleRow, shortcutRow, status);
      control.append(header, panel);

      toggle.addEventListener("click", () => {
        state.panelOpen = !state.panelOpen;
        syncControlPanel();
      });
      transparencyRange.addEventListener("input", () => {
        applyTransparency(transparencyRange.value);
        saveSettings();
      });
      backgroundToggle.addEventListener("change", () => {
        state.backgroundEnabled = backgroundToggle.checked;
        applyBackground();
        saveSettings();
      });
      applyUrlButton.addEventListener("click", () => {
        const image = normalizeBackgroundImage(urlInput.value);
        if (!image && urlInput.value.trim()) {
          showStatus("图片地址无效");
          return;
        }
        state.backgroundImage = image;
        state.backgroundImageStored = false;
        state.backgroundEnabled = Boolean(image);
        showStatus(image ? "背景已应用" : "背景已清除");
        applyBackground();
        saveSettings();
        clearBackgroundImageStore().catch(() => {});
      });
      urlInput.addEventListener("change", () => {
        applyUrlButton.click();
      });
      fileButton.addEventListener("click", () => {
        fileInput.click();
      });
      fileInput.addEventListener("change", async () => {
        try {
          const image = await readLocalBackgroundFile(fileInput.files?.[0]);
          if (!image) return;
          await saveBackgroundImageToStore(image);
          state.backgroundImage = image;
          state.backgroundImageStored = true;
          state.backgroundEnabled = true;
          showStatus("本地图片已导入");
          applyBackground();
          saveSettings();
        } catch (error) {
          showStatus(String(error && error.message || error));
        } finally {
          fileInput.value = "";
        }
      });
      clearButton.addEventListener("click", () => {
        state.backgroundImage = "";
        state.backgroundImageStored = false;
        state.backgroundEnabled = false;
        showStatus("背景已清除");
        applyBackground();
        saveSettings();
        clearBackgroundImageStore().catch(() => {});
      });
      backgroundOpacityRange.addEventListener("input", () => {
        state.backgroundOpacityPercent = clampBackgroundOpacityPercent(backgroundOpacityRange.value);
        applyBackground();
        saveSettings();
      });
      fitSelect.addEventListener("change", () => {
        state.backgroundFit = normalizeBackgroundFit(fitSelect.value);
        applyBackground();
        saveSettings();
      });
      blurRange.addEventListener("input", () => {
        state.backgroundBlurPx = clampBackgroundBlurPx(blurRange.value);
        applyBackground();
        saveSettings();
      });
      shortcutButton.addEventListener("click", startShortcutRecording);
      document.body?.appendChild(control);
    }
    syncControlPanel();
  }

  function syncControlPanel() {
    const control = document.getElementById(CONTROL_ID);
    if (!control) return;
    control.dataset.panelOpen = String(state.panelOpen);

    const transparencyRange = control.querySelector("[data-codex-main-transparency-range]");
    const transparencyValue = control.querySelector("[data-codex-main-transparency-percent-value]");
    if (transparencyRange && transparencyRange.value !== String(state.transparencyPercent)) {
      transparencyRange.value = String(state.transparencyPercent);
    }
    if (transparencyValue) transparencyValue.textContent = `${state.transparencyPercent}%`;

    const backgroundToggle = control.querySelector("[data-codex-main-background-enabled-input]");
    if (backgroundToggle) backgroundToggle.checked = Boolean(state.backgroundEnabled);

    const urlInput = control.querySelector("[data-codex-main-background-url-input]");
    const displayedBackgroundImage = state.backgroundImageStored ? "" : state.backgroundImage;
    if (urlInput && urlInput.value !== displayedBackgroundImage) {
      urlInput.value = displayedBackgroundImage;
    }

    const backgroundOpacityRange = control.querySelector("[data-codex-main-background-opacity-range]");
    const backgroundOpacityValue = control.querySelector("[data-codex-main-background-opacity-value]");
    if (backgroundOpacityRange && backgroundOpacityRange.value !== String(state.backgroundOpacityPercent)) {
      backgroundOpacityRange.value = String(state.backgroundOpacityPercent);
    }
    if (backgroundOpacityValue) backgroundOpacityValue.textContent = `${state.backgroundOpacityPercent}%`;

    const fitSelect = control.querySelector("[data-codex-main-background-fit-select]");
    if (fitSelect && fitSelect.value !== state.backgroundFit) fitSelect.value = state.backgroundFit;

    const blurRange = control.querySelector("[data-codex-main-background-blur-range]");
    const blurValue = control.querySelector("[data-codex-main-background-blur-value]");
    if (blurRange && blurRange.value !== String(state.backgroundBlurPx)) {
      blurRange.value = String(state.backgroundBlurPx);
    }
    if (blurValue) blurValue.textContent = `${state.backgroundBlurPx}px`;

    const shortcutValue = control.querySelector("[data-codex-main-background-shortcut-value]");
    if (shortcutValue) shortcutValue.textContent = state.shortcut;

    const shortcutButton = control.querySelector("[data-codex-main-background-shortcut-record]");
    if (shortcutButton) {
      shortcutButton.textContent = state.recordingShortcut ? "按下组合键" : state.shortcut;
      shortcutButton.setAttribute("aria-pressed", String(state.recordingShortcut));
    }

    const status = control.querySelector("[data-codex-main-transparency-status]");
    if (status) status.textContent = state.statusMessage;
  }

  function removeTopFades() {
    document.querySelectorAll(TOP_FADE_SELECTOR).forEach((element) => {
      element.remove();
    });
  }

  function isTransparentColor(value) {
    const color = String(value || "").trim().toLowerCase();
    if (!color || color === "transparent") return true;
    const compact = color.replace(/\s+/g, "");
    if (compact === "rgba(0,0,0,0)") return true;
    const rgba = compact.match(/^rgba\((?:[^,]+,){3}([^)]+)\)$/);
    return rgba ? Number.parseFloat(rgba[1]) === 0 : false;
  }

  function isClearLayer(value) {
    const layer = String(value || "").trim().toLowerCase();
    return !layer || layer === "none";
  }

  function isLargeRectangle(element) {
    const rect = element.getBoundingClientRect?.();
    if (!rect || rect.width <= 0 || rect.height <= 0) return false;
    const viewportWidth = Math.max(document.documentElement?.clientWidth || 0, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement?.clientHeight || 0, window.innerHeight || 0);
    const area = rect.width * rect.height;
    const viewportArea = Math.max(1, viewportWidth * viewportHeight);
    return rect.width >= Math.min(320, viewportWidth * 0.34) && rect.height >= 72 && area >= viewportArea * 0.025;
  }

  function describeElement(element, reason, style) {
    const rect = element.getBoundingClientRect?.();
    return {
      reason,
      tag: element.tagName?.toLowerCase?.() || "",
      id: element.id || "",
      className: String(element.className || "").slice(0, 160),
      role: element.getAttribute?.("role") || "",
      testId: element.getAttribute?.("data-testid") || "",
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      backdropFilter: style.backdropFilter || style.webkitBackdropFilter || "none",
      borderRadius: style.borderRadius,
      rect: rect ? {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      } : null,
    };
  }

  function auditTransparency() {
    const roots = [
      ...document.querySelectorAll("main, [role='main'], [data-app-shell-main-content-layout], [data-above-composer-portal], [data-above-composer-queue-portal], [role='dialog'], [data-radix-popper-content-wrapper], [data-side]"),
    ];
    const elements = new Set();
    roots.forEach((root) => {
      if (!(root instanceof Element)) return;
      elements.add(root);
      root.querySelectorAll?.("*").forEach((element) => elements.add(element));
    });

    const issues = [];
    let checked = 0;
    elements.forEach((element) => {
      if (!(element instanceof Element)) return;
      if (element.closest(AUDIT_EXCLUDE_SELECTOR)) return;
      if (element.closest(BACKGROUND_AUDIT_EXCLUDE_SELECTOR)) return;
      if (["SCRIPT", "STYLE", "LINK", "META"].includes(element.tagName)) return;
      checked += 1;
      const style = window.getComputedStyle(element);
      const hasBackground = !isTransparentColor(style.backgroundColor) || !isClearLayer(style.backgroundImage);
      const hasShadow = !isClearLayer(style.boxShadow);
      const hasBackdrop = !isClearLayer(style.backdropFilter) || !isClearLayer(style.webkitBackdropFilter);
      if ((hasBackground && isLargeRectangle(element)) || hasShadow || hasBackdrop) {
        const reasons = [];
        if (hasBackground && isLargeRectangle(element)) reasons.push("large-background");
        if (hasShadow) reasons.push("box-shadow");
        if (hasBackdrop) reasons.push("backdrop-filter");
        issues.push(describeElement(element, reasons.join(","), style));
      }
    });

    return {
      ok: issues.length === 0,
      version: SCRIPT_VERSION,
      opacityPercent: state.transparencyPercent,
      transparencyPercent: state.transparencyPercent,
      materialPercent: materialPercentFromTransparency(state.transparencyPercent),
      backgroundEnabled: state.backgroundEnabled,
      backgroundOpacityPercent: state.backgroundOpacityPercent,
      backgroundImageStored: state.backgroundImageStored,
      shortcut: state.shortcut,
      checked,
      issueCount: issues.length,
      issues: issues.slice(0, AUDIT_MAX_ISSUES),
    };
  }

  function refresh() {
    installStyle();
    removeTopFades();
    const root = document.documentElement;
    if (!root) return;
    root.dataset.codexMainTransparency = "true";
    root.dataset.codexMainTransparencyTheme = resolveCodexTheme();
    applyTransparency(state.transparencyPercent);
    installBackgroundLayer();
    installOpacityControl();
    installShortcutListener();
    restoreStoredBackgroundImage();
  }

  function scheduleRefresh() {
    if (state.refreshTimer) return;
    state.refreshTimer = window.setTimeout(() => {
      state.refreshTimer = 0;
      refresh();
    }, 80);
  }

  function installObservers() {
    if (!state.themeObserver && typeof MutationObserver === "function") {
      state.themeObserver = new MutationObserver(scheduleRefresh);
      state.themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });
    }

    if (!state.observer && typeof MutationObserver === "function") {
      const start = () => {
        const target = document.body || document.documentElement;
        if (!target) return;
        state.observer = new MutationObserver(scheduleRefresh);
        state.observer.observe(target, { childList: true, subtree: true });
      };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }

    if (!state.themeMediaQuery && typeof window.matchMedia === "function") {
      state.themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      state.themeMediaListener = scheduleRefresh;
      if (typeof state.themeMediaQuery.addEventListener === "function") {
        state.themeMediaQuery.addEventListener("change", state.themeMediaListener);
      } else if (typeof state.themeMediaQuery.addListener === "function") {
        state.themeMediaQuery.addListener(state.themeMediaListener);
      }
    }
  }

  function destroy() {
    window.clearTimeout(state.refreshTimer);
    state.refreshTimer = 0;
    state.observer?.disconnect?.();
    state.themeObserver?.disconnect?.();
    if (state.themeMediaQuery && state.themeMediaListener) {
      if (typeof state.themeMediaQuery.removeEventListener === "function") {
        state.themeMediaQuery.removeEventListener("change", state.themeMediaListener);
      } else if (typeof state.themeMediaQuery.removeListener === "function") {
        state.themeMediaQuery.removeListener(state.themeMediaListener);
      }
    }
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(CONTROL_ID)?.remove();
    document.getElementById(BACKGROUND_LAYER_ID)?.remove();
    document.removeEventListener("keydown", handleGlobalShortcut, true);
    document.removeEventListener("keydown", recordShortcut, true);
    state.shortcutListenerInstalled = false;
    state.recordingShortcut = false;
    [
      "--cmt-main-glass-dark",
      "--cmt-main-glass-light",
      "--cmt-panel-glass",
      "--cmt-input-glass",
      "--cmt-hover-glass",
      "--cmt-shadow-glass",
      "--cmt-control-bg",
      "--cmt-control-shadow",
      "--cmt-background-image",
      "--cmt-background-opacity",
      "--cmt-background-fit",
      "--cmt-background-blur",
    ].forEach((name) => document.documentElement.style.removeProperty(name));
    delete document.documentElement.dataset.codexMainTransparency;
    delete document.documentElement.dataset.codexMainTransparencyTheme;
    delete document.documentElement.dataset.codexMainTransparencyOpacity;
    delete document.documentElement.dataset.codexMainTransparencyPercent;
    delete document.documentElement.dataset.codexMainBackgroundEnabled;
    delete document.documentElement.dataset.codexMainBackgroundShortcut;
    delete window[INSTALL_KEY];
    delete window[API_KEY];
  }

  window[INSTALL_KEY] = true;
  window[API_KEY] = {
    id: SCRIPT_ID,
    version: SCRIPT_VERSION,
    refresh,
    destroy,
    audit: auditTransparency,
    theme: resolveCodexTheme,
  };

  refresh();
  installObservers();
})();
