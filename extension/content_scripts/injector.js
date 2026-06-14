/**
 * INJECTOR — shared context injection engine.
 *
 * Each platform adapter (chatgpt.js, gemini.js, etc.) sets:
 *   window.__contextos_adapter = { getPlatform, getText, setText, getSendButton, getTextarea, getResponses }
 *
 * This file hooks into those adapters to intercept + inject.
 */

(async function () {
  "use strict";

  // Wait for the platform adapter to register itself
  let adapter = null;
  const maxWaitMs = 10000;
  const pollInterval = 200;
  let waited = 0;

  while (!adapter && waited < maxWaitMs) {
    adapter = window.__contextos_adapter;
    if (!adapter) {
      await new Promise((r) => setTimeout(r, pollInterval));
      waited += pollInterval;
    }
  }

  if (!adapter) {
    console.warn("[ContextOS] No platform adapter found. Injection disabled.");
    return;
  }

  const platform = adapter.getPlatform();
  console.log(`[ContextOS] Injector active on: ${platform}`);

  // ─── State ───────────────────────────────────────────────
  let isInjecting = false;
  let lastInjectionCount = 0;

  // ─── Error Toast ─────────────────────────────────────────
  function showErrorToast(message) {
    // Only show once per page load
    if (document.querySelector(".contextos-error-toast")) return;

    const toast = document.createElement("div");
    toast.className = "contextos-error-toast";
    toast.textContent = `ContextOS: ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  }

  // ─── Badge UI ────────────────────────────────────────────
  function createBadge() {
    const badge = document.createElement("div");
    badge.id = "contextos-badge";
    badge.className = "contextos-badge hidden";
    badge.innerHTML = `
      <span class="contextos-badge-icon">🧠</span>
      <span class="contextos-badge-text">0 memories injected</span>
    `;
    document.body.appendChild(badge);
    return badge;
  }

  const badge = createBadge();

  function updateBadge(count) {
    const text = badge.querySelector(".contextos-badge-text");
    text.textContent = `${count} memor${count === 1 ? "y" : "ies"} injected`;
    badge.classList.remove("hidden");
    setTimeout(() => badge.classList.add("hidden"), 4000);
  }

  // ─── Intercept Send ──────────────────────────────────────
  async function interceptSend(originalClickHandler) {
    if (isInjecting) return; // prevent re-entry
    isInjecting = true;

    try {
      const userText = adapter.getText();
      if (!userText || userText.trim().length < 3) {
        // Too short to recall — just send normally
        if (originalClickHandler) originalClickHandler();
        return;
      }

      // Check if platform is enabled
      const settings = await chrome.runtime.sendMessage({
        type: "GET_SETTINGS",
      });
      if (!settings.autoInject || !settings.platforms[platform]) {
        if (originalClickHandler) originalClickHandler();
        return;
      }

      // Call backend via service worker
      const result = await chrome.runtime.sendMessage({
        type: "RECALL",
        query: userText.substring(0, 500), // Truncate for performance
        topK: settings.maxMemories,
        platform: platform,
      });

      if (result.error) {
        console.warn("[ContextOS] Recall error:", result.error);
        if (originalClickHandler) originalClickHandler();
        return;
      }

      if (result.has_context && result.injection_block) {
        // Prepend context to the user's message
        const modifiedText = result.injection_block + userText;
        adapter.setText(modifiedText);

        lastInjectionCount = result.memory_count;
        if (settings.showBadge) {
          updateBadge(result.memory_count);
        }
      }

      // Small delay to let the DOM update, then click send
      await new Promise((r) => setTimeout(r, 50));
      if (originalClickHandler) originalClickHandler();
    } catch (err) {
      console.error("[ContextOS] Injection error:", err);
      // On error, send the original message unmodified
      if (originalClickHandler) originalClickHandler();
    } finally {
      isInjecting = false;
    }
  }

  // ─── Hook into send button ───────────────────────────────
  let hookRetryCount = 0;

  function hookSendButton() {
    const sendBtn = adapter.getSendButton();
    if (!sendBtn) {
      hookRetryCount++;
      if (hookRetryCount > 30) {
        // After 30 seconds, stop retrying silently
        showErrorToast(
          "Could not find the send button. The platform may have updated."
        );
        return;
      }
      // Retry — DOM might not be ready yet
      setTimeout(hookSendButton, 1000);
      return;
    }

    // Prevent double-hooking
    if (sendBtn.__contextos_hooked) return;
    sendBtn.__contextos_hooked = true;

    // Clone the button's click behavior
    sendBtn.addEventListener(
      "click",
      async (e) => {
        // Only intercept if we're not already injecting (prevent loop)
        if (isInjecting) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        await interceptSend(() => {
          // Programmatically dispatch a new click event to the send button
          // with a flag so we don't intercept our own click
          isInjecting = true;
          sendBtn.click();
          setTimeout(() => {
            isInjecting = false;
          }, 100);
        });
      },
      true // capture phase — fires before the platform's own handler
    );

    // Also handle Enter key submission
    const textarea = adapter.getTextarea();
    if (textarea) {
      textarea.addEventListener(
        "keydown",
        async (e) => {
          if (e.key === "Enter" && !e.shiftKey && !isInjecting) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            await interceptSend(() => {
              // Simulate Enter keypress
              isInjecting = true;
              const enterEvent = new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true,
              });
              textarea.dispatchEvent(enterEvent);
              setTimeout(() => {
                isInjecting = false;
              }, 100);
            });
          }
        },
        true
      );
    }

    console.log("[ContextOS] Send button hooked successfully");
  }

  // ─── MutationObserver for SPA navigation ─────────────────
  // These sites are SPAs — the send button might get re-rendered
  const observer = new MutationObserver(() => {
    const sendBtn = adapter.getSendButton();
    if (sendBtn && !sendBtn.__contextos_hooked) {
      hookSendButton();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial hook attempt
  hookSendButton();
})();
