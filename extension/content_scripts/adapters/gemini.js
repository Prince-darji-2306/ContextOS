/**
 * Gemini DOM Adapter for ContextOS
 *
 * Gemini uses a Quill-based editor or contenteditable div.
 * Selectors target .ql-editor and various aria-labeled elements.
 */
(function () {
  "use strict";

  const SELECTORS = {
    textarea: [
      ".ql-editor",
      "div.ql-editor[contenteditable='true']",
      ".input-area-container .ql-editor",
      "div[contenteditable='true']",
      "textarea[aria-label]",
    ],
    sendButton: [
      ".send-button",
      "button.send-button",
      "[aria-label='Send message']",
      "button[aria-label='Send']",
    ],
    responses: [
      ".model-response-text",
      ".response-container .markdown",
      "message-content",
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
      if (config?.platforms?.gemini) {
        const remote = config.platforms.gemini;
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
    getPlatform: () => "gemini",

    getTextarea: () => findElement(SELECTORS.textarea),

    getText: () => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return "";
      // Check if it's a standard textarea or contenteditable
      if (el.tagName === "TEXTAREA") return el.value || "";
      return el.innerText || el.textContent || "";
    },

    setText: (text) => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return;

      if (el.tagName === "TEXTAREA") {
        // Standard textarea — use native setter for React sync
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        ).set;
        nativeSetter.call(el, text);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        // Quill / contenteditable — set innerHTML with <p> tags
        el.focus();
        el.innerHTML = `<p>${text.replace(/\n/g, "</p><p>")}</p>`;
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
