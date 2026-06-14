/**
 * ChatGPT DOM Adapter for ContextOS
 *
 * ChatGPT uses a contenteditable div (often ProseMirror-based) for input.
 * The send button typically has data-testid="send-button".
 */
(function () {
  "use strict";

  const SELECTORS = {
    textarea: [
      "#prompt-textarea",
      "div[contenteditable='true'][id='prompt-textarea']",
      "div#prompt-textarea[contenteditable]",
      "div[contenteditable='true']",
    ],
    sendButton: [
      "[data-testid='send-button']",
      "button[data-testid='send-button']",
      "form button[type='button']:last-child",
    ],
    responses: ["[data-message-author-role='assistant']", ".agent-turn .markdown"],
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
      if (config?.platforms?.chatgpt) {
        const remote = config.platforms.chatgpt;
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
    getPlatform: () => "chatgpt",

    getTextarea: () => findElement(SELECTORS.textarea),

    getText: () => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return "";
      // ChatGPT uses contenteditable div
      return el.innerText || el.textContent || "";
    },

    setText: (text) => {
      const el = findElement(SELECTORS.textarea);
      if (!el) return;
      // For contenteditable, we need to use execCommand for proper undo
      // history + React/ProseMirror state sync
      el.focus();
      // Select all existing content
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      // Replace with new text using execCommand for framework compatibility
      document.execCommand("insertText", false, text);
      // Trigger input event to sync React state
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
