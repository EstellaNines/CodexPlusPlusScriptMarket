(() => {
  "use strict";

  const SCRIPT_ID = "codex-main-transparency";
  const SCRIPT_VERSION = "0.1.9";
  const INSTALL_KEY = "__codexMainTransparencyInstalled";
  const API_KEY = "__codexMainTransparency";
  const STYLE_ID = "codex-main-transparency-style";
  const CONTROL_ID = "codex-main-transparency-control";
  const AUDIT_EXCLUDE_SELECTOR = `#${CONTROL_ID}`;
  const TOP_FADE_SELECTOR = "[data-app-shell-main-content-top-fade]";
  const DEFAULT_TRANSPARENCY_PERCENT = 100;
  const AUDIT_MAX_ISSUES = 40;

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
    transparencyPercent: DEFAULT_TRANSPARENCY_PERCENT,
  };

  function clampTransparencyPercent(value) {
    const number = Number.parseInt(String(value), 10);
    if (!Number.isFinite(number)) return DEFAULT_TRANSPARENCY_PERCENT;
    return Math.min(100, Math.max(0, number));
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

      #codex-main-transparency-control {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 60;
        display: flex;
        align-items: center;
        gap: 6px;
        width: min(190px, calc(100vw - 24px));
        padding: 5px 8px;
        border: 1px solid var(--cmt-border-glass);
        border-radius: 999px;
        background: var(--cmt-control-bg) !important;
        color: var(--text-primary, currentColor);
        box-shadow: var(--cmt-control-shadow);
        opacity: 0.76;
        backdrop-filter: blur(10px) saturate(1.08);
        -webkit-backdrop-filter: blur(10px) saturate(1.08);
        font: 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #codex-main-transparency-control:hover,
      #codex-main-transparency-control:focus-within {
        opacity: 1;
      }

      #codex-main-transparency-control label {
        display: flex;
        min-width: 0;
        flex: 1;
        align-items: center;
        gap: 6px;
      }

      #codex-main-transparency-control span {
        white-space: nowrap;
      }

      #codex-main-transparency-control input[type="range"] {
        min-width: 0;
        flex: 1;
        accent-color: currentColor;
      }
    `;
    document.head?.appendChild(style);
  }

  function installOpacityControl() {
    let control = document.getElementById(CONTROL_ID);
    if (!control) {
      control = document.createElement("div");
      control.id = CONTROL_ID;
      control.dataset.version = SCRIPT_VERSION;
      const label = document.createElement("label");
      const name = document.createElement("span");
      name.textContent = "透明度";
      const range = document.createElement("input");
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.step = "1";
      range.value = String(state.transparencyPercent);
      const value = document.createElement("span");
      value.dataset.codexMainTransparencyOpacityValue = "true";
      value.dataset.codexMainTransparencyPercentValue = "true";
      label.append(name, range, value);
      control.append(label);
      range.addEventListener("input", () => {
        applyTransparency(range.value);
      });
      document.body?.appendChild(control);
    }
    applyTransparency(state.transparencyPercent);
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
    installOpacityControl();
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
    [
      "--cmt-main-glass-dark",
      "--cmt-main-glass-light",
      "--cmt-panel-glass",
      "--cmt-input-glass",
      "--cmt-hover-glass",
      "--cmt-shadow-glass",
      "--cmt-control-bg",
      "--cmt-control-shadow",
    ].forEach((name) => document.documentElement.style.removeProperty(name));
    delete document.documentElement.dataset.codexMainTransparency;
    delete document.documentElement.dataset.codexMainTransparencyTheme;
    delete document.documentElement.dataset.codexMainTransparencyOpacity;
    delete document.documentElement.dataset.codexMainTransparencyPercent;
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
