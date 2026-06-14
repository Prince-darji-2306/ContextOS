/**
 * Grok DOM Adapter for ContextOS
 *
 * Grok uses a standard <textarea> element for input.
 * We use React's native value setter trick to ensure the framework
 * recognizes value changes made programmatically.
 */
(function () {
  "use strict";

  const SELECTORS = {
    textarea: [
      "textarea",
      "textarea[placeholder]",
      "textarea[role='textbox']",
      "div[contenteditable='true']",
    ],
    sendButton: [
      "button[aria-label='Send']",
      "button[type='submit']",
      "form button:last-child",
    ],
    responses: [
      "[class*='message'][class*='assistant']",
      ".message-content",
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
      if (config?.platforms?.grok) {
        const remote = config.platforms.grok;
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
    getPlatform: () => "grok",

    getTextarea: () => findElement(SELECTORS.textarea),

    getText: () => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return "";
      if (el.tagName === "TEXTAREA") return el.value || "";
      return el.innerText || el.textContent || "";
    },

    setText: (text) => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return;

      if (el.tagName === "TEXTAREA") {
        // Grok uses a standard textarea — use native setter for React sync
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeSetter.call(el, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // Contenteditable fallback
        el.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("insertText", false, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
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
