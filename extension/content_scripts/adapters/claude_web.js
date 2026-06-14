/**
 * Claude Web DOM Adapter for ContextOS
 *
 * Claude uses ProseMirror for its rich-text input (contenteditable div).
 * We use execCommand("insertText") combined with Selection API to
 * properly replace content while keeping ProseMirror's state in sync.
 */
(function () {
  "use strict";

  const SELECTORS = {
    textarea: [
      "div[contenteditable='true'].ProseMirror",
      "fieldset div[contenteditable='true']",
      "[contenteditable='true']",
    ],
    sendButton: [
      "button[aria-label='Send message']",
      "button[aria-label='Send Message']",
      "fieldset button:last-child",
    ],
    responses: [
      "[data-is-streaming]",
      ".font-claude-message",
    ],
  };

  function findElement(selectorList) {
    for (const sel of selectorList) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // Try to update selectors from cached backend config
  (async function updateSelectorsFromConfig() {
    try {
      const config = await chrome.runtime.sendMessage({
        type: "REFRESH_SELECTORS",
      });
      if (config?.platforms?.["claude-web"]) {
        const remote = config.platforms["claude-web"];
        if (remote.textareaSelectors) SELECTORS.textarea = remote.textareaSelectors;
        if (remote.sendButtonSelectors)
          SELECTORS.sendButton = remote.sendButtonSelectors;
        if (remote.responseSelectors) SELECTORS.responses = remote.responseSelectors;
      }
    } catch (e) {
      // Silently fall back to hardcoded selectors
    }
  })();

  window.__contextos_adapter = {
    getPlatform: () => "claude-web",

    getTextarea: () => findElement(SELECTORS.textarea),

    getText: () => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return "";
      return el.innerText || el.textContent || "";
    },

    setText: (text) => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return;
      // Claude uses ProseMirror — use execCommand for clean insertion
      el.focus();
      // Select all existing content and replace
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand("insertText", false, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },

    getSendButton: () => findElement(SELECTORS.sendButton),

    getResponses: () => {
      for (const sel of SELECTORS.responses) {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) return Array.from(els);
      }
      return [];
    },
  };
})();
