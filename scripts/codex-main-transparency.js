(() => {
  "use strict";

  const SCRIPT_ID = "codex-main-transparency";
  const SCRIPT_VERSION = "0.1.3";
  const INSTALL_KEY = "__codexMainTransparencyInstalled";
  const API_KEY = "__codexMainTransparency";
  const STYLE_ID = "codex-main-transparency-style";
  const TOP_FADE_SELECTOR = "[data-app-shell-main-content-top-fade]";

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
  };

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
        --cmt-main-glass-dark: rgba(17, 24, 39, 0.36);
        --cmt-main-glass-light: rgba(255, 255, 255, 0.08);
        --cmt-main-glass: var(--cmt-main-glass-dark);
        --cmt-panel-glass: rgba(17, 24, 39, 0.28);
        --cmt-border-glass: rgba(255, 255, 255, 0.12);
        --cmt-input-glass: rgba(15, 23, 42, 0.42);
        --cmt-hover-glass: rgba(255, 255, 255, 0.07);
        --cmt-shadow-glass: 0 18px 54px rgba(0, 0, 0, 0.18);
        background: var(--cmt-page-clear) !important;
      }

      html[data-codex-main-transparency="true"][data-codex-main-transparency-theme="light"] {
        --cmt-main-glass: var(--cmt-main-glass-light);
        --cmt-panel-glass: rgba(255, 255, 255, 0.18);
        --cmt-border-glass: rgba(15, 23, 42, 0.1);
        --cmt-input-glass: rgba(255, 255, 255, 0.34);
        --cmt-hover-glass: rgba(15, 23, 42, 0.05);
        --cmt-shadow-glass: 0 18px 54px rgba(15, 23, 42, 0.12);
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
      html[data-codex-main-transparency="true"] [class*="bg-token-side-bar-background"],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions],
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions] > *,
      html[data-codex-main-transparency="true"] [data-home-ambient-suggestions] button {
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
        background: var(--cmt-panel-glass) !important;
        box-shadow: var(--cmt-shadow-glass);
        backdrop-filter: blur(18px) saturate(1.18);
        -webkit-backdrop-filter: blur(18px) saturate(1.18);
      }

      html[data-codex-main-transparency="true"] main textarea,
      html[data-codex-main-transparency="true"] main [contenteditable="true"],
      html[data-codex-main-transparency="true"] main form:has(textarea) {
        background: var(--cmt-input-glass) !important;
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
        background: var(--cmt-main-glass) !important;
        backdrop-filter: blur(20px) saturate(1.2);
        -webkit-backdrop-filter: blur(20px) saturate(1.2);
      }

      html[data-codex-main-transparency="true"] main ::-webkit-scrollbar-track {
        background: var(--cmt-page-clear) !important;
      }
    `;
    document.head?.appendChild(style);
  }

  function removeTopFades() {
    document.querySelectorAll(TOP_FADE_SELECTOR).forEach((element) => {
      element.remove();
    });
  }

  function refresh() {
    installStyle();
    removeTopFades();
    const root = document.documentElement;
    if (!root) return;
    root.dataset.codexMainTransparency = "true";
    root.dataset.codexMainTransparencyTheme = resolveCodexTheme();
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
    delete document.documentElement.dataset.codexMainTransparency;
    delete document.documentElement.dataset.codexMainTransparencyTheme;
    delete window[INSTALL_KEY];
    delete window[API_KEY];
  }

  window[INSTALL_KEY] = true;
  window[API_KEY] = {
    id: SCRIPT_ID,
    version: SCRIPT_VERSION,
    refresh,
    destroy,
    theme: resolveCodexTheme,
  };

  refresh();
  installObservers();
})();
